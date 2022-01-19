import {TestGenerator} from "./TestGenerator";
import {SearchAlgorithm} from "../search/SearchAlgorithm";
import {SearchAlgorithmBuilder} from "../search/SearchAlgorithmBuilder";
import {SearchAlgorithmProperties} from "../search/SearchAlgorithmProperties";
import {WhiskerTestListWithSummary} from "./WhiskerTestListWithSummary";
import {WhiskerTest} from "./WhiskerTest";
import {Container} from "../utils/Container";
import Arrays from "../utils/Arrays";
import {Randomness} from "../utils/Randomness";

export class NeuroevolutionTestGenerator extends TestGenerator {

    /**
     * Searches for tests for the given project by using a Neuroevolution Algorithm
     */
    async generateTests(): Promise<WhiskerTestListWithSummary> {
        const searchAlgorithm = this.buildSearchAlgorithm(true);
        const archive = await searchAlgorithm.findSolution();
        const testChromosomes = Arrays.distinct(archive.values());
        const parameter = Container.config.neuroevolutionProperties;

        // Execute the final suite on as many program states as possible. Different program states are enforced
        // through diverging seeds.
        const scratchSeeds = Array(parameter.repetitions).fill(0).map(
            () => Randomness.getInstance().nextInt(0, Number.MAX_SAFE_INTEGER));
        for (const network of testChromosomes) {
            for (let i = 0; i < parameter.repetitions; i++) {
                Randomness.setScratchSeed(scratchSeeds[i]);
                await parameter.networkFitness.getFitness(network, parameter.timeout, parameter.eventSelection);
            }
        }

        console.log("Networks: ", testChromosomes)

        let testSuite: WhiskerTest[];
        if (Container.config.getTestSuiteType() === 'dynamic') {
            testSuite = testChromosomes.map(chromosome => new WhiskerTest(chromosome));
        } else {
            testSuite = this.getTestSuite(testChromosomes);
        }

        await this.collectStatistics(testSuite);
        const summary = this.summarizeSolution(archive);
        return new WhiskerTestListWithSummary(testSuite, summary);
    }

    /**
     * Builds the specified Neuroevolution search algorithm (specified in config file)
     * @param initializeFitnessFunction flag determining if search algorithm fitness functions should be initialised.
     */
    protected buildSearchAlgorithm(initializeFitnessFunction: boolean): SearchAlgorithm<any> {
        const builder = new SearchAlgorithmBuilder(this._config.getAlgorithm())
            .addProperties(this._config.neuroevolutionProperties as unknown as SearchAlgorithmProperties<any>);

        if (initializeFitnessFunction) {
            builder.initializeFitnessFunction(this._config.getFitnessFunctionType(),
                null, this._config.getFitnessFunctionTargets());
            this._fitnessFunctions = builder.fitnessFunctions;
        }

        builder.addChromosomeGenerator(this._config.getChromosomeGenerator());
        return builder.buildSearchAlgorithm();
    }
}
