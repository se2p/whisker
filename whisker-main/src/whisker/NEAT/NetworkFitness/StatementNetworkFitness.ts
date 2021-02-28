import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NeatChromosome} from "../NeatChromosome";
import {StatementCoverageFitness} from "../../testcase/fitness/StatementFitnessFunction";
import {StatementFitnessFunctionFactory} from "../../testcase/fitness/StatementFitnessFunctionFactory";
import {List} from "../../utils/List";
import {Container} from "../../utils/Container";
import {TestChromosome} from "../../testcase/TestChromosome";
import {IntegerListMutation} from "../../integerlist/IntegerListMutation";
import {SinglePointCrossover} from "../../search/operators/SinglePointCrossover";
import {NetworkExecutor} from "../NetworkExecutor";

export class StatementNetworkFitness implements NetworkFitnessFunction<NeatChromosome>{


    compare(value1: number, value2: number): number {
        return value2 - value1;
    }

    async getFitness(network: NeatChromosome, timeout: number): Promise<number> {

        // Get the execution Trace
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.execute(network);

        // Cast to a TestChromosome
        const testChromosome = new TestChromosome(network.codons, new IntegerListMutation(0, 1), new SinglePointCrossover())
        testChromosome.trace = network.trace;

        // Step through each statement and check if we reached it.
        const factory: StatementFitnessFunctionFactory = new StatementFitnessFunctionFactory();
        const statemenCoverage: List<StatementCoverageFitness> = factory.extractFitnessFunctions(Container.vm, new List<string>());
        let statementScore = 0;
        for(const statement of statemenCoverage){
            if(statement.isCovered(testChromosome))
             statementScore++;
        }
        network.networkFitness = statementScore;
        return Promise.resolve(statementScore);
    }
}
