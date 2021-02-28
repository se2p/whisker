import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatChromosome} from "../../../src/whisker/NEAT/NeatChromosome";
import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";
import {ConnectionGene} from "../../../src/whisker/NEAT/ConnectionGene";
import {NodeGene} from "../../../src/whisker/NEAT/NodeGene";
import {NodeType} from "../../../src/whisker/NEAT/NodeType";
import {ActivationFunctions} from "../../../src/whisker/NEAT/ActivationFunctions";
import {NeuroevolutionProperties} from "../../../src/whisker/NEAT/NeuroevolutionProperties";


describe("NeatMutation", () => {

    let neatChromosome: NeatChromosome;
    let neatChromosomeGenerator: NeatChromosomeGenerator
    let mutation: NeatMutation;
    let crossOver: NeatCrossover;
    let genInputs: number[][];
    let outputSize: number;
    let properties: NeuroevolutionProperties<NeatChromosome>

    beforeEach(() => {
        crossOver = new NeatCrossover(0.4);
        mutation = new NeatMutation(0.03, 0.1, 30,
            0.2, 0.01, 0.8, 1.5,
            0.1, 3, 0.1);
        genInputs = [[1,2,3,4,5,6]];
        outputSize = 3;
        properties = new NeuroevolutionProperties<NeatChromosome>(50);
        neatChromosomeGenerator = new NeatChromosomeGenerator(mutation, crossOver, genInputs, outputSize, 0.4, false)
        neatChromosome = neatChromosomeGenerator.get();
    })

    test("MutateWeights", () => {
        const originalWeights = [];
        for (const connection of neatChromosome.connections)
            originalWeights.push(connection.weight)

        const mutatedWeights = [];
        mutation.mutateWeight(neatChromosome, 1.5, 1)
        for (const connection of neatChromosome.connections)
            mutatedWeights.push(connection.weight)
        originalWeights.sort();
        mutatedWeights.sort()
        expect(mutatedWeights).toHaveLength(originalWeights.length)
    })

    test("MutateAddConnection without hidden Layer", () => {
        const originalConnectionsSize = neatChromosome.connections.size();
        neatChromosome.generateNetwork();
        mutation.mutateAddConnection(neatChromosome, 30)
        // Equal if by chance an already established connection is chosen
        expect(originalConnectionsSize).toBeLessThanOrEqual(neatChromosome.connections.size())
    })


    test("MutateAddConnection with hidden Layer", () => {
        const inputNodes = neatChromosome.inputNodes
        const outputNodes = neatChromosome.outputNodes;
        const hiddenLayerNode = new NodeGene(8, NodeType.HIDDEN, ActivationFunctions.SIGMOID);
        const hiddenLayerNode2 = new NodeGene(9, NodeType.HIDDEN, ActivationFunctions.SIGMOID);
        const hiddenLayerNode3 = new NodeGene(10, NodeType.HIDDEN, ActivationFunctions.SIGMOID);
        const hiddenLayerNode4 = new NodeGene(11, NodeType.HIDDEN, ActivationFunctions.SIGMOID);
        const deepHiddenLayerNode = new NodeGene(12, NodeType.HIDDEN, ActivationFunctions.SIGMOID);
        // create some new connections, those will create new nodes in createNetwork()
        // which is called by mutateAddConnection
        neatChromosome.connections.add(new ConnectionGene(inputNodes.get(0), hiddenLayerNode, 1, true, 50, false))
        neatChromosome.connections.add(new ConnectionGene(hiddenLayerNode, deepHiddenLayerNode, 1, true, 51, false))
        neatChromosome.connections.add(new ConnectionGene(deepHiddenLayerNode, outputNodes.get(0), 1, true, 52, false))
        neatChromosome.connections.add(new ConnectionGene(inputNodes.get(1), hiddenLayerNode2, 1, true, 53, false))
        neatChromosome.connections.add(new ConnectionGene(hiddenLayerNode2, outputNodes.get(1), 1, true, 54, false))
        neatChromosome.connections.add(new ConnectionGene(inputNodes.get(1), hiddenLayerNode3, 1, true, 56, false))
        neatChromosome.connections.add(new ConnectionGene(hiddenLayerNode3, outputNodes.get(1), 1, true, 57, false))
        neatChromosome.connections.add(new ConnectionGene(inputNodes.get(2), hiddenLayerNode4, 1, true, 58, false))
        neatChromosome.connections.add(new ConnectionGene(hiddenLayerNode4, outputNodes.get(0), 1, true, 59, false))
        neatChromosome.generateNetwork();
        const originalConnections = neatChromosome.connections.size();
        // Make some rounds of mutations to ensure a mutation eventually happens
        for (let i = 0; i < 20; i++) {
            mutation.mutateAddConnection(neatChromosome, 50)
        }
        neatChromosome.generateNetwork();
        expect(originalConnections).not.toEqual(neatChromosome.connections.size())
    })

    test("MutateConnectionState", () => {
        const connectionStates = []
        for (const connection of neatChromosome.connections)
            connectionStates.push(connection.enabled)

        mutation.mutateToggleEnableConnection(neatChromosome,3)
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
        for (const nodes of neatChromosome.allNodes)
            oldNodes.push(nodes);
        for (const connection of neatChromosome.connections) {
            oldConnections.push(connection);
            oldInnovationNumbers.push(connection.innovation)
        }

        mutation.mutateAddNode(neatChromosome);
        neatChromosome.generateNetwork();
        const mutantNodes = []
        const mutantConnections = []
        const mutantInnovationNumbers = []
        for (const nodes of neatChromosome.allNodes)
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
