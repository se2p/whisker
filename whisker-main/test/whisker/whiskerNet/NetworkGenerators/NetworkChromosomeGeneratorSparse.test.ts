import {NetworkChromosomeGeneratorSparse} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NetworkChromosomeGeneratorSparse";
import {NeatMutation} from "../../../../src/whisker/whiskerNet/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/NeatCrossover";
import {NetworkChromosome} from "../../../../src/whisker/whiskerNet/NetworkChromosome";

describe('Test NetworkChromosomeGeneratorSparse', () => {

    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let generator: NetworkChromosomeGeneratorSparse
    let genInputs: Map<string, number[]>
    let outputSize: number

    beforeEach(() => {
        crossoverOp = new NeatCrossover(0.4);
        mutationOp = new NeatMutation(0.03, 0.1, 30,
            0.2, 0.01, 0.8, 1.5,
            0.1, 3,0.1);
        genInputs = new Map<string, number[]>();
        genInputs.set("First", [1,2,3]);
        genInputs.set("Second", [4,5,6]);
        genInputs.set("Third", [7,8]);
        genInputs.set("Fourth", [9]);
        outputSize = 3;
        generator = new NetworkChromosomeGeneratorSparse(mutationOp, crossoverOp,genInputs, outputSize, 0.4, false);
    })

    test('Create initial random Chromosome', () => {
        generator.setCrossoverOperator(crossoverOp)
        generator.setMutationOperator(mutationOp)
        const neatChromosome = generator.get();
        neatChromosome.generateNetwork();
        expect(neatChromosome.allNodes.size()).toBe(13) // +1 for Bias
        expect(neatChromosome.connections.size()).toBeGreaterThan(0)
    })

    test('Create initial random Chromosome with regression', () => {
        generator = new NetworkChromosomeGeneratorSparse(mutationOp, crossoverOp,genInputs, outputSize, 0.4, true);
        const neatChromosome = generator.get();
        neatChromosome.generateNetwork();
        expect(neatChromosome.allNodes.size()).toBe(13 + 2) // +1 for Bias + 2 for Regression Nodes
        expect(neatChromosome.connections.size()).toBeGreaterThan(0)
    })

    test('Create several Chromosomes to test if defect chromosomes survive', () => {
        outputSize = 2;
        const chromosomes : NetworkChromosome[] = []
        // eslint-disable-next-line prefer-spread
        let stabCount = 0;
        for (let i = 0; i < 100; i++) {
            const chrom = generator.get();
            chromosomes.push(chrom)
            stabCount = chrom.stabilizedCounter(30);
        }
        for(const chromosome of chromosomes){
            chromosome.generateNetwork();
            chromosome.flushNodeValues();
            for (let i = 0; i < stabCount + 1; i++) {
                chromosome.activateNetwork(genInputs);
            }
            expect(chromosome.activateNetwork(genInputs)).toBeTruthy()
        }
    })
})
