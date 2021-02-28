import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";
import {NeatUtil} from "../../../src/whisker/NEAT/NeatUtil";
import {NeatChromosome} from "../../../src/whisker/NEAT/NeatChromosome";

describe('NeatChromosomeGenerator', () => {

    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let generator: NeatChromosomeGenerator
    let inputSize: number
    let outputSize: number

    beforeEach(() => {
        crossoverOp = new NeatCrossover(0.4);
        mutationOp = new NeatMutation(0.03, 0.1, 30,
            0.2, 0.01, 0.8, 1.5,
            0.1, 3,0.1);
        inputSize = 6;
        outputSize = 3;
        generator = new NeatChromosomeGenerator(mutationOp, crossoverOp,inputSize, outputSize, 0.4, false);
    })

    test('Create initial random Chromosome', () => {
        const neatChromosome = generator.get();
        expect(neatChromosome.allNodes.size()).toBe(inputSize + 1 + outputSize) // +1 for Bias
        expect(neatChromosome.connections.size()).toBeGreaterThan(0)
    })

    test('Create initial random Chromosome with regression', () => {
        generator = new NeatChromosomeGenerator(mutationOp, crossoverOp,inputSize, outputSize, 0.4, true);
        const neatChromosome = generator.get();
        expect(neatChromosome.allNodes.size()).toBe(inputSize + 1 + outputSize + 2) // +1 for Bias
        expect(neatChromosome.connections.size()).toBeGreaterThan(0)
    })

    test('Create several Chromosomes to test if defect chromosomes survive', () => {
        inputSize = 3;
        outputSize = 2;
        const chromosomes : NeatChromosome[] = []
        const inputs = [1,2,3];
        let stabCount = 0;
        generator = new NeatChromosomeGenerator(mutationOp, crossoverOp, inputSize, outputSize, 0.4, false);
        for (let i = 0; i < 100; i++) {
            const chrom = generator.get();
            chromosomes.push(chrom)
            stabCount = chrom.stabilizedCounter(30, true);
        }
        for(const chromosome of chromosomes){
            chromosome.generateNetwork();
            chromosome.flushNodeValues();
            chromosome.setUpInputs(inputs)
            for (let i = 0; i < stabCount + 1; i++) {
                chromosome.activateNetwork(true);
            }
            expect(Math.round(NeatUtil.softmax(chromosome.outputNodes).reduce((a, b) => a + b, 0))).toBe(1);
        }
    })
})
