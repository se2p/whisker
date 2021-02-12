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
        // add +1 to the input Nodes due to the Bias Node
        expect(neatChromosome.getNodes().size).toBe(generator.numInputNodes + 1 + generator.numOutputNodes)
        expect(neatChromosome.getConnections().size()).toBe((generator.numInputNodes + 1) * generator.numOutputNodes)
        console.log(neatChromosome.toString())
    })
})
