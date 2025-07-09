import {NeatPopulation} from "../../../../src/whisker/whiskerNet/NeuroevolutionPopulations/NeatPopulation";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../../src/whisker/testcase/events/MouseMoveEvent";
import {KeyPressEvent} from "../../../../src/whisker/testcase/events/KeyPressEvent";
import {
    NeatParameter
} from "../../../../src/whisker/whiskerNet/HyperParameter/NeatParameter";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NeatMutation} from "../../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/Operators/NeatCrossover";
import {NeatChromosomeGenerator} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGenerator";
import {
    NeatestPopulation
} from "../../../../src/whisker/whiskerNet/NeuroevolutionPopulations/NeatestPopulation";
import {InputFeatures} from "../../../../src/whisker/whiskerNet/Misc/InputExtraction";
import logger from "../../../../src/util/logger";

describe("Test NeatestPopulation", () => {

    let properties: NeatParameter;
    let chromosomeGenerator: NeatChromosomeGenerator;
    let size: number;

    beforeEach(() => {
        logger.suggest.deny(/.*/, "debug");
        NeatPopulation.innovations = [];
        size = 500;
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
            "mutationAddNode": 1,
            "mutateWeights": 0.6,
            "perturbationPower": 2.5,
            "mutateToggleEnableConnection": 0.1,
            "toggleEnableConnectionTimes": 3,
            "mutateEnableConnection": 0.03
        };
        const genInputs: InputFeatures = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        genInputs.set("Sprite1", sprite1);
        const events = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
        chromosomeGenerator = new NeatChromosomeGenerator(genInputs, events, 'fully',
            ActivationFunction.SIGMOID, ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));
        properties = new NeatParameter();
        properties.populationSize = size;
    });

    test("Generate population without starting networks", async () => {
        const population = new NeatestPopulation(chromosomeGenerator, properties, [],
            undefined, [], 0);
        await population.generatePopulation();
        expect(population.networks.length).toBe(size);
    });

    test("Generate population with starting networks and low random fraction", async () => {
        const networks = [];
        for (let i = 0; i < 5; i++) {
            networks.push(await chromosomeGenerator.get());
        }
        const population = new NeatestPopulation(chromosomeGenerator, properties, [],
            undefined, networks, 0.1);
        const innovations = NeatPopulation.innovations.length;
        await population.generatePopulation();
        expect(population.networks.length).toBe(size);
        expect(NeatPopulation.innovations.length).toBeGreaterThan(innovations);
    });

    test("Generate population with starting networks and maximum random fraction", async () => {
        const networks = [];
        for (let i = 0; i < 5; i++) {
            networks.push(await chromosomeGenerator.get());
        }
        const population = new NeatestPopulation(chromosomeGenerator, properties, [],
            undefined, networks, 1);
        const innovations = NeatPopulation.innovations.length;
        await population.generatePopulation();
        expect(population.networks.length).toBe(size);
        expect(NeatPopulation.innovations.length).toBe(innovations);
    });
});
