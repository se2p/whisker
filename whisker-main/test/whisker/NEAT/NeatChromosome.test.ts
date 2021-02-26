import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";
import {ConnectionGene} from "../../../src/whisker/NEAT/ConnectionGene";
import {NodeGene} from "../../../src/whisker/NEAT/NodeGene";
import {NodeType} from "../../../src/whisker/NEAT/NodeType";
import {NeatChromosome} from "../../../src/whisker/NEAT/NeatChromosome";
import {Mutation} from "../../../src/whisker/search/Mutation";
import {Crossover} from "../../../src/whisker/search/Crossover";
import {List} from "../../../src/whisker/utils/List";
import {ActivationFunctions} from "../../../src/whisker/NEAT/ActivationFunctions";
import {NeatUtil} from "../../../src/whisker/NEAT/NeatUtil";

describe('NeatChromosome', () => {

    let mutationOp: Mutation<NeatChromosome>;
    let crossoverOp: Crossover<NeatChromosome>;
    let inputSize: number;
    let outputSize: number;
    let generator: NeatChromosomeGenerator;
    let chromosome: NeatChromosome;


    beforeEach(() => {
        mutationOp = new NeatMutation();
        crossoverOp = new NeatCrossover();
        inputSize = 3;
        outputSize = 2;
        generator = new NeatChromosomeGenerator(mutationOp, crossoverOp, inputSize, outputSize)
        chromosome = generator.get();
    })

    test('Create Network without hidden layer', () => {
        chromosome.connections.add(new ConnectionGene(chromosome.inputNodes.get(0), chromosome.outputNodes.get(0), 1, true, 3));
        chromosome.generateNetwork();
        // add +1 to the input Nodes due to the Bias Node
        expect(chromosome.allNodes.size()).toBe(inputSize + 1 + outputSize)
    })


    test('Create Network with hidden layer', () => {
        const inputNode = chromosome.inputNodes.get(0)
        const outputNode = chromosome.outputNodes.get(0)
        const hiddenNode = new NodeGene(7, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        const deepHiddenNode = new NodeGene(8, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        chromosome.connections.add(new ConnectionGene(inputNode, hiddenNode, 0.5, true, 7))
        chromosome.connections.add(new ConnectionGene(hiddenNode, outputNode, 0, true, 8))
        chromosome.connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 1, true, 9))
        chromosome.connections.add(new ConnectionGene(deepHiddenNode, outputNode, 0.2, true, 10))
        chromosome.generateNetwork()
        // add +1 to the input Nodes due to the Bias Node
        expect(chromosome.allNodes.size()).toBe(inputSize + 1 + outputSize + 2)
        expect(chromosome.layerMap.size).toBe(4)
    })

    test('Test stabilizedCounter without hidden Layer', () => {

        // Create input Nodes
        const inputNodes = new List<NodeGene>()
        inputNodes.add(new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE))
        inputNodes.add(new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE))
        inputNodes.add(new NodeGene(2, NodeType.BIAS, ActivationFunctions.NONE))

        // Create output Nodes
        const outputNodes = new List<NodeGene>()
        outputNodes.add(new NodeGene(3, NodeType.OUTPUT, ActivationFunctions.NONE))
        outputNodes.add(new NodeGene(4, NodeType.OUTPUT, ActivationFunctions.NONE))

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(inputNodes.get(0), outputNodes.get(0), 0.2, true, 1))
        connections.add(new ConnectionGene(inputNodes.get(0), outputNodes.get(1), 0.5, false, 2))
        connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(0), 0.2, false, 3))
        connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(1), 1, true, 4))
        connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(0), 0.2, true, 5))
        connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(1), 0.7, true, 6))

        chromosome = new NeatChromosome(connections, inputNodes, outputNodes, crossoverOp, mutationOp)
        const counter = chromosome.stabilizedCounter(5, true);
        expect(counter).toBe(2);
    })

    test('Test stabilizedCounter with hidden Layer', () => {

        // Create input Nodes
        const inputNodes = new List<NodeGene>()
        inputNodes.add(new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE))
        inputNodes.add(new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE))
        inputNodes.add(new NodeGene(2, NodeType.BIAS, ActivationFunctions.NONE))

        // Create output Nodes
        const outputNodes = new List<NodeGene>()
        outputNodes.add(new NodeGene(3, NodeType.OUTPUT, ActivationFunctions.NONE))
        outputNodes.add(new NodeGene(4, NodeType.OUTPUT, ActivationFunctions.NONE))

        const hiddenNode = new NodeGene(5, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        const deepHiddenNode = new NodeGene(6, NodeType.HIDDEN, ActivationFunctions.SIGMOID)

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(inputNodes.get(0), outputNodes.get(0), 0.2, true, 1))
        connections.add(new ConnectionGene(inputNodes.get(0), outputNodes.get(1), 0.5, false, 2))
        connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(0), 0.2, false, 3))
        connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(1), 1, true, 4))
        connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(0), 0.2, true, 5))
        connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(1), 0.7, true, 6))
        connections.add(new ConnectionGene(inputNodes.get(0), hiddenNode, 0.3, true, 7));
        connections.add(new ConnectionGene(hiddenNode, outputNodes.get(0), 0.7, true, 8));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9));
        connections.add(new ConnectionGene(deepHiddenNode, outputNodes.get(1), 1, true, 10))


        chromosome = new NeatChromosome(connections, inputNodes, outputNodes, crossoverOp, mutationOp)
        const counter = chromosome.stabilizedCounter(5, true);
        expect(counter).toBe(4);
    })


    test('Network activation without hidden layer', () => {

        // Create input Nodes
        const inputNodes = new List<NodeGene>()
        inputNodes.add(new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE))
        inputNodes.add(new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE))
        inputNodes.add(new NodeGene(2, NodeType.BIAS, ActivationFunctions.NONE))

        // Create output Nodes
        const outputNodes = new List<NodeGene>()
        outputNodes.add(new NodeGene(3, NodeType.OUTPUT, ActivationFunctions.NONE))
        outputNodes.add(new NodeGene(4, NodeType.OUTPUT, ActivationFunctions.NONE))

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(inputNodes.get(0), outputNodes.get(0), 0.2, true, 1))
        connections.add(new ConnectionGene(inputNodes.get(0), outputNodes.get(1), 0.5, false, 2))
        connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(0), 0.2, false, 3))
        connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(1), 1, true, 4))
        connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(0), 0.2, true, 5))
        connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(1), 0.7, true, 6))

        chromosome = new NeatChromosome(connections, inputNodes, outputNodes, crossoverOp, mutationOp)
        chromosome.setUpInputs([1, 2])
        chromosome.activateNetwork(true)
        const outputSum = NeatUtil.softmax(chromosome.outputNodes)
        expect(Math.round(outputSum.reduce((a, b) => a + b))).toBe(1);
    })


    test('Network activation with hidden layer', () => {

        // Create input Nodes
        const inputNodes = new List<NodeGene>()
        inputNodes.add(new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE))
        inputNodes.add(new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE))
        inputNodes.add(new NodeGene(2, NodeType.BIAS, ActivationFunctions.NONE))

        // Create output Nodes
        const outputNodes = new List<NodeGene>()
        outputNodes.add(new NodeGene(3, NodeType.OUTPUT, ActivationFunctions.NONE))
        outputNodes.add(new NodeGene(4, NodeType.OUTPUT, ActivationFunctions.NONE))

        const hiddenNode = new NodeGene(5, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        const deepHiddenNode = new NodeGene(6, NodeType.HIDDEN, ActivationFunctions.SIGMOID)

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(inputNodes.get(0), outputNodes.get(0), 0.2, true, 1))
        connections.add(new ConnectionGene(inputNodes.get(0), outputNodes.get(1), 0.5, false, 2))
        connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(0), 0.2, false, 3))
        connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(1), 1, true, 4))
        connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(0), 0.2, true, 5))
        connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(1), 0.7, true, 6))
        connections.add(new ConnectionGene(inputNodes.get(0), hiddenNode, 0.3, true, 7));
        connections.add(new ConnectionGene(hiddenNode, outputNodes.get(0), 0.7, true, 8));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9));
        connections.add(new ConnectionGene(deepHiddenNode, outputNodes.get(1), 1, true, 10))


        chromosome = new NeatChromosome(connections, inputNodes, outputNodes, crossoverOp, mutationOp)
        const stabilizeCount = chromosome.stabilizedCounter(10, true);
        chromosome.flushNodeValues();
        chromosome.setUpInputs([1, 2])
        for (let i = 0; i < stabilizeCount + 1; i++) {
            chromosome.activateNetwork(true);
        }
        const output = NeatUtil.softmax(chromosome.outputNodes)
        expect(Math.round(output.reduce((a, b) => a + b))).toBe(1);
    })

    test('Network activation with recurrent connections', () => {

        // Create input Nodes
        const inputNodes = new List<NodeGene>()
        inputNodes.add(new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE))
        inputNodes.add(new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE))
        inputNodes.add(new NodeGene(2, NodeType.BIAS, ActivationFunctions.NONE))

        // Create output Nodes
        const outputNodes = new List<NodeGene>()
        outputNodes.add(new NodeGene(3, NodeType.OUTPUT, ActivationFunctions.NONE))
        outputNodes.add(new NodeGene(4, NodeType.OUTPUT, ActivationFunctions.NONE))

        const hiddenNode = new NodeGene(5, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        const deepHiddenNode = new NodeGene(6, NodeType.HIDDEN, ActivationFunctions.SIGMOID)

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(inputNodes.get(0), outputNodes.get(0), 0.2, true, 1))
        connections.add(new ConnectionGene(inputNodes.get(0), outputNodes.get(1), 0.5, false, 2))
        connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(0), 0.2, false, 3))
        connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(1), 1, true, 4))
        connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(0), 0.2, true, 5))
        connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(1), 0.7, true, 6))
        connections.add(new ConnectionGene(inputNodes.get(0), hiddenNode, 0.3, true, 7));
        connections.add(new ConnectionGene(hiddenNode, outputNodes.get(0), 0.7, true, 8));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9));
        connections.add(new ConnectionGene(deepHiddenNode, hiddenNode, 1, true, 10));
        connections.add(new ConnectionGene(deepHiddenNode, outputNodes.get(1), 1, true, 11))


        chromosome = new NeatChromosome(connections, inputNodes, outputNodes, crossoverOp, mutationOp)
        chromosome.setUpInputs([1, 2])
        chromosome.activateNetwork(true)
        const outputSum = NeatUtil.softmax(chromosome.outputNodes)
        expect(Math.round(outputSum.reduce((a, b) => a + b))).toBe(1);
    })

    test("Clone Test without hidden Layer", () => {
        chromosome.generateNetwork();
        const clone = chromosome.clone();
        expect(clone.connections.size()).toBe(chromosome.connections.size())
        expect(clone.allNodes.size()).toBe(chromosome.allNodes.size())
        expect(clone.inputNodes.size()).toBe(chromosome.inputNodes.size())
        expect(clone.outputNodes.size()).toBe(chromosome.outputNodes.size())
        expect(clone.timePlayed).toBe(chromosome.timePlayed)
        expect(clone.fitness).toBe(chromosome.fitness)
    })

    test("Clone Test with hidden Layer", () => {
        // Create input Nodes
        const inputNodes = new List<NodeGene>()
        inputNodes.add(new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE))
        inputNodes.add(new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE))
        inputNodes.add(new NodeGene(2, NodeType.BIAS, ActivationFunctions.NONE))

        // Create output Nodes
        const outputNodes = new List<NodeGene>()
        outputNodes.add(new NodeGene(3, NodeType.OUTPUT, ActivationFunctions.NONE))
        outputNodes.add(new NodeGene(4, NodeType.OUTPUT, ActivationFunctions.NONE))

        const hiddenNode = new NodeGene(5, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        const deepHiddenNode = new NodeGene(6, NodeType.HIDDEN, ActivationFunctions.SIGMOID)

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(inputNodes.get(0), outputNodes.get(0), 0.2, true, 1))
        connections.add(new ConnectionGene(inputNodes.get(0), outputNodes.get(1), 0.5, false, 2))
        connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(0), 0.2, false, 3))
        connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(1), 1, true, 4))
        connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(0), 0.2, true, 5))
        connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(1), 0.7, true, 6))
        connections.add(new ConnectionGene(inputNodes.get(0), hiddenNode, 0.3, true, 7));
        connections.add(new ConnectionGene(hiddenNode, outputNodes.get(0), 0.7, true, 8));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9));
        connections.add(new ConnectionGene(deepHiddenNode, hiddenNode, 1, true, 10));
        connections.add(new ConnectionGene(deepHiddenNode, outputNodes.get(1), 1, true, 11))


        chromosome = new NeatChromosome(connections, inputNodes, outputNodes, crossoverOp, mutationOp)
        chromosome.generateNetwork();
        const clone = chromosome.clone();
        expect(clone.connections.size()).toBe(chromosome.connections.size())
        expect(clone.allNodes.size()).toBe(chromosome.allNodes.size())
        expect(clone.inputNodes.size()).toBe(chromosome.inputNodes.size())
        expect(clone.outputNodes.size()).toBe(chromosome.outputNodes.size())
        expect(clone.timePlayed).toBe(chromosome.timePlayed)
        expect(clone.fitness).toBe(chromosome.fitness)
    })

    test("Clone with gene Test without hidden Layer", () => {
        chromosome.generateNetwork();
        const clone = chromosome.cloneWith(chromosome.connections);
        expect(clone.connections.size()).toBe(chromosome.connections.size())
        expect(clone.allNodes.size()).toBe(chromosome.allNodes.size())
        expect(clone.inputNodes.size()).toBe(chromosome.inputNodes.size())
        expect(clone.outputNodes.size()).toBe(chromosome.outputNodes.size())
        expect(clone.timePlayed).toBe(chromosome.timePlayed)
        expect(clone.fitness).toBe(chromosome.fitness)
    })

    test("Clone with gene Test with hidden Layer", () => {
        // Create input Nodes
        const inputNodes = new List<NodeGene>()
        inputNodes.add(new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE))
        inputNodes.add(new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE))
        inputNodes.add(new NodeGene(2, NodeType.BIAS, ActivationFunctions.NONE))

        // Create output Nodes
        const outputNodes = new List<NodeGene>()
        outputNodes.add(new NodeGene(3, NodeType.OUTPUT, ActivationFunctions.NONE))
        outputNodes.add(new NodeGene(4, NodeType.OUTPUT, ActivationFunctions.NONE))

        const hiddenNode = new NodeGene(5, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        const deepHiddenNode = new NodeGene(6, NodeType.HIDDEN, ActivationFunctions.SIGMOID)

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(inputNodes.get(0), outputNodes.get(0), 0.2, true, 1))
        connections.add(new ConnectionGene(inputNodes.get(0), outputNodes.get(1), 0.5, false, 2))
        connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(0), 0.2, false, 3))
        connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(1), 1, true, 4))
        connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(0), 0.2, true, 5))
        connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(1), 0.7, true, 6))
        connections.add(new ConnectionGene(inputNodes.get(0), hiddenNode, 0.3, true, 7));
        connections.add(new ConnectionGene(hiddenNode, outputNodes.get(0), 0.7, true, 8));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9));
        connections.add(new ConnectionGene(deepHiddenNode, hiddenNode, 1, true, 10));
        connections.add(new ConnectionGene(deepHiddenNode, outputNodes.get(1), 1, true, 11))


        chromosome = new NeatChromosome(connections, inputNodes, outputNodes, crossoverOp, mutationOp)
        chromosome.generateNetwork();
        const clone = chromosome.cloneWith(chromosome.connections);
        expect(clone.connections.size()).toBe(chromosome.connections.size())
        expect(clone.allNodes.size()).toBe(chromosome.allNodes.size())
        expect(clone.inputNodes.size()).toBe(chromosome.inputNodes.size())
        expect(clone.outputNodes.size()).toBe(chromosome.outputNodes.size())
        expect(clone.timePlayed).toBe(chromosome.timePlayed)
        expect(clone.fitness).toBe(chromosome.fitness)
    })

})
