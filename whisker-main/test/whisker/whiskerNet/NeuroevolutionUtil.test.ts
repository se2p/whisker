import {NeatPopulation} from "../../../src/whisker/whiskerNet/NeatPopulation";
import {NetworkChromosome} from "../../../src/whisker/whiskerNet/NetworkChromosome";
import {NeatCrossover} from "../../../src/whisker/whiskerNet/NeatCrossover";
import {NeatMutation} from "../../../src/whisker/whiskerNet/NeatMutation";
import {NetworkChromosomeGenerator} from "../../../src/whisker/whiskerNet/NetworkChromosomeGenerator";
import {NeuroevolutionUtil} from "../../../src/whisker/whiskerNet/NeuroevolutionUtil";
import {ConnectionGene} from "../../../src/whisker/whiskerNet/ConnectionGene";
import {NodeGene} from "../../../src/whisker/whiskerNet/NetworkNodes/NodeGene";
import {List} from "../../../src/whisker/utils/List";
import {ActivationFunction} from "../../../src/whisker/whiskerNet/NetworkNodes/ActivationFunction";
import {NeuroevolutionProperties} from "../../../src/whisker/whiskerNet/NeuroevolutionProperties";
import {InputNode} from "../../../src/whisker/whiskerNet/NetworkNodes/InputNode";
import {ClassificationNode} from "../../../src/whisker/whiskerNet/NetworkNodes/ClassificationNode";

describe("NeatUtil Tests", () => {

    let population: NeatPopulation<NetworkChromosome>;
    let populationSize: number;
    let crossOver: NeatCrossover;
    let mutation: NeatMutation;
    let genInputs: number[][];
    let numberOutputs: number;
    let generator: NetworkChromosomeGenerator
    let properties: NeuroevolutionProperties<NetworkChromosome>


    beforeEach(() => {
        crossOver = new NeatCrossover(0.4);
        mutation = new NeatMutation(0.03, 0.1, 30,
            0.2, 0.01, 0.8, 1.5,
            0.1,3, 0.1);
        genInputs = [[1,2,3,4,5,6]]
        numberOutputs = 3;
        populationSize = 50;
        properties = new NeuroevolutionProperties<NetworkChromosome>(populationSize);
        generator = new NetworkChromosomeGenerator(mutation, crossOver, genInputs, numberOutputs, 0.4, false)
    })

    test("Speciation when a new Population gets created", () => {
        population = new NeatPopulation<NetworkChromosome>(populationSize, 2, generator, properties);
        expect(population.speciesCount).toBeGreaterThanOrEqual(1);
        expect(population.species.size()).toBeGreaterThanOrEqual(1);
    })

    test("Speciation when a new Population gets created and a low speciation Threshold", () => {
        population = new NeatPopulation<NetworkChromosome>(populationSize, 2, generator, properties);
        expect(population.speciesCount).toBeGreaterThanOrEqual(1);
        expect(population.species.size()).toBeGreaterThanOrEqual(1);
        // With this low threshold every unique connection leads to compatDistance above the Threshold
        // Therefore, we cannot have more than inputNodes * outputNodes connections
        expect(population.species.size()).toBeLessThanOrEqual(populationSize)
    })

    test("Speciation with a chromosome mutated several times", () => {
        population = new NeatPopulation<NetworkChromosome>(populationSize, 2, generator, properties)
        const chromosome = generator.get();
        const mutant = chromosome.clone();
        for (let i = 0; i < 100; i++) {
            mutant.mutate();
            NeuroevolutionUtil.speciate(mutant, population, properties)
        }
        expect(population.speciesCount).toBeGreaterThan(1)
    })

    test("Compatibility Distance of clones", () => {
        const chromosome1 = generator.get();
        const chromosome2 = chromosome1.clone();
        const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4)
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

        const chromosome1 = new NetworkChromosome(connections1, nodes, mutation, crossOver)
        const chromosome2 = new NetworkChromosome(connections2, nodes, mutation, crossOver)

        const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4)
        // Greater than 0 because with a small chance we could get the exact same Chromosome from the generator.
        expect(compatDistance).toBe(1)
    })

    test("Compatibility Distance of Chromosomes with excess connections", () => {
        const chromosome1 = generator.get();
        const chromosome2 = chromosome1.clone();

        const node1 = chromosome1.inputNodes.get(0);
        const node2 = chromosome1.outputNodes.get(1);
        chromosome2.connections.add(new ConnectionGene(node1, node2, 1, true, 1000, false));
        const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4)
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

        const chromosome1 = new NetworkChromosome(connections1, nodes, mutation, crossOver)
        const chromosome2 = new NetworkChromosome(connections2, nodes, mutation, crossOver)
        const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4)
        // Greater than 0 because with a small chance we could get the exact same Chromosome from the generator.
        expect(compatDistance).toBe(0.4 * 0.5)
    })

    test("Regression Nodes Output", () =>{
        const noRegressionNetwork = generator.get();
        const regGenerator = new NetworkChromosomeGenerator(mutation, crossOver, genInputs, numberOutputs, 0.4, true);
        const regressionNetwork1 = regGenerator.get();
        const regressionNetwork2 = regGenerator.get();

        const inputs = [1,2,3,4,5,6];
        const stabValue1 = noRegressionNetwork.stabilizedCounter(20, false);
        const stabValue2 = regressionNetwork1.stabilizedCounter(20, false);
        const stabValue3 = regressionNetwork2.stabilizedCounter(20, false);

        for (let i = 0; i < stabValue1+1; i++) {
            noRegressionNetwork.activateNetwork(inputs)
        }

        for (let i = 0; i < stabValue2+1; i++) {
            regressionNetwork1.activateNetwork(inputs)
        }

        for (let i = 0; i < stabValue3+1; i++) {
            regressionNetwork2.activateNetwork(inputs)
        }

        const outputSum1 = NeuroevolutionUtil.evaluateRegressionNodes(regressionNetwork1.outputNodes).reduce((a, b) => a + b, 0);
        const outputSum2 = NeuroevolutionUtil.evaluateRegressionNodes(regressionNetwork2.outputNodes).reduce((a, b) => a + b, 0);

        expect(NeuroevolutionUtil.evaluateRegressionNodes(noRegressionNetwork.outputNodes).length).toBe(0);
        expect(NeuroevolutionUtil.evaluateRegressionNodes(regressionNetwork1.outputNodes).length).toBe(2);
        expect(NeuroevolutionUtil.evaluateRegressionNodes(regressionNetwork2.outputNodes).length).toBe(2);
        expect(outputSum1).not.toBe(outputSum2)
    })
})
