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
import {NeatConfig} from "../../../src/whisker/NEAT/NeatConfig";

describe('NeatChromosome', () => {

    let neatChromosome: NeatChromosome;
    let generator: NeatChromosomeGenerator;
    let mutationOp: Mutation<NeatChromosome>;
    let crossoverOp: Crossover<NeatChromosome>;


    beforeEach(() => {
        mutationOp = new NeatMutation();
        crossoverOp = new NeatCrossover();
        generator = new NeatChromosomeGenerator(mutationOp, crossoverOp);
        neatChromosome = generator.get();
    })

    test('Create Network without hidden layer', () => {
        neatChromosome.generateNetwork()
        // add +1 to the input Nodes due to the Bias Node
        const nodes = neatChromosome.nodes.values()
        let nodeCounter = 0;
        for (const nodeList of nodes)
            nodeCounter += nodeList.size();
        expect(nodeCounter).toBe(NeatConfig.INPUT_NEURONS + 1 + NeatConfig.OUTPUT_NEURONS)
        expect(neatChromosome.connections.size()).toBe((NeatConfig.INPUT_NEURONS + 1) * NeatConfig.OUTPUT_NEURONS)
        console.log(neatChromosome.toString())
    })

    test('Create Network with hidden layer', () => {
        const inputNode = neatChromosome.nodes.get(0).get(0)
        const outputNode = neatChromosome.nodes.get(10).get(0)
        const hiddenNode = new NodeGene(8, NodeType.HIDDEN, 0)
        const deepHiddenNode = new NodeGene(9, NodeType.HIDDEN, 0)
        neatChromosome.generateNetwork()
        neatChromosome.connections.add(new ConnectionGene(inputNode, hiddenNode, 0.5, true, ConnectionGene.getNextInnovationNumber()))
        neatChromosome.connections.add(new ConnectionGene(hiddenNode, outputNode, 0, true, ConnectionGene.getNextInnovationNumber()))
        neatChromosome.connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 1, true, ConnectionGene.getNextInnovationNumber()))
        neatChromosome.connections.add(new ConnectionGene(deepHiddenNode, outputNode, 0.2, true, ConnectionGene.getNextInnovationNumber()))
        neatChromosome.generateNetwork()
        ConnectionGene.resetInnovationCounter();
        const nodes = neatChromosome.nodes.values()
        let nodeCounter = 0;
        for (const nodeList of nodes)
            nodeCounter += nodeList.size();
        // add +1 to the input Nodes due to the Bias Node
        expect(nodeCounter).toBe(NeatConfig.INPUT_NEURONS + 1 + NeatConfig.OUTPUT_NEURONS + 2)
        expect(neatChromosome.connections.size()).toBe((NeatConfig.INPUT_NEURONS + 1) * NeatConfig.OUTPUT_NEURONS + 4)
        expect(neatChromosome.nodes.size).toBe(4)
    })

    test('Network activation without hidden layer', () => {
        // Create Nodes
        const nodes = new Map<number, NodeGene>()
        NodeGene._idCounter = 0
        nodes.set(0, new NodeGene(0, NodeType.INPUT, 0))
        nodes.set(1, new NodeGene(1, NodeType.INPUT, 0))
        nodes.set(2, new NodeGene(2, NodeType.BIAS, 1))
        nodes.set(3, new NodeGene(3, NodeType.OUTPUT, 0))
        nodes.set(4, new NodeGene(4, NodeType.OUTPUT, 0))

        // Create Connections
        const connections = new List<ConnectionGene>();
        ConnectionGene.resetInnovationCounter();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true, ConnectionGene.getNextInnovationNumber()))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, ConnectionGene.getNextInnovationNumber()))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, ConnectionGene.getNextInnovationNumber()))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true, ConnectionGene.getNextInnovationNumber()))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true, ConnectionGene.getNextInnovationNumber()))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true, ConnectionGene.getNextInnovationNumber()))
        ConnectionGene.resetInnovationCounter();

        neatChromosome = new NeatChromosome(connections, crossoverOp, mutationOp)
        neatChromosome.inputSize = 2;
        neatChromosome.outputSize = 2;
        const brainValue = neatChromosome.activateNetwork([0.5, 0.4])
        expect(Math.round(brainValue[0] * 100) / 100).toBe(0.81)
        expect(Math.round(brainValue[1] * 100) / 100).toBe(1)
    })

    test('Network activation with hidden layer', () => {
        // Create Nodes
        const nodes = new Map<number, NodeGene>()
        NodeGene._idCounter = 0
        nodes.set(0, new NodeGene(0, NodeType.INPUT, 0))
        nodes.set(1, new NodeGene(1, NodeType.INPUT, 0))
        nodes.set(2, new NodeGene(2, NodeType.BIAS, 1))
        nodes.set(3, new NodeGene(3, NodeType.OUTPUT, 0))
        nodes.set(4, new NodeGene(4, NodeType.OUTPUT, 0))
        nodes.set(5, new NodeGene(5, NodeType.HIDDEN, 0))

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true, ConnectionGene.getNextInnovationNumber()))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, ConnectionGene.getNextInnovationNumber()))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, ConnectionGene.getNextInnovationNumber()))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true, ConnectionGene.getNextInnovationNumber()))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true, ConnectionGene.getNextInnovationNumber()))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true, ConnectionGene.getNextInnovationNumber()))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(5), 0.5, true, ConnectionGene.getNextInnovationNumber()))
        connections.add(new ConnectionGene(nodes.get(5), nodes.get(3), 1, true, ConnectionGene.getNextInnovationNumber()))
        ConnectionGene.resetInnovationCounter();


        neatChromosome = new NeatChromosome(connections, crossoverOp, mutationOp)
        neatChromosome.inputSize = 2;
        neatChromosome.outputSize = 2;
        const brainValue = neatChromosome.activateNetwork([0.1, 0.2])
        expect(Math.round(brainValue[0] * 100) / 100).toBe(0.98)
        expect(Math.round(brainValue[1] * 100) / 100).toBe(0.99)
    })
})
