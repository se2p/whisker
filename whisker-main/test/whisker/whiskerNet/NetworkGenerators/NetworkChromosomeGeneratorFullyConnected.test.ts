import {NeatMutation} from "../../../../src/whisker/whiskerNet/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/NeatCrossover";
import {NetworkChromosome} from "../../../../src/whisker/whiskerNet/NetworkChromosome";
import {NetworkChromosomeGeneratorFullyConnected} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NetworkChromosomeGeneratorFullyConnected";

describe('Test NetworkChromosomeGeneratorFullyConnected', () => {

    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let generator: NetworkChromosomeGeneratorFullyConnected
    let genInputs: number[][]
    let outputSize: number

    beforeEach(() => {
        crossoverOp = new NeatCrossover(0.4);
        mutationOp = new NeatMutation(0.03, 0.1, 30,
            0.2, 0.01, 0.8, 1.5,
            0.1, 3, 0.1);
        genInputs = [[1, 2, 3], [4, 5, 6], [7, 8], [9]];
        outputSize = 3;
        generator = new NetworkChromosomeGeneratorFullyConnected(mutationOp, crossoverOp, genInputs, outputSize, false);
    })

    test('Create initial random Chromosome', () => {
        generator.setCrossoverOperator(crossoverOp)
        generator.setMutationOperator(mutationOp)
        const neatChromosome = generator.get();
        neatChromosome.generateNetwork();
        expect(neatChromosome.allNodes.size()).toBe(13)
        expect(neatChromosome.connections.size()).toBe(27)
    })

    test('Create initial random Chromosome with regression', () => {
        generator = new NetworkChromosomeGeneratorFullyConnected(mutationOp, crossoverOp, genInputs, outputSize, true);
        const neatChromosome = generator.get();
        neatChromosome.generateNetwork();
        expect(neatChromosome.allNodes.size()).toBe(15)
        expect(neatChromosome.connections.size()).toBe(45)
    })

    test('Create several Chromosomes to test if defect chromosomes survive', () => {
        outputSize = 2;
        const chromosomes: NetworkChromosome[] = []
        // eslint-disable-next-line prefer-spread
        const inputs = [].concat.apply([], genInputs);
        let stabCount = 0;
        for (let i = 0; i < 100; i++) {
            const chrom = generator.get();
            chromosomes.push(chrom)
            stabCount = chrom.stabilizedCounter(30);
        }
        for (const chromosome of chromosomes) {
            chromosome.generateNetwork();
            chromosome.flushNodeValues();
            for (let i = 0; i < stabCount + 1; i++) {
                chromosome.activateNetwork(inputs);
            }
            expect(chromosome.activateNetwork(inputs)).toBeTruthy();
        }
    })
})
