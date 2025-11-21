import {WaitEvent} from "../../../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../../../src/whisker/testcase/events/MouseMoveEvent";
import {KeyPressEvent} from "../../../../../src/whisker/testcase/events/KeyPressEvent";
import {NeatPopulation} from "../../../../../src/whisker/agentTraining/neuroevolution/neuroevolutionPopulations/NeatPopulation";
import {Randomness} from "../../../../../src/whisker/utils/Randomness";
import {ActivationFunction} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/ActivationFunction";
import {NeatChromosomeGenerator} from "../../../../../src/whisker/agentTraining/neuroevolution/networkGenerators/NeatChromosomeGenerator";
import {NeatMutation} from "../../../../../src/whisker/agentTraining/neuroevolution/operators/NeatMutation";
import {NeatCrossover} from "../../../../../src/whisker/agentTraining/neuroevolution/operators/NeatCrossover";
import {ScratchEvent} from "../../../../../src/whisker/testcase/events/ScratchEvent";
import {HiddenNode} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/HiddenNode";
import {generateNetworkInputs} from "../../../TestUtils";
import {InputFeatures} from "../../../../../src/whisker/agentTraining/featureExtraction/FeatureExtraction";


describe('Test NeatChromosomeGenerator', () => {

    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let inputSpace: InputFeatures;
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
        inputSpace = generateNetworkInputs();

        outputSpace = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
    });

    test('Create initial random Chromosome using fully connection mode', async () => {
        const generator = new NeatChromosomeGenerator(inputSpace, outputSpace, 'fully',
            ActivationFunction.SIGMOID, ActivationFunction.SIGMOID, mutationOp, crossoverOp);
        const neatChromosome = await generator.get();
        expect(neatChromosome.getAllNodes().length).toBe(14);
        expect(neatChromosome.connections.length).toBe(40);
        expect(neatChromosome.inputNodes.get("Sprite1").size).toEqual(5);
        expect(neatChromosome.inputNodes.get("Sprite2").size).toEqual(4);
        expect(neatChromosome.getAllNodes().filter(node => node instanceof HiddenNode).length).toBe(0);
        expect(neatChromosome.getTriggerActionNodes().length).toBe(4);
        expect(neatChromosome.layers.size).toEqual(2);
        expect(neatChromosome.layers.get(0).length).toEqual(10);
        expect(neatChromosome.layers.get(1).length).toBe(4);
    });

    test('Create initial random Chromosome using sparse connection mode', async () => {
        const generator = new NeatChromosomeGenerator(inputSpace, outputSpace, 'sparse',
            ActivationFunction.SIGMOID, ActivationFunction.SIGMOID, mutationOp, crossoverOp);
        const neatChromosome = await generator.get();
        expect(neatChromosome.connections.length).toBeGreaterThanOrEqual(1);
        expect(neatChromosome.inputNodes.get("Sprite1").size).toEqual(5);
        expect(neatChromosome.inputNodes.get("Sprite2").size).toEqual(4);
        expect(neatChromosome.getAllNodes().filter(node => node instanceof HiddenNode).length).toBe(0);
        expect(neatChromosome.getTriggerActionNodes().length).toBe(4);
        expect(neatChromosome.layers.size).toEqual(2);
        expect(neatChromosome.layers.get(0).length).toEqual(10);
        expect(neatChromosome.layers.get(1).length).toBe(4);
    });

    test('Create two Chromosomes to test if every one of them gets the same innovation numbers', async () => {
        const generator = new NeatChromosomeGenerator(inputSpace, outputSpace, 'fully',
            ActivationFunction.SIGMOID, ActivationFunction.SIGMOID, mutationOp, crossoverOp);
        const chromosome1 = await generator.get();
        const chromosome2 = await generator.get();
        const randomNodeIndex = Randomness.getInstance().nextInt(0, chromosome1.getAllNodes().length);
        expect(chromosome1.getAllNodes()[randomNodeIndex].uID).toBe(chromosome2.getAllNodes()[randomNodeIndex].uID);
        expect(chromosome1.inputNodes.get("Sprite1").get("Y-Position").uID).toBe(
            chromosome2.inputNodes.get("Sprite1").get("Y-Position").uID);
        expect(chromosome1.layers.get(1)[3].uID).toBe(chromosome2.layers.get(1)[3].uID);
        expect(chromosome1.connections.length).toBe(chromosome2.connections.length);
        expect(NeatPopulation.innovations.length).toBe(chromosome1.connections.length);
        expect(chromosome1.connections[5].innovation).toBe(chromosome2.connections[5].innovation);
    });
});
