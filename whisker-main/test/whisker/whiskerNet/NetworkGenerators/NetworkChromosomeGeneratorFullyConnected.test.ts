import {NeatMutation} from "../../../../src/whisker/whiskerNet/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/NeatCrossover";
import {NetworkChromosome} from "../../../../src/whisker/whiskerNet/NetworkChromosome";
import {NetworkChromosomeGeneratorFullyConnected} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NetworkChromosomeGeneratorFullyConnected";
import {ScratchEvent} from "../../../../src/whisker/testcase/events/ScratchEvent";
import {List} from "../../../../src/whisker/utils/List";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../../src/whisker/testcase/events/MouseMoveEvent";
import {KeyPressEvent} from "../../../../src/whisker/testcase/events/KeyPressEvent";

describe('Test NetworkChromosomeGeneratorFullyConnected', () => {

    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let generator: NetworkChromosomeGeneratorFullyConnected;
    let genInputs: Map<string, number[]>;
    let events: List<ScratchEvent>;

    beforeEach(() => {
        crossoverOp = new NeatCrossover(0.4);
        mutationOp = new NeatMutation(0.03, 0.1, 30,
            0.2, 0.01, 0.8, 1.5,
            0.1, 3, 0.1);
        genInputs = new Map<string, number[]>();
        genInputs.set("First", [1, 2, 3]);
        genInputs.set("Second", [4, 5, 6]);
        genInputs.set("Third", [7, 8]);
        genInputs.set("Fourth", [9]);
        events = new List<ScratchEvent>([new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()])
        generator = new NetworkChromosomeGeneratorFullyConnected(mutationOp, crossoverOp, genInputs, events);
    })

    test('Create initial random Chromosome', () => {
        generator.setCrossoverOperator(crossoverOp);
        generator.setMutationOperator(mutationOp);
        const neatChromosome = generator.get();
        neatChromosome.generateNetwork();
        expect(neatChromosome.allNodes.size()).toBe(19);
        expect(neatChromosome.connections.size()).toBe(81);
        expect(neatChromosome.classificationNodes.size).toBe(4);
        expect(neatChromosome.regressionNodes.size).toBe(4);
        expect(neatChromosome.outputNodes.size()).toBe(9);
    })

    test('Create several Chromosomes to test if defect chromosomes survive', () => {
        const chromosomes: NetworkChromosome[] = [];
        // eslint-disable-next-line prefer-spread
        let stabCount = 0;
        for (let i = 0; i < 100; i++) {
            const chromosome = generator.get();
            chromosomes.push(chromosome);
            stabCount = chromosome.stabilizedCounter(30);
        }
        for (const chromosome of chromosomes) {
            chromosome.generateNetwork();
            chromosome.flushNodeValues();
            for (let i = 0; i < stabCount + 1; i++) {
                chromosome.activateNetwork(genInputs);
            }
            expect(chromosome.activateNetwork(genInputs)).toBeTruthy();
        }
    })
})
