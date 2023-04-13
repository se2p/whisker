import {NeatMutation} from "../../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/Operators/NeatCrossover";
import {ConnectionGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/ConnectionGene";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {HiddenNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/HiddenNode";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";
import {ClassificationNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/ClassificationNode";
import {RegressionNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/RegressionNode";
import {Species} from "../../../../src/whisker/whiskerNet/NeuroevolutionPopulations/Species";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../../src/whisker/testcase/events/MouseMoveEvent";
import {ClickStageEvent} from "../../../../src/whisker/testcase/events/ClickStageEvent";
import {KeyPressEvent} from "../../../../src/whisker/testcase/events/KeyPressEvent";
import {NeatChromosome} from "../../../../src/whisker/whiskerNet/Networks/NeatChromosome";
import {
    NeuroevolutionTestGenerationParameter
} from "../../../../src/whisker/whiskerNet/HyperParameter/NeuroevolutionTestGenerationParameter";
import {NeatPopulation} from "../../../../src/whisker/whiskerNet/NeuroevolutionPopulations/NeatPopulation";
import {NeatChromosomeGenerator} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGenerator";
import {NetworkChromosome, NetworkLayer} from "../../../../src/whisker/whiskerNet/Networks/NetworkChromosome";
import {Randomness} from "../../../../src/whisker/utils/Randomness";
import {ActivationTrace} from "../../../../src/whisker/whiskerNet/Misc/ActivationTrace";
import {FitnessFunction} from "../../../../src/whisker/search/FitnessFunction";
import {EventAndParameters, ExecutionTrace} from "../../../../src/whisker/testcase/ExecutionTrace";
import {InputFeatures} from "../../../../src/whisker/whiskerNet/Misc/InputExtraction";
import {generateInputs} from "../Algorithms/NEAT.test";
import {expect} from "@jest/globals";

describe('Test NeatChromosome', () => {
    let mutationOp: NeatMutation;
    let mutationConfig: Record<string, (string | number)>;
    let crossoverConfig: Record<string, (string | number)>;
    let crossoverOp: NeatCrossover;
    let genInputs: InputFeatures;
    let generator: NeatChromosomeGenerator;
    let chromosome: NeatChromosome;
    let properties: NeuroevolutionTestGenerationParameter;
    const activationFunction = ActivationFunction.SIGMOID;

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
        const classificationNode1 = new ClassificationNode(4, new WaitEvent(), ActivationFunction.SOFTMAX);
        const classificationNode2 = new ClassificationNode(5, new ClickStageEvent(), ActivationFunction.SOFTMAX);
        const regressionNode1 = new RegressionNode(6, new WaitEvent(), "Duration");
        const regressionNode2 = new RegressionNode(7, new MouseMoveEvent(), "X");
        layer.set(1, [classificationNode1, classificationNode2, regressionNode1, regressionNode2]);

        // Create Connections
        const connections: ConnectionGene[] = [];
        connections.push(new ConnectionGene(iNode1, classificationNode1, 0.1, true, 1));
        connections.push(new ConnectionGene(iNode1, classificationNode2, 0.2, true, 1));
        connections.push(new ConnectionGene(iNode2, classificationNode1, 0.3, false, 1));
        connections.push(new ConnectionGene(iNode2, classificationNode2, 0.4, false, 1));
        connections.push(new ConnectionGene(bias, classificationNode1, 0.5, true, 1));
        connections.push(new ConnectionGene(bias, classificationNode2, 0.6, false, 1));
        connections.push(new ConnectionGene(iNode1, regressionNode1, 0.7, true, 1));
        connections.push(new ConnectionGene(iNode1, regressionNode2, 0.8, true, 1));
        connections.push(new ConnectionGene(iNode2, regressionNode1, 0.9, false, 1));
        connections.push(new ConnectionGene(iNode2, regressionNode2, 1, true, 1));
        return new NeatChromosome(layer, connections, mutationOp, crossoverOp, 'fully');
    };

    beforeEach(() => {
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

        genInputs = generateInputs();
        const events = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
        generator = new NeatChromosomeGenerator(genInputs, events, 'fully',
            ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));
        chromosome = generator.get();
        properties = new NeuroevolutionTestGenerationParameter();
        properties.populationSize = 10;
        NeatPopulation.innovations = [];
    });

    test('Constructor Test', () => {
        expect(chromosome.activationFunction).toBe(activationFunction);
        expect(chromosome.getNumNodes()).toEqual(19);
        expect(chromosome.layers.size).toEqual(2);
        expect(chromosome.classificationNodes.size).toEqual(4);
        expect(chromosome.regressionNodes.size).toEqual(4);
        expect(chromosome.inputNodes.get("Sprite1").size).toEqual(5);
        expect(chromosome.inputNodes.get("Sprite2").size).toEqual(4);
        expect(chromosome.connections.length).toBeGreaterThanOrEqual(9);
        expect(chromosome.getCrossoverOperator() instanceof NeatCrossover).toBeTruthy();
        expect(chromosome.getMutationOperator() instanceof NeatMutation).toBeTruthy();
        expect(chromosome.fitness).toEqual(0);
        expect(chromosome.sharedFitness).toEqual(0);
        expect(chromosome.species).toEqual(undefined);
        expect(chromosome.isSpeciesChampion).toBeFalsy();
        expect(chromosome.isPopulationChampion).toBeFalsy();
        expect(chromosome.isParent).toBeFalsy();
        expect(chromosome.expectedOffspring).toEqual(0);
        expect(chromosome.numberOffspringPopulationChamp).toEqual(undefined);
        expect(chromosome.trace).toEqual(undefined);
        expect(chromosome.coverage.size).toEqual(0);
        expect(chromosome.codons.length).toBe(0);
        expect(chromosome.layers.get(1)[0].incomingConnections.length).toBeGreaterThanOrEqual(1);
    });

    test("Test getter and setter", () => {
        const species = new Species(1, true, properties);
        const sampleNode = new HiddenNode(101, 0.5, ActivationFunction.TANH);
        const refUncertainty = new Map<number, number>();
        refUncertainty.set(10, 0.3);

        chromosome.uID = 1234;
        chromosome.fitness = 4;
        chromosome.sharedFitness = 2;
        chromosome.species = species;
        chromosome.isSpeciesChampion = true;
        chromosome.isPopulationChampion = true;
        chromosome.isParent = true;
        chromosome.expectedOffspring = 1;
        chromosome.numberOffspringPopulationChamp = 2;
        chromosome.trace = undefined;
        chromosome.codons = [1, 2, 3];
        chromosome.coverage = new Set<string>("B");
        chromosome.score = 10;
        chromosome.playTime = 30;
        chromosome.referenceActivationTrace = new ActivationTrace([sampleNode]);
        chromosome.testActivationTrace = new ActivationTrace([]);
        chromosome.recordNetworkStatistics = false;
        chromosome.averageLSA = 0.1;
        chromosome.surpriseCount = 3;
        chromosome.referenceUncertainty = refUncertainty;
        chromosome.testUncertainty = new Map<number, number>();
        chromosome.openStatementTargets = new Map<FitnessFunction<NetworkChromosome>, number>();

        expect(chromosome.uID).toBe(1234);
        expect(chromosome.fitness).toEqual(4);
        expect(chromosome.sharedFitness).toEqual(2);
        expect(chromosome.species).toEqual(species);
        expect(chromosome.isSpeciesChampion).toBeTruthy();
        expect(chromosome.isPopulationChampion).toBeTruthy();
        expect(chromosome.isParent).toBeTruthy();
        expect(chromosome.expectedOffspring).toEqual(1);
        expect(chromosome.numberOffspringPopulationChamp).toEqual(2);
        expect(chromosome.trace).toEqual(undefined);
        expect(chromosome.codons).toEqual([1, 2, 3]);
        expect(chromosome.getLength()).toEqual(3);
        expect(chromosome.coverage).toContain("B");
        expect(chromosome.score).toEqual(10);
        expect(chromosome.playTime).toEqual(30);
        expect(chromosome.referenceActivationTrace.tracedNodes.length).toEqual(1);
        expect(chromosome.testActivationTrace.tracedNodes.length).toEqual(0);
        expect(chromosome.recordNetworkStatistics).toBeFalsy();
        expect(chromosome.averageLSA).toEqual(0.1);
        expect(chromosome.surpriseCount).toEqual(3);
        expect(chromosome.referenceUncertainty.size).toEqual(1);
        expect(chromosome.testUncertainty.size).toEqual(0);
        expect(chromosome.openStatementTargets).not.toBeUndefined();
    });

    test("Deep clone", () => {
        const refTrace = new ActivationTrace([new HiddenNode(0, 0.5, ActivationFunction.TANH)]);
        const testTrace = new ActivationTrace([]);
        chromosome.referenceActivationTrace = refTrace;
        chromosome.testActivationTrace = testTrace;
        const clone = chromosome.clone();
        expect(clone.uID).toEqual(chromosome.uID);
        expect(clone.trace).toEqual(chromosome.trace);
        expect(clone.coverage).toEqual(chromosome.coverage);
        expect(clone.fitness).toEqual(chromosome.fitness);
        expect(clone.sharedFitness).toEqual(chromosome.sharedFitness);
        expect(clone.targetFitness).toEqual(chromosome.targetFitness);
        expect(clone.openStatementTargets).toEqual(chromosome.openStatementTargets);
        expect(clone.species).toEqual(chromosome.species);
        expect(clone.isSpeciesChampion).toEqual(chromosome.isSpeciesChampion);
        expect(clone.isPopulationChampion).toEqual(chromosome.isPopulationChampion);
        expect(clone.isParent).toEqual(chromosome.isParent);
        expect(clone.expectedOffspring).toEqual(chromosome.expectedOffspring);
        expect(clone.connections.length).toEqual(chromosome.connections.length);
        expect(clone.getNumNodes()).toEqual(chromosome.getNumNodes());
        expect(clone.layers.size).toEqual(chromosome.layers.size);
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.layers.get(1).length).toEqual(chromosome.layers.get(1).length);
        expect(clone.activationFunction).toEqual(chromosome.activationFunction);
        expect(clone.referenceActivationTrace.tracedNodes.length).toEqual(chromosome.referenceActivationTrace.tracedNodes.length);
        expect(clone.testActivationTrace.tracedNodes.length).toEqual(chromosome.testActivationTrace.tracedNodes.length);
        expect(clone.referenceUncertainty.size).toBe(0);
        expect(clone.testUncertainty.size).toBe(0);
    });

    test("Clone with given genes", () => {
        const clone = chromosome.cloneWith(chromosome.connections);
        expect(clone.connections.length).toEqual(chromosome.connections.length);
        expect(clone.getNumNodes()).toEqual(chromosome.getNumNodes());
        expect(clone.layers.size).toEqual(clone.layers.size);
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.layers.get(1).length).toEqual(chromosome.layers.get(1).length);
        expect(clone.activationFunction).toEqual(chromosome.activationFunction);
    });

    test("Clone structure", () => {
        const clone = chromosome.cloneStructure(false);
        expect(clone.connections.length).toEqual(chromosome.connections.length);
        expect(clone.getNumNodes()).toEqual(chromosome.getNumNodes());
        expect(clone.layers.size).toEqual(clone.layers.size);
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.layers.get(1).length).toEqual(chromosome.layers.get(1).length);
        expect(clone.activationFunction).toEqual(chromosome.activationFunction);
    });

    test("Clone as test case", () => {
        chromosome.referenceActivationTrace = new ActivationTrace([new HiddenNode(0, 0.5, ActivationFunction.TANH)]);
        const clone = chromosome.cloneAsTestCase();
        expect(clone.connections.length).toEqual(chromosome.connections.length);
        expect(clone.getNumNodes()).toEqual(chromosome.getNumNodes());
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.layers.get(1).length).toEqual(chromosome.layers.get(1).length);
        expect(clone.layers.size).toEqual(clone.layers.size);
        expect(clone.activationFunction).toEqual(chromosome.activationFunction);
        expect(clone.uID).toEqual(chromosome.uID);
        expect(clone.referenceActivationTrace.tracedNodes.length).toEqual(chromosome.referenceActivationTrace.tracedNodes.length);
    });

    test('Test generateNetwork with hidden Layer', () => {
        const inputNode = chromosome.inputNodes.get("Sprite1").get("X-Position");
        const outputNode = chromosome.layers.get(1)[0];
        const hiddenNode = new HiddenNode(7, 0.5, ActivationFunction.SIGMOID);
        const deepHiddenNode = new HiddenNode(8, 0.5, ActivationFunction.SIGMOID);
        chromosome.addNode(hiddenNode, inputNode, outputNode);
        chromosome.addNode(deepHiddenNode, hiddenNode, outputNode);
        chromosome.connections.push(new ConnectionGene(inputNode, hiddenNode, 0.5, true, 7));
        chromosome.connections.push(new ConnectionGene(hiddenNode, outputNode, 0, true, 8));
        chromosome.connections.push(new ConnectionGene(hiddenNode, deepHiddenNode, 1, true, 9));
        chromosome.connections.push(new ConnectionGene(deepHiddenNode, outputNode, 0.2, true, 10));
        chromosome.generateNetwork();
        // InputNodes + Bias + hiddenNodes + classificationNodes + RegressionNodes
        expect(chromosome.getNumNodes()).toEqual(9 + 1 + 2 + 4 + 5);
        expect(hiddenNode.incomingConnections.length).toEqual(1);
        expect(deepHiddenNode.incomingConnections.length).toEqual(1);
        expect(chromosome.regressionNodes.get(new WaitEvent().constructor.name).length).toEqual(1);
        expect(chromosome.regressionNodes.get(new MouseMoveEvent().constructor.name).length).toEqual(2);
        expect(chromosome.activationFunction).toEqual(ActivationFunction.SIGMOID);
        expect(chromosome.layers.size).toEqual(4);
        expect(chromosome.layers.get(0).length).toEqual(10);
        expect(chromosome.layers.get(0.5).length).toEqual(1);
        expect(chromosome.layers.get(0.75).length).toEqual(1);
        expect(chromosome.layers.get(1).length).toEqual(9);
    });

    test('Network activation without path from input to output', () => {
        // Create input Nodes
        const iNode = new InputNode(0, "Sprite1", "X-Position");
        const oNode = new ClassificationNode(4, new WaitEvent(), ActivationFunction.SIGMOID);
        const layer: NetworkLayer = new Map<number, NodeGene[]>();
        layer.set(0, [iNode]);
        layer.set(1, [oNode]);
        const connections = [new ConnectionGene(iNode, oNode, 1, false, 0)];

        chromosome = new NeatChromosome(layer, connections, mutationOp, crossoverOp, 'fully');
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
        chromosome.activateNetwork(inputs);

        expect(chromosome.layers.get(0)[0].nodeValue).toEqual(1);
        expect(chromosome.layers.get(0)[1].nodeValue).toEqual(2);
        expect(chromosome.layers.get(0)[2].nodeValue).toEqual(0);
        expect(chromosome.layers.get(1)[0].nodeValue).toEqual(0.6);
        expect(chromosome.layers.get(1)[1].nodeValue).toEqual(0.2);
        expect(chromosome.layers.get(1)[2].nodeValue).toEqual(0.7);
        expect(chromosome.layers.get(1)[3].nodeValue).toEqual(2.8);

        const classificationValues = [...chromosome.classificationNodes.values()].map(node => Math.round(node.activationValue * 1000) / 1000);
        expect(classificationValues).toEqual([0.599, 0.401]);
        expect(Math.round(classificationValues.reduce((a, b) => a + b))).toEqual(1);
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
        chromosome.addNode(hiddenNode, chromosome.layers.get(0)[0], chromosome.layers.get(1)[1]);
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

        expect(chromosome.layers.get(0)[0].nodeValue).toEqual(1);
        expect(chromosome.layers.get(0)[1].nodeValue).toEqual(2);
        expect(chromosome.layers.get(0)[2].nodeValue).toEqual(0);
        expect(chromosome.layers.get(0.5)[0].nodeValue).toEqual(3.5);
        expect(Math.round(chromosome.layers.get(0.5)[0].activationValue * 100) / 100).toEqual(0.97);
        expect(Math.round(chromosome.layers.get(1)[0].nodeValue * 100) / 100).toEqual(1.86);
        expect(chromosome.layers.get(1)[1].nodeValue).toEqual(0.2);
        expect(chromosome.layers.get(1)[2].nodeValue).toEqual(0.7);
        expect(chromosome.layers.get(1)[3].nodeValue).toEqual(2.8);

        const classificationValues = [...chromosome.classificationNodes.values()].map(node => Math.round(node.activationValue * 1000) / 1000);
        expect(classificationValues).toEqual([0.840, 0.160]);
        expect(Math.round(classificationValues.reduce((a, b) => a + b))).toEqual(1);
    });

    test('Network activation with recurrent connection from classification to hidden node', () => {
        const chromosome = getSampleNetwork();
        const hiddenNode = new HiddenNode(101, 0.5, ActivationFunction.SIGMOID);
        chromosome.addNode(hiddenNode, chromosome.layers.get(0)[0], chromosome.layers.get(1)[1]);
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
        expect(chromosome.layers.get(0)[0].nodeValue).toEqual(1);
        expect(chromosome.layers.get(0)[1].nodeValue).toEqual(2);
        expect(chromosome.layers.get(0)[2].nodeValue).toEqual(0);
        expect(chromosome.layers.get(0.5)[0].nodeValue).toEqual(3.5);
        expect(Math.round(chromosome.layers.get(0.5)[0].activationValue * 100) / 100).toEqual(0.97);
        expect(Math.round(chromosome.layers.get(1)[0].nodeValue * 100) / 100).toEqual(1.86);
        expect(chromosome.layers.get(1)[1].nodeValue).toEqual(0.2);
        expect(chromosome.layers.get(1)[2].nodeValue).toEqual(0.7);
        expect(chromosome.layers.get(1)[3].nodeValue).toEqual(2.8);
        const classificationValues1 = [...chromosome.classificationNodes.values()].map(node => Math.round(node.activationValue * 1000) / 1000);
        expect(classificationValues1).toEqual([0.840, 0.160]);
        expect(Math.round(classificationValues1.reduce((a, b) => a + b))).toEqual(1);

        // Second activation
        chromosome.activateNetwork(inputs);
        expect(chromosome.layers.get(0)[0].nodeValue).toEqual(1);
        expect(chromosome.layers.get(0)[1].nodeValue).toEqual(2);
        expect(chromosome.layers.get(0)[2].nodeValue).toEqual(0);
        expect(Math.round(chromosome.layers.get(0.5)[0].nodeValue * 100) / 100).toEqual(4.68);
        expect(Math.round(chromosome.layers.get(0.5)[0].activationValue * 100) / 100).toEqual(0.99);
        expect(Math.round(chromosome.layers.get(1)[0].nodeValue * 100) / 100).toEqual(1.89);
        expect(chromosome.layers.get(1)[1].nodeValue).toEqual(0.2);
        expect(chromosome.layers.get(1)[2].nodeValue).toEqual(0.7);
        expect(chromosome.layers.get(1)[3].nodeValue).toEqual(2.8);

        const classificationValues2 = [...chromosome.classificationNodes.values()].map(node => Math.round(node.activationValue * 1000) / 1000);
        expect(classificationValues2).toEqual([0.844, 0.156]);
        expect(Math.round(classificationValues2.reduce((a, b) => a + b))).toEqual(1);
    });

    test("Network Activation with example network", () => {
        // https://theneuralblog.com/forward-pass-backpropagation-example/
        const layer: NetworkLayer = new Map<number, NodeGene[]>();
        const i1 = new InputNode(0, "Input", "A");
        const i2 = new InputNode(1, "Input", "B");
        const bias = new BiasNode(2);
        layer.set(0, [i1, i2, bias]);

        const h1 = new HiddenNode(3, 0.5, ActivationFunction.SIGMOID);
        const h2 = new HiddenNode(4, 0.5, ActivationFunction.SIGMOID);
        layer.set(0.5, [h1, h2]);

        const r1 = new RegressionNode(5, new WaitEvent(), "Duration");
        const r2 = new RegressionNode(6, new WaitEvent(), "X");
        layer.set(1, [r1, r2]);

        // Create Connections
        const connections: ConnectionGene[] = [];
        connections.push(new ConnectionGene(i1, h1, 0.1, true, 1));
        connections.push(new ConnectionGene(i1, h2, 0.2, true, 1));
        connections.push(new ConnectionGene(i2, h1, 0.3, true, 1));
        connections.push(new ConnectionGene(i2, h2, 0.4, true, 1));
        connections.push(new ConnectionGene(bias, h1, 0.25, true, 1));
        connections.push(new ConnectionGene(bias, h2, 0.25, true, 1));
        connections.push(new ConnectionGene(h1, r1, 0.5, true, 1));
        connections.push(new ConnectionGene(h1, r2, 0.7, true, 1));
        connections.push(new ConnectionGene(h2, r1, 0.6, true, 1));
        connections.push(new ConnectionGene(h2, r2, 0.8, true, 1));
        connections.push(new ConnectionGene(bias, r1, 0.35, true, 1));
        connections.push(new ConnectionGene(bias, r2, 0.35, true, 1));

        const network = new NeatChromosome(layer, connections, mutationOp, crossoverOp, 'fully');

        const genInputs: InputFeatures = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("A", 0.1);
        sprite1.set("B", 0.5);
        genInputs.set("Input", sprite1);

        network.activateNetwork(genInputs);

        expect(Math.round(network.layers.get(1)[0].activationValue * 1000) / 1000).toEqual(0.735);
        expect(Math.round(network.layers.get(1)[1].activationValue * 1000) / 1000).toEqual(0.780);
    });

    test("Generate Dummy Inputs", () => {
        const chromosome = getSampleNetwork();
        const dummyInputs = chromosome.generateDummyInputs();
        expect(dummyInputs.size).toBe(1);
        expect(dummyInputs.get("Sprite1").size).toBe(3);
        expect(chromosome.activateNetwork(dummyInputs)).toBeTruthy();
    });

    test("Test getRegressionNodes", () => {
        chromosome = generator.get();
        const regressionNodes = chromosome.regressionNodes;
        expect(regressionNodes.get("WaitEvent").length).toEqual(1);
        expect(regressionNodes.get("MouseMoveEvent").length).toEqual(2);
    });

    test("Test updateOutputNodes fullyHidden", () => {
        const hiddenNodeGenerator = new NeatChromosomeGenerator(genInputs, [new WaitEvent()], 'fullyHidden',
            ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));
        chromosome = hiddenNodeGenerator.get();
        const chromosome2 = hiddenNodeGenerator.get();
        const chromosome3 = hiddenNodeGenerator.get();
        const oldNodeSize = chromosome.getNumNodes();
        const oldOutputNodesSize = chromosome.layers.get(1).length;
        const oldRegressionNodesSize = chromosome.regressionNodes.size;
        const oldMapSize = NeatPopulation.nodeToId.size;
        const oldConnectionSize = chromosome.connections.length;
        chromosome.updateOutputNodes([new MouseMoveEvent()]);
        chromosome2.updateOutputNodes([new MouseMoveEvent()]);
        chromosome3.updateOutputNodes([new KeyPressEvent('up arrow')]);
        expect(chromosome.getNumNodes()).toBeGreaterThan(oldNodeSize);
        expect(chromosome.layers.get(1).length).toBeGreaterThan(oldOutputNodesSize);
        expect(chromosome.regressionNodes.size).toBeGreaterThan(oldRegressionNodesSize);
        expect(chromosome.connections.length).toBeGreaterThan(oldConnectionSize);
        expect(NeatPopulation.nodeToId.size).toBe(oldMapSize + 5);
        expect(chromosome.layers.size).toEqual(3);
        expect(chromosome.layers.get(0.5).length).toEqual(8);
        expect(chromosome.layers.get(1)[chromosome.layers.get(1).length - 1].uID).toEqual(
            chromosome2.layers.get(1)[chromosome2.layers.get(1).length - 1].uID);
        expect(chromosome.layers.get(1)[chromosome.layers.get(1).length - 1].uID).not.toEqual(
            chromosome3.layers.get(1)[chromosome3.layers.get(1).length - 1].uID);
    });

    test("Test updateOutputNodes sparse", () => {
        const sparseGenerator = new NeatChromosomeGenerator(genInputs, [new WaitEvent()], 'sparse',
            ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));
        chromosome = sparseGenerator.get();
        const chromosome2 = sparseGenerator.get();
        const chromosome3 = sparseGenerator.get();
        const oldNodeSize = chromosome.getNumNodes();
        const oldOutputNodesSize = chromosome.layers.get(1).length;
        const oldRegressionNodesSize = chromosome.regressionNodes.size;
        const oldConnectionSize = chromosome.connections.length;
        chromosome.updateOutputNodes([new MouseMoveEvent()]);
        chromosome2.updateOutputNodes([new MouseMoveEvent()]);
        chromosome3.updateOutputNodes([new KeyPressEvent('up arrow')]);
        expect(chromosome.getNumNodes()).toBeGreaterThan(oldNodeSize);
        expect(chromosome.layers.get(1).length).toBeGreaterThan(oldOutputNodesSize);
        expect(chromosome.regressionNodes.size).toBeGreaterThan(oldRegressionNodesSize);
        expect(chromosome.connections.length).toBeGreaterThan(oldConnectionSize);
        expect(chromosome.layers.size).toEqual(2);
        expect(chromosome.getAllNodes().filter(node => node instanceof HiddenNode).length).toEqual(0);
    });

    test("Test setUpInputs", () => {
        chromosome = generator.get();
        genInputs.set("New", new Map<string, number>());
        genInputs.get("New").set("First", 1);
        genInputs.get("New").set("Second", 2);
        genInputs.get("Sprite2").set("NewFeature", 10);
        const oldAllNodesSize = chromosome.getNumNodes();
        const spriteFeatureSize = chromosome.inputNodes.size;
        const oldSprite2FeatureSize = chromosome.inputNodes.get("Sprite2").size;
        const oldConnections = chromosome.connections.length;
        chromosome.setUpInputs(genInputs);
        expect(oldAllNodesSize).toBeLessThan(chromosome.getNumNodes());
        expect(spriteFeatureSize).toBeLessThan(chromosome.inputNodes.size);
        expect(oldSprite2FeatureSize).toBeLessThan(chromosome.inputNodes.get("Sprite2").size);
        expect(oldConnections).toEqual(chromosome.connections.length);
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
        let numberHiddenNodes = 0;
        for (const node of chromosome.getAllNodes()) {
            if (node instanceof HiddenNode) {
                node.activationValue = Randomness.getInstance().nextInt(-1, 1);
                numberHiddenNodes++;
            }
        }
        const step = 2;
        chromosome.updateActivationTrace(step);
        expect(chromosome.testActivationTrace.tracedNodes.length).toEqual(numberHiddenNodes);
    });

    test("Get number of executed events", () => {
        const eventAndParams = [
            new EventAndParameters(new WaitEvent(), [1]),
            new EventAndParameters(new KeyPressEvent("Right Arrow"), [])
        ];
        chromosome.trace = new ExecutionTrace(undefined, eventAndParams);
        expect(chromosome.getNumEvents()).toEqual(2);
    });

    test("Get InputFeatures", () => {
        const inputs = chromosome.extractInputFeatures();
        expect(inputs.size).toEqual(2);
        expect(inputs.get("Sprite1").size).toEqual(5);
        expect(inputs.get("Sprite2").size).toEqual(4);
    });

    test("Get OutputFeatures", () => {
        const outputs = chromosome.extractOutputFeatures();
        expect(outputs.size).toEqual(4);
    });

    test("toJSON", () => {
        const json = chromosome.toJSON();
        expect(json['id']).toEqual(chromosome.uID);
        expect(json['aF']).toEqual(ActivationFunction[chromosome.activationFunction]);
        expect(json['cM']).toEqual(chromosome.inputConnectionMethod);
        expect('tf' in json).toBeFalsy();
        expect(Object.keys(json['Nodes']).length).toEqual(chromosome.getNumNodes());
        expect(Object.keys(json['Cons']).length).toEqual(chromosome.connections.length);
        expect(json['AT']).toBeUndefined();
        expect(Object.keys(json).length).toBe(6);

        chromosome.testActivationTrace = new ActivationTrace([]);
        expect(chromosome.toJSON()['AT']).not.toBeUndefined();
    });

});
