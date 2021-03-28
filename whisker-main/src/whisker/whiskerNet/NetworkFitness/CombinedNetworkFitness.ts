import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NetworkChromosome} from "../NetworkChromosome";
import {List} from "../../utils/List";
import {NetworkExecutor} from "../NetworkExecutor";
import {Container} from "../../utils/Container";
import {NotSupportedFunctionException} from "../../core/exceptions/NotSupportedFunctionException";
import {SurviveFitness} from "./SurviveFitness";

export class CombinedNetworkFitness implements NetworkFitnessFunction<NetworkChromosome>{

    private readonly _fitnessFunctions = new List<NetworkFitnessFunction<NetworkChromosome>>();

    constructor(...fitnessFunctions: NetworkFitnessFunction<NetworkChromosome>[]) {
        this._fitnessFunctions.addAll(fitnessFunctions);
    }

    compare(value1: number, value2: number): number {
        return value2 - value1;
    }

    async getFitness(network: NetworkChromosome, timeout: number): Promise<number> {
        const start = Date.now();
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.execute(network);
        const surviveTime = Math.round((Container.vm.runtime.currentMSecs - start) / 100);
        let fitness = 0.00;
        for(const fitnessFunction of this._fitnessFunctions){
            if(fitnessFunction instanceof SurviveFitness)
                fitness += surviveTime;
            else {
                fitness += fitnessFunction.getFitnessWithoutPlaying(network);
            }
        }
        network.networkFitness = fitness;
        return Promise.resolve(fitness);
    }


    async getRandomFitness(network: NetworkChromosome, timeout: number): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.executeRandom(network);

        let fitness = 0.00;
        for(const fitnessFunction of this._fitnessFunctions){
            fitness += fitnessFunction.getFitnessWithoutPlaying(network);
        }
        network.networkFitness = fitness;
        return Promise.resolve(fitness);
    }

    // No sense to use this in this way; but needed to satisfy interface implementation.
    getFitnessWithoutPlaying(network: NetworkChromosome): number {
        throw new NotSupportedFunctionException();
    }

}
