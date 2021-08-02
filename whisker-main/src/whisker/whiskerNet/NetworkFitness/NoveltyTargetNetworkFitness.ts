import {NetworkChromosome} from "../NetworkChromosome";
import {Container} from "../../utils/Container";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";
import {NoveltyFitness} from "./NoveltyFitness";

export class NoveltyTargetNetworkFitness extends NoveltyFitness {

    /**
     * The player who has to reach the goal sprite.
     */
    private readonly _player: RenderedTarget;

    /**
     * Contains all behaviours seen so far.
     */
    protected _behaviourArchive = new Array<Point>();

    /**
     * Constructs a new NoveltyTargetNetworkFitness object, whose behaviour is determined through the final position
     * of a target sprite on the canvas.
     * @param player the player who has to reach the goal sprite.
     * @param neighbourCount determines the number of k nearest neighbours.
     * @param archiveThreshold determines how novel a found behaviour has to be in order to be added to the archive.
     */
    constructor(player: string, neighbourCount: number, archiveThreshold: number) {
        super(neighbourCount, archiveThreshold);
        for (const runtimeTargets of Container.vm.runtime.targets) {
            if (runtimeTargets.sprite.name === player) {
                this._player = runtimeTargets;
            }
        }
        if (!this._player) {
            throw new Error("Player Sprite not found. Please check your config file.");
        }
    }

    /**
     * Calculates the distance to each point saved in the archive and the players final point on the canvas
     * after the playthrough.
     * @param player the player's final point on the canvas after the playthrough.
     * @returns List<number> containing the k-nearest distances to the player.
     */
    private kNearestNeighbours(player: Point): number[] {
        const distances = this._behaviourArchive.map(point => point.distanceTo(player));
        distances.sort((a, b) => a - b);
        return distances.slice(0, this._neighbourCount);
    }

    /**
     * Calculates the sparseness of a Network's behaviour by calculating the average distance to the k-nearest
     * neighbours.
     * @param network the network whose solution should be evaluated in terms of novelty.
     * @returns sparseness of the given network's solution, determining how novel the solution is.
     */
    protected sparseNess(network: NetworkChromosome): number {
        const playerEndPoint = this.getFinalPosition(network);
        const kNearestNeighbours = this.kNearestNeighbours(playerEndPoint);
        const distanceSum = kNearestNeighbours.reduce((a, b) => a + b, 0);
        return (1 / this._neighbourCount) * distanceSum;
    }

    /**
     * This function adds the behaviour of the given network to the archive of encountered behaviours if it appears
     * to be novel enough.
     * @param network the network whose solution might be added to the behaviour archive.
     * @param sparseNess the metric defining the novelty of a given solution.
     */
    protected addToBehaviourArchive(network: NetworkChromosome, sparseNess: number): void {
        const playerEndPoint = this.getFinalPosition(network)
        if (this._behaviourArchive.length < 1 ||
            (sparseNess > this._archiveThreshold && this.isNewPoint(playerEndPoint))) {
            this._behaviourArchive.push(playerEndPoint);
        }
    }

    /**
     * Gathers the final position of the given player sprite.
     * @param network the network from whose inputNodes the last position of the player sprite will be extracted.
     * @returns Point containing the player sprite's final coordinates.
     */
    private getFinalPosition(network: NetworkChromosome): Point {
        const playerEnd = {
            x: network.inputNodes.get(this._player.sprite.name).get("X-Position").nodeValue *
                (Container.vmWrapper.getStageSize().width / 2),
            y: network.inputNodes.get(this._player.sprite.name).get("Y-Position").nodeValue *
                (Container.vmWrapper.getStageSize().height / 2)
        }
        return new Point(playerEnd.x, playerEnd.y);
    }

    /**
     * Determines whether the point is already contained inside the behaviourArchive.
     * @param point the point which might be added to the behaviour archive.
     * @returns boolean determining if the point is present in the behaviour archive.
     */
    private isNewPoint(point: Point) {
        return !this._behaviourArchive.some(element => element.equals(point));
    }

    get behaviourArchive(): Point[] {
        return this._behaviourArchive;
    }
}

class Point {

    private readonly _x: number
    private readonly _y: number;

    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    distanceTo(other: Point): number {
        return Math.sqrt(Math.pow(other._x - this._x, 2) + Math.pow(other._y - this._y, 2));
    }

    equals(other: Point): boolean {
        return other._x === this._x && other._y === this._y;
    }

    get x(): number {
        return this._x;
    }

    get y(): number {
        return this._y;
    }
}
