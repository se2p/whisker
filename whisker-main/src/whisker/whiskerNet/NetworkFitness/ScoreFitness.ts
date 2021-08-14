import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {Container} from "../../utils/Container";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {NetworkChromosome} from "../NetworkChromosome";
import {NetworkExecutor} from "../NetworkExecutor";


export class ScoreFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * Calculates the reached score
     * @param network the network to evaluate
     * @param timeout the timeout after which the execution of the Scratch-VM is halted.
     * @param random if set true networks choose events randomly
     */
    async getFitness(network: NetworkChromosome, timeout: number, random?:boolean): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        if(random){
            await executor.executeRandom(network);
        }
        else {
            await executor.execute(network);
        }
        let score = ScoreFitness.gatherPoints(Container.vm);
        if(score < 0){
            score = 0.01;
        }
        network.networkFitness = score;
        executor.resetState();
        return network.networkFitness;
    }

    /**
     * Calculates the reached score without starting a new playthrough.
     * Used for CombinedNetworkFitness.
     */
    getFitnessWithoutPlaying(): number {
        return ScoreFitness.gatherPoints(Container.vm);
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
     * Calculates the reached score by crawling through various variables of the stage and sprites.
     * @param vm the Scratch-VM after the playthrough.
     */
    private static gatherPoints(vm: VirtualMachine): number {
        let points = 0;
        for (const target of vm.runtime.targets) {
            for (const value of Object.values(target.variables)) {
                // @ts-ignore
                const name = value.name.toLowerCase();
                if (name === 'punkte' || name === 'points' ||name === 'score' || name === 'high score') {
                    // @ts-ignore
                    points += Number(value.value)
                }
            }
        }
        return points;
    }
}
