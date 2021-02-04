import {TestGenerator} from "./TestGenerator";
import {ScratchProject} from "../scratch/ScratchProject";
import {WhiskerTest} from "./WhiskerTest";
import {List} from "../utils/List";

export class NeuroevolutionTestGenerator extends TestGenerator{
    async generateTests(project: ScratchProject): Promise<List<WhiskerTest>>{
        const searchAlgorithm = this.buildSearchAlgorithm(true);
        const testChromosomes = await searchAlgorithm.findSolution();

        const testSuite = await this.getTestSuite(testChromosomes);

        await this.collectStatistics(testSuite);
        return testSuite;
    }
}
