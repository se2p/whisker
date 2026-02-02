import {NeatMutation} from "../../../../../src/whisker/agentTraining/neuroevolution/operators/NeatMutation";
import {NeatCrossover} from "../../../../../src/whisker/agentTraining/neuroevolution/operators/NeatCrossover";
import {ConnectionGene} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/ConnectionGene";
import {NodeGene} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/NodeGene";
import {ActivationFunction} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/ActivationFunction";
import {HiddenNode} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/HiddenNode";
import {InputNode} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/InputNode";
import {BiasNode} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/BiasNode";
import {ActionNode} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/ActionNode";
import {WaitEvent} from "../../../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../../../src/whisker/testcase/events/MouseMoveEvent";
import {KeyPressEvent} from "../../../../../src/whisker/testcase/events/KeyPressEvent";
import {NeatChromosome} from "../../../../../src/whisker/agentTraining/neuroevolution/networks/NeatChromosome";
import {NeatParameter} from "../../../../../src/whisker/agentTraining/neuroevolution/hyperparameter/NeatParameter";
import {NeatPopulation} from "../../../../../src/whisker/agentTraining/neuroevolution/neuroevolutionPopulations/NeatPopulation";
import {NeatChromosomeGenerator} from "../../../../../src/whisker/agentTraining/neuroevolution/networkGenerators/NeatChromosomeGenerator";
import {NetworkChromosome, NetworkLayer} from "../../../../../src/whisker/agentTraining/neuroevolution/networks/NetworkChromosome";
import {Randomness} from "../../../../../src/whisker/utils/Randomness";
import {ActivationTrace} from "../../../../../src/whisker/agentTraining/neuroevolution/misc/ActivationTrace";
import {EventAndParameters, ExecutionTrace} from "../../../../../src/whisker/testcase/ExecutionTrace";
import {generateNetworkInputs} from "../../../TestUtils";
import {NodeType} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/NodeType";
import {InputFeatures} from "../../../../../src/whisker/agentTraining/featureExtraction/FeatureExtraction";

function assertCloneStructure(clone: NeatChromosome, chromosome: NeatChromosome) {
    expect(clone.connections.length).toEqual(chromosome.connections.length);
    expect(clone.getNumNodes()).toEqual(chromosome.getNumNodes());
    expect(clone.layers.size).toEqual(clone.layers.size);
    expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
    expect(clone.layers.get(1).length).toEqual(chromosome.layers.get(1).length);
    expect(clone.outputActivationFunction).toEqual(chromosome.outputActivationFunction);
}

describe('Test NeatChromosome', () => {
    let mutationOp: NeatMutation;
    let mutationConfig: Record<string, (string | number)>;
    let crossoverConfig: Record<string, (string | number)>;
    let crossoverOp: NeatCrossover;
    let genInputs: InputFeatures;
    let generator: NeatChromosomeGenerator;
    let chromosome: NeatChromosome;
    let properties: NeatParameter;

    // Helper function for generating a sample chromosome.
    const getSampleNetwork = (): NetworkChromosome => {
        // Create input Nodes
        const layer: NetworkLayer = new Map<number, NodeGene[]>();
        const iNode1 = new InputNode(0, "Sprite1", "X-Position");
        const iNode2 = new InputNode(1, "Sprite1", "Y-Position");
        const iNode3 = new InputNode(2, "Sprite1", "Costume");
        const bias = new BiasNode(3);
        layer.set(0, [iNode1, iNode2, iNode3, bias]);

        // Create classification and Regression Output Nodes

        const eventNode1 = new ActionNode(6, ActivationFunction.SIGMOID, new KeyPressEvent("a"));
        const eventNode2 = new ActionNode(7, ActivationFunction.SIGMOID, new KeyPressEvent("b"));
        layer.set(1, [eventNode1, eventNode2]);

        // Create Connections
        const connections: ConnectionGene[] = [];
        connections.push(new ConnectionGene(iNode1, eventNode1, 0.1, true, 1));
        connections.push(new ConnectionGene(iNode1, eventNode2, 0.2, true, 1));
        connections.push(new ConnectionGene(iNode2, eventNode1, 0.3, false, 1));
        connections.push(new ConnectionGene(iNode2, eventNode2, 0.4, false, 1));
        connections.push(new ConnectionGene(bias, eventNode1, 0.5, true, 1));
        connections.push(new ConnectionGene(bias, eventNode2, 0.6, false, 1));
        return new NeatChromosome(layer, connections, mutationOp, crossoverOp, 'fully', ActivationFunction.RELU, ActivationFunction.SOFTMAX);
    };

    beforeEach(async () => {
        crossoverConfig = {
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
        mutationOp = new NeatMutation(mutationConfig);

        genInputs = generateNetworkInputs();
        const events = [new KeyPressEvent("space"), new KeyPressEvent("left arrow"),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
        generator = new NeatChromosomeGenerator(genInputs, events, 'fully',
            ActivationFunction.SIGMOID, ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));
        chromosome = await generator.get();
        properties = new NeatParameter();
        properties.populationSize = 10;
        NeatPopulation.innovations = [];
    });

    test("Deep clone", () => {
        const refTrace = new ActivationTrace([new HiddenNode(0, 0.5, ActivationFunction.TANH)]);
        const testTrace = new ActivationTrace([]);
        chromosome.referenceActivationTrace = refTrace;
        chromosome.testActivationTrace = testTrace;
        const clone = chromosome.clone();
        expect(clone.uID).toEqual(chromosome.uID);
        expect(clone.trace).toEqual(chromosome.trace);
        expect(clone.fitness).toEqual(chromosome.fitness);
        expect(clone.sharedFitness).toEqual(chromosome.sharedFitness);
        expect(clone.targetObjective).toEqual(chromosome.targetObjective);
        expect(clone.coverageObjectives).toEqual(chromosome.coverageObjectives);
        expect(clone.isSpeciesChampion).toEqual(chromosome.isSpeciesChampion);
        expect(clone.isPopulationChampion).toEqual(chromosome.isPopulationChampion);
        expect(clone.isParent).toEqual(chromosome.isParent);
        expect(clone.expectedOffspring).toEqual(chromosome.expectedOffspring);
        expect(clone.referenceActivationTrace.tracedNodes.length).toEqual(chromosome.referenceActivationTrace.tracedNodes.length);
        expect(clone.testActivationTrace.tracedNodes.length).toEqual(chromosome.testActivationTrace.tracedNodes.length);
        expect(clone.referenceUncertainty.size).toBe(0);
        expect(clone.testUncertainty.size).toBe(0);
        assertCloneStructure(clone, chromosome);
    });

    test("Clone with given genes", () => {
        assertCloneStructure(chromosome.cloneWith(chromosome.connections), chromosome);
    });

    test("Clone structure", () => {
        assertCloneStructure(chromosome.cloneStructure(false), chromosome);
    });

    test("Clone as test case", () => {
        chromosome.referenceActivationTrace = new ActivationTrace([new HiddenNode(0, 0.5, ActivationFunction.TANH)]);
        const clone = chromosome.cloneAsTestCase();
        assertCloneStructure(clone, chromosome);
        expect(clone.uID).toEqual(chromosome.uID);
        expect(clone.referenceActivationTrace.tracedNodes.length).toEqual(chromosome.referenceActivationTrace.tracedNodes.length);
    });

    test('Test generateNetwork with hidden Layer', () => {
        const inputNode = chromosome.inputNodes.get("Sprite1").get("X-Position");
        const outputNode = chromosome.layers.get(1)[0];
        const hiddenNode = new HiddenNode(7, 0.5, ActivationFunction.SIGMOID);
        const deepHiddenNode = new HiddenNode(8, 0.75, ActivationFunction.SIGMOID);
        chromosome.addNode(hiddenNode);
        chromosome.addNode(deepHiddenNode);
        chromosome.connections.push(new ConnectionGene(inputNode, hiddenNode, 0.5, true, 7));
        chromosome.connections.push(new ConnectionGene(hiddenNode, outputNode, 0, true, 8));
        chromosome.connections.push(new ConnectionGene(hiddenNode, deepHiddenNode, 1, true, 9));
        chromosome.connections.push(new ConnectionGene(deepHiddenNode, outputNode, 0.2, true, 10));
        chromosome.generateNetwork();
        expect(chromosome.getNumNodes()).toEqual(9 + 1 + 2 + 4);  // InputNodes + Bias + HiddenNodes + EventNodes
        expect(hiddenNode.incomingConnections.length).toEqual(1);
        expect(deepHiddenNode.incomingConnections.length).toEqual(1);
        expect(chromosome.outputActivationFunction).toEqual(ActivationFunction.SIGMOID);
        expect(chromosome.layers.size).toEqual(4);
        expect(chromosome.layers.get(0).length).toEqual(10);
        expect(chromosome.layers.get(0.5).length).toEqual(1);
        expect(chromosome.layers.get(0.75).length).toEqual(1);
        expect(chromosome.layers.get(1).length).toEqual(4);
    });

    test("Sort network layers", () => {
        const iNode = new InputNode(0, "Sprite1", "X-Position");
        const oNode = new ActionNode(4, ActivationFunction.SIGMOID, new KeyPressEvent("a"));
        const layer: NetworkLayer = new Map<number, NodeGene[]>();
        layer.set(1, [oNode]);
        layer.set(0, [iNode]);
       const sampleNetwork = new NeatChromosome(layer, [], mutationOp, crossoverOp, 'fully', ActivationFunction.RELU, ActivationFunction.SOFTMAX);
       sampleNetwork.sortLayer();
       expect([...sampleNetwork.layers.keys()]).toEqual([0, 1]);
    });

    test('Network activation without path from input to output', () => {
        // Create input Nodes
        const iNode = new InputNode(0, "Sprite1", "X-Position");
        const oNode = new ActionNode(4, ActivationFunction.SIGMOID, new KeyPressEvent("a"));
        const layer: NetworkLayer = new Map<number, NodeGene[]>();
        layer.set(0, [iNode]);
        layer.set(1, [oNode]);
        const connections = [new ConnectionGene(iNode, oNode, 1, false, 0)];

        chromosome = new NeatChromosome(layer, connections, mutationOp, crossoverOp, 'fully', ActivationFunction.RELU, ActivationFunction.SOFTMAX);
        const inputs: InputFeatures = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        inputs.set("Sprite1", sprite1);
        expect(chromosome.activateNetwork(inputs)).toBeFalsy();
    });

    test('Network activation without hidden layer', () => {
        const chromosome = getSampleNetwork();
        const inputs: InputFeatures = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        inputs.set("Sprite1", sprite1);
        expect(chromosome.activateNetwork(inputs)).toBeTruthy();
        const outputValues = [...chromosome.getTriggerActionNodes()].map(node => Math.round(node.activationValue * 1000) / 1000);
        expect(outputValues).toEqual([0.646, 0.55]);
    });

    test('Network activation without hidden layer and novel inputs', () => {
        const chromosome = getSampleNetwork();
        const chromosome2 = getSampleNetwork();
        const inputs: InputFeatures = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        sprite1.set('Direction', 3);
        inputs.set("Sprite1", sprite1);

        const sprite2 = new Map<string, number>();
        sprite2.set("X-Position", 4);
        sprite2.set("Y-Position", 5);
        inputs.set("Sprite2", sprite2);

        chromosome.activateNetwork(inputs);
        chromosome2.activateNetwork(inputs);
        expect(chromosome.layers.get(0).length).toEqual(7);
        expect(NeatPopulation.nodeToId.size).toEqual(3);
        expect(chromosome.inputNodes.get("Sprite1").get("X-Position").uID).toEqual(
            chromosome2.inputNodes.get("Sprite1").get("X-Position").uID);
        expect(chromosome.inputNodes.get("Sprite1").get("X-Position").uID).not.toEqual(
            chromosome.inputNodes.get("Sprite1").get("Direction").uID);
        expect(chromosome.inputNodes.get("Sprite1").get("Direction").uID).toEqual(
            chromosome2.inputNodes.get("Sprite1").get("Direction").uID);
        expect(chromosome.inputNodes.get("Sprite2").get("X-Position").uID).toEqual(
            chromosome2.inputNodes.get("Sprite2").get("X-Position").uID);
    });

    test('Network activation with hidden layer', () => {
        const chromosome = getSampleNetwork();
        const hiddenNode = new HiddenNode(101, 0.5, ActivationFunction.SIGMOID);
        chromosome.addNode(hiddenNode);
        chromosome.connections.push(new ConnectionGene(chromosome.layers.get(0)[0], hiddenNode, 1.1, true, 121));
        chromosome.connections.push(new ConnectionGene(chromosome.layers.get(0)[1], hiddenNode, 1.2, true, 123));
        chromosome.connections.push(new ConnectionGene(hiddenNode, chromosome.layers.get(1)[0], 1.3, true, 123));
        const inputs: InputFeatures = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        inputs.set("Sprite1", sprite1);
        chromosome.generateNetwork();
        chromosome.activateNetwork(inputs);

        const outputValues = [...chromosome.getTriggerActionNodes()].map(node => Math.round(node.activationValue * 1000) / 1000);
        expect(outputValues).toEqual([0.866, 0.55]);
    });

    test('Network activation with recurrent connection from classification to hidden node', () => {
        const chromosome = getSampleNetwork();
        const hiddenNode = new HiddenNode(101, 0.5, ActivationFunction.SIGMOID);
        chromosome.addNode(hiddenNode);
        chromosome.connections.push(new ConnectionGene(chromosome.layers.get(0)[0], hiddenNode, 1.1, true, 121));
        chromosome.connections.push(new ConnectionGene(chromosome.layers.get(0)[1], hiddenNode, 1.2, true, 123));
        chromosome.connections.push(new ConnectionGene(hiddenNode, chromosome.layers.get(1)[0], 1.3, true, 123));
        chromosome.connections.push(new ConnectionGene(chromosome.layers.get(1)[0], hiddenNode, 1.4, true, 123));
        const inputs: InputFeatures = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        inputs.set("Sprite1", sprite1);
        chromosome.generateNetwork();

        // First activation
        chromosome.activateNetwork(inputs);
        let outputValues = [...chromosome.getTriggerActionNodes()].map(node => Math.round(node.activationValue * 1000) / 1000);
        expect(outputValues).toEqual([0.866, 0.55]);

        // Second activation
        chromosome.activateNetwork(inputs);
        outputValues = [...chromosome.getTriggerActionNodes()].map(node => Math.round(node.activationValue * 1000) / 1000);
        expect(outputValues).toEqual([0.869, 0.55]);
    });

    test("Generate Dummy Inputs", () => {
        const chromosome = getSampleNetwork();
        const dummyInputs = chromosome.generateDummyInputs();
        expect(dummyInputs.size).toBe(1);
        expect(dummyInputs.get("Sprite1").size).toBe(3);
        expect(chromosome.activateNetwork(dummyInputs)).toBeTruthy();
    });

    test("Test updateOutputNodes sparse", async () => {
        const sparseGenerator = new NeatChromosomeGenerator(genInputs, [new WaitEvent()], 'sparse',
            ActivationFunction.SIGMOID, ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));
        chromosome = await sparseGenerator.get();
        const chromosome2 = await sparseGenerator.get();
        const chromosome3 = await sparseGenerator.get();
        const oldNodeSize = chromosome.getNumNodes();
        const oldOutputNodesSize = chromosome.layers.get(1).length;
        const oldConnectionSize = chromosome.connections.length;
        chromosome.updateOutputNodes([new MouseMoveEvent()]);
        chromosome2.updateOutputNodes([new MouseMoveEvent()]);
        chromosome3.updateOutputNodes([new KeyPressEvent('up arrow')]);
        expect(chromosome.getNumNodes()).toBeGreaterThan(oldNodeSize);
        expect(chromosome.layers.get(1).length).toBeGreaterThan(oldOutputNodesSize);
        expect(chromosome.connections.length).toBeGreaterThan(oldConnectionSize);
        expect(chromosome.layers.size).toEqual(2);
        expect(chromosome.getAllNodes().filter(node => node instanceof HiddenNode).length).toEqual(0);
    });

    test("Add Connection", () => {
        const iNode = chromosome.inputNodes.get("Sprite1").get("X-Position");
        const oNode = chromosome.layers.get(1)[0];
        const connection = new ConnectionGene(oNode, iNode, 0, true, 0);
        const clone = chromosome.cloneStructure(true);
        const connectionSizeBefore = chromosome.connections.length;
        const nodeSizeBefore = chromosome.getNumNodes();
        expect(NeatPopulation.findInnovation(connection, 'addConnection')).toBeUndefined();
        chromosome.addConnection(connection);
        expect(NeatPopulation.findInnovation(connection, 'addConnection')).not.toBeUndefined();
        clone.addConnection(connection);

        expect(chromosome.connections.length).toEqual(connectionSizeBefore + 1);
        expect(clone.connections.length).toEqual(chromosome.connections.length);
        expect(chromosome.getNumNodes()).toEqual(nodeSizeBefore);
        expect(clone.getNumNodes()).toEqual(chromosome.getNumNodes());
    });

    test("Add Node by splitting up a connection", () => {
        const splitConnection = Randomness.getInstance().pick(chromosome.connections);
        const clone = chromosome.cloneStructure(true);
        const connectionSizeBefore = chromosome.connections.length;
        const nodeSizeBefore = chromosome.getNumNodes();
        expect(NeatPopulation.findInnovation(splitConnection, 'addNodeSplitConnection')).toBeUndefined();
        chromosome.addNodeSplitConnection(splitConnection);
        expect(NeatPopulation.findInnovation(splitConnection, 'addNodeSplitConnection')).not.toBeUndefined();
        clone.addNodeSplitConnection(splitConnection);

        expect(chromosome.connections.length).toEqual(connectionSizeBefore + 2);
        expect(clone.connections.length).toEqual(chromosome.connections.length);
        expect(chromosome.getNumNodes()).toEqual(nodeSizeBefore + 1);
        expect(clone.getNumNodes()).toEqual(chromosome.getNumNodes());
    });

    test("Test toString", () => {
        const iNode = new InputNode(10, "HexColor", "#ff0000");
        chromosome.layers.get(0).push(iNode);
        chromosome.connections[0].isEnabled = false;
        const toStringOut = chromosome.toString();
        expect(toStringOut).toContain("digraph Network"); // Check for .dot output
        expect(toStringOut).toContain("Red"); // Check if color was translated from hex
        expect(toStringOut).not.toContain(":"); // Problematic .dot character
    });

    test("Update Activation Trace", () => {
        let numberTracedNodes = 0;
        for (const node of chromosome.getAllNodes()) {
            if (node.type == NodeType.OUTPUT || node.type == NodeType.HIDDEN) {
                node.activationValue = Randomness.getInstance().nextInt(-1, 1);
                numberTracedNodes++;
            }
        }
        const step = 2;
        chromosome.updateActivationTrace(step);
        expect(chromosome.testActivationTrace.tracedNodes.length).toEqual(numberTracedNodes);
    });

    test("Get number of executed events", () => {
        const eventAndParams = [
            new EventAndParameters(new WaitEvent(), [1]),
            new EventAndParameters(new KeyPressEvent("Right Arrow"), [])
        ];
        chromosome.trace = new ExecutionTrace(undefined, eventAndParams);
        expect(chromosome.getNumEvents()).toEqual(2);
    });

    test("toJSON", () => {
        const json = chromosome.toJSON();
        expect(json['id']).toEqual(chromosome.uID);
        expect(json['hF']).toEqual("SIGMOID");
        expect(json['oF']).toEqual("SIGMOID");
        expect(json['cM']).toEqual(chromosome.inputConnectionMethod);
        expect('tf' in json).toBeFalsy();
        expect(Object.keys(json['Nodes']).length).toEqual(chromosome.getNumNodes());
        expect(Object.keys(json['Cons']).length).toEqual(chromosome.connections.length);
        expect(json['AT']).toBeUndefined();
        expect(Object.keys(json).length).toBe(7);

        chromosome.testActivationTrace = new ActivationTrace([]);
        expect(chromosome.toJSON()['AT']).not.toBeUndefined();
    });

});
