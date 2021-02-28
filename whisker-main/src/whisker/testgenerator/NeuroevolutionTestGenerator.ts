import {TestGenerator} from "./TestGenerator";
import {ScratchProject} from "../scratch/ScratchProject";
import {WhiskerTest} from "./WhiskerTest";
import {List} from "../utils/List";
import {SearchAlgorithm} from "../search/SearchAlgorithm";
import {SearchAlgorithmBuilder} from "../search/SearchAlgorithmBuilder";
import {SearchAlgorithmProperties} from "../search/SearchAlgorithmProperties";

export class NeuroevolutionTestGenerator extends TestGenerator{
    async generateTests(project: ScratchProject): Promise<List<WhiskerTest>>{
        const searchAlgorithm = this.buildSearchAlgorithm(true);
        const networkChromosomes = await searchAlgorithm.findSolution();

        const testSuite = await this.getTestSuite(networkChromosomes);

        await this.collectStatistics(testSuite);
        return testSuite;
    }

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
