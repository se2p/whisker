import {NeatMutation} from "../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/whiskerNet/Operators/NeatCrossover";
import {ConnectionGene} from "../../../src/whisker/whiskerNet/NetworkComponents/ConnectionGene";
import {ActivationFunction} from "../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {HiddenNode} from "../../../src/whisker/whiskerNet/NetworkComponents/HiddenNode";
import {InputNode} from "../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {ClassificationNode} from "../../../src/whisker/whiskerNet/NetworkComponents/ClassificationNode";
import {NodeGene} from "../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {WaitEvent} from "../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../src/whisker/testcase/events/MouseMoveEvent";
import {ClickStageEvent} from "../../../src/whisker/testcase/events/ClickStageEvent";
import {KeyPressEvent} from "../../../src/whisker/testcase/events/KeyPressEvent";
import {NeatChromosomeGeneratorSparse} from "../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGeneratorSparse";
import {NeatChromosome} from "../../../src/whisker/whiskerNet/Networks/NeatChromosome";


describe("Test NeatMutation", () => {

    let networkChromosome: NeatChromosome;
    let mutation: NeatMutation;
    let crossoverOp: NeatCrossover;
    let mutationConfig: Record<string, (string | number)>

    beforeEach(() => {
        const crossoverConfig = {
            "operator": "neatCrossover",
            "crossoverWithoutMutation": 0.2,
            "interspeciesRate": 0.001,
            "weightAverageRate": 0.4
        };
        crossoverOp = new NeatCrossover(crossoverConfig);

        mutationConfig = {
            "operator": "neatMutation",
            "mutationWithoutCrossover": 0.25,
            "mutationAddConnection": 0.2,
            "recurrentConnection": 0.1,
            "addConnectionTries": 20,
            "populationChampionNumberOffspring": 10,
            "populationChampionNumberClones": 5,
            "populationChampionConnectionMutation": 0.3,
            "mutationAddNode": 0.1,
            "mutateWeights": 0.6,
            "perturbationPower": 2.5,
            "mutateToggleEnableConnection": 0.1,
            "toggleEnableConnectionTimes": 3,
            "mutateEnableConnection": 0.03
        };
        mutation = new NeatMutation(mutationConfig);
        const genInputs = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        sprite1.set("Costume", 3);
        sprite1.set("DistanceToSprite2-X", 4);
        sprite1.set("DistanceToSprite2-y", 5);
        genInputs.set("Sprite1", sprite1);
        const sprite2 = new Map<string, number>();
        sprite2.set("X-Position", 6);
        sprite2.set("Y-Position", 7);
        sprite2.set("Costume", 8);
        sprite2.set("DistanceToSprite2-X", 9);
        sprite2.set("DistanceToSprite2-y", 10);
        genInputs.set("Sprite2", sprite2);
        const events = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
        const networkChromosomeGenerator = new NeatChromosomeGeneratorSparse(mutationConfig, crossoverConfig, genInputs, events, 0);
        networkChromosome = networkChromosomeGenerator.get();
    })

    test("Test apply mutation operator on a populationChampion", () => {
        networkChromosome.isPopulationChampion = true;
        let mutant = networkChromosome.mutate();
        for (let i = 0; i < 50; i++) {
            mutant = mutant.mutate();
        }
        expect(mutant.connections.length).not.toBe(networkChromosome.connections.length);
        expect(mutant.connections[0].weight).not.toBe(networkChromosome.connections[0].weight);
    })

    test("Test apply mutation operator on a non-populationChampion", () => {
        let mutant = networkChromosome.mutate();
        for (let i = 0; i < 50; i++) {
            mutant = mutant.mutate();
        }
        const mutatedEnableStates = [];
        for (const connection of networkChromosome.connections) {
            mutatedEnableStates.push(connection.isEnabled);
        }

        expect(networkChromosome.connections.length).not.toBe(mutant.connections.length);
        expect(networkChromosome.connections[0].weight).not.toBe(mutant.connections[0].weight);
    })

    test("Test MutateWeights", () => {
        const originalWeights = [];
        for (const connection of networkChromosome.connections)
            originalWeights.push(connection.weight);

        const mutatedWeights = [];
        mutation.mutateWeight(networkChromosome, 1);
        mutation.mutateWeight(networkChromosome, 1)
        for (const connection of networkChromosome.connections) {
            mutatedWeights.push(connection.weight);
        }
        originalWeights.sort();
        mutatedWeights.sort();
        const originalSum = originalWeights.reduce((a, b) => a + b, 0);
        const mutatedSum = mutatedWeights.reduce((a, b) => a +b , 0)
        expect(originalSum).not.toEqual(mutatedSum);
        expect(mutatedWeights).toHaveLength(originalWeights.length);
    })

    test("Test MutateAddConnection without hidden Layer", () => {
        const originalConnectionsSize = networkChromosome.connections.length;
        networkChromosome.generateNetwork();
        mutation.mutateAddConnection(networkChromosome, 30);
        // Equal if by chance an already established connection is chosen
        expect(originalConnectionsSize).toBeLessThanOrEqual(networkChromosome.connections.length);
    })

    test("Test MutateAddConnection with recurrent connection between output Nodes", () => {
        const allNodes: NodeGene[] = [];
        const iNode = new InputNode("Sprite1", "X-Position");
        iNode.uID = 0;
        allNodes.push(iNode);
        const oNode1 = new ClassificationNode(new WaitEvent(), ActivationFunction.SIGMOID);
        oNode1.uID = 1;
        allNodes.push(oNode1);
        const oNode2 = new ClassificationNode(new ClickStageEvent(), ActivationFunction.SIGMOID);
        oNode2.uID = 2;
        allNodes.push(oNode2);


        const connectionList: ConnectionGene[] = [];
        const connection1 = new ConnectionGene(iNode, oNode1, 1, true, 0, false);
        connectionList.push(connection1);
        const connection2 = new ConnectionGene(iNode, oNode2, 2, true, 1, false);
        connectionList.push(connection2);
        mutationConfig.recurrentConnection = 1;
        mutation = new NeatMutation(mutationConfig);
        networkChromosome = new NeatChromosome(allNodes, connectionList, mutation, crossoverOp);
        const originalConnectionsSize = networkChromosome.connections.length;

        mutation.mutateAddConnection(networkChromosome, 30);
        // Equal if by chance an already established connection is chosen
        expect(originalConnectionsSize).toBeLessThanOrEqual(networkChromosome.connections.length);
    })


    test("Test MutateAddConnection with hidden Layer", () => {
        const inputNodes = networkChromosome.inputNodes;
        const outputNodes = networkChromosome.outputNodes;
        const hiddenLayerNode = new HiddenNode(ActivationFunction.SIGMOID);
        hiddenLayerNode.uID = 8;
        networkChromosome.allNodes.push(hiddenLayerNode);
        const hiddenLayerNode2 = new HiddenNode(ActivationFunction.SIGMOID);
        hiddenLayerNode2.uID = 9;
        networkChromosome.allNodes.push(hiddenLayerNode2);
        const hiddenLayerNode3 = new HiddenNode(ActivationFunction.SIGMOID);
        hiddenLayerNode3.uID = 10;
        networkChromosome.allNodes.push(hiddenLayerNode3);
        const hiddenLayerNode4 = new HiddenNode(ActivationFunction.SIGMOID);
        hiddenLayerNode4.uID = 11;
        networkChromosome.allNodes.push(hiddenLayerNode4);
        const deepHiddenLayerNode = new HiddenNode(ActivationFunction.SIGMOID);
        deepHiddenLayerNode.uID = 12;
        networkChromosome.allNodes.push(deepHiddenLayerNode);
        // create some new connections, those will create new nodes in createNetwork()
        // which is called by mutateAddConnection
        networkChromosome.connections.push(new ConnectionGene(inputNodes.get("Sprite1").get("X-Position"), hiddenLayerNode, 1, true, 50, false));
        networkChromosome.connections.push(new ConnectionGene(hiddenLayerNode, deepHiddenLayerNode, 1, true, 51, false));
        networkChromosome.connections.push(new ConnectionGene(deepHiddenLayerNode, outputNodes[0], 1, true, 52, false));
        networkChromosome.connections.push(new ConnectionGene(inputNodes.get("Sprite1").get("Y-Position"), hiddenLayerNode2, 1, true, 53, false));
        networkChromosome.connections.push(new ConnectionGene(hiddenLayerNode2, outputNodes[1], 1, true, 54, false));
        networkChromosome.connections.push(new ConnectionGene(inputNodes.get("Sprite1").get("Costume"), hiddenLayerNode3, 1, true, 56, false));
        networkChromosome.connections.push(new ConnectionGene(hiddenLayerNode3, outputNodes[1], 1, true, 57, false));
        networkChromosome.connections.push(new ConnectionGene(inputNodes.get("Sprite1").get("Costume"), hiddenLayerNode4, 1, true, 58, false));
        networkChromosome.connections.push(new ConnectionGene(hiddenLayerNode4, outputNodes[0], 1, true, 59, false));
        networkChromosome.generateNetwork();
        const originalConnections = networkChromosome.connections.length;
        // Make some rounds of mutations to ensure a mutation eventually happens
        for (let i = 0; i < 50; i++) {
            mutation.mutateAddConnection(networkChromosome, 5);
        }
        networkChromosome.generateNetwork();
        expect(originalConnections).not.toEqual(networkChromosome.connections.length);
    })

    test("Test mutateToggleEnableConnection", () => {
        const recConnection = new ConnectionGene(networkChromosome.outputNodes[0],
            networkChromosome.outputNodes[1], 1, true, 60, true);
        networkChromosome.connections.push(recConnection);
        networkChromosome.generateNetwork();
        const connectionStates = [];
        for (const connection of networkChromosome.connections)
            connectionStates.push(connection.isEnabled);

        for (let i = 0; i < 50; i++) {
            mutation.mutateToggleEnableConnection(networkChromosome, 10);
        }
        const mutatedStates = [];
        for (const connection of networkChromosome.connections)
            mutatedStates.push(connection.isEnabled);
        expect(connectionStates.length).toBe(mutatedStates.length);
        expect(connectionStates).not.toContainEqual(mutatedStates);
    })

    test("Test mutateConnectionReenable", () => {
        const recConnection = new ConnectionGene(networkChromosome.outputNodes[0],
            networkChromosome.outputNodes[1], 1, false, 60, true);
        networkChromosome.connections.push(recConnection);
        networkChromosome.generateNetwork();
        const connectionStates = [];
        for (const connection of networkChromosome.connections)
            connectionStates.push(connection.isEnabled);

        mutation.mutateConnectionReenable(networkChromosome)
        const mutatedStates = [];
        for (const connection of networkChromosome.connections)
            mutatedStates.push(connection.isEnabled);
        expect(connectionStates.length).toBe(mutatedStates.length);
        expect(connectionStates).not.toContainEqual(mutatedStates);
    })

    test("Test MutateAddNode", () => {
        const oldNodes = [];
        const oldConnections = [];
        const oldInnovationNumbers = [];
        for (const nodes of networkChromosome.allNodes)
            oldNodes.push(nodes);
        for (const connection of networkChromosome.connections) {
            oldConnections.push(connection);
            oldInnovationNumbers.push(connection.innovation);
        }

        mutation.mutateAddNode(networkChromosome);
        networkChromosome.generateNetwork();
        const mutantNodes = [];
        const mutantConnections = [];
        const mutantInnovationNumbers = [];
        for (const nodes of networkChromosome.allNodes)
            mutantNodes.push(nodes);
        for (const connection of networkChromosome.connections) {
            mutantConnections.push(connection);
            mutantInnovationNumbers.push(connection.innovation);
        }

        // One new Hidden Layer
        expect(oldNodes.length + 1).toBe(mutantNodes.length);
        // Two new Connections
        expect(oldConnections.length + 2).toBe(mutantConnections.length);
        // Check Innovation Numbers
        expect(mutantInnovationNumbers[mutantInnovationNumbers.length - 1]).toBeGreaterThan(
            oldInnovationNumbers[oldInnovationNumbers.length - 1]);
    })

    test("Test MutateAddNode with only non-valid connections", () => {
        const oldNodes = [];
        const oldConnections = [];
        const oldInnovationNumbers = [];
        for (const nodes of networkChromosome.allNodes)
            oldNodes.push(nodes);
        for (const connection of networkChromosome.connections) {
            connection.isEnabled = false;
            oldConnections.push(connection);
            oldInnovationNumbers.push(connection.innovation);
        }

        mutation.mutateAddNode(networkChromosome);
        networkChromosome.generateNetwork();
        const mutantNodes = [];
        const mutantConnections = [];
        const mutantInnovationNumbers = [];
        for (const nodes of networkChromosome.allNodes)
            mutantNodes.push(nodes);
        for (const connection of networkChromosome.connections) {
            mutantConnections.push(connection);
            mutantInnovationNumbers.push(connection.innovation);
        }

        // One new Hidden Layer
        expect(oldNodes.length).toBe(mutantNodes.length);
        // Two new Connections
        expect(oldConnections.length).toBe(mutantConnections.length);
        // Check Innovation Numbers
        expect(mutantInnovationNumbers[mutantInnovationNumbers.length - 1]).toBe(
            oldInnovationNumbers[oldInnovationNumbers.length - 1]);
    })

})
