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

    let neatChromosome: NeatChromosome
    let generator: NeatChromosomeGenerator
    let mutationOp: Mutation<NeatChromosome>
    let crossoverOp: Crossover<NeatChromosome>
    const numInputs = 2
    const numOutputs = 1


    beforeEach(() => {
        mutationOp = new NeatMutation();
        crossoverOp = new NeatCrossover();
        generator = new NeatChromosomeGenerator(mutationOp, crossoverOp);
        generator.inputSize = numInputs;
        generator.outputSize = numOutputs;
        neatChromosome = generator.get();
        neatChromosome.inputSize = numInputs
        neatChromosome.outputSize = numOutputs;
    })

    test('Create Network without hidden layer', () => {
        neatChromosome.generateNetwork()
        // add +1 to the input Nodes due to the Bias Node
        const nodes = neatChromosome.getNodes().values()
        let nodeCounter = 0;
        for(const nodeList of nodes)
            nodeCounter += nodeList.size();
        expect(nodeCounter).toBe(generator.inputSize + 1 + generator.outputSize)
        expect(neatChromosome.getConnections().size()).toBe((generator.inputSize + 1) * generator.outputSize)
    })

    test('Create Network with hidden layer', () => {
        const hiddenNode = new NodeGene(NodeType.HIDDEN, 0)
        neatChromosome.generateNetwork()
        neatChromosome.getConnections().add(new ConnectionGene(neatChromosome.getNodes().get(0).get(0), hiddenNode, 0.5, true))
        neatChromosome.getConnections().add(new ConnectionGene(hiddenNode, neatChromosome.getNodes().get(10).get(0), 0, true))
        neatChromosome.generateNetwork()
        const nodes = neatChromosome.getNodes().values()
        let nodeCounter = 0;
        for(const nodeList of nodes)
            nodeCounter += nodeList.size();
        // add +1 to the input Nodes due to the Bias Node
        expect(nodeCounter).toBe(generator.inputSize + 1 + generator.outputSize + 1)
        expect(neatChromosome.getConnections().size()).toBe((generator.inputSize + 1) * generator.outputSize + 2)
        console.log(neatChromosome.toString())
    })

    test('Network activation without hidden layer', () => {
        // Create Nodes
        const nodes = new Map<number, NodeGene>()
        NodeGene._idCounter = 0
        nodes.set(0, new NodeGene(NodeType.INPUT, 0))
        nodes.set(1, new NodeGene(NodeType.INPUT, 0))
        nodes.set(2, new NodeGene(NodeType.BIAS, 1))
        nodes.set(3, new NodeGene(NodeType.OUTPUT, 0))
        nodes.set(4, new NodeGene(NodeType.OUTPUT, 0))

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true))

        neatChromosome = new NeatChromosome(connections, crossoverOp, mutationOp)
        neatChromosome.inputSize = 2;
        neatChromosome.outputSize = 2;
        const brainValue = neatChromosome.activateNetwork([0.5, 0.4])
        expect(Math.round(brainValue[0] * 100) / 100).toBe(0.57)
        expect(Math.round(brainValue[1] * 100) / 100).toBe(0.75)
    })

    test('Network activation with hidden layer', () => {
        // Create Nodes
        const nodes = new Map<number, NodeGene>()
        NodeGene._idCounter = 0
        nodes.set(0, new NodeGene(NodeType.INPUT, 0))
        nodes.set(1, new NodeGene(NodeType.INPUT, 0))
        nodes.set(2, new NodeGene(NodeType.BIAS, 1))
        nodes.set(3, new NodeGene(NodeType.OUTPUT, 0))
        nodes.set(4, new NodeGene(NodeType.OUTPUT, 0))
        nodes.set(5, new NodeGene(NodeType.HIDDEN, 0))

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(5), 0.5, true))
        connections.add(new ConnectionGene(nodes.get(5), nodes.get(3), 1, true))


        neatChromosome = new NeatChromosome(connections, crossoverOp, mutationOp)
        neatChromosome.inputSize = 2;
        neatChromosome.outputSize = 2;
        const brainValue = neatChromosome.activateNetwork([0.5, 0.4])
        expect(Math.round(brainValue[0] * 100) / 100).toBe(0.70)
        expect(Math.round(brainValue[1] * 100) / 100).toBe(0.75)
    })
})
