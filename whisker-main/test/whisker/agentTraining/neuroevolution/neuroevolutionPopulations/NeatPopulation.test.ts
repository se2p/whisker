import {NeatPopulation} from "../../../../../src/whisker/agentTraining/neuroevolution/neuroevolutionPopulations/NeatPopulation";
import {Randomness} from "../../../../../src/whisker/utils/Randomness";
import {WaitEvent} from "../../../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../../../src/whisker/testcase/events/MouseMoveEvent";
import {KeyPressEvent} from "../../../../../src/whisker/testcase/events/KeyPressEvent";
import {
    NeatParameter
} from "../../../../../src/whisker/agentTraining/neuroevolution/hyperparameter/NeatParameter";
import Arrays from "../../../../../src/whisker/utils/Arrays";
import {InputNode} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/InputNode";
import {ActionNode} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/ActionNode";
import {ActivationFunction} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/ActivationFunction";
import {NodeGene} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/NodeGene";
import {ConnectionGene} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/ConnectionGene";
import {NeatChromosome} from "../../../../../src/whisker/agentTraining/neuroevolution/networks/NeatChromosome";
import {NeatMutation} from "../../../../../src/whisker/agentTraining/neuroevolution/operators/NeatMutation";
import {NeatCrossover} from "../../../../../src/whisker/agentTraining/neuroevolution/operators/NeatCrossover";
import {NeatChromosomeGenerator} from "../../../../../src/whisker/agentTraining/neuroevolution/networkGenerators/NeatChromosomeGenerator";
import {generateNetworkInputs} from "../../../TestUtils";
import {NetworkLayer} from "../../../../../src/whisker/agentTraining/neuroevolution/networks/NetworkChromosome";
import logger from "../../../../../src/util/logger";

describe("Test NeatPopulation", () => {

    let size: number;
    let numberOfSpecies: number;
    let population: NeatPopulation;
    let random: Randomness;
    let properties: NeatParameter;
    let chromosomeGenerator: NeatChromosomeGenerator;
    let mutation: NeatMutation;
    let crossover: NeatCrossover;

    beforeEach(async () => {
        logger.suggest.deny(/.*/, "debug");
        size = 10;
        numberOfSpecies = 5;
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
            "mutationAddConnection": 0.5,
            "recurrentConnection": 0.1,
            "addConnectionTries": 20,
            "populationChampionNumberOffspring": 10,
            "populationChampionNumberClones": 5,
            "populationChampionConnectionMutation": 0.3,
            "mutationAddNode": 0.3,
            "mutateWeights": 0.6,
            "perturbationPower": 2.5,
            "mutateToggleEnableConnection": 0.1,
            "toggleEnableConnectionTimes": 3,
            "mutateEnableConnection": 0.03
        };
        const genInputs = generateNetworkInputs();
        const events = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
        chromosomeGenerator = new NeatChromosomeGenerator(genInputs, events, 'fully',
            ActivationFunction.SIGMOID, ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));
        properties = new NeatParameter();
        properties.populationSize = size;
        properties.disjointCoefficient = 1;
        properties.excessCoefficient = 1;
        properties.weightCoefficient = 0.5;
        properties.compatibilityDistanceThreshold = 3;
        properties.compatibilityModifier = 0.1;
        properties.penalizingAge = 10;
        properties.ageSignificance = 1.0;
        properties.parentsPerSpecies = 0.2;
        properties.mutationWithoutCrossover = 0.3;
        properties.interspeciesMating = 0.1;
        properties.numberOfSpecies = 5;
        population = new NeatPopulation(chromosomeGenerator, properties);
        await population.generatePopulation();
        random = Randomness.getInstance();
        mutation = new NeatMutation(mutationConfig);
        crossover = new NeatCrossover(crossoverConfig);
        for (const c of population.networks) {
            c.fitness = random.nextInt(1, 50);
        }
    });

    test("Test Constructor", () => {
        expect(population.speciesCount).toBeGreaterThan(0);
        expect(population.bestFitness).toBe(0);
        expect(population.highestFitnessLastChanged).toBe(0);
        expect(population.numberOfSpeciesTargeted).toBe(numberOfSpecies);
        expect(population.generator).toBeInstanceOf(NeatChromosomeGenerator);
        expect(population.populationSize).toBe(size);
        expect(population.generation).toBe(0);
        expect(population.species.length).toBeGreaterThan(0);
        expect(population.networks.length).toBe(size);
        expect(population.hyperParameter).toBeInstanceOf(NeatParameter);
        expect(population.averageFitness).toBe(0);
    });

    test("Test Getter and Setter", () => {
        population.speciesCount = 3;
        population.bestFitness = 3;
        population.highestFitnessLastChanged = 3;
        population.generation = 3;
        population.averageFitness = 3;

        const champ = population.networks[0];
        population.populationChampion = champ;

        expect(population.speciesCount).toBe(3);
        expect(population.bestFitness).toBe(3);
        expect(population.highestFitnessLastChanged).toBe(3);
        expect(population.generation).toBe(3);
        expect(population.averageFitness).toBe(3);
        expect(population.populationChampion).toBe(champ);
    });

    test("Test evolution", async () => {
        const oldGeneration = population.networks;
        for (let i = 0; i < 5; i++) {
            for (const c of population.networks)
                c.fitness = random.nextInt(1, 50);
            population.updatePopulationStatistics();
            await population.evolve();
        }
        const newGeneration = population.networks;

        expect(oldGeneration).not.toContainEqual(newGeneration);
        expect(population.speciesCount).toBeGreaterThan(0);
        expect(population.generation).toBe(5);
        expect(population.species.length).toBeGreaterThan(0);
        expect(population.networks.length).toBe(size);
    });

    test("Test evolution stagnant population with only one species", async () => {
        population.bestFitness = 60;
        population.highestFitnessLastChanged = 100;
        const firstSpecie = population.species[0];
        Arrays.clear(population.species);
        population.species.push(firstSpecie);
        population.updatePopulationStatistics();
        await population.evolve();
        expect(population.species.length).toBeGreaterThan(0);
    });

    test("Test evolution stagnant population with more than two species", async () => {
        while (population.species.length < 3) {
            for (const c of population.networks)
                c.fitness = random.nextInt(1, 50);
            population.updatePopulationStatistics();
            await population.evolve();
        }
        for (const network of population.networks) {
            network.fitness = 1;
        }
        population.bestFitness = 60;
        population.highestFitnessLastChanged = 100;
        population.updatePopulationStatistics();
        await population.evolve();
        expect(population.species.length).toBeGreaterThan(0);
    });

    test("Test that the initial hyperparameter value remains untouched", async () => {
        population.generation = 3;
        population.hyperParameter.compatibilityDistanceThreshold = 0.1;
        for (let i = 0; i < 10; i++) {
            population.updatePopulationStatistics();
            await population.evolve();
        }
        expect(population.hyperParameter.compatibilityDistanceThreshold).toBe(0.1);
    });

    test("Test Speciation when a new Population gets created", async () => {
        await population.generatePopulation();
        expect(population.speciesCount).toBeGreaterThanOrEqual(1);
        expect(population.species.length).toBeGreaterThanOrEqual(1);
    });

    test("Test Speciation when a new Population gets created and a low speciation Threshold", async () => {
        properties.compatibilityDistanceThreshold = 0.01;
        await population.generatePopulation();
        expect(population.speciesCount).toBeGreaterThanOrEqual(1);
        expect(population.species.length).toBeGreaterThanOrEqual(1);
        expect(population.species.length).toBeLessThanOrEqual(properties.populationSize);
    });

    test("Test Speciation when a new Population gets created and a high speciation Threshold", async () => {
        properties.compatibilityDistanceThreshold = 1000;
        await population.generatePopulation();
        expect(population.speciesCount).toBeGreaterThanOrEqual(1);
        expect(population.species.length).toBeGreaterThanOrEqual(1);
        expect(population.species.length).toBeLessThanOrEqual(properties.populationSize);
    });

    test("Test Speciation with a chromosome mutated several times", async () => {
        const chromosome = await chromosomeGenerator.get();
        let mutant = await chromosome.mutate();
        let count = 0;
        while (population.speciesCount <= 1 && count < 1000){
            mutant = await mutant.mutate();
            population.assignSpecies(mutant);
            count++;
        }
        expect(population.speciesCount).toBeGreaterThanOrEqual(2);

    });

    test("Test Compatibility Distance of clones", async () => {
        const chromosome1 = await chromosomeGenerator.get();
        const chromosome2 = chromosome1.cloneStructure(false);
        const compatDistance = population.compatibilityDistance(chromosome1, chromosome2);
        expect(compatDistance).toBe(0);
    });

    test("Test Compatibility Distance of Chromosomes with disjoint connections", () => {
        const inputNode1 = new InputNode(1, "Sprite1", "X-Position");
        const inputNode2 = new InputNode(2, "Sprite2", "Y-Position");
        const outputNode = new ActionNode(3, ActivationFunction.SIGMOID, new WaitEvent());

        const layer: NetworkLayer = new Map<number, NodeGene[]>();
        layer.set(0, [inputNode1, inputNode2]);
        layer.set(1, [outputNode]);


        const connection1 = new ConnectionGene(inputNode1, outputNode, 1, true, 0);
        const connection2 = new ConnectionGene(inputNode2, outputNode, 0.5, true, 1);

        const connections1: ConnectionGene[] = [];
        connections1.push(connection1);

        const connections2: ConnectionGene[] = [];
        connections2.push(connection2);

        const chromosome1 = new NeatChromosome(layer, connections1, mutation, crossover,'fully', ActivationFunction.SIGMOID, ActivationFunction.SIGMOID);
        const chromosome2 = new NeatChromosome(layer, connections2, mutation, crossover,'fully', ActivationFunction.SIGMOID, ActivationFunction.SIGMOID);

        const compatDistance = population.compatibilityDistance(chromosome1, chromosome2);
        expect(compatDistance).toBe(1);
    });

    test("Test Compatibility Distance of Chromosomes with disjoint connections switched", () => {
        const inputNode1 = new InputNode(1, "Sprite1", "X-Position");
        const inputNode2 = new InputNode(2, "Sprite2", "Y-Position");
        const outputNode = new ActionNode(3, ActivationFunction.SIGMOID, new WaitEvent());

        const layer: NetworkLayer = new Map<number, NodeGene[]>();
        layer.set(0, [inputNode1, inputNode2]);
        layer.set(1, [outputNode]);

        const connection1 = new ConnectionGene(inputNode1, outputNode, 1, true, 0);
        const connection2 = new ConnectionGene(inputNode2, outputNode, 0.5, true, 1);

        const connections1: ConnectionGene[] = [];
        connections1.push(connection1);

        const connections2: ConnectionGene[] = [];
        connections2.push(connection2);

        const chromosome1 = new NeatChromosome(layer, connections2, mutation, crossover, 'fully', ActivationFunction.SIGMOID, ActivationFunction.SIGMOID);
        const chromosome2 = new NeatChromosome(layer, connections1, mutation, crossover, 'fully', ActivationFunction.SIGMOID, ActivationFunction.SIGMOID);

        const compatDistance = population.compatibilityDistance(chromosome1, chromosome2);
        expect(compatDistance).toBe(1);
    });

    test("Test Compatibility Distance of Chromosomes with excess connections", async () => {
        const chromosome1 = await chromosomeGenerator.get();
        const chromosome2 = chromosome1.cloneStructure(true);

        const node1 = chromosome1.inputNodes.get("Sprite1").get("X-Position");
        const node2 = chromosome1.layers.get(1)[1];
        chromosome2.connections.push(new ConnectionGene(node1, node2, 1, true, 1000));
        const compatDistance = population.compatibilityDistance(chromosome1, chromosome2);
        expect(compatDistance).toBe(1 / Math.max(chromosome1.connections.length, chromosome2.connections.length));
    });

    test("Test Compatibility Distance of Chromosomes with same connections but different weights", () => {
        const inputNode1 = new InputNode(1, "Sprite1", "X-Position");
        const inputNode2 = new InputNode(2, "Sprite2", "Y-Position");
        const outputNode = new ActionNode(3, ActivationFunction.SIGMOID, new WaitEvent());

        const layer: NetworkLayer = new Map<number, NodeGene[]>();
        layer.set(0, [inputNode1, inputNode2]);
        layer.set(1, [outputNode]);

        const connection1 = new ConnectionGene(inputNode1, outputNode, 1, true, 0);
        const connection2 = new ConnectionGene(inputNode1, outputNode, 0.5, true, 0);

        const connections1: ConnectionGene[] = [];
        connections1.push(connection1);

        const connections2: ConnectionGene[] = [];
        connections2.push(connection2);

        const chromosome1 = new NeatChromosome(layer, connections1, mutation, crossover, 'fully', ActivationFunction.SIGMOID, ActivationFunction.SIGMOID);
        const chromosome2 = new NeatChromosome(layer, connections2, mutation, crossover, 'fully', ActivationFunction.SIGMOID, ActivationFunction.SIGMOID);
        const compatDistance = population.compatibilityDistance(chromosome1, chromosome2);
        expect(compatDistance).toBe((0.5 * 0.5) / chromosome2.connections.length);
    });

    test("Clone population", () => {
        population.populationChampion = population.networks[0];
        const clone = population.clone();
        expect(clone.speciesCount).toBe(population.speciesCount);
        expect(clone.bestFitness).toBe(population.bestFitness);
        expect(clone.highestFitnessLastChanged).toBe(population.highestFitnessLastChanged);
        expect(clone.averageFitness).toBe(population.averageFitness);
        expect(clone.generation).toBe(population.generation);
        expect(clone.populationChampion.uID).toBe(population.populationChampion.uID);
        expect(clone.networks.length).toBe(population.networks.length);
        expect(clone.species.length).toBe(population.species.length);
    });

    test("toJSON", async () => {
        population.updatePopulationStatistics();
        await population.evolve();
        const json = population.toJSON();
        expect(json['aF']).toBe(Number(population.averageFitness.toFixed(4)));
        expect(json['bF']).toBe(Number(population.bestFitness.toFixed(4)));
        expect(json['PC']).toBe(population.populationChampion.uID);
        expect(Object.keys(json).length).toBe(3 + population.species.length);
    });
});
