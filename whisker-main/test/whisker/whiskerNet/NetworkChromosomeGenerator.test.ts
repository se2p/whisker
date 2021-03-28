import {NetworkChromosomeGenerator} from "../../../src/whisker/whiskerNet/NetworkChromosomeGenerator";
import {NeatMutation} from "../../../src/whisker/whiskerNet/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/whiskerNet/NeatCrossover";
import {NetworkChromosome} from "../../../src/whisker/whiskerNet/NetworkChromosome";
import {NeuroevolutionUtil} from "../../../src/whisker/whiskerNet/NeuroevolutionUtil";

describe('NeatChromosomeGenerator', () => {

    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let generator: NetworkChromosomeGenerator
    let genInputs: number[][]
    let outputSize: number

    beforeEach(() => {
        crossoverOp = new NeatCrossover(0.4);
        mutationOp = new NeatMutation(0.03, 0.1, 30,
            0.2, 0.01, 0.8, 1.5,
            0.1, 3,0.1);
        genInputs = [[1,2,3],[4,5,6], [7,8], [9]];
        outputSize = 3;
        generator = new NetworkChromosomeGenerator(mutationOp, crossoverOp,genInputs, outputSize, 0.4, false);
    })

    test('Create initial random Chromosome', () => {
        const neatChromosome = generator.get();
        neatChromosome.generateNetwork();
        expect(neatChromosome.allNodes.size()).toBe(13) // +1 for Bias
        expect(neatChromosome.connections.size()).toBeGreaterThan(0)
    })

    test('Create initial random Chromosome with regression', () => {
        generator = new NetworkChromosomeGenerator(mutationOp, crossoverOp,genInputs, outputSize, 0.4, true);
        const neatChromosome = generator.get();
        neatChromosome.generateNetwork();
        expect(neatChromosome.allNodes.size()).toBe(13 + 2) // +1 for Bias + 2 for Regression Nodes
        expect(neatChromosome.connections.size()).toBeGreaterThan(0)
    })

    test('Create several Chromosomes to test if defect chromosomes survive', () => {
        outputSize = 2;
        const chromosomes : NetworkChromosome[] = []
        // eslint-disable-next-line prefer-spread
        const inputs = [].concat.apply([], genInputs);
        let stabCount = 0;
        generator = new NetworkChromosomeGenerator(mutationOp, crossoverOp, genInputs, outputSize, 0.4, false);
        for (let i = 0; i < 100; i++) {
            const chrom = generator.get();
            chromosomes.push(chrom)
            stabCount = chrom.stabilizedCounter(30, true);
        }
        for(const chromosome of chromosomes){
            chromosome.generateNetwork();
            chromosome.flushNodeValues();
            for (let i = 0; i < stabCount + 1; i++) {
                chromosome.activateNetwork(inputs);
            }
            expect(Math.round(NeuroevolutionUtil.softmax(chromosome.outputNodes).reduce((a, b) => a + b, 0))).toBe(1);
        }
    })
})
