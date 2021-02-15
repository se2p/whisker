import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatChromosome} from "../../../src/whisker/NEAT/NeatChromosome";
import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";
import {ConnectionGene} from "../../../src/whisker/NEAT/ConnectionGene";
import {NodeGene} from "../../../src/whisker/NEAT/NodeGene";
import {NodeType} from "../../../src/whisker/NEAT/NodeType";


describe("NeatMutation", () => {

    let neatChromosome: NeatChromosome;
    let neatChromosomeGenerator: NeatChromosomeGenerator
    let neatMutation: NeatMutation;
    let neatCrossover: NeatCrossover;

    beforeEach(() => {
        neatMutation = new NeatMutation();
        neatCrossover = new NeatCrossover();
        neatChromosomeGenerator = new NeatChromosomeGenerator(neatMutation, neatCrossover)
        neatChromosome = neatChromosomeGenerator.get();
        ConnectionGene.resetInnovationCounter()
    })

    test("MutateWeights", () => {
        const originalWeights = [];
        for (const connection of neatChromosome.connections)
            originalWeights.push(connection.weight)

        const mutatedWeights = [];
        neatMutation.mutateWeight(neatChromosome)
        for (const connection of neatChromosome.connections)
            mutatedWeights.push(connection.weight)
        originalWeights.sort();
        mutatedWeights.sort()
        expect(mutatedWeights).toHaveLength(originalWeights.length)
    })

    test("MutateAddConnection without hidden Layer", () => {
        const originalConnectionsSize = neatChromosome.connections.size();
        neatMutation.mutateAddConnection(neatChromosome)
        // No Changes should happen since the generated network without hidden Layers is already fully connected
        expect(originalConnectionsSize).toEqual(neatChromosome.connections.size())
    })

    test("MutateAddConnection with hidden Layer", () => {
        const inputNodes = neatChromosome.nodes.get(0)
        const hiddenLayerNode = new NodeGene(8, NodeType.HIDDEN, 0);
        const hiddenLayerNode2 = new NodeGene(9, NodeType.HIDDEN, 0);
        // create some new connections, those will create new nodes in createNetwork()
        // which is called by mutateAddConnection
        neatChromosome.connections.add(new ConnectionGene(inputNodes.get(0), hiddenLayerNode, 1,
            true, ConnectionGene.getNextInnovationNumber()))
        neatChromosome.connections.add(new ConnectionGene(hiddenLayerNode, hiddenLayerNode2, 1,
            true, ConnectionGene.getNextInnovationNumber()))
        neatChromosome.connections.add(new ConnectionGene(inputNodes.get(2),
            new NodeGene(10, NodeType.HIDDEN, 0), 1, true, ConnectionGene.getNextInnovationNumber()))
        neatChromosome.connections.add(new ConnectionGene(inputNodes.get(2),
            new NodeGene(11, NodeType.HIDDEN, 0), 1, true, ConnectionGene.getNextInnovationNumber()))
        const originalConnections = neatChromosome.connections.size();
        // Make some rounds of mutations to ensure a mutation eventually happens
        for (let i = 0; i < 20; i++) {
            neatMutation.mutateAddConnection(neatChromosome)
        }
        expect(originalConnections).not.toEqual(neatChromosome.connections.size())
    })

    test("MutateConnectionState", () => {
        const connectionStates = []
        for (const connection of neatChromosome.connections)
            connectionStates.push(connection.enabled)

        neatMutation.mutateConnectionState(neatChromosome)
        const mutatedStates = []
        for (const connection of neatChromosome.connections)
            mutatedStates.push(connection.enabled)
        expect(connectionStates.length).toBe(mutatedStates.length)
        expect(connectionStates).not.toContainEqual(mutatedStates)

    })

    test("MutateAddNode", () => {
        const oldNodes = []
        const oldConnections = []
        const oldInnovationNumbers = []
        for (const nodes of neatChromosome.nodes)
            oldNodes.push(nodes);
        for (const connection of neatChromosome.connections) {
            oldConnections.push(connection);
            oldInnovationNumbers.push(connection.innovation)
        }

        neatMutation.mutateAddNode(neatChromosome);
        neatChromosome.generateNetwork();
        const mutantNodes = []
        const mutantConnections = []
        const mutantInnovationNumbers = []
        for (const nodes of neatChromosome.nodes)
            mutantNodes.push(nodes);
        for (const connection of neatChromosome.connections) {
            mutantConnections.push(connection);
            mutantInnovationNumbers.push(connection.innovation)
        }

        // One new Hidden Layer
        expect(oldNodes.length + 1).toBe(mutantNodes.length)
        // Two new Connections
        expect(oldConnections.length + 2).toBe(mutantConnections.length)
        // Check Innovation Numbers
        expect(mutantInnovationNumbers[mutantInnovationNumbers.length - 1]).toBeGreaterThan(
            oldInnovationNumbers[oldInnovationNumbers.length - 1])
    })
})
