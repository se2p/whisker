import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NetworkChromosome} from "../NetworkChromosome";
import {Container} from "../../utils/Container";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";
import {NetworkExecutor} from "../NetworkExecutor";
import {Trace} from "scratch-vm/src/engine/tracing";

export class TargetFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * The player who has to reach the goal sprite.
     */
    private readonly player: RenderedTarget;

    /**
     * The starting position of the player.
     */
    private readonly playerStart: { x: number, y: number };

    /**
     * The target which has to be reached by the player sprite.
     * The target can be a color in hex representation or a name of a Sprite.
     */
    private readonly target: string;

    /**
     * A weight determining how big the influence of the traveled distance should be within the distance calculation
     * This may help overcoming local optima.
     * Set it to 0 to disable the travelled distance within the fitness calculation.
     */
    private readonly travelDistanceWeight: number;

    /**
     * Constructs a new TargetFitness object.
     * @param player the player who has to reach the goal sprite.
     * @param target the name of the target which has to be reached by the player sprite.
     * @param travelDistanceWeight the weight of the travelDistance within the fitness calculation.
     */
    constructor(player: string, target: string, travelDistanceWeight: number) {
        for (const runtimeTargets of Container.vm.runtime.targets) {
            if (runtimeTargets.sprite.name === player) {
                this.player = runtimeTargets;
            }
        }
        if (!this.player) {
            throw new Error("Player Sprite not found. Please check your config file.");
        }
        this.playerStart = {x: this.player.x, y: this.player.y}
        this.target = target;
        this.travelDistanceWeight = travelDistanceWeight;
    }

    /**
     * Calculates the distance to the target Sprite.
     * @param network the network to evaluate
     * @param timeout the timeout after which the execution of the Scratch-VM is halted.
     */
    async getFitness(network: NetworkChromosome, timeout: number): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.execute(network);
        const fitness = this.getTargetDistanceFitness(network);
        executor.resetState();
        network.networkFitness = fitness;
        return fitness;
    }

    /**
     * Calculates the distance to the target Sprite after a random project execution.
     * @param network the network to evaluate
     * @param timeout the timeout after which the execution of the Scratch-VM is halted.
     */
    async getRandomFitness(network: NetworkChromosome, timeout: number): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.executeRandom(network);
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
        // We want to maximize fitness, hence subtract the distance from the maximum stage distance of 600.
        let fitnessDistance = 600.01 - this.extractDistanceToTarget(network.trace.blockTraces);
        // Reward the player according to the distances travelled. This might help overcoming local optima.
        const playerEnd = {
            x: network.inputNodes.get(this.player.sprite.name).get("X-Position").nodeValue *
                (Container.vmWrapper.getStageSize().width / 2),
            y: network.inputNodes.get(this.player.sprite.name).get("Y-Position").nodeValue *
                (Container.vmWrapper.getStageSize().height / 2)
        }
        fitnessDistance += this.travelDistanceWeight * this.distanceTravelled(playerEnd);
        return fitnessDistance
    }

    /**
     * Extracts the distance to the target.
     * @param traces the traces which contain the distance to the targeted sprite/color
     * @return Returns the distance to the target sprite/color
     */
    private extractDistanceToTarget(traces: [Trace]): number {
        let ifBlock;
        // Search for the ifBlock which in term contains the distance to the target sprite/color.
        // If the target name starts with an '#' we are searching for a color
        if (this.target.startsWith("#")) {
            for (const blockId of Object.keys(this.player.blocks._blocks)) {
                const block = this.player.blocks.getBlock(blockId);
                if (this.player.blocks.getOpcode(block) === 'sensing_touchingcolor') {
                    const colorBlock = this.player.blocks.getBlock(block.inputs.COLOR.block);
                    if (colorBlock.fields.COLOUR.value === this.target) {
                        ifBlock = block.parent;
                        break;
                    }
                }
            }
        }
        // Otherwise if the target name does not start with an '#' we are searching for a sprite.
        else {
            for (const blockId of Object.keys(this.player.blocks._blocks)) {
                const block = this.player.blocks.getBlock(blockId);
                if (this.player.blocks.getOpcode(block) === 'sensing_touchingobjectmenu' &&
                    block.fields.TOUCHINGOBJECTMENU.value === this.target) {
                    ifBlock = this.player.blocks.getBlock(block.parent).parent;
                    break;
                }
            }
        }

        if (!ifBlock) {
            throw new Error("Target sprite/color not found. Please check your config file.")
        }
        return traces[ifBlock].distances[0][0];
    }

    /**
     * Calculates the travel distance of the player. The travel distance influences the final fitness value based on
     * a predefined weight. The travel distance can be used to overcome local optima.
     * @param playerEnd the final position of the player after executing the project.
     * @return Returns the travelled distance of the player.
     */
    private distanceTravelled(playerEnd: { x: number, y: number }) {
        return Math.sqrt(Math.pow(this.playerStart.x - playerEnd.x, 2) +
            Math.pow(this.playerStart.y - playerEnd.y, 2));
    }
}
