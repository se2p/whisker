import {TestGenerator} from "./TestGenerator";
import {SearchAlgorithm} from "../search/SearchAlgorithm";
import {SearchAlgorithmBuilder} from "../search/SearchAlgorithmBuilder";
import {SearchAlgorithmProperties} from "../search/SearchAlgorithmProperties";
import {WhiskerTestListWithSummary} from "./WhiskerTestListWithSummary";
import {NEAT} from "../search/algorithms/NEAT";

export class NeuroevolutionTestGenerator extends TestGenerator {

    /**
     * Searches for tests for the given project by using a Neuroevolution Algorithm
     */
    async generateTests(): Promise<WhiskerTestListWithSummary> {
        const searchAlgorithm = this.buildSearchAlgorithm(true);
        const networkChromosomes = await searchAlgorithm.findSolution();
        const testSuite = await this.getTestSuite(networkChromosomes);
        await this.collectStatistics(testSuite);
        const summary = searchAlgorithm.summarizeSolution();
        const testListWithSummary = new WhiskerTestListWithSummary(testSuite, summary);
        // TODO: It is deeply necessary to separate NE and SearchAlgorithms or at least make NE a subclass of it.
        if(searchAlgorithm instanceof NEAT){
        testListWithSummary.networkPopulation = searchAlgorithm.getPopulationRecordAsJSON();
        }
        return testListWithSummary;
    }

    /**
     * Builds the specified Neuroevolution search algorithm (specified in config file)
     * @param initializeFitnessFunction flag determining if search algorithm fitness functions should be initialised.
     */
    protected buildSearchAlgorithm(initializeFitnessFunction: boolean): SearchAlgorithm<any> {
        const builder = new SearchAlgorithmBuilder(this._config.getAlgorithm())
            .addProperties(this._config.getNeuroevolutionProperties() as unknown as SearchAlgorithmProperties<any>);

        if (initializeFitnessFunction) {
            builder.initializeFitnessFunction(this._config.getFitnessFunctionType(),
                null, this._config.getFitnessFunctionTargets());
            this._fitnessFunctions = builder.fitnessFunctions;
        }

        builder.addChromosomeGenerator(this._config.getChromosomeGenerator());
        return builder.buildSearchAlgorithm();
    }
}
