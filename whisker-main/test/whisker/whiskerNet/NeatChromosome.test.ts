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
import {NeatChromosomeGeneratorSparse} from "../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGeneratorSparse";
import {NeatChromosome} from "../../../src/whisker/whiskerNet/Networks/NeatChromosome";
import {NeatProperties} from "../../../src/whisker/whiskerNet/HyperParameter/NeatProperties";

describe('Test NetworkChromosome', () => {

    let mutationOp: NeatMutation;
    let mutationConfig: Record<string, (string | number)>;
    let crossoverConfig: Record<string, (string | number)>;
    let crossoverOp: NeatCrossover;
    let genInputs: Map<string, Map<string, number>>;
    let generator: NeatChromosomeGeneratorSparse;
    let chromosome: NeatChromosome;
    let properties: NeatProperties;

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
        generator = new NeatChromosomeGeneratorSparse(mutationConfig, crossoverConfig, genInputs, events, 0.4);
        chromosome = generator.get();
        properties = new NeatProperties(10);
    })

    test('Constructor Test', () => {
        expect(chromosome.allNodes.length).toEqual(19);
        expect(chromosome.outputNodes.length).toEqual(9);
        expect(chromosome.classificationNodes.size).toEqual(4);
        expect(chromosome.regressionNodes.size).toEqual(4);
        expect(chromosome.inputNodes.get("Sprite1").size).toEqual(5);
        expect(chromosome.inputNodes.get("Sprite2").size).toEqual(4);
        expect(chromosome.connections.length).toBeGreaterThanOrEqual(36);
        expect(chromosome.getCrossoverOperator() instanceof NeatCrossover).toBeTruthy();
        expect(chromosome.getMutationOperator() instanceof NeatMutation).toBeTruthy();
        expect(chromosome.fitness).toEqual(0);
        expect(chromosome.sharedFitness).toEqual(0);
        expect(chromosome.species).toEqual(undefined);
        expect(chromosome.isSpeciesChampion).toBeFalsy();
        expect(chromosome.isPopulationChampion).toBeFalsy();
        expect(chromosome.isParent).toBeFalsy();
        expect(chromosome.expectedOffspring).toEqual(undefined);
        expect(chromosome.numberOffspringPopulationChamp).toEqual(undefined);
        expect(chromosome.trace).toEqual(undefined);
        expect(chromosome.coverage.size).toEqual(0);
        expect(chromosome.codons.length).toBe(0);
        expect(chromosome.isRecurrent).toBeFalsy();
        expect(chromosome.outputNodes[0].incomingConnections.length).toBeGreaterThanOrEqual(4);
    })

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
    })

    test("Clone Test without hidden Layer", () => {
        chromosome.generateNetwork();
        const clone = chromosome.cloneStructure(false);
        expect(clone.connections.length).toEqual(chromosome.connections.length);
        expect(clone.allNodes.length).toEqual(chromosome.allNodes.length);
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.outputNodes.length).toEqual(chromosome.outputNodes.length);
        expect(clone.sharedFitness).toEqual(chromosome.sharedFitness);
    })

    test("Clone Test with given gene without hidden Layer", () => {
        const clone = chromosome.cloneWith(chromosome.connections);
        expect(clone.connections.length).toEqual(chromosome.connections.length);
        expect(clone.allNodes.length).toEqual(chromosome.allNodes.length);
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.outputNodes.length).toEqual(chromosome.outputNodes.length);
        expect(clone.sharedFitness).toEqual(chromosome.sharedFitness);
    })

    test("Clone Test with hidden Layer", () => {
        const clone = chromosome.cloneStructure(false);
        expect(clone.connections.length).toEqual(chromosome.connections.length);
        expect(clone.connections[0]).not.toBe(chromosome.connections[0]);
        expect(clone.allNodes.length).toEqual(chromosome.allNodes.length);
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.outputNodes.length).toEqual(chromosome.outputNodes.length);
        expect(clone.sharedFitness).toEqual(chromosome.sharedFitness);
    })

    test("Clone Test with given gene and hidden Layer", () => {
        const clone = chromosome.cloneWith(chromosome.connections);
        expect(clone.connections.length).toEqual(chromosome.connections.length);
        expect(clone.connections[0]).not.toBe(chromosome.connections[0]);
        expect(clone.allNodes.length).toEqual(chromosome.allNodes.length);
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.outputNodes.length).toEqual(chromosome.outputNodes.length);
        expect(clone.sharedFitness).toEqual(chromosome.sharedFitness);
    })

    test('Test generateNetwork with hidden Layer', () => {
        const inputNode = chromosome.inputNodes.get("Sprite1").get("X-Position");
        const outputNode = chromosome.outputNodes[0];
        const hiddenNode = new HiddenNode(ActivationFunction.SIGMOID);
        hiddenNode.uID = 7;
        const deepHiddenNode = new HiddenNode(ActivationFunction.SIGMOID);
        deepHiddenNode.uID = 8;
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
    })

    test('Test stabilizedCounter without hidden Layer', () => {
        const nodes: NodeGene[] = [];
        const iNode1 = new InputNode("Sprite1", "X-Position");
        iNode1.uID = 0;
        const iNode2 = new InputNode("Sprite1", "Y-Position");
        iNode2.uID = 1;
        const bias = new BiasNode();
        bias.uID = 2;

        nodes.push(iNode1);
        nodes.push(iNode2);
        nodes.push(bias);

        // Create classification Output Nodes
        const classificationNode1 = new ClassificationNode(new WaitEvent(), ActivationFunction.SIGMOID);
        classificationNode1.uID = 3;
        const classificationNode2 = new ClassificationNode(new ClickStageEvent(), ActivationFunction.SIGMOID);
        classificationNode2.uID = 4;
        nodes.push(classificationNode1);
        nodes.push(classificationNode2);

        // Create Connections
        const connections: ConnectionGene[] = [];
        connections.push(new ConnectionGene(nodes[0], nodes[3], 0.2, true, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[4], 0.5, false, 2, false));
        connections.push(new ConnectionGene(nodes[1], nodes[3], 0.2, false, 3, false));
        connections.push(new ConnectionGene(nodes[1], nodes[4], 1, true, 4, false));
        connections.push(new ConnectionGene(nodes[2], nodes[3], 0.2, true, 5, false));
        connections.push(new ConnectionGene(nodes[2], nodes[4], 0.7, true, 6, false));

        chromosome = new NeatChromosome(nodes, connections, mutationOp, crossoverOp);
        const counter = chromosome.updateStabiliseCount(5);
        expect(counter).toEqual(2);
    })

    test('Test stabilizedCounter with hidden Layer', () => {
        const nodes: NodeGene[] = [];
        const iNode1 = new InputNode("Sprite1", "X-Position");
        iNode1.uID = 0;
        const iNode2 = new InputNode("Sprite1", "Y-Position");
        iNode2.uID = 1;
        const bias = new BiasNode();
        bias.uID = 2;
        nodes.push(iNode1);
        nodes.push(iNode2);
        nodes.push(bias);

        // Create classification Output Nodes
        const classificationNode1 = new ClassificationNode(new WaitEvent(), ActivationFunction.SIGMOID);
        classificationNode1.uID = 3;
        const classificationNode2 = new ClassificationNode(new ClickStageEvent(), ActivationFunction.SIGMOID);
        classificationNode2.uID = 4;
        nodes.push(classificationNode1);
        nodes.push(classificationNode2);

        const hiddenNode = new HiddenNode(ActivationFunction.SIGMOID);
        hiddenNode.uID = 5;
        const deepHiddenNode = new HiddenNode(ActivationFunction.SIGMOID);
        deepHiddenNode.uID = 6;
        nodes.push(hiddenNode);
        nodes.push(deepHiddenNode);

        // Create Connections
        const connections: ConnectionGene[] = [];
        connections.push(new ConnectionGene(nodes[0], nodes[3], 0.2, true, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[4], 0.5, false, 2, false));
        connections.push(new ConnectionGene(nodes[1], nodes[3], 0.2, false, 3, false));
        connections.push(new ConnectionGene(nodes[1], nodes[4], 1, true, 4, false));
        connections.push(new ConnectionGene(nodes[2], nodes[3], 0.2, true, 5, false));
        connections.push(new ConnectionGene(nodes[2], nodes[4], 0.7, true, 6, false));
        connections.push(new ConnectionGene(nodes[0], hiddenNode, 0.3, true, 7, false));
        connections.push(new ConnectionGene(hiddenNode, nodes[3], 0.7, true, 8, false));
        connections.push(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9, false));
        connections.push(new ConnectionGene(deepHiddenNode, nodes[4], 1, true, 10, false));

        chromosome = new NeatChromosome(nodes, connections, mutationOp, crossoverOp);
        const counter = chromosome.updateStabiliseCount(5);
        expect(counter).toEqual(4);
    })

    test('Test stabilizedCounter with unstable network', () => {
        const nodes: NodeGene[] = [];
        const iNode1 = new InputNode("Sprite1", "X-Position");
        iNode1.uID = 0;
        const iNode2 = new InputNode("Sprite1", "Y-Position");
        iNode2.uID = 1;
        const bias = new BiasNode();
        bias.uID = 2;
        nodes.push(iNode1);
        nodes.push(iNode2);
        nodes.push(bias);

        // Create classification Output Nodes
        const classificationNode1 = new ClassificationNode(new WaitEvent(), ActivationFunction.SIGMOID);
        classificationNode1.uID = 3;
        const classificationNode2 = new ClassificationNode(new ClickStageEvent(), ActivationFunction.SIGMOID);
        classificationNode2.uID = 4;
        nodes.push(classificationNode1);
        nodes.push(classificationNode2);

        // Create Connections
        const connections: ConnectionGene[] = [];
        connections.push(new ConnectionGene(nodes[0], nodes[3], 0.2, false, 1, false));
        connections.push(new ConnectionGene(nodes[0], nodes[4], 0.5, false, 2, false));
        connections.push(new ConnectionGene(nodes[1], nodes[3], 0.2, false, 3, false));
        connections.push(new ConnectionGene(nodes[1], nodes[4], 1, false, 4, false));
        connections.push(new ConnectionGene(nodes[2], nodes[3], 0.2, false, 5, false));
        connections.push(new ConnectionGene(nodes[2], nodes[4], 0.7, false, 6, false));

        chromosome = new NeatChromosome(nodes, connections, mutationOp, crossoverOp);
        const counter = chromosome.updateStabiliseCount(5);
        expect(counter).toEqual(-1);
    })

    test('Network activation without hidden layer', () => {
        // Create input Nodes
        const nodes: NodeGene[] = [];
        const iNode1 = new InputNode("Sprite1", "X-Position");
        iNode1.uID = 0;
        const iNode2 = new InputNode("Sprite1", "Y-Position");
        iNode2.uID = 1;
        const iNode3 = new InputNode("Sprite1", "Costume");
        iNode3.uID = 2;
        const bias = new BiasNode();
        bias.uID = 3;
        nodes.push(iNode1);
        nodes.push(iNode2);
        nodes.push(iNode3);
        nodes.push(bias);

        // Create classification and Regression Output Nodes
        const classificationNode1 = new ClassificationNode(new WaitEvent(), ActivationFunction.SIGMOID);
        classificationNode1.uID = 4;
        const classificationNode2 = new ClassificationNode(new ClickStageEvent(), ActivationFunction.SIGMOID);
        classificationNode2.uID = 5;
        const regressionNode1 = new RegressionNode(new WaitEvent(), "Duration", ActivationFunction.NONE);
        regressionNode1.uID = 6;
        const regressionNode2 = new RegressionNode(new MouseMoveEvent(), "X", ActivationFunction.NONE);
        regressionNode2.uID = 7;
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

        chromosome = new NeatChromosome(nodes, connections, mutationOp, crossoverOp);
        const inputs = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        inputs.set("Sprite1", sprite1);
        chromosome.activateNetwork(inputs);
        const availableEvents = [new WaitEvent(), new ClickStageEvent()];
        const softmaxOutput: number[] = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents)
        for (let i = 0; i < softmaxOutput.length; i++) {
            softmaxOutput[i] = Number(softmaxOutput[i].toFixed(3))
        }
        expect(chromosome.outputNodes[0].nodeValue).toEqual(0.6);
        expect(chromosome.outputNodes[1].nodeValue).toEqual(0.2);
        expect(chromosome.outputNodes[2].nodeValue).toEqual(0.7)
        expect(chromosome.outputNodes[3].nodeValue).toEqual(2.8)
        expect(softmaxOutput).toEqual([0.599, 0.401]);
        expect(Math.round(softmaxOutput.reduce((a, b) => a + b))).toEqual(1);
    })

    test('Network activation with hidden layer', () => {
        // Create input Nodes
        const nodes: NodeGene[] = [];
        const iNode1 = new InputNode("Sprite1", "X-Position");
        iNode1.uID = 0;
        const iNode2 = new InputNode("Sprite2", "X-Position");
        iNode2.uID = 1;
        const iNode3 = new InputNode("Sprite2", "Costumes");
        iNode3.uID = 2;
        const bias = new BiasNode();
        bias.uID = 3;
        nodes.push(iNode1);
        nodes.push(iNode2);
        nodes.push(iNode3);
        nodes.push(bias);

        // Create classification and Regression Output Nodes
        const classificationNode1 = new ClassificationNode(new WaitEvent(), ActivationFunction.SIGMOID);
        classificationNode1.uID = 4;
        const classificationNode2 = new ClassificationNode(new ClickStageEvent(), ActivationFunction.SIGMOID);
        classificationNode2.uID = 5;
        nodes.push(classificationNode1);
        nodes.push(classificationNode2);

        const hiddenNode = new HiddenNode(ActivationFunction.SIGMOID);
        hiddenNode.uID = 6;
        const deepHiddenNode = new HiddenNode(ActivationFunction.SIGMOID);
        deepHiddenNode.uID = 7;
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

        chromosome = new NeatChromosome(nodes, connections, mutationOp, crossoverOp);
        const inputs = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        const sprite2 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite2.set("X-Position", 2);
        inputs.set("Sprite1", sprite1);
        inputs.set("Sprite2", sprite2);
        chromosome.activateNetwork(inputs);
        chromosome.flushNodeValues();
        for (let i = 0; i < 5; i++) {
            chromosome.activateNetwork(inputs);
        }
        const availableEvents = [new WaitEvent(), new ClickStageEvent()];
        const softmaxOutput: number[] = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents);
        for (let i = 0; i < softmaxOutput.length; i++) {
            softmaxOutput[i] = Number(softmaxOutput[i].toFixed(3));
        }
        expect(hiddenNode.nodeValue).toEqual(1.4);
        expect(Number(hiddenNode.activationValue.toFixed(3))).toEqual(0.999);
        expect(Number(deepHiddenNode.nodeValue.toFixed(3))).toEqual(0.799);
        expect(Number(deepHiddenNode.activationValue.toFixed(3))).toEqual(0.980);
        expect(Number(nodes[7].nodeValue.toFixed(3))).toEqual(1.082);
        expect(nodes[6].nodeValue).toEqual(0.6);
        expect(softmaxOutput).toEqual([0.382, 0.618]);
        expect(Math.round(softmaxOutput.reduce((a, b) => a + b))).toEqual(1);
    })

    test('Network activation with recurrent connections', () => {
        // Create input Nodes
        const nodes: NodeGene[] = [];
        const iNode1 = new InputNode("Sprite1", "X-Position");
        iNode1.uID = 0;
        const iNode2 = new InputNode("Sprite1", "Y-Position");
        iNode2.uID = 1;
        const iNode3 = new InputNode("Sprite1", "Costumes");
        iNode3.uID = 2;
        const bias = new BiasNode();
        bias.uID = 3;
        nodes.push(iNode1);
        nodes.push(iNode2);
        nodes.push(iNode3);
        nodes.push(bias);

        // Create classification and Regression Output Nodes
        const classificationNode1 = new ClassificationNode(new WaitEvent(), ActivationFunction.SIGMOID);
        classificationNode1.uID = 4;
        const classificationNode2 = new ClassificationNode(new ClickStageEvent(), ActivationFunction.SIGMOID);
        classificationNode2.uID = 5;
        nodes.push(classificationNode1);
        nodes.push(classificationNode2);

        const hiddenNode = new HiddenNode(ActivationFunction.SIGMOID);
        hiddenNode.uID = 6;
        const deepHiddenNode = new HiddenNode(ActivationFunction.SIGMOID);
        deepHiddenNode.uID = 7;
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

        chromosome = new NeatChromosome(nodes, connections, mutationOp, crossoverOp);
        const inputs = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        inputs.set("Sprite1", sprite1);
        chromosome.activateNetwork(inputs);
        const availableEvents = [new WaitEvent(), new ClickStageEvent()];
        chromosome.activateNetwork(inputs);
        const firstOutput = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents);
        // New input has to propagate through network.
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 4);
        inputs.set("Sprite1", sprite1);
        chromosome.activateNetwork(inputs);
        chromosome.activateNetwork(inputs);
        const secondOutput = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents);
        chromosome.activateNetwork(inputs);
        chromosome.activateNetwork(inputs);
        const thirdOutput = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents);
        expect(chromosome.updateStabiliseCount(100)).toEqual(0);
        expect(Math.round(firstOutput.reduce((a, b) => a + b))).toEqual(1);
        expect(Math.round(secondOutput.reduce((a, b) => a + b))).toEqual(1);
        expect(Math.round(thirdOutput.reduce((a, b) => a + b))).toEqual(1);
    })

    test("Test the recurrent Network check", () => {
        // Create input Nodes
        const nodes: NodeGene[] = [];
        const iNode1 = new InputNode("Sprite1", "X-Position");
        iNode1.uID = 0;
        const iNode2 = new InputNode("Sprite1", "Y-Position");
        iNode2.uID = 1;
        const iNode3 = new InputNode("Sprite1", "Costume");
        iNode3.uID = 2;
        const bias = new BiasNode();
        bias.uID = 3;
        nodes.push(iNode1);
        nodes.push(iNode2);
        nodes.push(iNode3);
        nodes.push(bias);

        // Create classification and Regression Output Nodes
        const classificationNode1 = new ClassificationNode(new WaitEvent(), ActivationFunction.SIGMOID);
        classificationNode1.uID = 4;
        const classificationNode2 = new ClassificationNode(new ClickStageEvent(), ActivationFunction.SIGMOID);
        classificationNode2.uID = 5;
        nodes.push(classificationNode1);
        nodes.push(classificationNode2);

        const hiddenNode = new HiddenNode(ActivationFunction.SIGMOID);
        hiddenNode.uID = 6;
        const deepHiddenNode = new HiddenNode(ActivationFunction.SIGMOID);
        deepHiddenNode.uID = 7;
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

        chromosome = new NeatChromosome(nodes, connections, mutationOp, crossoverOp);
        const threshold = chromosome.allNodes.length * chromosome.allNodes.length;
        expect(chromosome.isRecurrentPath(deepHiddenNode, hiddenNode, 0, threshold)).toBeTruthy();
        expect(chromosome.isRecurrentPath(deepHiddenNode, deepHiddenNode, 0, threshold)).toBeTruthy();
        expect(chromosome.isRecurrentPath(hiddenNode, deepHiddenNode, 0, threshold)).toBeFalsy();
        expect(chromosome.isRecurrentPath(nodes[5], deepHiddenNode, 0, threshold)).toBeTruthy();
        expect(chromosome.isRecurrentPath(nodes[0], nodes[4], 0, threshold)).toBeFalsy();
        expect(chromosome.isRecurrentPath(nodes[4], nodes[0], 0, threshold)).toBeTruthy();
        expect(chromosome.isRecurrentPath(nodes[0], nodes[1], 0, threshold)).toBeFalsy();
    })

    test("Test getRegressionNodes", () => {
        generator = new NeatChromosomeGeneratorSparse(mutationConfig, crossoverConfig, genInputs,
            [new WaitEvent(), new MouseMoveEvent()], 0.5);
        chromosome = generator.get();
        const regressionNodes = chromosome.regressionNodes;
        expect(regressionNodes.get("WaitEvent").length).toEqual(1);
        expect(regressionNodes.get("MouseMoveEvent").length).toEqual(2);
    })

    test("Test updateOutputNodes", () => {
        generator = new NeatChromosomeGeneratorSparse(mutationConfig, crossoverConfig, genInputs,
            [new WaitEvent()], 0.5);
        chromosome = generator.get();
        const oldNodeSize = chromosome.allNodes.length;
        const oldOutputNodesSize = chromosome.outputNodes.length;
        const oldRegressionNodesSize = chromosome.regressionNodes.size;
        chromosome.updateOutputNodes([new MouseMoveEvent()]);
        expect(chromosome.allNodes.length).toBeGreaterThan(oldNodeSize);
        expect(chromosome.outputNodes.length).toBeGreaterThan(oldOutputNodesSize);
        expect(chromosome.regressionNodes.size).toBeGreaterThan(oldRegressionNodesSize);

    })

    test("Test toString", () => {
        expect(chromosome.toString()).toContain("NodeGenes");
        expect(chromosome.toString()).toContain("ConnectionGenes");
    })
})
