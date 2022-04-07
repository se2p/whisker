import {TestGenerator} from "./TestGenerator";
import {SearchAlgorithm} from "../search/SearchAlgorithm";
import {SearchAlgorithmBuilder} from "../search/SearchAlgorithmBuilder";
import {SearchAlgorithmProperties} from "../search/SearchAlgorithmProperties";
import {WhiskerTestListWithSummary} from "./WhiskerTestListWithSummary";
import {WhiskerTest} from "./WhiskerTest";
import Arrays from "../utils/Arrays";
import {NeatChromosome} from "../whiskerNet/Networks/NeatChromosome";

export class NeuroevolutionTestGenerator extends TestGenerator {

    /**
     * Searches for tests for the given project by using a Neuroevolution Algorithm
     */
    async generateTests(): Promise<WhiskerTestListWithSummary> {
        const searchAlgorithm = this.buildSearchAlgorithm(true);
        const archive = await searchAlgorithm.findSolution();
        const testChromosomes = Arrays.distinctByComparator([...archive.values()],
            (a: NeatChromosome, b: NeatChromosome) => a.toString() === b.toString());
        const testSuite = testChromosomes.map(chromosome => new WhiskerTest(chromosome));
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
