import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../../src/whisker/testcase/events/MouseMoveEvent";
import {KeyPressEvent} from "../../../../src/whisker/testcase/events/KeyPressEvent";
import {NeatPopulation} from "../../../../src/whisker/whiskerNet/NeuroevolutionPopulations/NeatPopulation";
import {Randomness} from "../../../../src/whisker/utils/Randomness";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NeatChromosomeGenerator} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGenerator";
import {NeatMutation} from "../../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/Operators/NeatCrossover";
import {ScratchEvent} from "../../../../src/whisker/testcase/events/ScratchEvent";
import {HiddenNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/HiddenNode";

describe('Test NetworkChromosomeGeneratorFullyConnected', () => {

    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let inputSpace: Map<string, Map<string, number>>;
    let outputSpace: ScratchEvent[];

    beforeEach(() => {
        NeatPopulation.innovations = [];
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
        mutationOp = new NeatMutation(mutationConfig);
        crossoverOp = new NeatCrossover(crossoverConfig);
        inputSpace = new Map<string, Map<string, number>>();

        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        sprite1.set("Costume", 3);
        inputSpace.set("Sprite1", sprite1);

        const sprite2 = new Map<string, number>();
        sprite2.set("X-Position", 6);
        sprite2.set("Y-Position", 7);
        inputSpace.set("Sprite2", sprite2);

        outputSpace = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
    });

    test('Create initial random Chromosome using fully connection mode', () => {
        const generator = new NeatChromosomeGenerator(inputSpace, outputSpace,'fully',
            ActivationFunction.TANH,mutationOp, crossoverOp);
        const neatChromosome = generator.get();
        expect(neatChromosome.allNodes.length).toBe(15);
        expect(neatChromosome.connections.length).toBe(54);
        expect(neatChromosome.inputNodes.get("Sprite1").size).toEqual(3);
        expect(neatChromosome.inputNodes.get("Sprite2").size).toEqual(2);
        expect(neatChromosome.allNodes.filter(node => node instanceof HiddenNode).length).toBe(0);
        expect(neatChromosome.classificationNodes.size).toBe(4);
        expect(neatChromosome.regressionNodes.size).toBe(4);
        expect(neatChromosome.outputNodes.length).toBe(9);
    });

    test('Create initial random Chromosome using fullyHidden connection mode', () => {
        const generator = new NeatChromosomeGenerator(inputSpace, outputSpace,'fullyHidden',
            ActivationFunction.TANH,mutationOp, crossoverOp);
        const neatChromosome = generator.get();
        expect(neatChromosome.allNodes.length).toBe(18);
        expect(neatChromosome.connections.length).toBe(33);
        expect(neatChromosome.inputNodes.get("Sprite1").size).toEqual(3);
        expect(neatChromosome.inputNodes.get("Sprite2").size).toEqual(2);
        expect(neatChromosome.allNodes.filter(node => node instanceof HiddenNode).length).toBe(3);
        expect(neatChromosome.classificationNodes.size).toBe(4);
        expect(neatChromosome.regressionNodes.size).toBe(4);
        expect(neatChromosome.outputNodes.length).toBe(9);
    });

    test('Create initial random Chromosome using sparse connection mode', () => {
        const generator = new NeatChromosomeGenerator(inputSpace, outputSpace,'sparse',
            ActivationFunction.TANH,mutationOp, crossoverOp);
        const neatChromosome = generator.get();
        expect(neatChromosome.allNodes.length).toBeGreaterThanOrEqual(15);
        expect(neatChromosome.connections.length).toBeGreaterThanOrEqual(18);
        expect(neatChromosome.inputNodes.get("Sprite1").size).toEqual(3);
        expect(neatChromosome.inputNodes.get("Sprite2").size).toEqual(2);
        expect(neatChromosome.allNodes.filter(node => node instanceof HiddenNode).length).toBe(0);
        expect(neatChromosome.classificationNodes.size).toBe(4);
        expect(neatChromosome.regressionNodes.size).toBe(4);
        expect(neatChromosome.outputNodes.length).toBe(9);
    });

    test('Create two Chromosomes to test if every one of them gets the same innovation numbers', () => {
        const generator = new NeatChromosomeGenerator(inputSpace, outputSpace,'fully',
            ActivationFunction.TANH,mutationOp, crossoverOp);
        const chromosome1 = generator.get();
        const chromosome2 = generator.get();
        const randomNodeIndex = Randomness.getInstance().nextInt(0, chromosome1.allNodes.length);
        expect(chromosome1.allNodes[randomNodeIndex].uID).toBe(chromosome2.allNodes[randomNodeIndex].uID);
        expect(chromosome1.inputNodes.get("Sprite1").get("Y-Position").uID).toBe(
            chromosome2.inputNodes.get("Sprite1").get("Y-Position").uID);
        expect(chromosome1.outputNodes[3].uID).toBe(chromosome2.outputNodes[3].uID);
        expect(chromosome1.connections.length).toBe(chromosome2.connections.length);
        expect(NeatPopulation.innovations.length).toBe(chromosome1.connections.length);
        expect(chromosome1.connections[5].innovation).toBe(chromosome2.connections[5].innovation);
    });
});
