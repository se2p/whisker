import {NetworkChromosome} from "../../../../src/whisker/whiskerNet/Networks/NetworkChromosome";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../../src/whisker/testcase/events/MouseMoveEvent";
import {KeyPressEvent} from "../../../../src/whisker/testcase/events/KeyPressEvent";
import {NeatChromosomeGeneratorFullyConnected} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGeneratorFullyConnected";

describe('Test NetworkChromosomeGeneratorFullyConnected', () => {

    let generator: NeatChromosomeGeneratorFullyConnected;
    let genInputs: Map<string, Map<string, number>>;

    beforeEach(() => {
        const crossoverConfig = {
            "operator": "neatCrossover",
            "crossoverWithoutMutation": 0.2,
            "interspeciesRate": 0.001,
            "weightAverageRate": 0.4
        };

        const mutationConfig = {
            "operator": "neatMutation",
            "mutationWithoutCrossover": 0.25,
            "mutationAddConnection": 0.2,
            "recurrentConnection": 0.1,
            "addConnectionTries": 20,
            "populationChampionNumberOffspring": 10,
            "populationChampionNumberClones": 5,
            "populationChampionConnectionMutation": 0.3,
            "mutationAddNode": 0.1,
            "mutateWeights": 0.6,
            "perturbationPower": 2.5,
            "mutateToggleEnableConnection": 0.1,
            "toggleEnableConnectionTimes": 3,
            "mutateEnableConnection": 0.03
        };
        genInputs = new Map<string, Map<string, number>>();

        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        sprite1.set("Costume", 3);
        sprite1.set("DistanceToSprite2-X", 4);
        sprite1.set("DistanceToSprite2-y", 5);
        genInputs.set("Sprite1", sprite1);

        const sprite2 = new Map<string, number>();
        sprite2.set("X-Position", 6);
        sprite2.set("Y-Position", 7);
        sprite2.set("DistanceToWhite-X", 8);
        sprite2.set("DistanceToWhite-Y", 9);
        genInputs.set("Sprite2", sprite2);

        const events = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
        generator = new NeatChromosomeGeneratorFullyConnected(mutationConfig, crossoverConfig, genInputs, events);
    })

    test('Create initial random Chromosome', () => {
        const neatChromosome = generator.get();
        neatChromosome.generateNetwork();
        expect(neatChromosome.allNodes.length).toBe(19);
        expect(neatChromosome.connections.length).toBe(81);
        expect(neatChromosome.inputNodes.get("Sprite1").size).toEqual(5);
        expect(neatChromosome.inputNodes.get("Sprite2").size).toEqual(4);
        expect(neatChromosome.classificationNodes.size).toBe(4);
        expect(neatChromosome.regressionNodes.size).toBe(4);
        expect(neatChromosome.outputNodes.length).toBe(9);
    })

    test('Create several Chromosomes to test if defect chromosomes survive', () => {
        const chromosomes: NetworkChromosome[] = [];
        let stabCount = 0;
        for (let i = 0; i < 100; i++) {
            const chromosome = generator.get();
            chromosomes.push(chromosome);
            stabCount = chromosome.updateStabiliseCount(30);
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
