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
        chromosome = generator.get();
        // add +1 to the input Nodes due to the Bias Node
        expect(chromosome.allNodes.size()).toBe(inputSize + 1 + outputSize)
    })


    test('Create Network with hidden layer', () => {
        const inputNode = chromosome.inputNodes.get(0)
        const outputNode = chromosome.outputNodes.get(0)
        const hiddenNode = new NodeGene(7, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        const deepHiddenNode = new NodeGene(8, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        chromosome.allNodes.add(hiddenNode);
        chromosome.allNodes.add(deepHiddenNode);
        chromosome.connections.add(new ConnectionGene(inputNode, hiddenNode, 0.5, true, 7, false))
        chromosome.connections.add(new ConnectionGene(hiddenNode, outputNode, 0, true, 8, false))
        chromosome.connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 1, true, 9, false))
        chromosome.connections.add(new ConnectionGene(deepHiddenNode, outputNode, 0.2, true, 10, false))
        chromosome.generateNetwork()
        // add +1 to the input Nodes due to the Bias Node
        expect(chromosome.allNodes.size()).toBe(inputSize + 1 + outputSize + 2)
    })

    test('Test stabilizedCounter without hidden Layer', () => {

        // Create input Nodes
        const nodes = new List<NodeGene>()
        nodes.add(new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(2, NodeType.BIAS, ActivationFunctions.NONE))

        // Create output Nodes
        nodes.add(new NodeGene(3, NodeType.OUTPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(4, NodeType.OUTPUT, ActivationFunctions.NONE))

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, 2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, 3, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true, 4, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true, 5, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true, 6, false))

        chromosome = new NeatChromosome(connections, nodes, mutationOp, crossoverOp)
        const counter = chromosome.stabilizedCounter(5, true);
        expect(counter).toBe(2);
    })

    test('Test stabilizedCounter with hidden Layer', () => {

        // Create input Nodes
        const nodes = new List<NodeGene>()
        nodes.add(new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(2, NodeType.BIAS, ActivationFunctions.NONE))

        // Create output Nodes
        nodes.add(new NodeGene(3, NodeType.OUTPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(4, NodeType.OUTPUT, ActivationFunctions.NONE))

        const hiddenNode = new NodeGene(5, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        const deepHiddenNode = new NodeGene(6, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        nodes.add(hiddenNode);
        nodes.add(deepHiddenNode);

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, 2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, 3, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true, 4, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true, 5, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true, 6, false))
        connections.add(new ConnectionGene(nodes.get(0), hiddenNode, 0.3, true, 7, false));
        connections.add(new ConnectionGene(hiddenNode, nodes.get(3), 0.7, true, 8, false));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9, false));
        connections.add(new ConnectionGene(deepHiddenNode, nodes.get(4), 1, true, 10, false))


        chromosome = new NeatChromosome(connections, nodes, mutationOp, crossoverOp)
        const counter = chromosome.stabilizedCounter(5, true);
        expect(counter).toBe(4);
    })


    test('Network activation without hidden layer', () => {

        // Create input Nodes
        const nodes = new List<NodeGene>()
        nodes.add(new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(2, NodeType.BIAS, ActivationFunctions.NONE))

        // Create output Nodes
        nodes.add(new NodeGene(3, NodeType.OUTPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(4, NodeType.OUTPUT, ActivationFunctions.NONE))

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, 2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, 3, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true, 4, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true, 5, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true, 6, false))

        chromosome = new NeatChromosome(connections, nodes, mutationOp, crossoverOp)
        chromosome.setUpInputs([1, 2])
        chromosome.activateNetwork(true)
        const outputSum = NeatUtil.softmax(chromosome.outputNodes)
        expect(Math.round(outputSum.reduce((a, b) => a + b))).toBe(1);
    })


    test('Network activation with hidden layer', () => {

        // Create input Nodes
        const nodes = new List<NodeGene>()
        nodes.add(new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(2, NodeType.BIAS, ActivationFunctions.NONE))

        // Create output Nodes
        nodes.add(new NodeGene(3, NodeType.OUTPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(4, NodeType.OUTPUT, ActivationFunctions.NONE))

        const hiddenNode = new NodeGene(5, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        const deepHiddenNode = new NodeGene(6, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        nodes.add(hiddenNode);
        nodes.add(deepHiddenNode);

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, 2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, 3, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true, 4, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true, 5, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true, 6, false))
        connections.add(new ConnectionGene(nodes.get(0), hiddenNode, 0.3, true, 7, false));
        connections.add(new ConnectionGene(hiddenNode, nodes.get(3), 0.7, true, 8, false));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9, false));
        connections.add(new ConnectionGene(deepHiddenNode, nodes.get(4), 1, true, 10, false))


        chromosome = new NeatChromosome(connections, nodes, mutationOp, crossoverOp)
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
        const nodes = new List<NodeGene>()
        nodes.add(new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(2, NodeType.BIAS, ActivationFunctions.NONE))

        // Create output Nodes
        nodes.add(new NodeGene(3, NodeType.OUTPUT, ActivationFunctions.SIGMOID))
        nodes.add(new NodeGene(4, NodeType.OUTPUT, ActivationFunctions.SIGMOID))

        const hiddenNode = new NodeGene(5, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        const deepHiddenNode = new NodeGene(6, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        nodes.add(hiddenNode);
        nodes.add(deepHiddenNode);

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, 2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, 3, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true, 4, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true, 5, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true, 6, false))
        connections.add(new ConnectionGene(nodes.get(0), hiddenNode, 0.3, true, 7, false));
        connections.add(new ConnectionGene(hiddenNode, nodes.get(3), 0.7, true, 8, false));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9, false));
        connections.add(new ConnectionGene(deepHiddenNode, hiddenNode, 1, true, 10, true));
        connections.add(new ConnectionGene(deepHiddenNode, nodes.get(4), 1, true, 11, false))


        chromosome = new NeatChromosome(connections, nodes, mutationOp, crossoverOp)
        chromosome.setUpInputs([1, 2])
        chromosome.activateNetwork(false)
        const stabilizeCount = chromosome.stabilizedCounter(30, false);
        for (let i = 0; i < stabilizeCount + 1; i++) {
            chromosome.activateNetwork(false)
        }
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
        const nodes = new List<NodeGene>()
        nodes.add(new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(2, NodeType.BIAS, ActivationFunctions.NONE))

        // Create output Nodes
        nodes.add(new NodeGene(3, NodeType.OUTPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(4, NodeType.OUTPUT, ActivationFunctions.NONE))

        const hiddenNode = new NodeGene(5, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        const deepHiddenNode = new NodeGene(6, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        nodes.add(hiddenNode);
        nodes.add(deepHiddenNode);

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, 2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, 3, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true, 4, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true, 5, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true, 6, false))
        connections.add(new ConnectionGene(nodes.get(0), hiddenNode, 0.3, true, 7, false));
        connections.add(new ConnectionGene(hiddenNode, nodes.get(3), 0.7, true, 8, false));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9, false));
        connections.add(new ConnectionGene(deepHiddenNode, hiddenNode, 1, true, 10, true));
        connections.add(new ConnectionGene(deepHiddenNode, nodes.get(4), 1, true, 11, false))


        chromosome = new NeatChromosome(connections, nodes, mutationOp, crossoverOp)
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
        const nodes = new List<NodeGene>()
        nodes.add(new NodeGene(0, NodeType.INPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(1, NodeType.INPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(2, NodeType.BIAS, ActivationFunctions.NONE))

        // Create output Nodes
        nodes.add(new NodeGene(3, NodeType.OUTPUT, ActivationFunctions.NONE))
        nodes.add(new NodeGene(4, NodeType.OUTPUT, ActivationFunctions.NONE))

        const hiddenNode = new NodeGene(5, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        const deepHiddenNode = new NodeGene(6, NodeType.HIDDEN, ActivationFunctions.SIGMOID)
        nodes.add(hiddenNode);
        nodes.add(deepHiddenNode);

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, 2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, 3, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true, 4, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true, 5, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true, 6, false))
        connections.add(new ConnectionGene(nodes.get(0), hiddenNode, 0.3, true, 7, false));
        connections.add(new ConnectionGene(hiddenNode, nodes.get(3), 0.7, true, 8, false));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9, false));
        connections.add(new ConnectionGene(deepHiddenNode, hiddenNode, 1, true, 10, true));
        connections.add(new ConnectionGene(deepHiddenNode, nodes.get(4), 1, true, 11, false))


        chromosome = new NeatChromosome(connections, nodes, mutationOp, crossoverOp)
        chromosome.generateNetwork();
        const clone = chromosome.cloneWith(chromosome.connections);
        expect(clone.connections.size()).toBe(chromosome.connections.size())
        expect(clone.allNodes.size()).toBe(chromosome.allNodes.size())
        expect(clone.outputNodes.size()).toBe(chromosome.outputNodes.size())
        expect(clone.inputNodes.size()).toBe(chromosome.inputNodes.size())
        expect(clone.timePlayed).toBe(chromosome.timePlayed)
        expect(clone.fitness).toBe(chromosome.fitness)
    })

})
