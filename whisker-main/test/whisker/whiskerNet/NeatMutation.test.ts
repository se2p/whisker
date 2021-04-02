import {NeatMutation} from "../../../src/whisker/whiskerNet/NeatMutation";
import {NetworkChromosome} from "../../../src/whisker/whiskerNet/NetworkChromosome";
import {NetworkChromosomeGeneratorSparse} from "../../../src/whisker/whiskerNet/NetworkGenerators/NetworkChromosomeGeneratorSparse";
import {NeatCrossover} from "../../../src/whisker/whiskerNet/NeatCrossover";
import {ConnectionGene} from "../../../src/whisker/whiskerNet/ConnectionGene";
import {ActivationFunction} from "../../../src/whisker/whiskerNet/NetworkNodes/ActivationFunction";
import {HiddenNode} from "../../../src/whisker/whiskerNet/NetworkNodes/HiddenNode";
import {InputNode} from "../../../src/whisker/whiskerNet/NetworkNodes/InputNode";
import {ClassificationNode} from "../../../src/whisker/whiskerNet/NetworkNodes/ClassificationNode";
import {List} from "../../../src/whisker/utils/List";
import {NodeGene} from "../../../src/whisker/whiskerNet/NetworkNodes/NodeGene";


describe("Test NeatMutation", () => {

    let networkChromosome: NetworkChromosome;
    let networkChromosomeGenerator: NetworkChromosomeGeneratorSparse
    let mutation: NeatMutation;
    let crossOver: NeatCrossover;
    let genInputs: number[][];
    let outputSize: number;

    beforeEach(() => {
        crossOver = new NeatCrossover(0.4);
        mutation = new NeatMutation(0.1, 0.1, 30,
            0.2, 0.1, 0.8, 1.5,
            0.1, 3, 0.1);
        genInputs = [[1, 2, 3, 4, 5, 6]];
        outputSize = 3;
        networkChromosomeGenerator = new NetworkChromosomeGeneratorSparse(mutation, crossOver, genInputs, outputSize, 0.4, false)
        networkChromosome = networkChromosomeGenerator.get();
    })

    test("Test apply mutation operator on a populationChampion", () => {
        networkChromosome.isPopulationChampion = true;
        const oldSize = networkChromosome.connections.size()
        const oldWeight = networkChromosome.connections.get(0).weight
        for (let i = 0; i < 50; i++) {
            networkChromosome.mutate();
        }
        expect(networkChromosome.connections.size()).not.toBe(oldSize)
        expect(networkChromosome.connections.get(0).weight).not.toBe(oldWeight)
    })

    test("Test apply mutation operator on a non-populationChampion", () => {
        const oldSize = networkChromosome.connections.size();
        const oldWeight = networkChromosome.connections.get(0).weight;

        const oldEnableStates = []
        for (const connection of networkChromosome.connections)
            oldEnableStates.push(connection.isEnabled);

        for (let i = 0; i < 50; i++) {
            networkChromosome.mutate();
        }
        const mutatedEnableStates = []
        for (const connection of networkChromosome.connections)
            mutatedEnableStates.push(connection.isEnabled);

        expect(networkChromosome.connections.size()).not.toBe(oldSize);
        expect(networkChromosome.connections.get(0).weight).not.toBe(oldWeight);
        expect(mutatedEnableStates).not.toContainEqual(oldEnableStates)
    })

    test("Test MutateWeights", () => {
        const originalWeights = [];
        for (const connection of networkChromosome.connections)
            originalWeights.push(connection.weight)

        const mutatedWeights = [];
        mutation.mutateWeight(networkChromosome, 1.5, 1)
        for (const connection of networkChromosome.connections)
            mutatedWeights.push(connection.weight)
        originalWeights.sort();
        mutatedWeights.sort()
        expect(mutatedWeights).toHaveLength(originalWeights.length)
    })

    test("Test MutateAddConnection without hidden Layer", () => {
        const originalConnectionsSize = networkChromosome.connections.size();
        networkChromosome.generateNetwork();
        mutation.mutateAddConnection(networkChromosome, 30)
        // Equal if by chance an already established connection is chosen
        expect(originalConnectionsSize).toBeLessThanOrEqual(networkChromosome.connections.size())
    })

    test("Test MutateAddConnection with recurrent connection between output Nodes", () => {
        const allNodes = new List<NodeGene>();
        const iNode = new InputNode(0);
        allNodes.add(iNode);
        const oNode1 = new ClassificationNode(1, ActivationFunction.SIGMOID);
        allNodes.add(oNode1);
        const oNode2 = new ClassificationNode(2, ActivationFunction.SIGMOID);
        allNodes.add(oNode2);


        const connectionList = new List<ConnectionGene>();
        const connection1 = new ConnectionGene(iNode, oNode1, 1, true, 0, false);
        connectionList.add(connection1);
        const connection2 = new ConnectionGene(iNode, oNode2, 2, true, 1, false);
        connectionList.add(connection2)

        mutation = new NeatMutation(0.03, 1, 30,
            0.2, 0.01, 0.8, 1.5,
            0.1, 3, 0.1);
        networkChromosome = new NetworkChromosome(connectionList, allNodes,mutation,crossOver)
        const originalConnectionsSize = networkChromosome.connections.size();

        mutation.mutateAddConnection(networkChromosome, 30);
        // Equal if by chance an already established connection is chosen
        expect(originalConnectionsSize).toBeLessThanOrEqual(networkChromosome.connections.size());
    })


    test("Test MutateAddConnection with hidden Layer", () => {
        const inputNodes = networkChromosome.inputNodes
        const outputNodes = networkChromosome.outputNodes;
        const hiddenLayerNode = new HiddenNode(8, ActivationFunction.SIGMOID);
        networkChromosome.allNodes.add(hiddenLayerNode)
        const hiddenLayerNode2 = new HiddenNode(9, ActivationFunction.SIGMOID);
        networkChromosome.allNodes.add(hiddenLayerNode2)
        const hiddenLayerNode3 = new HiddenNode(10, ActivationFunction.SIGMOID);
        networkChromosome.allNodes.add(hiddenLayerNode3)
        const hiddenLayerNode4 = new HiddenNode(11, ActivationFunction.SIGMOID);
        networkChromosome.allNodes.add(hiddenLayerNode4)
        const deepHiddenLayerNode = new HiddenNode(12, ActivationFunction.SIGMOID);
        networkChromosome.allNodes.add(deepHiddenLayerNode)
        // create some new connections, those will create new nodes in createNetwork()
        // which is called by mutateAddConnection
        networkChromosome.connections.add(new ConnectionGene(inputNodes.get(0), hiddenLayerNode, 1, true, 50, false))
        networkChromosome.connections.add(new ConnectionGene(hiddenLayerNode, deepHiddenLayerNode, 1, true, 51, false))
        networkChromosome.connections.add(new ConnectionGene(deepHiddenLayerNode, outputNodes.get(0), 1, true, 52, false))
        networkChromosome.connections.add(new ConnectionGene(inputNodes.get(1), hiddenLayerNode2, 1, true, 53, false))
        networkChromosome.connections.add(new ConnectionGene(hiddenLayerNode2, outputNodes.get(1), 1, true, 54, false))
        networkChromosome.connections.add(new ConnectionGene(inputNodes.get(1), hiddenLayerNode3, 1, true, 56, false))
        networkChromosome.connections.add(new ConnectionGene(hiddenLayerNode3, outputNodes.get(1), 1, true, 57, false))
        networkChromosome.connections.add(new ConnectionGene(inputNodes.get(2), hiddenLayerNode4, 1, true, 58, false))
        networkChromosome.connections.add(new ConnectionGene(hiddenLayerNode4, outputNodes.get(0), 1, true, 59, false))
        networkChromosome.generateNetwork();
        const originalConnections = networkChromosome.connections.size();
        // Make some rounds of mutations to ensure a mutation eventually happens
        for (let i = 0; i < 50; i++) {
            mutation.mutateAddConnection(networkChromosome, 5)
        }
        networkChromosome.generateNetwork();
        expect(originalConnections).not.toEqual(networkChromosome.connections.size())
    })

    test("Test mutateToggleEnableConnection", () => {
        const recConnection = new ConnectionGene(networkChromosome.outputNodes.get(0),
            networkChromosome.outputNodes.get(1), 1,true,60,true);
        networkChromosome.connections.add(recConnection);
        networkChromosome.generateNetwork();
        const connectionStates = []
        for (const connection of networkChromosome.connections)
            connectionStates.push(connection.isEnabled)

        for (let i = 0; i < 50; i++) {
        mutation.mutateToggleEnableConnection(networkChromosome, 10)
        }
        const mutatedStates = []
        for (const connection of networkChromosome.connections)
            mutatedStates.push(connection.isEnabled)
        expect(connectionStates.length).toBe(mutatedStates.length)
        expect(connectionStates).not.toContainEqual(mutatedStates)
    })

    test("Test mutateConnectionReenable", () => {
        const recConnection = new ConnectionGene(networkChromosome.outputNodes.get(0),
            networkChromosome.outputNodes.get(1), 1,false,60,true);
        networkChromosome.connections.add(recConnection);
        networkChromosome.generateNetwork();
        const connectionStates = []
        for (const connection of networkChromosome.connections)
            connectionStates.push(connection.isEnabled)

        mutation.mutateConnectionReenable(networkChromosome)
        const mutatedStates = []
        for (const connection of networkChromosome.connections)
            mutatedStates.push(connection.isEnabled)
        expect(connectionStates.length).toBe(mutatedStates.length)
        expect(connectionStates).not.toContainEqual(mutatedStates)
    })

    test("Test MutateAddNode", () => {
        const oldNodes = []
        const oldConnections = []
        const oldInnovationNumbers = []
        for (const nodes of networkChromosome.allNodes)
            oldNodes.push(nodes);
        for (const connection of networkChromosome.connections) {
            oldConnections.push(connection);
            oldInnovationNumbers.push(connection.innovation)
        }

        mutation.mutateAddNode(networkChromosome);
        networkChromosome.generateNetwork();
        const mutantNodes = []
        const mutantConnections = []
        const mutantInnovationNumbers = []
        for (const nodes of networkChromosome.allNodes)
            mutantNodes.push(nodes);
        for (const connection of networkChromosome.connections) {
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

    test("Test MutateAddNode with only non-valid connections", () => {
        const oldNodes = []
        const oldConnections = []
        const oldInnovationNumbers = []
        for (const nodes of networkChromosome.allNodes)
            oldNodes.push(nodes);
        for (const connection of networkChromosome.connections) {
            connection.isEnabled = false;
            oldConnections.push(connection);
            oldInnovationNumbers.push(connection.innovation)
        }

        mutation.mutateAddNode(networkChromosome);
        networkChromosome.generateNetwork();
        const mutantNodes = []
        const mutantConnections = []
        const mutantInnovationNumbers = []
        for (const nodes of networkChromosome.allNodes)
            mutantNodes.push(nodes);
        for (const connection of networkChromosome.connections) {
            mutantConnections.push(connection);
            mutantInnovationNumbers.push(connection.innovation)
        }

        // One new Hidden Layer
        expect(oldNodes.length).toBe(mutantNodes.length)
        // Two new Connections
        expect(oldConnections.length).toBe(mutantConnections.length)
        // Check Innovation Numbers
        expect(mutantInnovationNumbers[mutantInnovationNumbers.length - 1]).toBe(
            oldInnovationNumbers[oldInnovationNumbers.length - 1])
    })

})
