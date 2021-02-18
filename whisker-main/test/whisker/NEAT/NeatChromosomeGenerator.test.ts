import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";

describe('NeatChromosomeGenerator', () => {

    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let generator: NeatChromosomeGenerator
    let inputSize: number
    let outputSize: number

    beforeEach(() => {
        mutationOp = new NeatMutation();
        crossoverOp = new NeatCrossover();
        inputSize = 10;
        outputSize = 7;
        generator = new NeatChromosomeGenerator(mutationOp, crossoverOp,inputSize, outputSize);
    })

    test('Create initial random Chromosome', () => {
        const neatChromosome = generator.get();
        expect(neatChromosome.allNodes.size()).toBe(inputSize + 1 + outputSize) // +1 for Bias
        expect(neatChromosome.connections.size()).toBe(inputSize * outputSize)
    })

    test('Create two random Chromosome and compare innovationNumbers', () => {
        const firstChromosome = generator.get();
        const firstInnovations = []
        for (const firstConnection of firstChromosome.connections)
            firstInnovations.push(firstConnection.innovation)

        const secondChromosome = generator.get();
        const secondInnovations = []
        for (const secondConnection of secondChromosome.connections)
            secondInnovations.push(secondConnection.innovation)

        expect(firstInnovations).toEqual(secondInnovations)
    })
})
