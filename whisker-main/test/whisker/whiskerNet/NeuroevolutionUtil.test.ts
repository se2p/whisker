import {NeuroevolutionUtil} from "../../../src/whisker/whiskerNet/NeuroevolutionUtil";
import {ScratchEvent} from "../../../src/whisker/testcase/events/ScratchEvent";
import {MouseMoveEvent} from "../../../src/whisker/testcase/events/MouseMoveEvent";
import {NeatProperties} from "../../../src/whisker/whiskerNet/HyperParameter/NeatProperties";
import {ActivationFunction} from "../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NeatChromosomeGenerator} from "../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGenerator";
import {NeatMutation} from "../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/whiskerNet/Operators/NeatCrossover";

describe("NeuroevolutionUtil Tests", () => {

    let populationSize: number;
    let genInputs: Map<string, Map<string, number>>;
    let events: ScratchEvent[];
    let generator: NeatChromosomeGenerator;
    let properties: NeatProperties;


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
        populationSize = 50;
        properties = new NeatProperties();
        properties.populationSize = populationSize;
        properties.weightCoefficient = 0.4;
        properties.excessCoefficient = 1;
        properties.disjointCoefficient = 1;
        events = [new MouseMoveEvent()];
        generator = new NeatChromosomeGenerator(genInputs, events, 'fully',
            ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));
    });

    test("Test Softmax calculation", () => {
        const chromosome = generator.get();
        chromosome.activateNetwork(chromosome.generateDummyInputs());
        for (let i = 0; i < chromosome.getMaxDepth(); i++) {
            chromosome.activateNetwork(genInputs);
        }
        const softmaxOutput = NeuroevolutionUtil.softmaxEvents(chromosome, events);
        expect(Math.round([...softmaxOutput.values()].reduce((a, b) => a + b))).toBe(1);
    });

    test("Test RELU activation function", () => {
        expect(NeuroevolutionUtil.relu(Math.PI)).toEqual(Math.PI);
        expect(NeuroevolutionUtil.relu(-Math.PI)).toEqual(0);
    });
});
