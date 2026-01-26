import {TestGenerator} from "./TestGenerator";
import {SearchAlgorithm} from "../search/SearchAlgorithm";
import {SearchAlgorithmBuilder} from "../search/SearchAlgorithmBuilder";
import {SearchAlgorithmProperties} from "../search/SearchAlgorithmProperties";
import {WhiskerTestListWithSummary} from "./WhiskerTestListWithSummary";
import {WhiskerTest} from "./WhiskerTest";
import Arrays from "../utils/Arrays";
import {NeatChromosome} from "../agentTraining/neuroevolution/networks/NeatChromosome";
import {StatisticsCollector} from "../utils/StatisticsCollector";
import {Randomness} from "../utils/Randomness";
import {NetworkExecutor} from "../agentTraining/neuroevolution/misc/NetworkExecutor";
import {Container} from "../utils/Container";
import {NeatParameter} from "../agentTraining/neuroevolution/hyperparameter/NeatParameter";
import {AssertionGenerator} from "./AssertionGenerator";
import logger from "../../util/logger";
import {SearchAlgorithmType} from "../search/algorithms/SearchAlgorithmType";

export class NeuroevolutionTestGenerator extends TestGenerator {

    /**
     * Searches for tests for the given project by using a Neuroevolution Algorithm
     */
    async generateTests(): Promise<WhiskerTestListWithSummary> {
        this._vmWrapper.vm.registerCoverageTracer();
        const searchAlgorithm = this.buildOptimizationAlgorithm(true);
        const archive = await searchAlgorithm.findSolution();
        const testChromosomes = Arrays.distinctByComparator([...archive.values()],
            (a: NeatChromosome, b: NeatChromosome) => a.toString() === b.toString());
        const hyperParameter = this._config.neuroevolutionProperties;
        if (hyperParameter.activationTraceRepetitions > 0 && hyperParameter.eventSelection === 'activation') {
            logger.debug(`Collecting activation traces for ${testChromosomes.length} networks with a repetition count of ${hyperParameter.activationTraceRepetitions}`);
            await this.recordActivationTrace(hyperParameter, testChromosomes);
        }

        const testSuite = testChromosomes.map(chromosome => new WhiskerTest(chromosome));

        // Generate Assertions for static test suite.
        if (this._config.isAssertionGenerationActive()) {
            const assertionGenerator = new AssertionGenerator();
            if (this._config.isMinimizeAssertionsActive()) {
                await assertionGenerator.addStateChangeAssertions(testSuite);
            } else {
                await assertionGenerator.addAssertions(testSuite);
            }
        }

        this.collectStatistics(testSuite);
        const summary = await this.summarizeSolution(archive);
        return new WhiskerTestListWithSummary(testSuite, summary);
    }

    /**
     * Builds the specified Neuroevolution search algorithm (specified in config file)
     * @param initializeFitnessFunction flag determining if search algorithm fitness functions should be initialised.
     */
    protected override buildOptimizationAlgorithm(initializeFitnessFunction: boolean): SearchAlgorithm<any> {
        const builder = new SearchAlgorithmBuilder(this._config.getAlgorithm() as SearchAlgorithmType)
            .addProperties(this._config.neuroevolutionProperties as unknown as SearchAlgorithmProperties<any>);

        if (initializeFitnessFunction) {
            builder.initializeFitnessFunction(this._config.getFitnessFunctionType(),
                null, this._config.getFitnessFunctionTargets());
            this._fitnessFunctions = builder.fitnessFunctions;
        }

        builder.addChromosomeGenerator(this._config.getChromosomeGenerator());
        return builder.buildSearchAlgorithm();
    }


    /**
     * Executes the generated tests for a user-defined amount of times to collect activationTraces which can later
     * be used to identify deviating program behaviour.
     * @param hyperParameter user-defined parameters.
     * @param testChromosomes the chromosomes whose activationTrace should be recorded.
     */
    private async recordActivationTrace(hyperParameter: NeatParameter, testChromosomes: NeatChromosome[]): Promise<void> {
        // Save the number of fitness evaluations to recover them later.
        const trueEvaluations = StatisticsCollector.getInstance().evaluations;

        // Generate the required seeds.
        const scratchSeeds = Array(hyperParameter.activationTraceRepetitions).fill(0).map(
            () => Randomness.getInstance().nextInt(0, Number.MAX_SAFE_INTEGER));

        for (const network of testChromosomes) {
            // Saves some values to retrieve them later.
            const score = network.score;
            const originalPlayTime = network.playTime;

            // Execute the network and save the activation trace
            network.recordNetworkStatistics = true;
            const executor = new NetworkExecutor(Container.vmWrapper, hyperParameter.timeout,
                hyperParameter.eventSelection, hyperParameter.classificationType, false);
            for (const seed of scratchSeeds) {
                Randomness.setScratchSeed(seed);
                await executor.execute(network);
                await executor.resetState();
            }

            // Restore the saved values
            network.score = score;
            network.playTime = originalPlayTime;
        }
        StatisticsCollector.getInstance().evaluations = trueEvaluations;
    }
}
