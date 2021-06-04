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
     * The target which has to be reached by the player sprite. The target can be a color or a name of a Sprite.
     */
    private readonly target: string;

    /**
     * Constructs a new GoalFitness object.
     * @param player the player who has to reach the goal sprite.
     * @param target the name of the target which has to be reached by the player sprite.
     */
    constructor(player: string, target: string) {
        for (const runtimeTargets of Container.vm.runtime.targets) {
            if (runtimeTargets.sprite.name === player) {
                this.player = runtimeTargets;
            }
        }
        if (!this.player) {
            throw new Error("Player Sprite not found. Please check your config file.")
        }
            this.target = target;
    }

    /**
     * Calculates the distance to the target Sprite.
     * @param network the network to evaluate
     * @param timeout the timeout after which the execution of the Scratch-VM is halted.
     */
    async getFitness(network: NetworkChromosome, timeout: number): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.execute(network);
        // We want to maximize fitness, hence subtract the distance from the maximum stage distance of 600.
        const distNormalized = 600.01 - this.extractDistance(network.trace.blockTraces);
        network.networkFitness = distNormalized;
        executor.resetState();
        return distNormalized;
    }

    /**
     * Calculates the distance to the target Sprite after a random project execution.
     * @param network the network to evaluate
     * @param timeout the timeout after which the execution of the Scratch-VM is halted.
     */
    async getRandomFitness(network: NetworkChromosome, timeout: number): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.executeRandom(network);
        // We want to maximize fitness, hence subtract the distance from the maximum stage distance of 600.
        const distNormalized = 600.01 - this.extractDistance(network.trace.blockTraces);
        executor.resetState();
        network.networkFitness = distNormalized;
        return distNormalized;
    }

    /**
     * Used for CombinedNetworkFitness.
     * Value is calculated within CombinedNetworkFitness, hence returns 0.0
     */
    getFitnessWithoutPlaying(): number {
        return 0.0;
    }

    /**
     * Compares two fitness values -> Higher values are better.
     * @param value1 first fitness value
     * @param value2 second fitness value
     */
    compare(value1: number, value2: number): number {
        return value2 - value1;
    }

    private extractDistance(traces: [Trace]): number {
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
}
