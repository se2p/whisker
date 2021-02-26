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
        mutationOp = new NeatMutation();
        crossoverOp = new NeatCrossover();
        inputSize = 6;
        outputSize = 3;
        generator = new NeatChromosomeGenerator(mutationOp, crossoverOp,inputSize, outputSize);
    })

    test('Create initial random Chromosome', () => {
        const neatChromosome = generator.get();
        const counter = neatChromosome.stabilizedCounter(20, true);
        expect(neatChromosome.allNodes.size()).toBe(inputSize + 1 + outputSize) // +1 for Bias
        expect(neatChromosome.connections.size()).toBeGreaterThanOrEqual(1)
    })

    test('Create several Chromosomes to test if defect chromosomes survive', () => {
        inputSize = 3;
        outputSize = 1;
        const chromosomes : NeatChromosome[] = []
        const inputs = [1,2,3];
        let stabCount = 0;
        generator = new NeatChromosomeGenerator(mutationOp, crossoverOp, inputSize, outputSize);
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
            expect(NeatUtil.softmax(chromosome.outputNodes).reduce((a, b) => a + b, 0)).toBe(1);
        }
    })
})
