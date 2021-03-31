import {NeatPopulation} from "../../../src/whisker/whiskerNet/NeatPopulation";
import {NetworkChromosome} from "../../../src/whisker/whiskerNet/NetworkChromosome";
import {NeatCrossover} from "../../../src/whisker/whiskerNet/NeatCrossover";
import {NeatMutation} from "../../../src/whisker/whiskerNet/NeatMutation";
import {NetworkChromosomeGeneratorSparse} from "../../../src/whisker/whiskerNet/NetworkGenerators/NetworkChromosomeGeneratorSparse";
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
    let generator: NetworkChromosomeGeneratorSparse
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
        properties.weightCoefficient = 0.4;
        properties.excessCoefficient = 1;
        properties.disjointCoefficient = 1;
        generator = new NetworkChromosomeGeneratorSparse(mutation, crossOver, genInputs, numberOutputs, 0.4, false)
    })

    test("Test Speciation when a new Population gets created", () => {
        population = new NeatPopulation<NetworkChromosome>(populationSize, 2, generator, properties);
        expect(population.speciesCount).toBeGreaterThanOrEqual(1);
        expect(population.species.size()).toBeGreaterThanOrEqual(1);
    })

    test("Test Speciation when a new Population gets created and a low speciation Threshold", () => {
        properties.distanceThreshold = 0.01;
        population = new NeatPopulation<NetworkChromosome>(populationSize, 2, generator, properties);
        expect(population.speciesCount).toBeGreaterThanOrEqual(1);
        expect(population.species.size()).toBeGreaterThanOrEqual(1);
        // With this low threshold every unique connection leads to compatDistance above the Threshold
        // Therefore, we cannot have more than inputNodes * outputNodes connections
        expect(population.species.size()).toBeLessThanOrEqual(populationSize)
    })

    test("Test Speciation when a new Population gets created and a high speciation Threshold", () => {
        properties.distanceThreshold = 1000;
        population = new NeatPopulation<NetworkChromosome>(populationSize, 2, generator, properties);
        expect(population.speciesCount).toBeGreaterThanOrEqual(1);
        expect(population.species.size()).toBeGreaterThanOrEqual(1);
        // With this low threshold every unique connection leads to compatDistance above the Threshold
        // Therefore, we cannot have more than inputNodes * outputNodes connections
        expect(population.species.size()).toBeLessThanOrEqual(populationSize)
    })

    test("Test Speciation with a chromosome mutated several times", () => {
        population = new NeatPopulation<NetworkChromosome>(populationSize, 2, generator, properties)
        const chromosome = generator.get();
        const mutant = chromosome.clone();
        for (let i = 0; i < 100; i++) {
            mutant.mutate();
            NeuroevolutionUtil.speciate(mutant, population, properties)
        }
        expect(population.speciesCount).toBeGreaterThan(1)
    })

    test("Test Compatibility Distance of clones", () => {
        const chromosome1 = generator.get();
        const chromosome2 = chromosome1.clone();
        const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4)
        expect(compatDistance).toBe(0)
    })

    test("Test Compatibility Distance of Chromosomes with disjoint connections", () => {
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

    test("Test Compatibility Distance of Chromosomes with disjoint connections switched", () => {
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

        const chromosome1 = new NetworkChromosome(connections2, nodes, mutation, crossOver)
        const chromosome2 = new NetworkChromosome(connections1, nodes, mutation, crossOver)

        const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4)
        // Greater than 0 because with a small chance we could get the exact same Chromosome from the generator.
        expect(compatDistance).toBe(1)
    })

    test("Test Compatibility Distance of Chromosomes with excess connections", () => {
        const chromosome1 = generator.get();
        const chromosome2 = chromosome1.clone();

        const node1 = chromosome1.inputNodes.get(0);
        const node2 = chromosome1.outputNodes.get(1);
        chromosome2.connections.add(new ConnectionGene(node1, node2, 1, true, 1000, false));
        const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4)
        // Greater than 0 because with a small chance we could get the exact same Chromosome from the generator.
        expect(compatDistance).toBe(1)
    })

    test("Test Compatibility Distance of Chromosomes with same connections but different weights", () => {
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

    test("Test Compatibility Distance of undefined chromosome", () => {
        const chromosome1 = generator.get();
        const chromosome2 = undefined;
        const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4)
        expect(compatDistance).toBe(Number.MAX_SAFE_INTEGER)
    })

    test("Test Softmax calculation", () =>{
        const chromosome = generator.get();
        const stabiliseCount = chromosome.stabilizedCounter(30, true);
        for (let i = 0; i < stabiliseCount + 1; i++) {
            chromosome.activateNetwork([1,2,3,4,5,6])
        }
        const softmaxOutput = NeuroevolutionUtil.softmax(chromosome.outputNodes);
        expect(Math.round(softmaxOutput.reduce((a, b) => a + b))).toBe(1);

    })

    test("Test Regression Nodes Output", () =>{
        const noRegressionNetwork = generator.get();
        const regGenerator = new NetworkChromosomeGeneratorSparse(mutation, crossOver, genInputs, numberOutputs, 0.4, true);
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

    test("Test findConnection for connection which is inside the list", () =>{
        const connectionList = new List<ConnectionGene>()
        const chromosome = generator.get();
        for(const connection of chromosome.connections)
            connectionList.add(connection);
        expect(NeuroevolutionUtil.findConnection(connectionList, chromosome.connections.get(0))).toBe(chromosome.connections.get(0))
    })

    test("Test findConnection for connection which is not inside the list", () =>{
        const connectionList = new List<ConnectionGene>()
        const chromosome = generator.get();
        for(const connection of chromosome.connections)
            connectionList.add(connection);
        const inNode = new InputNode(100)
        const outNode = new ClassificationNode(101, ActivationFunction.SIGMOID)
        const newConnection = new ConnectionGene(inNode, outNode, 1, true, 100, false)
        expect(NeuroevolutionUtil.findConnection(connectionList, newConnection)).toBe(null)
    })

    test("Test Assign innovation number of a new connection", () =>{
        const inNode = new InputNode(100)
        const outNode = new ClassificationNode(101, ActivationFunction.SIGMOID)
        const newConnection = new ConnectionGene(inNode, outNode, 1, true, 100, false)
        NeuroevolutionUtil.assignInnovationNumber(newConnection)
        expect(newConnection.innovation).toBeLessThan(100)
    })

    test("Test Assign innovation number of a new connection which is similar to an existing one", () =>{
        const chromosome = generator.get();
        const existingConnection = chromosome.connections.get(0)
        const inNode = new InputNode(existingConnection.source.id)
        const outNode = new ClassificationNode(existingConnection.target.id, ActivationFunction.SIGMOID)
        const newConnection = new ConnectionGene(inNode, outNode, 1, true, 100, false)
        NeuroevolutionUtil.assignInnovationNumber(newConnection)
        expect(newConnection.innovation).toBe(existingConnection.innovation)
    })
})
