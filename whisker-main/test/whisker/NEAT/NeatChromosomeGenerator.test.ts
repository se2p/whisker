
import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";

describe('NeatChromosomeGenerator', () => {

    test('Create initial random Chromosome', () => {
        const mutationOp = new NeatMutation();
        const crossoverOp = new NeatCrossover();
        const generator = new NeatChromosomeGenerator(mutationOp, crossoverOp);
        generator.numInputNodes = 3;
        generator.numOutputNodes = 2;
        const neatChromosome = generator.get();
        expect(neatChromosome.getNodes().size()).toBe(5)
        expect(neatChromosome.getConnections().size()).toBe(6)
    })
})
