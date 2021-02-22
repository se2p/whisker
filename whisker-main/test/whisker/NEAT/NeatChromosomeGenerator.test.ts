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
        expect(neatChromosome.connections.size()).toBeGreaterThanOrEqual(1)
    })

    test('Create several Chromosomes to test if defect chromosomes survive', () => {
        inputSize = 3;
        outputSize = 1;
        const chromosomes = []
        const inputs = [1,2,3];
        generator = new NeatChromosomeGenerator(mutationOp, crossoverOp, inputSize, outputSize);
        for (let i = 0; i < 100; i++) {
            chromosomes.push(generator.get())
        }
        for(const chromosome of chromosomes){
            expect(chromosome.activateNetwork(inputs)).not.toBe(null);
        }
    })
})
