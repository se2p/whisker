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
    })

    test("MutateWeights", () => {
        const originalWeights = [];
        for (const connection of neatChromosome.getConnections())
            originalWeights.push(connection.weight)

        const mutatedWeights = [];
        neatMutation.mutateWeight(neatChromosome)
        for (const connection of neatChromosome.getConnections())
            mutatedWeights.push(connection.weight)
        originalWeights.sort();
        mutatedWeights.sort()
        expect(mutatedWeights).toHaveLength(originalWeights.length)
    })

    test("MutateAddConnection without hidden Layer", () => {
        const originalConnectionsSize = neatChromosome.getConnections().size();
        neatMutation.mutateAddConnection(neatChromosome)
        // No Changes should happen since the generated network without hidden Layers is already fully connected
        expect(originalConnectionsSize).toEqual(neatChromosome.getConnections().size())
    })

    test("MutateAddConnection with hidden Layer", () => {
        const inputNodes = neatChromosome.nodes.get(0)
        const hiddenLayerNode = new NodeGene(NodeType.HIDDEN, 0);
        const hiddenLayerNode2 = new NodeGene(NodeType.HIDDEN, 0);
        // create some new connections, those will create new nodes in createNetwork()
        // which is called by mutateAddConnection
        neatChromosome.getConnections().add(new ConnectionGene(inputNodes.get(0), hiddenLayerNode, 1, true))
        neatChromosome.getConnections().add(new ConnectionGene(hiddenLayerNode, hiddenLayerNode2, 1, true))
        neatChromosome.getConnections().add(new ConnectionGene(inputNodes.get(2), new NodeGene(NodeType.HIDDEN, 0), 1, true))
        neatChromosome.getConnections().add(new ConnectionGene(inputNodes.get(2), new NodeGene(NodeType.HIDDEN, 0), 1, true))
        const originalConnections = neatChromosome.getConnections().size();

        // Make some rounds of mutations to ensure a mutation eventually happens
        for (let i = 0; i < 20; i++) {
            neatMutation.mutateAddConnection(neatChromosome)
        }
        expect(originalConnections).not.toEqual(neatChromosome.getConnections().size())
    })

    test("MutateConnectionState", () => {
        const connectionStates = []
        for (const connection of neatChromosome.getConnections())
            connectionStates.push(connection.enabled)

        neatMutation.mutateConnectionState(neatChromosome)
        const mutatedStates = []
        for (const connection of neatChromosome.getConnections())
            mutatedStates.push(connection.enabled)
        expect(connectionStates.length).toBe(mutatedStates.length)
        expect(connectionStates).not.toContainEqual(mutatedStates)

    })

    test("MutateAddNode", () => {
        const oldNodes = []
        const oldConnections = []
        for (const nodes of neatChromosome.getNodes())
            oldNodes.push(nodes);
        for (const connection of neatChromosome.getConnections())
            oldConnections.push(connection);

        neatMutation.mutateAddNode(neatChromosome);
        neatChromosome.generateNetwork();
        const mutantNodes = []
        const mutantConnections = []
        for (const nodes of neatChromosome.getNodes())
            mutantNodes.push(nodes);
        for (const connection of neatChromosome.getConnections())
            mutantConnections.push(connection);

        // One new Hidden Layer
        expect(oldNodes.length + 1).toBe(mutantNodes.length)
        // Two new Connections
        expect(oldConnections.length + 2).toBe(mutantConnections.length)
    })
})
