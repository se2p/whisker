import {TestGenerator} from "./TestGenerator";
import {ScratchProject} from "../scratch/ScratchProject";
import {WhiskerTest} from "./WhiskerTest";
import {List} from "../utils/List";
import {TestChromosome} from "../testcase/TestChromosome";

export class NeuroevolutionTestGenerator extends TestGenerator{
    async generateTests(project: ScratchProject): Promise<List<WhiskerTest>>{
        const searchAlgorithm = this.buildSearchAlgorithm(true);
        const networkChromosomes = await searchAlgorithm.findSolution();

        const testChromosomes = new List<TestChromosome>()

        // TODO: This is a bit of a nasty cast in order to feed the getTestSuite() method with testChromosomes
        for(const network of networkChromosomes){
            const codons = network.trace.events;
            const testChromosome = new TestChromosome(codons, network.getMutationOperator(), network.getCrossoverOperator())
            testChromosome.trace = network.trace;
            testChromosomes.add(testChromosome)
        }

        const testSuite = await this.getTestSuite(testChromosomes);

        await this.collectStatistics(testSuite);
        return testSuite;
    }
}
