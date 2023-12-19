import {NeatMutation} from "../../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/Operators/NeatCrossover";
import {ConnectionGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/ConnectionGene";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {HiddenNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/HiddenNode";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {ClassificationNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/ClassificationNode";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../../src/whisker/testcase/events/MouseMoveEvent";
import {ClickStageEvent} from "../../../../src/whisker/testcase/events/ClickStageEvent";
import {KeyPressEvent} from "../../../../src/whisker/testcase/events/KeyPressEvent";
import {NeatChromosome} from "../../../../src/whisker/whiskerNet/Networks/NeatChromosome";
import {NeatPopulation} from "../../../../src/whisker/whiskerNet/NeuroevolutionPopulations/NeatPopulation";
import {NeatChromosomeGenerator} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGenerator";
import {Randomness} from "../../../../src/whisker/utils/Randomness";
import {generateInputs} from "../Algorithms/NEAT.test";
import {NetworkLayer} from "../../../../src/whisker/whiskerNet/Networks/NetworkChromosome";


describe("Test NeatMutation", () => {

    let neatChromosome1: NeatChromosome;
    let neatChromosome2: NeatChromosome;
    let mutation: NeatMutation;
    let crossoverOp: NeatCrossover;
    let mutationConfig: Record<string, (string | number)>;
    let networkGenerator: NeatChromosomeGenerator;

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
        NeatPopulation.innovations = [];
        mutation = new NeatMutation(mutationConfig);
        const genInputs = generateInputs();
        const events = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
        networkGenerator = new NeatChromosomeGenerator(genInputs, events, 'fully',
            ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));
        neatChromosome1 = networkGenerator.get();
        neatChromosome2 = networkGenerator.get();
    });

    test("Test apply mutation operator on a populationChampion", () => {
        neatChromosome1.isPopulationChampion = true;
        let mutant = neatChromosome1.mutate();
        for (let i = 0; i < 100; i++) {
            mutant = mutant.mutate();
        }
        expect(mutant.connections.length).not.toBe(neatChromosome1.connections.length);
        expect(mutant.connections[0].weight).not.toBe(neatChromosome1.connections[0].weight);
    });

    test("Test apply mutation operator on a non-populationChampion", () => {
        let mutant = neatChromosome1.mutate();
        for (let i = 0; i < 100; i++) {
            mutant = mutant.mutate();
        }
        const mutatedEnableStates = [];
        for (const connection of neatChromosome1.connections) {
            mutatedEnableStates.push(connection.isEnabled);
        }

        expect(neatChromosome1.connections.length).not.toBe(mutant.connections.length);
        expect(neatChromosome1.connections[0].weight).not.toBe(mutant.connections[0].weight);
    });

    test("Test MutateWeights", () => {
        const originalWeights = [];
        const innovationLengthBefore = NeatPopulation.innovations.length;
        for (const connection of neatChromosome1.connections)
            originalWeights.push(connection.weight);

        const mutatedWeights = [];
        mutation.mutateWeight(neatChromosome1, 1);
        mutation.mutateWeight(neatChromosome1, 1);
        for (const connection of neatChromosome1.connections) {
            mutatedWeights.push(connection.weight);
        }
        originalWeights.sort();
        mutatedWeights.sort();
        const originalSum = originalWeights.reduce((a, b) => a + b, 0);
        const mutatedSum = mutatedWeights.reduce((a, b) => a + b, 0);
        expect(originalSum).not.toEqual(mutatedSum);
        expect(mutatedWeights).toHaveLength(originalWeights.length);
        expect(NeatPopulation.innovations.length).toEqual(innovationLengthBefore);
    });

    test("Test MutateAddConnection without hidden Layer", () => {
        const originalConnectionsSize = neatChromosome1.connections.length;
        const initialInnovations = NeatPopulation.innovations.length;
        neatChromosome1.generateNetwork();
        neatChromosome2.generateNetwork();
        neatChromosome1.addNodeSplitConnection(Randomness.getInstance().pick(neatChromosome1.connections));
        neatChromosome2.addNodeSplitConnection(Randomness.getInstance().pick(neatChromosome2.connections));
        for (let i = 0; i < 50; i++) {
            mutation.mutateAddConnection(neatChromosome1, 30);
            mutation.mutateAddConnection(neatChromosome2, 30);
        }
        // Equal if by chance an already established connection is chosen
        expect(originalConnectionsSize).toBeLessThanOrEqual(neatChromosome1.connections.length);
        expect(initialInnovations).toBeLessThan(NeatPopulation.innovations.length);
        expect(NeatPopulation.innovations.length).toBeGreaterThan(neatChromosome1.connections.length);
        expect(NeatPopulation.innovations.length).toBeGreaterThan(neatChromosome2.connections.length);
    });

    test("Test MutateAddConnection with recurrent connection between output Nodes", () => {
        const innovationLengthBefore = NeatPopulation.innovations.length;
        const iNode = new InputNode(0, "Sprite1", "X-Position");
        const oNode1 = new ClassificationNode(1, new WaitEvent(), ActivationFunction.SIGMOID);
        const oNode2 = new ClassificationNode(2, new ClickStageEvent(), ActivationFunction.SIGMOID);
        const layer: NetworkLayer = new Map<number, NodeGene[]>();
        layer.set(0, [iNode]);
        layer.set(1, [oNode1, oNode2]);


        const connectionList: ConnectionGene[] = [];
        const connection1 = new ConnectionGene(iNode, oNode1, 1, true, 0);
        connectionList.push(connection1);
        const connection2 = new ConnectionGene(iNode, oNode2, 2, true, 1);
        connectionList.push(connection2);
        mutationConfig.recurrentConnection = 1;
        mutation = new NeatMutation(mutationConfig);
        neatChromosome1 = new NeatChromosome(layer, connectionList, mutation, crossoverOp, 'fully');
        const originalConnectionsSize = neatChromosome1.connections.length;

        mutation.mutateAddConnection(neatChromosome1, 30);
        // Equal if by chance an already established connection is chosen
        expect(originalConnectionsSize).toBeLessThanOrEqual(neatChromosome1.connections.length);
        expect(NeatPopulation.innovations.length).toBeGreaterThan(innovationLengthBefore);
    });


    test("Test MutateAddConnection with hidden Layer", () => {
        const inputNodes = neatChromosome1.inputNodes;
        const outputNodes = neatChromosome1.layers.get(1);
        const innovationLengthBefore = NeatPopulation.innovations.length;
        const hiddenLayerNode = new HiddenNode(8, 0.5, ActivationFunction.SIGMOID);
        const hiddenLayerNode2 = new HiddenNode(9, 0.5, ActivationFunction.SIGMOID);
        const hiddenLayerNode3 = new HiddenNode(10, 0.5, ActivationFunction.SIGMOID);
        const hiddenLayerNode4 = new HiddenNode(11, 0.5, ActivationFunction.SIGMOID);
        const deepHiddenLayerNode = new HiddenNode(12, 0.75, ActivationFunction.SIGMOID);

        neatChromosome1.layers.set(0.5, [hiddenLayerNode, hiddenLayerNode2, hiddenLayerNode3, hiddenLayerNode4]);
        neatChromosome1.layers.set(0.25, [deepHiddenLayerNode]);
        // create some new connections, those will create new nodes in createNetwork()
        // which is called by mutateAddConnection
        neatChromosome1.connections.push(new ConnectionGene(inputNodes.get("Sprite1").get("X-Position"), hiddenLayerNode, 1, true, 50));
        neatChromosome1.connections.push(new ConnectionGene(hiddenLayerNode, deepHiddenLayerNode, 1, true, 51));
        neatChromosome1.connections.push(new ConnectionGene(deepHiddenLayerNode, outputNodes[0], 1, true, 52));
        neatChromosome1.connections.push(new ConnectionGene(inputNodes.get("Sprite1").get("Y-Position"), hiddenLayerNode2, 1, true, 53));
        neatChromosome1.connections.push(new ConnectionGene(hiddenLayerNode2, outputNodes[1], 1, true, 54));
        neatChromosome1.connections.push(new ConnectionGene(inputNodes.get("Sprite1").get("Costume"), hiddenLayerNode3, 1, true, 56));
        neatChromosome1.connections.push(new ConnectionGene(hiddenLayerNode3, outputNodes[1], 1, true, 57));
        neatChromosome1.connections.push(new ConnectionGene(inputNodes.get("Sprite1").get("Costume"), hiddenLayerNode4, 1, true, 58));
        neatChromosome1.connections.push(new ConnectionGene(hiddenLayerNode4, outputNodes[0], 1, true, 59));
        neatChromosome1.generateNetwork();
        const originalConnections = neatChromosome1.connections.length;
        // Make some rounds of mutations to ensure a mutation eventually happens
        for (let i = 0; i < 50; i++) {
            mutation.mutateAddConnection(neatChromosome1, 5);
        }
        neatChromosome1.generateNetwork();
        expect(originalConnections).not.toEqual(neatChromosome1.connections.length);
        expect(NeatPopulation.innovations.length).toBeGreaterThan(innovationLengthBefore);
    });

    test("Test mutateToggleEnableConnection", () => {
        const recConnection = new ConnectionGene(neatChromosome1.layers.get(1)[0],
            neatChromosome1.layers.get(1)[1], 1, true, 60);
        neatChromosome1.connections.push(recConnection);
        neatChromosome1.generateNetwork();
        const innovationLengthBefore = NeatPopulation.innovations.length;
        const connectionStates = [];
        for (const connection of neatChromosome1.connections)
            connectionStates.push(connection.isEnabled);

        for (let i = 0; i < 50; i++) {
            mutation.mutateToggleEnableConnection(neatChromosome1, 10);
        }
        const mutatedStates = [];
        for (const connection of neatChromosome1.connections)
            mutatedStates.push(connection.isEnabled);
        expect(connectionStates.length).toBe(mutatedStates.length);
        expect(connectionStates).not.toContainEqual(mutatedStates);
        expect(NeatPopulation.innovations.length).toEqual(innovationLengthBefore);
    });

    test("Test mutateConnectionReenable", () => {
        const recConnection = new ConnectionGene(neatChromosome1.layers.get(1)[0],
            neatChromosome1.layers.get(1)[1], 1, false, 60);
        neatChromosome1.connections.push(recConnection);
        neatChromosome1.generateNetwork();
        const innovationLengthBefore = NeatPopulation.innovations.length;
        const connectionStates = [];
        for (const connection of neatChromosome1.connections)
            connectionStates.push(connection.isEnabled);

        mutation.mutateConnectionReenable(neatChromosome1);
        const mutatedStates = [];
        for (const connection of neatChromosome1.connections)
            mutatedStates.push(connection.isEnabled);
        expect(connectionStates.length).toBe(mutatedStates.length);
        expect(connectionStates).not.toContainEqual(mutatedStates);
        expect(NeatPopulation.innovations.length).toEqual(innovationLengthBefore);
    });

    test("Test MutateAddNode", () => {
        const oldNodes = neatChromosome1.getNumNodes();
        const oldConnections = neatChromosome1.connections.length;
        const innovationLengthBefore = NeatPopulation.innovations.length;
        const layerSizeBefore = neatChromosome1.layers.size;

        for (let i = 0; i < 10; i++) {
            mutation.mutateAddNode(neatChromosome1);
            mutation.mutateAddNode(neatChromosome2);
        }

        expect(oldNodes + 10).toBe(neatChromosome1.getNumNodes());
        expect(oldConnections + (2 * 10)).toBe(neatChromosome1.connections.length);
        expect(innovationLengthBefore).toBeLessThanOrEqual(neatChromosome1.connections.length);
        expect(innovationLengthBefore).toBeLessThanOrEqual(neatChromosome2.connections.length);
        expect(NeatPopulation.innovations.length).toBeGreaterThan(oldConnections);
        expect(neatChromosome1.layers.size).toBeGreaterThan(layerSizeBefore);
    });

    test("Test MutateAddNode with only non-valid connections", () => {
        const oldNodes = [];
        const oldConnections = [];
        const oldInnovationNumbers = [];
        for (const nodes of neatChromosome1.getAllNodes())
            oldNodes.push(nodes);
        for (const connection of neatChromosome1.connections) {
            connection.isEnabled = false;
            oldConnections.push(connection);
            oldInnovationNumbers.push(connection.innovation);
        }

        mutation.mutateAddNode(neatChromosome1);
        neatChromosome1.generateNetwork();
        const mutantNodes = [];
        const mutantConnections = [];
        const mutantInnovationNumbers = [];
        for (const nodes of neatChromosome1.getAllNodes())
            mutantNodes.push(nodes);
        for (const connection of neatChromosome1.connections) {
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
    });

});
