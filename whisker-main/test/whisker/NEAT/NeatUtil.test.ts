import {NeatPopulation} from "../../../src/whisker/NEAT/NeatPopulation";
import {NeatChromosome} from "../../../src/whisker/NEAT/NeatChromosome";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";
import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatParameter} from "../../../src/whisker/NEAT/NeatParameter";
import {NeatUtil} from "../../../src/whisker/NEAT/NeatUtil";
import {ConnectionGene} from "../../../src/whisker/NEAT/ConnectionGene";
import {NodeGene} from "../../../src/whisker/NEAT/NodeGene";
import {NodeType} from "../../../src/whisker/NEAT/NodeType";
import {List} from "../../../src/whisker/utils/List";
import {ActivationFunctions} from "../../../src/whisker/NEAT/ActivationFunctions";

describe("NeatUtil Tests", () => {

    let population: NeatPopulation<NeatChromosome>;
    let populationSize: number;
    let crossOver: NeatCrossover;
    let mutation: NeatMutation;
    let numberInputs: number;
    let numberOutputs: number;
    let generator: NeatChromosomeGenerator


    beforeEach(() => {
        crossOver = new NeatCrossover();
        mutation = new NeatMutation();
        numberInputs = 6;
        numberOutputs = 3;
        generator = new NeatChromosomeGenerator(mutation, crossOver, numberInputs, numberOutputs)
        populationSize = 50;
    })

    test("Speciation when a new Population gets created", () => {
        population = new NeatPopulation<NeatChromosome>(populationSize, 2, generator);
        expect(population.speciesCount).toBe(1);
        expect(population.species.size()).toBe(1);
    })

    test("Speciation when a new Population gets created and a low speciation Threshold", () => {
        population = new NeatPopulation<NeatChromosome>(populationSize, 2, generator);
        expect(population.speciesCount).toBeGreaterThanOrEqual(1);
        expect(population.species.size()).toBeGreaterThanOrEqual(1);
        // With this low threshold every unique connection leads to compatDistance above the Threshold
        // Therefore, we cannot have more than inputNodes * outputNodes connections
        expect(population.species.size()).toBeLessThanOrEqual(numberInputs * numberOutputs)
    })

    test("Speciation with a chromosome mutated several times", () => {
        NeatParameter.DISTANCE_THRESHOLD = 0.1;
        population = new NeatPopulation<NeatChromosome>(populationSize, 2, generator)
        const chromosome = generator.get();
        const mutant = chromosome.clone();
        for (let i = 0; i < 100; i++) {
            mutant.mutate();
            NeatUtil.speciate(mutant, population)
        }
        expect(population.speciesCount).toBeGreaterThan(1)
    })

    test("Compatibility Distance of clones", () => {
        const chromosome1 = generator.get();
        const chromosome2 = chromosome1.clone();
        const compatDistance = NeatUtil.compatibilityDistance(chromosome1, chromosome2)
        expect(compatDistance).toBe(0)
    })

    test("Compatibility Distance of Chromosomes with disjoint connections", () => {
        const inputNode1 = new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE);
        const inputNode2 = new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE);
        const outputNode = new NodeGene(2, NodeType.OUTPUT, ActivationFunctions.NONE);

        const nodes = new List<NodeGene>();
        nodes.add(inputNode1);
        nodes.add(inputNode2);
        nodes.add(outputNode);


        const connection1 = new ConnectionGene(inputNode1, outputNode, 1, true, 0, false);
        const connection2 = new ConnectionGene(inputNode2, outputNode, 0.5, true, 1, false);

        const connections1 = new List<ConnectionGene>()
        connections1.add(connection1);

        const connections2 = new List<ConnectionGene>()
        connections2.add(connection2);

        const chromosome1 = new NeatChromosome(connections1, nodes, mutation, crossOver)
        const chromosome2 = new NeatChromosome(connections2, nodes, mutation, crossOver)

        const compatDistance = NeatUtil.compatibilityDistance(chromosome1, chromosome2)
        // Greater than 0 because with a small chance we could get the exact same Chromosome from the generator.
        expect(compatDistance).toBe(NeatParameter.DISJOINT_COEFFICIENT)
    })

    test("Compatibility Distance of Chromosomes with excess connections", () => {
        const chromosome1 = generator.get();
        const chromosome2 = chromosome1.clone();

        const node1 = chromosome1.inputNodes.get(0);
        const node2 = chromosome1.outputNodes.get(1);
        chromosome2.connections.add(new ConnectionGene(node1, node2, 1, true, 1000, false));
        const compatDistance = NeatUtil.compatibilityDistance(chromosome1, chromosome2)
        // Greater than 0 because with a small chance we could get the exact same Chromosome from the generator.
        expect(compatDistance).toBe(NeatParameter.EXCESS_COEFFICIENT)
    })

    test("Compatibility Distance of Chromosomes with same connections but different weights", () => {
        const chromosome1 = generator.get();
        const chromosome2 = chromosome1.clone();
        chromosome2.connections.get(0).weight = chromosome1.connections.get(0).weight + 1;
        const compatDistance = NeatUtil.compatibilityDistance(chromosome1, chromosome2)
        // Greater than 0 because with a small chance we could get the exact same Chromosome from the generator.
        expect(compatDistance).toBe(NeatParameter.WEIGHT_COEFFICIENT)
    })
})
