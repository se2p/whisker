import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {Container} from "../../utils/Container";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";
import {NoveltyFitness} from "./NoveltyFitness";
import {ScratchPosition} from "../../scratch/ScratchPosition";

export class NoveltyTargetNetworkFitness extends NoveltyFitness {

    /**
     * The sprite which is navigated by a player.
     */
    private readonly _player: RenderedTarget;

    /**
     * Contains all behaviours seen so far.
     */
    protected override _behaviourArchive: ScratchPosition[] = [];

    /**
     * Constructs a new NoveltyTargetNetworkFitness object, whose behaviour is determined by the final position
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
     * Calculates the distance to each ScratchCoordinate saved in the archive and the player's final position
     * on the canvas after the playthrough.
     * @param player the player's final Scratch coordinate on the canvas after the playthrough.
     * @returns Array<number> containing the k-nearest distances to the player.
     */
    private kNearestNeighbours(player: ScratchPosition): number[] {
        const distances = this._behaviourArchive.map(archivePoint => archivePoint.distanceTo(player));
        distances.sort((a, b) => a - b);
        return distances.slice(0, this._neighbourCount);
    }

    /**
     * Calculates the sparseness of a Network's behaviour by calculating the average distance to the k-nearest
     * neighbours.
     * @param network the network whose solution should be evaluated in terms of novelty.
     * @returns number representing the sparseness of the given network's behaviour.
     */
    protected sparseNess(network: NetworkChromosome): number {
        const playerPosition = this.getFinalPosition(network);
        const kNearestNeighbours = this.kNearestNeighbours(playerPosition);
        const distanceSum = kNearestNeighbours.reduce((a, b) => a + b, 0);
        return (1 / this._neighbourCount) * distanceSum;
    }

    /**
     * Adds the behaviour of the given network to the archive of encountered behaviours if it appears
     * to be novel enough.
     * @param network the network whose solution might be added to the behaviour archive.
     * @param sparseNess the metric defining the novelty of a given solution.
     */
    protected addToBehaviourArchive(network: NetworkChromosome, sparseNess: number): void {
        const playerPosition = this.getFinalPosition(network);
        if (this._behaviourArchive.length < 1 ||
            (sparseNess > this._archiveThreshold && this.isNewPoint(playerPosition))) {
            this._behaviourArchive.push(playerPosition);
            console.log(`New Point: ${playerPosition.x}/${playerPosition.y}`);
        }
    }

    /**
     * Gathers the final position of the player sprite.
     * @param network the network from whose inputNodes the last position of the player sprite will be extracted.
     * @returns ScratchPosition containing the player sprite's final coordinates on the Scratch canvas.
     */
    private getFinalPosition(network: NetworkChromosome): ScratchPosition {
        const playerEnd = {
            x: network.inputNodes.get(this._player.sprite.name).get("X-Position").nodeValue *
                (Container.vmWrapper.getStageSize().width / 2),
            y: network.inputNodes.get(this._player.sprite.name).get("Y-Position").nodeValue *
                (Container.vmWrapper.getStageSize().height / 2)
        };
        return new ScratchPosition(playerEnd.x, playerEnd.y);
    }

    /**
     * Determines whether a given point is already contained within the behaviourArchive.
     * @param point the point which might be added to the behaviour archive.
     * @returns boolean determining if the point is present in the behaviour archive.
     */
    private isNewPoint(point: ScratchPosition) {
        return !this._behaviourArchive.some(element => element.equals(point));
    }

    get behaviourArchive(): ScratchPosition[] {
        return this._behaviourArchive;
    }
}
