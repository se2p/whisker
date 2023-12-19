import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {Container} from "../../utils/Container";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";
import {NetworkExecutor} from "../Misc/NetworkExecutor";
import {PathFinder} from "../../scratch/PathFinder";
import {ScratchPosition} from "../../scratch/ScratchPosition";
import {NeuroevolutionEventSelection} from "../HyperParameter/BasicNeuroevolutionParameter";

export class TargetFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * The name of the player sprite that has to reach a specified goal.
     */
    private readonly player: string;

    /**
     * The target which has to be reached by the player sprite.
     * The target may be a color in hex representation or a name of a Sprite.
     */
    private readonly target: string;

    /**
     * Colors which are not allowed to be touched during the playthrough
     */
    private readonly colorObstacles: string[];

    /**
     * Sprites which are not allowed to be touched during the playthrough.
     */
    private readonly spriteObstacles: string[];

    /**
     * A valid path from the starting point to the target point calculated via the A-Star algorithm.
     */
    private _pathToTarget: ScratchPosition[];

    /**
     * Constructs a new TargetFitness object.
     * @param player the player that has to reach a specified goal.
     * @param target which has to be reached by the player sprite.
     * @param colorObstacles colors that are not allowed to be touched during the playthrough.
     * @param spriteObstacles sprites that are not allowed to be touched during the playthrough.
     */
    constructor(player: string, target: string, colorObstacles: string[],
                spriteObstacles: string[]) {
        this.player = player;
        this.target = target;
        this.colorObstacles = colorObstacles;
        this.spriteObstacles = spriteObstacles;
    }

    /**
     * Calculates the novelty score.
     * @param network the network that should be evaluated.
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the networks select events.
     * @returns Promise<number> the sparseness of the network's behaviour, which is a metric of novelty.
     */
    async getFitness(network: NetworkChromosome, timeout: number, eventSelection: NeuroevolutionEventSelection): Promise<number> {
        const playerRenderedTarget = Container.vmWrapper.getTargetBySpriteName(this.player);
        if (!playerRenderedTarget) {
            throw new Error("Player Sprite not found. Please check your config file.");
        }
        const initialPosition = new ScratchPosition(playerRenderedTarget.x, playerRenderedTarget.y);
        const executor = new NetworkExecutor(Container.vmWrapper, timeout, eventSelection, false);
        await executor.execute(network);


        // If we have no valid path to the target yet, try to find one. Sometimes we need to let some time pass within
        // a game for a valid path to become available.
        if (!this._pathToTarget) {
            playerRenderedTarget.setXY(initialPosition.x, initialPosition.y, true);
            this._pathToTarget = await PathFinder.aStarPlayerToColor(playerRenderedTarget, this.target, 5,
                this.colorObstacles, this.spriteObstacles);
            Container.pathToGoal = this._pathToTarget;
        }
        const fitness = this.getTargetDistanceFitness(network, playerRenderedTarget);
        executor.resetState();
        network.fitness = fitness;
        return fitness;
    }

    /**
     * A network's target fitness is defined to be the number of waypoints along a valid path that have been passed on
     * the found way to the target. The valid path is calculated using the A-Star algorithm.
     * @param network the network whose playthrough should be evaluated.
     * @param playerRenderedTarget contains information about the player sprite.
     * @return number representing the network's TargetFitness.
     */
    private getTargetDistanceFitness(network: NetworkChromosome, playerRenderedTarget: RenderedTarget): number {
        const playerEnd = {
            x: network.inputNodes.get(playerRenderedTarget.sprite.name).get("X-Position").nodeValue *
                (Container.vmWrapper.getStageSize().width / 2),
            y: network.inputNodes.get(playerRenderedTarget.sprite.name).get("Y-Position").nodeValue *
                (Container.vmWrapper.getStageSize().height / 2)
        };
        const playerEndPosition = new ScratchPosition(playerEnd.x, playerEnd.y);

        // If we've found a valid path from start to the target. The fitness is determined by the index of the
        // closest waypoint with the target representing the last waypoint.
        if (this._pathToTarget) {
            const distances = this._pathToTarget.map(waypoint => waypoint.distanceTo(playerEndPosition));
            // Offset by one to give a poor solution an advantage over no solution at all.
            return distances.indexOf(Math.min(...distances)) + 1;
        }
        // If we haven't found a valid path yet, assign poor fitness.
        else {
            return 0.1;
        }
    }
}
