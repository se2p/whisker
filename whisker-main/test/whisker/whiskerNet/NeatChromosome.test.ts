import {NeatMutation} from "../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/whiskerNet/Operators/NeatCrossover";
import {ConnectionGene} from "../../../src/whisker/whiskerNet/NetworkComponents/ConnectionGene";
import {NodeGene} from "../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {ActivationFunction} from "../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {HiddenNode} from "../../../src/whisker/whiskerNet/NetworkComponents/HiddenNode";
import {InputNode} from "../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {BiasNode} from "../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";
import {ClassificationNode} from "../../../src/whisker/whiskerNet/NetworkComponents/ClassificationNode";
import {RegressionNode} from "../../../src/whisker/whiskerNet/NetworkComponents/RegressionNode";
import {NeuroevolutionUtil} from "../../../src/whisker/whiskerNet/NeuroevolutionUtil";
import {Species} from "../../../src/whisker/whiskerNet/NeuroevolutionPopulations/Species";
import {WaitEvent} from "../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../src/whisker/testcase/events/MouseMoveEvent";
import {ClickStageEvent} from "../../../src/whisker/testcase/events/ClickStageEvent";
import {KeyPressEvent} from "../../../src/whisker/testcase/events/KeyPressEvent";
import {NeatChromosome} from "../../../src/whisker/whiskerNet/Networks/NeatChromosome";
import {NeatProperties} from "../../../src/whisker/whiskerNet/HyperParameter/NeatProperties";
import {NeatPopulation} from "../../../src/whisker/whiskerNet/NeuroevolutionPopulations/NeatPopulation";
import {NeatChromosomeGenerator} from "../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGenerator";

describe('Test NetworkChromosome', () => {

    let mutationOp: NeatMutation;
    let mutationConfig: Record<string, (string | number)>;
    let crossoverConfig: Record<string, (string | number)>;
    let crossoverOp: NeatCrossover;
    let genInputs: Map<string, Map<string, number>>;
    let generator: NeatChromosomeGenerator;
    let chromosome: NeatChromosome;
    let properties: NeatProperties;
    const activationFunction =  ActivationFunction.SIGMOID;

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

        genInputs = new Map<string, Map<string, number>>();
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
        sprite2.set("DistanceToWhite-X", 8);
        sprite2.set("DistanceToWhite-Y", 9);
        genInputs.set("Sprite2", sprite2);
        const events = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
        generator = new NeatChromosomeGenerator(genInputs, events, 'fully',
            ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));
        chromosome = generator.get();
        properties = new NeatProperties();
        properties.populationSize = 10;
    });

    test('Constructor Test', () => {
        expect(chromosome.activationFunction).toBe(activationFunction);
        expect(chromosome.allNodes.length).toEqual(19);
        expect(chromosome.outputNodes.length).toEqual(9);
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
        expect(chromosome.isRecurrent).toBeFalsy();
        expect(chromosome.outputNodes[0].incomingConnections.length).toBeGreaterThanOrEqual(1);
    });

    test("Test getter and setter", () => {
        const species = new Species(1, true, properties);

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
        chromosome.isRecurrent = true;
        chromosome.coverage = new Set<string>("B");

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
        expect(chromosome.isRecurrent).toBeTruthy();
        expect(chromosome.coverage).toContain("B");
    });

    test("Clone Test without hidden Layer", () => {
        chromosome.generateNetwork();
        const clone = chromosome.cloneStructure(false);
        expect(clone.connections.length).toEqual(chromosome.connections.length);
        expect(clone.allNodes.length).toEqual(chromosome.allNodes.length);
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.outputNodes.length).toEqual(chromosome.outputNodes.length);
        expect(clone.sharedFitness).toEqual(chromosome.sharedFitness);
        expect(clone.activationFunction).toEqual(chromosome.activationFunction);
    });

    test("Clone Test with given gene without hidden Layer", () => {
        const clone = chromosome.cloneWith(chromosome.connections);
        expect(clone.connections.length).toEqual(chromosome.connections.length);
        expect(clone.allNodes.length).toEqual(chromosome.allNodes.length);
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.outputNodes.length).toEqual(chromosome.outputNodes.length);
        expect(clone.sharedFitness).toEqual(chromosome.sharedFitness);
        expect(clone.activationFunction).toEqual(chromosome.activationFunction);
    });

    test("Clone Test with hidden Layer", () => {
        const clone = chromosome.cloneStructure(false);
        expect(clone.connections.length).toEqual(chromosome.connections.length);
        expect(clone.connections[0]).not.toBe(chromosome.connections[0]);
        expect(clone.allNodes.length).toEqual(chromosome.allNodes.length);
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.outputNodes.length).toEqual(chromosome.outputNodes.length);
        expect(clone.sharedFitness).toEqual(chromosome.sharedFitness);
        expect(clone.activationFunction).toEqual(chromosome.activationFunction);
    });

    test("Clone Test with given gene and hidden Layer", () => {
        const clone = chromosome.cloneWith(chromosome.connections);
        expect(clone.connections.length).toEqual(chromosome.connections.length);
        expect(clone.connections[0]).not.toBe(chromosome.connections[0]);
        expect(clone.allNodes.length).toEqual(chromosome.allNodes.length);
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.outputNodes.length).toEqual(chromosome.outputNodes.length);
        expect(clone.sharedFitness).toEqual(chromosome.sharedFitness);
        expect(clone.activationFunction).toEqual(chromosome.activationFunction);
    });

    test('Test generateNetwork with hidden Layer', () => {
        const inputNode = chromosome.inputNodes.get("Sprite1").get("X-Position");
        const outputNode = chromosome.outputNodes[0];
        const hiddenNode = new HiddenNode(7, ActivationFunction.SIGMOID);
        const deepHiddenNode = new HiddenNode(8, ActivationFunction.SIGMOID);
        chromosome.allNodes.push(hiddenNode);
        chromosome.allNodes.push(deepHiddenNode);
        chromosome.connections.push(new ConnectionGene(inputNode, hiddenNode, 0.5, true, 7, false));
        chromosome.connections.push(new ConnectionGene(hiddenNode, outputNode, 0, true, 8, false));
        chromosome.connections.push(new ConnectionGene(hiddenNode, deepHiddenNode, 1, true, 9, false));
        chromosome.connections.push(new ConnectionGene(deepHiddenNode, outputNode, 0.2, true, 10, false));
        chromosome.generateNetwork();
        // InputNodes + Bias + hiddenNodes + classificationNodes + RegressionNodes
        expect(chromosome.allNodes.length).toEqual(9 + 1 + 2 + 4 + 5);
        expect(hiddenNode.incomingConnections.length).toEqual(1);
        expect(deepHiddenNode.incomingConnections.length).toEqual(1);
        expect(chromosome.regressionNodes.get(new WaitEvent().constructor.name).length).toEqual(1);
        expect(chromosome.regressionNodes.get(new MouseMoveEvent().constructor.name).length).toEqual(2);
        expect(chromosome.activationFunction).toEqual(ActivationFunction.SIGMOID);
    });

    test('Network activation without hidden layer', () => {
        // Create input Nodes
        const nodes: NodeGene[] = [];
        const iNode1 = new InputNode(0, "Sprite1", "X-Position");
        const iNode2 = new InputNode(1, "Sprite1", "Y-Position");
        const iNode3 = new InputNode(2, "Sprite1", "Costume");
        const bias = new BiasNode(3);
        nodes.push(iNode1);
        nodes.push(iNode2);
        nodes.push(iNode3);
        nodes.push(bias);

        // Create classification and Regression Output Nodes
        const classificationNode1 = new ClassificationNode(4, new WaitEvent(), ActivationFunction.SIGMOID);
        const classificationNode2 = new ClassificationNode(5, new ClickStageEvent(), ActivationFunction.SIGMOID);
        const regressionNode1 = new RegressionNode(6, new WaitEvent(), "Duration", ActivationFunction.NONE);
        const regressionNode2 = new RegressionNode(7, new MouseMoveEvent(), "X", ActivationFunction.NONE);
        nodes.push(classificationNode1);
        nodes.push(classificationNode2);
        nodes.push(regressionNode1);
        nodes.push(regressionNode2);

        // Create Connections
        const connections: ConnectionGene[] = [];
        connections.push(new ConnectionGene(nodes[0], nodes[4], 0.1, true, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[5], 0.2, true, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[4], 0.3, false, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[5], 0.4, false, 1, false));
        connections.push(new ConnectionGene(nodes[3], nodes[4], 0.5, true, 1, false));
        connections.push(new ConnectionGene(nodes[3], nodes[5], 0.6, false, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[6], 0.7, true, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[7], 0.8, true, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[6], 0.9, false, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[7], 1, true, 1, false));

        chromosome = new NeatChromosome(nodes, connections, mutationOp, crossoverOp, 'fully');
        const inputs = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        inputs.set("Sprite1", sprite1);
        chromosome.activateNetwork(inputs);
        for (let i = 0; i < chromosome.getMaxDepth(); i++) {
            chromosome.activateNetwork(inputs);
        }
        const availableEvents = [new WaitEvent(), new ClickStageEvent()];
        const softmaxOutput = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents);
        for (const key of softmaxOutput.keys()) {
            softmaxOutput.set(key, Number(softmaxOutput.get(key).toFixed(3)));
        }
        expect(chromosome.outputNodes[0].nodeValue).toEqual(0.6);
        expect(chromosome.outputNodes[1].nodeValue).toEqual(0.2);
        expect(chromosome.outputNodes[2].nodeValue).toEqual(0.7);
        expect(chromosome.outputNodes[3].nodeValue).toEqual(2.8);
        expect([...softmaxOutput.values()]).toEqual([0.599, 0.401]);
        expect(Math.round([...softmaxOutput.values()].reduce((a, b) => a + b))).toEqual(1);
    });

    test('Network activation without hidden layer and novel inputs', () => {
        // Create input Nodes
        const nodes: NodeGene[] = [];
        const iNode1 = new InputNode(0, "Sprite1", "X-Position");
        const iNode2 = new InputNode(1, "Sprite1", "Y-Position");
        const iNode3 = new InputNode(2, "Sprite1", "Costume");
        const bias = new BiasNode(3);
        nodes.push(iNode1);
        nodes.push(iNode2);
        nodes.push(iNode3);
        nodes.push(bias);

        // Create classification and Regression Output Nodes
        const classificationNode1 = new ClassificationNode(4, new WaitEvent(), ActivationFunction.SIGMOID);
        const classificationNode2 = new ClassificationNode(5, new ClickStageEvent(), ActivationFunction.SIGMOID);
        const regressionNode1 = new RegressionNode(6, new WaitEvent(), "Duration", ActivationFunction.NONE);
        const regressionNode2 = new RegressionNode(7, new MouseMoveEvent(), "X", ActivationFunction.NONE);
        nodes.push(classificationNode1);
        nodes.push(classificationNode2);
        nodes.push(regressionNode1);
        nodes.push(regressionNode2);

        // Create Connections
        const connections: ConnectionGene[] = [];
        connections.push(new ConnectionGene(nodes[0], nodes[4], 0.1, true, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[5], 0.2, true, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[4], 0.3, false, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[5], 0.4, false, 1, false));
        connections.push(new ConnectionGene(nodes[3], nodes[4], 0.5, true, 1, false));
        connections.push(new ConnectionGene(nodes[3], nodes[5], 0.6, false, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[6], 0.7, true, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[7], 0.8, true, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[6], 0.9, false, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[7], 1, true, 1, false));

        chromosome = new NeatChromosome(nodes, connections, mutationOp, crossoverOp, 'fully');
        const chromosome2 = new NeatChromosome(nodes, connections, mutationOp, crossoverOp, 'fully');
        const inputs = new Map<string, Map<string, number>>();
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

    test('Network activation without hidden layer and deactivated input nodes', () => {
        // Create input Nodes
        const nodes: NodeGene[] = [];
        const iNode1 = new InputNode(0, "Sprite1", "X-Position");
        const iNode2 = new InputNode(1, "Sprite1", "Y-Position");
        const iNode3 = new InputNode(2, "Sprite1", "Costume");
        const bias = new BiasNode(3);
        nodes.push(iNode1);
        nodes.push(iNode2);
        nodes.push(iNode3);
        nodes.push(bias);

        // Create classification and Regression Output Nodes
        const classificationNode1 = new ClassificationNode(4, new WaitEvent(), ActivationFunction.SIGMOID);
        const classificationNode2 = new ClassificationNode(5, new ClickStageEvent(), ActivationFunction.SIGMOID);
        const regressionNode1 = new RegressionNode(6, new WaitEvent(), "Duration", ActivationFunction.NONE);
        const regressionNode2 = new RegressionNode(7, new MouseMoveEvent(), "X", ActivationFunction.NONE);
        nodes.push(classificationNode1);
        nodes.push(classificationNode2);
        nodes.push(regressionNode1);
        nodes.push(regressionNode2);

        // Create Connections
        const connections: ConnectionGene[] = [];
        connections.push(new ConnectionGene(nodes[0], nodes[4], 0.1, true, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[5], 0.2, true, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[4], 0.3, true, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[5], 0.4, true, 1, false));
        connections.push(new ConnectionGene(nodes[3], nodes[4], 0.5, true, 1, false));
        connections.push(new ConnectionGene(nodes[3], nodes[5], 0.6, true, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[6], 0.7, true, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[7], 0.8, true, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[6], 0.9, true, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[7], 1, true, 1, false));

        chromosome = new NeatChromosome(nodes, connections, mutationOp, crossoverOp, 'fully');
        const inputs = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        inputs.set("Sprite1", sprite1);
        chromosome.activateNetwork(inputs);
        for (let i = 0; i < chromosome.getMaxDepth(); i++) {
            chromosome.activateNetwork(inputs);
        }
        const availableEvents = [new WaitEvent(), new ClickStageEvent()];
        const softmaxOutput = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents);
        for (const key of softmaxOutput.keys()) {
            softmaxOutput.set(key, Number(softmaxOutput.get(key).toFixed(3)));
        }
        expect(nodes[1].activatedFlag).toBeFalsy();
        expect(chromosome.outputNodes[0].nodeValue).toEqual(0.6);
        expect(chromosome.outputNodes[1].nodeValue).toEqual(0.8);
        expect(chromosome.outputNodes[2].nodeValue).toEqual(0.7);
        expect(chromosome.outputNodes[3].nodeValue).toEqual(0.8);
        expect(nodes[0].activatedFlag).toBeTruthy();
        expect([...softmaxOutput.values()]).toEqual([0.45, 0.55]);
        expect(Math.round([...softmaxOutput.values()].reduce((a, b) => a + b))).toEqual(1);
    });

    test('Network activation with hidden layer', () => {
        // Create input Nodes
        const nodes: NodeGene[] = [];
        const iNode1 = new InputNode(0, "Sprite1", "X-Position");
        const iNode2 = new InputNode(1, "Sprite2", "X-Position");
        const iNode3 = new InputNode(2, "Sprite2", "Costumes");
        const bias = new BiasNode(3);
        nodes.push(iNode1);
        nodes.push(iNode2);
        nodes.push(iNode3);
        nodes.push(bias);

        // Create classification and Regression Output Nodes
        const classificationNode1 = new ClassificationNode(4, new WaitEvent(), ActivationFunction.SIGMOID);
        const classificationNode2 = new ClassificationNode(5, new ClickStageEvent(), ActivationFunction.SIGMOID);
        nodes.push(classificationNode1);
        nodes.push(classificationNode2);

        const hiddenNode = new HiddenNode(6, ActivationFunction.SIGMOID);
        const deepHiddenNode = new HiddenNode(7, ActivationFunction.SIGMOID);
        nodes.push(hiddenNode);
        nodes.push(deepHiddenNode);

        // Create Connections
        const connections: ConnectionGene[] = [];
        connections.push(new ConnectionGene(nodes[0], nodes[4], 0.1, true, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[5], 0.2, true, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[4], 0.3, false, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[5], 0.4, false, 1, false));
        connections.push(new ConnectionGene(nodes[3], nodes[4], 0.5, true, 1, false));
        connections.push(new ConnectionGene(nodes[3], nodes[5], 0.6, false, 1, false));
        connections.push(new ConnectionGene(nodes[1], hiddenNode, 0.7, true, 1, false));
        connections.push(new ConnectionGene(hiddenNode, deepHiddenNode, 0.8, true, 1, false));
        connections.push(new ConnectionGene(deepHiddenNode, nodes[5], 0.9, true, 1, false));

        chromosome = new NeatChromosome(nodes, connections, mutationOp, crossoverOp, 'fully');
        const inputs = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        const sprite2 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite2.set("X-Position", 2);
        inputs.set("Sprite1", sprite1);
        inputs.set("Sprite2", sprite2);
        chromosome.flushNodeValues();
        const depth = chromosome.getMaxDepth();
        for (let i = 0; i < depth; i++) {
            chromosome.activateNetwork(inputs);
        }
        const availableEvents = [new WaitEvent(), new ClickStageEvent()];
        const softmaxOutput = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents);
        for (const key of softmaxOutput.keys()) {
            softmaxOutput.set(key, Number(softmaxOutput.get(key).toFixed(3)));
        }
        expect(hiddenNode.nodeValue).toEqual(1.4);
        expect(Number(hiddenNode.activationValue.toFixed(3))).toEqual(0.802);
        expect(Number(deepHiddenNode.nodeValue.toFixed(3))).toEqual(0.642);
        expect(Number(deepHiddenNode.activationValue.toFixed(3))).toEqual(0.655);
        expect(Number(nodes[7].nodeValue.toFixed(3))).toEqual(0.79);
        expect(nodes[6].nodeValue).toEqual(0.6);
        expect([...softmaxOutput.values()]).toEqual([0.453, 0.547]);
        expect(Math.round([...softmaxOutput.values()].reduce((a, b) => a + b))).toEqual(1);
    });

    test('Network activation with recurrent connections', () => {
        // Create input Nodes
        const nodes: NodeGene[] = [];
        const iNode1 = new InputNode(0, "Sprite1", "X-Position");
        const iNode2 = new InputNode(1, "Sprite1", "Y-Position");
        const iNode3 = new InputNode(2, "Sprite1", "Costumes");
        const bias = new BiasNode(3);
        nodes.push(iNode1);
        nodes.push(iNode2);
        nodes.push(iNode3);
        nodes.push(bias);

        // Create classification and Regression Output Nodes
        const classificationNode1 = new ClassificationNode(4, new WaitEvent(), ActivationFunction.SIGMOID);
        const classificationNode2 = new ClassificationNode(5, new ClickStageEvent(), ActivationFunction.SIGMOID);
        nodes.push(classificationNode1);
        nodes.push(classificationNode2);

        const hiddenNode = new HiddenNode(6, ActivationFunction.SIGMOID);
        const deepHiddenNode = new HiddenNode(7, ActivationFunction.SIGMOID);
        nodes.push(hiddenNode);
        nodes.push(deepHiddenNode);

        // Create Connections
        const connections: ConnectionGene[] = [];
        connections.push(new ConnectionGene(nodes[0], nodes[3], 0.1, true, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[4], 0.2, true, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[3], 0.3, false, 1, false));
        connections.push(new ConnectionGene(nodes[1], nodes[4], 0.4, false, 1, false));
        connections.push(new ConnectionGene(nodes[2], nodes[3], 0.5, true, 1, false));
        connections.push(new ConnectionGene(nodes[2], nodes[4], 0.6, false, 1, false));
        connections.push(new ConnectionGene(nodes[1], hiddenNode, 0.7, true, 1, false));
        connections.push(new ConnectionGene(hiddenNode, deepHiddenNode, 0.8, true, 1, false));
        connections.push(new ConnectionGene(deepHiddenNode, hiddenNode, 1, true, 1, true));
        connections.push(new ConnectionGene(deepHiddenNode, nodes[4], 0.9, true, 1, false));

        chromosome = new NeatChromosome(nodes, connections, mutationOp, crossoverOp, 'fully');
        const inputs = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        inputs.set("Sprite1", sprite1);
        chromosome.flushNodeValues();
        const depth = chromosome.getMaxDepth();
        for (let i = 0; i < depth; i++) {
            chromosome.activateNetwork(inputs);
        }
        const availableEvents = [new WaitEvent(), new ClickStageEvent()];
        const firstOutput = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents);

        // New input has to propagate through network.
        sprite1.set("X-Position", 5);
        sprite1.set("Y-Position", 4);
        inputs.set("Sprite1", sprite1);
        chromosome.activateNetwork(inputs);
        const secondOutput = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents);
        chromosome.activateNetwork(inputs);
        expect(Math.round([...firstOutput.values()].reduce((a, b) => a + b))).toEqual(1);
        expect(Math.round([...secondOutput.values()].reduce((a, b) => a + b))).toEqual(1);
    });

    test("Test the recurrent Network check", () => {
        // Create input Nodes
        const nodes: NodeGene[] = [];
        const iNode1 = new InputNode(0, "Sprite1", "X-Position");
        const iNode2 = new InputNode(1, "Sprite1", "Y-Position");
        const iNode3 = new InputNode(2, "Sprite1", "Costume");
        const bias = new BiasNode(3);
        nodes.push(iNode1);
        nodes.push(iNode2);
        nodes.push(iNode3);
        nodes.push(bias);

        // Create classification and Regression Output Nodes
        const classificationNode1 = new ClassificationNode(4, new WaitEvent(), ActivationFunction.SIGMOID);
        const classificationNode2 = new ClassificationNode(5, new ClickStageEvent(), ActivationFunction.SIGMOID);
        nodes.push(classificationNode1);
        nodes.push(classificationNode2);

        const hiddenNode = new HiddenNode(6, ActivationFunction.SIGMOID);
        const deepHiddenNode = new HiddenNode(7, ActivationFunction.SIGMOID);
        nodes.push(hiddenNode);
        nodes.push(deepHiddenNode);

        // Create Connections
        const connections: ConnectionGene[] = [];
        connections.push(new ConnectionGene(nodes[0], nodes[4], 0.2, true, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[5], 0.5, false, 2, false));
        connections.push(new ConnectionGene(nodes[1], nodes[4], 0.2, false, 3, false));
        connections.push(new ConnectionGene(nodes[1], nodes[5], 1, true, 4, false));
        connections.push(new ConnectionGene(nodes[3], nodes[4], 0.2, true, 5, false));
        connections.push(new ConnectionGene(nodes[3], nodes[5], 0.7, true, 6, false));
        connections.push(new ConnectionGene(nodes[0], hiddenNode, 0.3, true, 7, false));
        connections.push(new ConnectionGene(hiddenNode, nodes[4], 0.7, true, 8, false));
        connections.push(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9, false));
        connections.push(new ConnectionGene(deepHiddenNode, hiddenNode, 1, true, 10, true));
        connections.push(new ConnectionGene(deepHiddenNode, nodes[5], 1, true, 11, false));
        connections.push(new ConnectionGene(deepHiddenNode, deepHiddenNode, 1, true, 12, true));
        connections.push(new ConnectionGene(nodes[5], deepHiddenNode, 1, true, 13, true));

        chromosome = new NeatChromosome(nodes, connections, mutationOp, crossoverOp, 'fully');
        const threshold = chromosome.allNodes.length * chromosome.allNodes.length;
        expect(chromosome.isRecurrentPath(deepHiddenNode, hiddenNode, 0, threshold)).toBeTruthy();
        expect(chromosome.isRecurrentPath(deepHiddenNode, deepHiddenNode, 0, threshold)).toBeTruthy();
        expect(chromosome.isRecurrentPath(hiddenNode, deepHiddenNode, 0, threshold)).toBeFalsy();
        expect(chromosome.isRecurrentPath(nodes[5], deepHiddenNode, 0, threshold)).toBeTruthy();
        expect(chromosome.isRecurrentPath(nodes[0], nodes[4], 0, threshold)).toBeFalsy();
        expect(chromosome.isRecurrentPath(nodes[4], nodes[0], 0, threshold)).toBeTruthy();
        expect(chromosome.isRecurrentPath(nodes[0], nodes[1], 0, threshold)).toBeFalsy();
    });

    test("Test getRegressionNodes", () => {
        chromosome = generator.get();
        const regressionNodes = chromosome.regressionNodes;
        expect(regressionNodes.get("WaitEvent").length).toEqual(1);
        expect(regressionNodes.get("MouseMoveEvent").length).toEqual(2);
    });

    test("Test updateOutputNodes", () => {
        const hiddenNodeGenerator = new NeatChromosomeGenerator(genInputs, [new WaitEvent()], 'fullyHidden',
            ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));
        chromosome = hiddenNodeGenerator.get();
        const chromosome2 = hiddenNodeGenerator.get();
        const chromosome3 = hiddenNodeGenerator.get();
        const oldNodeSize = chromosome.allNodes.length;
        const oldOutputNodesSize = chromosome.outputNodes.length;
        const oldRegressionNodesSize = chromosome.regressionNodes.size;
        const oldMapSize = NeatPopulation.nodeToId.size;
        const oldConnectionSize = chromosome.connections.length;
        const nHiddenNodesBefore = chromosome.allNodes.filter(node => node instanceof HiddenNode).length;
        chromosome.updateOutputNodes([new MouseMoveEvent()]);
        chromosome2.updateOutputNodes([new MouseMoveEvent()]);
        chromosome3.updateOutputNodes([new KeyPressEvent('up arrow')]);
        expect(chromosome.allNodes.length).toBeGreaterThan(oldNodeSize);
        expect(chromosome.outputNodes.length).toBeGreaterThan(oldOutputNodesSize);
        expect(chromosome.regressionNodes.size).toBeGreaterThan(oldRegressionNodesSize);
        expect(chromosome.connections.length).toBeGreaterThan(oldConnectionSize);
        expect(NeatPopulation.nodeToId.size).toBe(oldMapSize + 5);
        expect(nHiddenNodesBefore).toBeLessThan(chromosome.allNodes.filter(node => node instanceof HiddenNode).length);
        expect(chromosome.outputNodes[chromosome.outputNodes.length - 1].uID).toEqual(
            chromosome2.outputNodes[chromosome2.outputNodes.length - 1].uID);
        expect(chromosome.outputNodes[chromosome.outputNodes.length - 1].uID).not.toEqual(
            chromosome3.outputNodes[chromosome3.outputNodes.length - 1].uID);
    });

    test("Test setUpInputs", () => {
        chromosome = generator.get();
        genInputs.set("New", new Map<string, number>());
        genInputs.get("New").set("First", 1);
        genInputs.get("New").set("Second", 2);
        genInputs.get("Sprite2").set("NewFeature", 10);
        const oldAllNodesSize = chromosome.allNodes.length;
        const spriteFeatureSize = chromosome.inputNodes.size;
        const oldSprite2FeatureSize = chromosome.inputNodes.get("Sprite2").size;
        const oldConnections = chromosome.connections.length;
        chromosome.setUpInputs(genInputs);
        expect(oldAllNodesSize).toBeLessThan(chromosome.allNodes.length);
        expect(spriteFeatureSize).toBeLessThan(chromosome.inputNodes.size);
        expect(oldSprite2FeatureSize).toBeLessThan(chromosome.inputNodes.get("Sprite2").size);
        expect(oldConnections).toEqual(chromosome.connections.length);
    });

    test("Test toString", () => {
        const network = generator.get();
        network.connections[0].isEnabled = false;
        expect(network.toString().split('\n').length).toBeGreaterThan(network.connections.length);
    });
});
