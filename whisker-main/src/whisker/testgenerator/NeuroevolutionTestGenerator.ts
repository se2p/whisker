import {TestGenerator} from "./TestGenerator";
import {SearchAlgorithm} from "../search/SearchAlgorithm";
import {SearchAlgorithmBuilder} from "../search/SearchAlgorithmBuilder";
import {SearchAlgorithmProperties} from "../search/SearchAlgorithmProperties";
import {WhiskerTestListWithSummary} from "./WhiskerTestListWithSummary";
import {List} from "../utils/List";
import {TestChromosome} from "../testcase/TestChromosome";
import {NEAT} from "../search/algorithms/NEAT";
import {WhiskerTest} from "./WhiskerTest";
import {Container} from "../utils/Container";

export class NeuroevolutionTestGenerator extends TestGenerator {

    /**
     * Searches for tests for the given project by using a Neuroevolution Algorithm
     */
    async generateTests(): Promise<WhiskerTestListWithSummary> {
        const searchAlgorithm = this.buildSearchAlgorithm(true);
        const archive = await searchAlgorithm.findSolution();
        const testChromosomes = new List<TestChromosome>(Array.from(archive.values())).distinct();
        let testSuite: List<WhiskerTest>;
        if (Container.config.getTestSuiteType() === 'dynamic') {
            testSuite = testChromosomes.map(chromosome => new WhiskerTest(chromosome));
        } else {
            testSuite = await this.getTestSuite(testChromosomes);
        }

        await this.collectStatistics(testSuite);
        const summary = this.summarizeSolution(archive);
        // TODO: It is deeply necessary to separate NE and SearchAlgorithms.
        if (searchAlgorithm instanceof NEAT) {
            console.log("PopulationRecord: ", searchAlgorithm.getPopulationRecord());
        }
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
