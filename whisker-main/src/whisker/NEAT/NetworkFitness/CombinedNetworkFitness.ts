import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NeatChromosome} from "../NeatChromosome";
import {List} from "../../utils/List";
import {NetworkExecutor} from "../NetworkExecutor";
import {Container} from "../../utils/Container";
import {NotSupportedFunctionException} from "../../core/exceptions/NotSupportedFunctionException";

export class CombinedNetworkFitness implements NetworkFitnessFunction<NeatChromosome>{

    private readonly _fitnessFunctions = new List<NetworkFitnessFunction<NeatChromosome>>();

    constructor(...fitnessFunctions: NetworkFitnessFunction<NeatChromosome>[]) {
        this._fitnessFunctions.addAll(fitnessFunctions);
    }

    compare(value1: number, value2: number): number {
        return value2 - value1;
    }

    async getFitness(network: NeatChromosome, timeout: number): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.execute(network);

        let fitness = 0.00;
        for(const fitnessFunction of this._fitnessFunctions){
            fitness += fitnessFunction.getFitnessWithoutPlaying(network);
        }
        network.networkFitness = fitness;
        return Promise.resolve(fitness);
    }

    // No sense to use this in this way; but needed to satisfy interface implementation.
    getFitnessWithoutPlaying(network: NeatChromosome): number {
        throw new NotSupportedFunctionException();
    }

}
