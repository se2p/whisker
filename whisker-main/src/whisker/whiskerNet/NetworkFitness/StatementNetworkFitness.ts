import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NetworkChromosome} from "../NetworkChromosome";
import {StatementCoverageFitness} from "../../testcase/fitness/StatementFitnessFunction";
import {StatementFitnessFunctionFactory} from "../../testcase/fitness/StatementFitnessFunctionFactory";
import {List} from "../../utils/List";
import {Container} from "../../utils/Container";
import {TestChromosome} from "../../testcase/TestChromosome";
import {IntegerListMutation} from "../../integerlist/IntegerListMutation";
import {SinglePointCrossover} from "../../search/operators/SinglePointCrossover";
import {NetworkExecutor} from "../NetworkExecutor";

export class StatementNetworkFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * Calculates the number of reached blocks
     * @param network the network to evaluate
     * @param timeout the timeout after which the execution of the Scratch-VM is halted.
     */
    async getFitness(network: NetworkChromosome, timeout: number): Promise<number> {
        // Get the execution Trace
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.execute(network);
        const statementScore = StatementNetworkFitness.getNumberReachedBlocks(network);
        network.networkFitness = statementScore;
        executor.resetState();
        return Promise.resolve(statementScore);
    }

    /**
     * Calculate the fitness value without playing the game.
     * Used for CombinedNetworkFitness.
     */
    getFitnessWithoutPlaying(network: NetworkChromosome): number {
        return StatementNetworkFitness.getNumberReachedBlocks(network);
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
     * Calculates how many blocks this network has reached during its playthrough.
     * @param network the network to evaluate
     */
    private static getNumberReachedBlocks(network: NetworkChromosome): number {
        // Cast to a TestChromosome
        const testChromosome = new TestChromosome(network.codons, new IntegerListMutation(0, 1), new SinglePointCrossover())
        testChromosome.trace = network.trace;

        // Step through each statement and check if we reached it.
        const factory: StatementFitnessFunctionFactory = new StatementFitnessFunctionFactory();
        const statemenCoverage: List<StatementCoverageFitness> = factory.extractFitnessFunctions(Container.vm, new List<string>());
        let statementScore = 0;
        for (const statement of statemenCoverage) {
            if (statement.isCovered(testChromosome))
                statementScore++;
        }
        return statementScore;
    }
}
