import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NetworkChromosome} from "../NetworkChromosome";
import {Container} from "../../utils/Container";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";
import {NetworkExecutor} from "../NetworkExecutor";
import {PathFinder} from "../../scratch/PathFinder";
import {ScratchPosition} from "../../scratch/ScratchPosition";

export class TargetFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * The player who has to reach the goal sprite.
     */
    private readonly player: RenderedTarget;

    /**
     * The starting position of the player on the Canvas.
     */
    private readonly playerStart: ScratchPosition;

    /**
     * The target which has to be reached by the player sprite.
     * The target can be a color in hex representation or a name of a Sprite.
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
     * A valid path from the starting point to the target point.
     */
    private _pathToTarget: ScratchPosition[];

    /**
     * Constructs a new TargetFitness object.
     * @param player the player who has to reach the goal sprite.
     * @param target the name of the target which has to be reached by the player sprite.
     * @param colorObstacles colors which are not allowed to be touched during the playthrough.
     * @param spriteObstacles sprites which are not allowed to be touched during the playthrough.
     */
    constructor(player: string, target: string, colorObstacles: string[],
                spriteObstacles: string[]) {
        this.player = Container.vmWrapper.getTargetOfSprite(player);
        if (!this.player) {
            throw new Error("Player Sprite not found. Please check your config file.");
        }
        this.target = target;
        this.playerStart = new ScratchPosition(this.player.x, this.player.y);
        this.colorObstacles = colorObstacles;
        this.spriteObstacles = spriteObstacles;
    }

    /**
     * Calculates the distance to the target Sprite.
     * @param network the network to evaluate
     * @param timeout the timeout after which the execution of the Scratch-VM is halted.
     * @param random if set true networks choose events randomly
     */
    async getFitness(network: NetworkChromosome, timeout: number, random?: boolean): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        if (random) {
            await executor.executeRandom(network);
        } else {
            await executor.execute(network);
        }

        // If we have no valid path to the target yet, try to find one. Sometimes we need to let some time pass within
        // a game for a valid path to become available.
        if (!this._pathToTarget) {
            this._pathToTarget = await PathFinder.aStarPlayerToColor(this.player, this.target, 5,
                this.colorObstacles, this.spriteObstacles);
            Container.pathToGoal = this._pathToTarget;
        }
        const fitness = this.getTargetDistanceFitness(network);
        executor.resetState();
        network.networkFitness = fitness;
        return fitness;
    }

    /**
     * Used for CombinedNetworkFitness.
     * Value is calculated within CombinedNetworkFitness, hence returns 0.0
     */
    getFitnessWithoutPlaying(network: NetworkChromosome): number {
        return this.getTargetDistanceFitness(network);
    }

    /**
     * Compares two fitness values -> Higher values are better.
     * @param value1 first fitness value
     * @param value2 second fitness value
     */
    compare(value1: number, value2: number): number {
        return value2 - value1;
    }

    /**
     * Calculates the distance from the player to the target including the player's travel distance.
     * @param network the network used for gathering the final position of the player
     * @return Returns the targetFitness value
     */
    private getTargetDistanceFitness(network: NetworkChromosome): number {
        const playerEnd = {
            x: network.inputNodes.get(this.player.sprite.name).get("X-Position").nodeValue *
                (Container.vmWrapper.getStageSize().width / 2),
            y: network.inputNodes.get(this.player.sprite.name).get("Y-Position").nodeValue *
                (Container.vmWrapper.getStageSize().height / 2)
        }
        const playerEndPosition = new ScratchPosition(playerEnd.x, playerEnd.y)

        // TODO: Remove when we found root cause of defect networks (happens like once in 1000 times)
        if (playerEndPosition.x === 0 && playerEndPosition.y === 0) {
            return 0.1;
        }
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
