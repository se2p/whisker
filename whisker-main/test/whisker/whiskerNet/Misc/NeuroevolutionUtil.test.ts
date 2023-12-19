import {NeuroevolutionUtil} from "../../../../src/whisker/whiskerNet/Misc/NeuroevolutionUtil";
import {ScratchEvent} from "../../../../src/whisker/testcase/events/ScratchEvent";
import {MouseMoveEvent} from "../../../../src/whisker/testcase/events/MouseMoveEvent";
import {NeuroevolutionTestGenerationParameter} from "../../../../src/whisker/whiskerNet/HyperParameter/NeuroevolutionTestGenerationParameter";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NeatChromosomeGenerator} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGenerator";
import {NeatMutation} from "../../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/Operators/NeatCrossover";
import {InputFeatures} from "../../../../src/whisker/whiskerNet/Misc/InputExtraction";
import {generateInputs} from "../Algorithms/NEAT.test";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";

describe("NeuroevolutionUtil Tests", () => {

    let populationSize: number;
    let genInputs: InputFeatures;
    let events: ScratchEvent[];
    let generator: NeatChromosomeGenerator;
    let properties: NeuroevolutionTestGenerationParameter;


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
        genInputs = generateInputs();
        populationSize = 50;
        properties = new NeuroevolutionTestGenerationParameter();
        properties.populationSize = populationSize;
        properties.weightCoefficient = 0.4;
        properties.excessCoefficient = 1;
        properties.disjointCoefficient = 1;
        events = [new MouseMoveEvent(), new WaitEvent()];
        generator = new NeatChromosomeGenerator(genInputs, events, 'fully',
            ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));
    });

    test("Test Softmax calculation", () => {
        const chromosome = generator.get();
        chromosome.activateNetwork(chromosome.generateDummyInputs());
        const softmaxOutput = NeuroevolutionUtil.softmaxEvents(chromosome, events);
        expect(Math.round([...softmaxOutput.values()].reduce((a, b) => a + b))).toBe(1);
    });

    test("Test RELU activation function", () => {
        expect(NeuroevolutionUtil.relu(Math.PI)).toEqual(Math.PI);
        expect(NeuroevolutionUtil.relu(-Math.PI)).toEqual(0);
    });
});
