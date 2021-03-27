
import {NeatPopulation} from "../../../src/whisker/NEAT/NeatPopulation";
import {NeatChromosome} from "../../../src/whisker/NEAT/NeatChromosome";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";
import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatUtil} from "../../../src/whisker/NEAT/NeatUtil";
import {ConnectionGene} from "../../../src/whisker/NEAT/ConnectionGene";
import {NodeGene} from "../../../src/whisker/NEAT/NetworkNodes/NodeGene";
import {List} from "../../../src/whisker/utils/List";
import {ActivationFunction} from "../../../src/whisker/NEAT/NetworkNodes/ActivationFunction";
import {NeuroevolutionProperties} from "../../../src/whisker/NEAT/NeuroevolutionProperties";
import {InputNode} from "../../../src/whisker/NEAT/NetworkNodes/InputNode";
import {ClassificationNode} from "../../../src/whisker/NEAT/NetworkNodes/ClassificationNode";

describe("NeatUtil Tests", () => {

    let population: NeatPopulation<NeatChromosome>;
    let populationSize: number;
    let crossOver: NeatCrossover;
    let mutation: NeatMutation;
    let genInputs: number[][];
    let numberOutputs: number;
    let generator: NeatChromosomeGenerator
    let properties: NeuroevolutionProperties<NeatChromosome>


    beforeEach(() => {
        crossOver = new NeatCrossover(0.4);
        mutation = new NeatMutation(0.03, 0.1, 30,
            0.2, 0.01, 0.8, 1.5,
            0.1,3, 0.1);
        genInputs = [[1,2,3,4,5,6]]
        numberOutputs = 3;
        populationSize = 50;
        properties = new NeuroevolutionProperties<NeatChromosome>(populationSize);
        generator = new NeatChromosomeGenerator(mutation, crossOver, genInputs, numberOutputs, 0.4, false)
    })

    test("Speciation when a new Population gets created", () => {
        population = new NeatPopulation<NeatChromosome>(populationSize, 2, generator, properties);
        expect(population.speciesCount).toBeGreaterThanOrEqual(1);
        expect(population.species.size()).toBeGreaterThanOrEqual(1);
    })

    test("Speciation when a new Population gets created and a low speciation Threshold", () => {
        population = new NeatPopulation<NeatChromosome>(populationSize, 2, generator, properties);
        expect(population.speciesCount).toBeGreaterThanOrEqual(1);
        expect(population.species.size()).toBeGreaterThanOrEqual(1);
        // With this low threshold every unique connection leads to compatDistance above the Threshold
        // Therefore, we cannot have more than inputNodes * outputNodes connections
        expect(population.species.size()).toBeLessThanOrEqual(populationSize)
    })

    test("Speciation with a chromosome mutated several times", () => {
        population = new NeatPopulation<NeatChromosome>(populationSize, 2, generator, properties)
        const chromosome = generator.get();
        const mutant = chromosome.clone();
        for (let i = 0; i < 100; i++) {
            mutant.mutate();
            NeatUtil.speciate(mutant, population, properties)
        }
        expect(population.speciesCount).toBeGreaterThan(1)
    })

    test("Compatibility Distance of clones", () => {
        const chromosome1 = generator.get();
        const chromosome2 = chromosome1.clone();
        const compatDistance = NeatUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4)
        expect(compatDistance).toBe(0)
    })

    test("Compatibility Distance of Chromosomes with disjoint connections", () => {
        const inputNode1 = new InputNode(0);
        const inputNode2 = new InputNode(1);
        const outputNode = new ClassificationNode(2, ActivationFunction.SIGMOID);

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

        const compatDistance = NeatUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4)
        // Greater than 0 because with a small chance we could get the exact same Chromosome from the generator.
        expect(compatDistance).toBe(1)
    })

    test("Compatibility Distance of Chromosomes with excess connections", () => {
        const chromosome1 = generator.get();
        const chromosome2 = chromosome1.clone();

        const node1 = chromosome1.inputNodes.get(0);
        const node2 = chromosome1.outputNodes.get(1);
        chromosome2.connections.add(new ConnectionGene(node1, node2, 1, true, 1000, false));
        const compatDistance = NeatUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4)
        // Greater than 0 because with a small chance we could get the exact same Chromosome from the generator.
        expect(compatDistance).toBe(1)
    })

    test("Compatibility Distance of Chromosomes with same connections but different weights", () => {
        const inputNode1 = new InputNode(0);
        const inputNode2 = new InputNode(1);
        const outputNode = new ClassificationNode(2, ActivationFunction.SIGMOID);

        const nodes = new List<NodeGene>();
        nodes.add(inputNode1);
        nodes.add(inputNode2);
        nodes.add(outputNode);


        const connection1 = new ConnectionGene(inputNode1, outputNode, 1, true, 0, false);
        const connection2 = new ConnectionGene(inputNode1, outputNode, 0.5, true, 0, false);

        const connections1 = new List<ConnectionGene>()
        connections1.add(connection1);

        const connections2 = new List<ConnectionGene>()
        connections2.add(connection2);

        const chromosome1 = new NeatChromosome(connections1, nodes, mutation, crossOver)
        const chromosome2 = new NeatChromosome(connections2, nodes, mutation, crossOver)
        const compatDistance = NeatUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4)
        // Greater than 0 because with a small chance we could get the exact same Chromosome from the generator.
        expect(compatDistance).toBe(0.4 * 0.5)
    })

    test("Regression Nodes Output", () =>{
        const noRegressionNetwork = generator.get();
        const regGenerator = new NeatChromosomeGenerator(mutation, crossOver, genInputs, numberOutputs, 0.4, true);
        const regressionNetwork1 = regGenerator.get();
        const regressionNetwork2 = regGenerator.get();

        const inputs = [1,2,3,4,5,6];
        const stabValue1 = noRegressionNetwork.stabilizedCounter(20, false);
        const stabValue2 = regressionNetwork1.stabilizedCounter(20, false);
        const stabValue3 = regressionNetwork2.stabilizedCounter(20, false);

        noRegressionNetwork.setUpInputs(inputs)
        for (let i = 0; i < stabValue1+1; i++) {
            noRegressionNetwork.activateNetwork(false)
        }

        regressionNetwork1.setUpInputs(inputs)
        for (let i = 0; i < stabValue2+1; i++) {
            regressionNetwork1.activateNetwork(false)
        }

        regressionNetwork2.setUpInputs(inputs)
        for (let i = 0; i < stabValue3+1; i++) {
            regressionNetwork2.activateNetwork(false)
        }

        const outputSum1 = NeatUtil.evaluateRegressionNodes(regressionNetwork1.outputNodes).reduce((a,b) => a + b, 0);
        const outputSum2 = NeatUtil.evaluateRegressionNodes(regressionNetwork2.outputNodes).reduce((a,b) => a + b, 0);

        expect(NeatUtil.evaluateRegressionNodes(noRegressionNetwork.outputNodes).length).toBe(0);
        expect(NeatUtil.evaluateRegressionNodes(regressionNetwork1.outputNodes).length).toBe(2);
        expect(NeatUtil.evaluateRegressionNodes(regressionNetwork2.outputNodes).length).toBe(2);
        expect(outputSum1).not.toBe(outputSum2)
    })
})
