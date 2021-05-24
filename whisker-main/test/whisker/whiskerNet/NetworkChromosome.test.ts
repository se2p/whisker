import {NetworkChromosomeGeneratorSparse} from "../../../src/whisker/whiskerNet/NetworkGenerators/NetworkChromosomeGeneratorSparse";
import {NeatMutation} from "../../../src/whisker/whiskerNet/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/whiskerNet/NeatCrossover";
import {ConnectionGene} from "../../../src/whisker/whiskerNet/ConnectionGene";
import {NodeGene} from "../../../src/whisker/whiskerNet/NetworkNodes/NodeGene";
import {NetworkChromosome} from "../../../src/whisker/whiskerNet/NetworkChromosome";
import {Mutation} from "../../../src/whisker/search/Mutation";
import {Crossover} from "../../../src/whisker/search/Crossover";
import {List} from "../../../src/whisker/utils/List";
import {ActivationFunction} from "../../../src/whisker/whiskerNet/NetworkNodes/ActivationFunction";
import {HiddenNode} from "../../../src/whisker/whiskerNet/NetworkNodes/HiddenNode";
import {InputNode} from "../../../src/whisker/whiskerNet/NetworkNodes/InputNode";
import {BiasNode} from "../../../src/whisker/whiskerNet/NetworkNodes/BiasNode";
import {ClassificationNode} from "../../../src/whisker/whiskerNet/NetworkNodes/ClassificationNode";
import {RegressionNode} from "../../../src/whisker/whiskerNet/NetworkNodes/RegressionNode";
import {NeuroevolutionUtil} from "../../../src/whisker/whiskerNet/NeuroevolutionUtil";
import {Species} from "../../../src/whisker/whiskerNet/Species";
import {NeuroevolutionProperties} from "../../../src/whisker/whiskerNet/NeuroevolutionProperties";
import {WaitEvent} from "../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../src/whisker/testcase/events/MouseMoveEvent";
import {ScratchEvent} from "../../../src/whisker/testcase/events/ScratchEvent";
import {KeyDownEvent} from "../../../src/whisker/testcase/events/KeyDownEvent";
import {ClickStageEvent} from "../../../src/whisker/testcase/events/ClickStageEvent";

describe('Test NetworkChromosome', () => {

    let mutationOp: Mutation<NetworkChromosome>;
    let crossoverOp: Crossover<NetworkChromosome>;
    let genInputs: Map<string, number[]>;
    let generator: NetworkChromosomeGeneratorSparse;
    let chromosome: NetworkChromosome;
    let properties: NeuroevolutionProperties<NetworkChromosome>;
    let events: List<ScratchEvent>;

    beforeEach(() => {
        crossoverOp = new NeatCrossover(0.4);
        mutationOp = new NeatMutation(0.03, 0.1,
            30, 0.2, 0.01, 0.8,
            1.5, 0.1, 3, 0.1);
        genInputs = new Map<string, number[]>();
        genInputs.set("First", [1, 2, 3, 4, 5, 6])
        events = new List<ScratchEvent>([new WaitEvent(), new KeyDownEvent("left arrow", true),
            new KeyDownEvent("right arrow", true), new MouseMoveEvent()])
        generator = new NetworkChromosomeGeneratorSparse(mutationOp, crossoverOp, genInputs, events, 0.4)
        chromosome = generator.get();
        properties = new NeuroevolutionProperties<NetworkChromosome>(10)
    })

    test('Constructor Test', () => {
        expect(chromosome.allNodes.size()).toBe(genInputs.get("First").length + 1 + 7);
        expect(chromosome.inputNodesSize()).toBe(genInputs.get("First").length);
        expect(chromosome.outputNodes.size()).toBe(7);
        expect(chromosome.classificationNodes.size).toEqual(4);
        expect(chromosome.regressionNodes.size).toEqual(2);
        expect(chromosome.connections.size()).toBe(42);
        expect(chromosome.getCrossoverOperator()).toBe(crossoverOp);
        expect(chromosome.getMutationOperator()).toBe(mutationOp);
        expect(chromosome.networkFitness).toBe(0);
        expect(chromosome.sharedFitness).toBe(0);
        expect(chromosome.species).toBe(null);
        expect(chromosome.isSpeciesChampion).toBe(false);
        expect(chromosome.isPopulationChampion).toBe(false);
        expect(chromosome.hasDeathMark).toBe(false);
        expect(chromosome.expectedOffspring).toBe(0);
        expect(chromosome.numberOffspringPopulationChamp).toBe(0);
        expect(chromosome.trace).toBe(null);
        expect(chromosome.coverage.size).toBe(0)
        expect(chromosome.codons.size()).toBe(0);
        expect(chromosome.isRecurrent).toBe(false);

        expect(chromosome.outputNodes.get(0).incomingConnections.size()).toBe(genInputs.get("First").length)
    })

    test("Test getter and setter", () => {
        const species = new Species(1, true, properties)

        chromosome.networkFitness = 4;
        chromosome.sharedFitness = 2;
        chromosome.species = species
        chromosome.isSpeciesChampion = true;
        chromosome.isPopulationChampion = true;
        chromosome.hasDeathMark = true;
        chromosome.expectedOffspring = 1;
        chromosome.numberOffspringPopulationChamp = 2;
        chromosome.trace = undefined;
        chromosome.codons = new List<number>([1,2,3]);
        chromosome.isRecurrent = true;
        chromosome.coverage = new Set<string>("B")

        expect(chromosome.networkFitness).toBe(4)
        expect(chromosome.sharedFitness).toBe(2)
        expect(chromosome.species).toBe(species)
        expect(chromosome.isSpeciesChampion).toBeTruthy()
        expect(chromosome.isPopulationChampion).toBeTruthy()
        expect(chromosome.hasDeathMark).toBeTruthy()
        expect(chromosome.expectedOffspring).toBe(1)
        expect(chromosome.numberOffspringPopulationChamp).toBe(2)
        expect(chromosome.trace).toBe(undefined)
        expect(chromosome.codons.getElements()).toEqual([1,2,3])
        expect(chromosome.getLength()).toBe(3)
        expect(chromosome.isRecurrent).toBeTruthy()
        expect(chromosome.coverage).toContain("B")
    })

    test("Clone Test without hidden Layer", () => {
        chromosome.generateNetwork();
        const clone = chromosome.clone();
        expect(clone.connections.size()).toBe(chromosome.connections.size())
        expect(clone.allNodes.size()).toBe(chromosome.allNodes.size())
        expect(clone.inputNodes.size).toBe(chromosome.inputNodes.size)
        expect(clone.outputNodes.size()).toBe(chromosome.outputNodes.size())
        expect(clone.sharedFitness).toBe(chromosome.sharedFitness)
    })

    test("Clone Test with given gene without hidden Layer", () => {
        const clone = chromosome.cloneWith(chromosome.connections);
        expect(clone.connections.size()).toBe(chromosome.connections.size())
        expect(clone.allNodes.size()).toBe(chromosome.allNodes.size())
        expect(clone.inputNodes.size).toBe(chromosome.inputNodes.size)
        expect(clone.outputNodes.size()).toBe(chromosome.outputNodes.size())
        expect(clone.sharedFitness).toBe(chromosome.sharedFitness)
    })

    test("Clone Test with hidden Layer", () => {
        // Create input Nodes
        const nodes = new List<NodeGene>()
        nodes.add(new InputNode(0, "Test"))
        nodes.add(new InputNode(1, "Test"))
        nodes.add(new BiasNode(2))

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(3, new WaitEvent, ActivationFunction.SIGMOID))
        nodes.add(new ClassificationNode(4, new ClickStageEvent(),ActivationFunction.SIGMOID))

        const hiddenNode = new HiddenNode(5, ActivationFunction.SIGMOID)
        const deepHiddenNode = new HiddenNode(6, ActivationFunction.SIGMOID)
        nodes.add(hiddenNode);
        nodes.add(deepHiddenNode);

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, 2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, 3, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true, 4, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true, 5, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true, 6, false))
        connections.add(new ConnectionGene(nodes.get(0), hiddenNode, 0.3, true, 7, false));
        connections.add(new ConnectionGene(hiddenNode, nodes.get(3), 0.7, true, 8, false));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9, false));
        connections.add(new ConnectionGene(deepHiddenNode, hiddenNode, 1, true, 10, true));
        connections.add(new ConnectionGene(deepHiddenNode, nodes.get(4), 1, true, 11, false))


        chromosome = new NetworkChromosome(connections, nodes, mutationOp, crossoverOp)
        chromosome.generateNetwork();
        const clone = chromosome.clone();
        expect(clone.connections.size()).toBe(chromosome.connections.size())
        expect(clone.allNodes.size()).toBe(chromosome.allNodes.size())
        expect(clone.inputNodes.size).toBe(chromosome.inputNodes.size)
        expect(clone.outputNodes.size()).toBe(chromosome.outputNodes.size())
        expect(clone.sharedFitness).toBe(chromosome.sharedFitness)
    })

    test("Clone Test with given gene and hidden Layer", () => {
        // Create input Nodes
        const nodes = new List<NodeGene>()
        nodes.add(new InputNode(0, "Test"))
        nodes.add(new InputNode(1, "Test"))
        nodes.add(new BiasNode(2))

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(3, new WaitEvent, ActivationFunction.SIGMOID))
        nodes.add(new ClassificationNode(4, new ClickStageEvent(),ActivationFunction.SIGMOID))

        const hiddenNode = new HiddenNode(5, ActivationFunction.SIGMOID)
        const deepHiddenNode = new HiddenNode(6, ActivationFunction.SIGMOID)
        nodes.add(hiddenNode);
        nodes.add(deepHiddenNode);

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, 2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, 3, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true, 4, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true, 5, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true, 6, false))
        connections.add(new ConnectionGene(nodes.get(0), hiddenNode, 0.3, true, 7, false));
        connections.add(new ConnectionGene(hiddenNode, nodes.get(3), 0.7, true, 8, false));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9, false));
        connections.add(new ConnectionGene(deepHiddenNode, hiddenNode, 1, true, 10, true));
        connections.add(new ConnectionGene(deepHiddenNode, nodes.get(4), 1, true, 11, false))


        chromosome = new NetworkChromosome(connections, nodes, mutationOp, crossoverOp)
        chromosome.generateNetwork();
        const clone = chromosome.cloneWith(chromosome.connections);
        expect(clone.connections.size()).toBe(chromosome.connections.size())
        expect(clone.allNodes.size()).toBe(chromosome.allNodes.size())
        expect(clone.outputNodes.size()).toBe(chromosome.outputNodes.size())
        expect(clone.inputNodes.size).toBe(chromosome.inputNodes.size)
        expect(clone.sharedFitness).toBe(chromosome.sharedFitness)
    })

    test("Test add inputNode with new Sprite", () => {
        genInputs.set("First", [10])
        genInputs.set("Second", [1, 2, 3])
        chromosome.addInputNode(genInputs)
        chromosome.activateNetwork(genInputs)
        expect(chromosome.inputNodes.get("First").get(0).activatedFlag).toBeTruthy();
        expect(chromosome.inputNodes.get("First").get(1).activatedFlag).toBeFalsy();
        expect(chromosome.inputNodes.get("Second").get(0).activatedFlag).toBeTruthy();
        expect(chromosome.inputNodesSize()).toBe(9)
    })

    test("Test add inputNode with additional information gathered from an already existing sprite", () => {
        genInputs.get("First").push(11)
        chromosome.addInputNode(genInputs)
        expect(chromosome.inputNodesSize()).toBe(7)
    })

    test('Test generateNetwork with hidden Layer', () => {
        const inputNode = chromosome.inputNodes.get("First").get(0);
        const outputNode = chromosome.outputNodes.get(0);
        const hiddenNode = new HiddenNode(7, ActivationFunction.SIGMOID);
        const deepHiddenNode = new HiddenNode(8, ActivationFunction.SIGMOID);
        chromosome.allNodes.add(hiddenNode);
        chromosome.allNodes.add(deepHiddenNode);
        chromosome.connections.add(new ConnectionGene(inputNode, hiddenNode, 0.5, true, 7, false));
        chromosome.connections.add(new ConnectionGene(hiddenNode, outputNode, 0, true, 8, false));
        chromosome.connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 1, true, 9, false));
        chromosome.connections.add(new ConnectionGene(deepHiddenNode, outputNode, 0.2, true, 10, false));
        chromosome.generateNetwork();
        // InputNodes + Bias + hiddenNodes + classificationNodes + RegressionNodes
        expect(chromosome.allNodes.size()).toBe(6 + 1 + 2 + 4 + 3);
        expect(hiddenNode.incomingConnections.size()).toBe(1);
        expect(deepHiddenNode.incomingConnections.size()).toBe(1);
        expect(chromosome.regressionNodes.get(new WaitEvent().constructor.name).size()).toEqual(1)
        expect(chromosome.regressionNodes.get(new MouseMoveEvent().constructor.name).size()).toEqual(2);
    })

    test('Test stabilizedCounter without hidden Layer', () => {
        const nodes = new List<NodeGene>()
        nodes.add(new InputNode(0, "Test"))
        nodes.add(new InputNode(1, "Test"))
        nodes.add(new BiasNode(2))

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(3, new WaitEvent, ActivationFunction.SIGMOID))
        nodes.add(new ClassificationNode(4, new ClickStageEvent(),ActivationFunction.SIGMOID))

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, 2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, 3, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true, 4, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true, 5, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true, 6, false))

        chromosome = new NetworkChromosome(connections, nodes, mutationOp, crossoverOp)
        const counter = chromosome.stabilizedCounter(5);
        expect(counter).toBe(2);
    })

    test('Test stabilizedCounter with hidden Layer', () => {
        const nodes = new List<NodeGene>()
        nodes.add(new InputNode(0, "Test"))
        nodes.add(new InputNode(1, "Test"))
        nodes.add(new BiasNode(2))

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(3, new WaitEvent, ActivationFunction.SIGMOID))
        nodes.add(new ClassificationNode(4, new ClickStageEvent(),ActivationFunction.SIGMOID))

        const hiddenNode = new HiddenNode(5, ActivationFunction.SIGMOID)
        const deepHiddenNode = new HiddenNode(6, ActivationFunction.SIGMOID)
        nodes.add(hiddenNode);
        nodes.add(deepHiddenNode);

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, 2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, 3, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true, 4, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true, 5, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true, 6, false))
        connections.add(new ConnectionGene(nodes.get(0), hiddenNode, 0.3, true, 7, false));
        connections.add(new ConnectionGene(hiddenNode, nodes.get(3), 0.7, true, 8, false));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9, false));
        connections.add(new ConnectionGene(deepHiddenNode, nodes.get(4), 1, true, 10, false))


        chromosome = new NetworkChromosome(connections, nodes, mutationOp, crossoverOp)
        const counter = chromosome.stabilizedCounter(5);
        expect(counter).toBe(4);
    })

    test('Test stabilizedCounter with unstable network', () => {
        const nodes = new List<NodeGene>()
        nodes.add(new InputNode(0, "Test"))
        nodes.add(new InputNode(1, "Test"))
        nodes.add(new BiasNode(2))

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(3, new WaitEvent, ActivationFunction.SIGMOID))
        nodes.add(new ClassificationNode(4, new ClickStageEvent(),ActivationFunction.SIGMOID))

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, false, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, 2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, 3, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, false, 4, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, false, 5, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, false, 6, false))

        chromosome = new NetworkChromosome(connections, nodes, mutationOp, crossoverOp)
        const counter = chromosome.stabilizedCounter(5);
        expect(counter).toBe(-1);
    })

    test('Network activation without hidden layer', () => {
        // Create input Nodes
        const nodes = new List<NodeGene>()
        nodes.add(new InputNode(0, "Test"))
        nodes.add(new InputNode(1, "Test"))
        nodes.add(new BiasNode(2))

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(3, new WaitEvent, ActivationFunction.SIGMOID))
        nodes.add(new ClassificationNode(4, new ClickStageEvent(),ActivationFunction.SIGMOID))


        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.1, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.3, false, 1, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 0.4, false, 1, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.5, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.6, false, 1, false))

        chromosome = new NetworkChromosome(connections, nodes, mutationOp, crossoverOp)
        const inputs = new Map<string, number[]>();
        inputs.set("Test", [1, 2])
        chromosome.activateNetwork(inputs)
        const availableEvents = new List<ScratchEvent>([new WaitEvent(), new ClickStageEvent()]);
        const softmaxOutput: number[] = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents)
        for (let i = 0; i < softmaxOutput.length; i++) {
            softmaxOutput[i] = Number(softmaxOutput[i].toFixed(3))
        }
        expect(nodes.get(3).nodeValue).toBe(0.6);
        expect(nodes.get(4).nodeValue).toBe(0.2);
        expect(softmaxOutput).toEqual([0.599, 0.401]);
        expect(Math.round(softmaxOutput.reduce((a, b) => a + b))).toBe(1);
    })

    test('Network activation without hidden layer and regression', () => {

        // Create input Nodes
        const nodes = new List<NodeGene>()
        nodes.add(new InputNode(0, "Test"))
        nodes.add(new InputNode(1, "Test"))
        nodes.add(new BiasNode(2))

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(3, new WaitEvent, ActivationFunction.SIGMOID))
        nodes.add(new ClassificationNode(4, new ClickStageEvent(),ActivationFunction.SIGMOID))
        nodes.add(new RegressionNode(5, new WaitEvent().constructor.name, ActivationFunction.NONE));
        nodes.add(new RegressionNode(6, new MouseMoveEvent().constructor.name, ActivationFunction.NONE));


        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.1, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.3, false, 1, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 0.4, false, 1, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.5, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.6, false, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(5), 0.7, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(6), 0.8, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(5), 0.9, false, 1, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(6), 1, true, 1, false))


        chromosome = new NetworkChromosome(connections, nodes, mutationOp, crossoverOp)
        const inputs = new Map<string, number[]>();
        inputs.set("Test", [1, 2])
        chromosome.activateNetwork(inputs)
        const availableEvents = new List<ScratchEvent>([new WaitEvent(), new ClickStageEvent()]);
        const softmaxOutput: number[] = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents)
        for (let i = 0; i < softmaxOutput.length; i++) {
            softmaxOutput[i] = Number(softmaxOutput[i].toFixed(3))
        }
        expect(nodes.get(3).nodeValue).toBe(0.6);
        expect(nodes.get(4).nodeValue).toBe(0.2);
        expect(nodes.get(5).nodeValue).toBe(0.7)
        expect(nodes.get(6).nodeValue).toBe(2.8)
        expect(softmaxOutput).toEqual([0.599, 0.401]);
        expect(Math.round(softmaxOutput.reduce((a, b) => a + b))).toBe(1);
    })

    test('Network activation with hidden layer', () => {

        // Create input Nodes
        const nodes = new List<NodeGene>()
        nodes.add(new InputNode(0, "First"))
        nodes.add(new InputNode(1, "Second"))
        nodes.add(new BiasNode(2))

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(3, new WaitEvent, ActivationFunction.SIGMOID))
        nodes.add(new ClassificationNode(4, new ClickStageEvent(),ActivationFunction.SIGMOID))

        const hiddenNode = new HiddenNode(5, ActivationFunction.SIGMOID)
        const deepHiddenNode = new HiddenNode(6, ActivationFunction.SIGMOID)
        nodes.add(hiddenNode);
        nodes.add(deepHiddenNode);

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.1, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.3, false, 1, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 0.4, false, 1, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.5, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.6, false, 1, false))
        connections.add(new ConnectionGene(nodes.get(1), hiddenNode, 0.7, true, 1, false))
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.8, true, 1, false))
        connections.add(new ConnectionGene(deepHiddenNode, nodes.get(4), 0.9, true, 1, false))


        chromosome = new NetworkChromosome(connections, nodes, mutationOp, crossoverOp)
        const inputs = new Map<string, number[]>();
        inputs.set("First", [1])
        inputs.set("Second", [2])
        chromosome.flushNodeValues();
        for (let i = 0; i < 5; i++) {
            chromosome.activateNetwork(inputs);
        }
        const availableEvents = new List<ScratchEvent>([new WaitEvent(), new ClickStageEvent()]);
        const softmaxOutput: number[] = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents)
        for (let i = 0; i < softmaxOutput.length; i++) {
            softmaxOutput[i] = Number(softmaxOutput[i].toFixed(3))
        }
        expect(hiddenNode.nodeValue).toBe(1.4)
        expect(Number(hiddenNode.activationValue.toFixed(3))).toBe(0.999)
        expect(Number(deepHiddenNode.nodeValue.toFixed(3))).toBe(0.799)
        expect(Number(deepHiddenNode.activationValue.toFixed(3))).toBe(0.980)
        expect(Number(nodes.get(4).nodeValue.toFixed(3))).toBe(1.082)
        expect(nodes.get(3).nodeValue).toBe(0.6)
        expect(softmaxOutput).toEqual([0.382, 0.618]);
        expect(Math.round(softmaxOutput.reduce((a, b) => a + b))).toBe(1);
    })

    test('Network activation with recurrent connections', () => {
        // Create input Nodes
        const nodes = new List<NodeGene>()
        nodes.add(new InputNode(0, "Test"))
        nodes.add(new InputNode(1, "Test"))
        nodes.add(new BiasNode(2))

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(3, new WaitEvent, ActivationFunction.SIGMOID))
        nodes.add(new ClassificationNode(4, new ClickStageEvent(),ActivationFunction.SIGMOID))

        const hiddenNode = new HiddenNode(5, ActivationFunction.SIGMOID)
        const deepHiddenNode = new HiddenNode(6, ActivationFunction.SIGMOID)
        nodes.add(hiddenNode);
        nodes.add(deepHiddenNode);

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.1, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.3, false, 1, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 0.4, false, 1, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.5, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.6, false, 1, false))
        connections.add(new ConnectionGene(nodes.get(1), hiddenNode, 0.7, true, 1, false))
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.8, true, 1, false))
        connections.add(new ConnectionGene(deepHiddenNode, hiddenNode, 1, true, 1, true))
        connections.add(new ConnectionGene(deepHiddenNode, nodes.get(4), 0.9, true, 1, false))


        chromosome = new NetworkChromosome(connections, nodes, mutationOp, crossoverOp)
        const inputs = new Map<string, number[]>();
        inputs.set("Test", [1, 2])
        chromosome.activateNetwork(inputs)
        const availableEvents = new List<ScratchEvent>([new WaitEvent(), new ClickStageEvent()]);
        const stabilizeCount = chromosome.stabilizedCounter(30);
        for (let i = 0; i < stabilizeCount + 1; i++) {
            chromosome.activateNetwork(inputs)
        }
        const firstOutput = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents)
        // New input has to propagate through network.
        inputs.set("Test", [1, 4]);
        chromosome.activateNetwork(inputs)
        const secondOutput = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents)
        chromosome.activateNetwork(inputs)
        chromosome.activateNetwork(inputs)
        const thirdOutput = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents)
        expect(firstOutput).toEqual(secondOutput)
        expect(firstOutput).not.toEqual(thirdOutput)
        expect(Math.round(firstOutput.reduce((a, b) => a + b))).toBe(1);
        expect(Math.round(secondOutput.reduce((a, b) => a + b))).toBe(1);
        expect(Math.round(thirdOutput.reduce((a, b) => a + b))).toBe(1);
    })

    test("Test the recurrent Network check", () => {
        // Create input Nodes
        const nodes = new List<NodeGene>()
        nodes.add(new InputNode(0, "Test"))
        nodes.add(new InputNode(1, "Test"))
        nodes.add(new BiasNode(2))

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(3, new WaitEvent, ActivationFunction.SIGMOID))
        nodes.add(new ClassificationNode(4, new ClickStageEvent(),ActivationFunction.SIGMOID))

        const hiddenNode = new HiddenNode(5, ActivationFunction.SIGMOID)
        const deepHiddenNode = new HiddenNode(6, ActivationFunction.SIGMOID)
        nodes.add(hiddenNode);
        nodes.add(deepHiddenNode);

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.2, true, 1, false))
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.5, false, 2, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.2, false, 3, false))
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 1, true, 4, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.2, true, 5, false))
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.7, true, 6, false))
        connections.add(new ConnectionGene(nodes.get(0), hiddenNode, 0.3, true, 7, false));
        connections.add(new ConnectionGene(hiddenNode, nodes.get(3), 0.7, true, 8, false));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9, false));
        connections.add(new ConnectionGene(deepHiddenNode, hiddenNode, 1, true, 10, true));
        connections.add(new ConnectionGene(deepHiddenNode, nodes.get(4), 1, true, 11, false))
        connections.add(new ConnectionGene(deepHiddenNode, deepHiddenNode, 1, true, 12, true));
        connections.add(new ConnectionGene(nodes.get(4), deepHiddenNode, 1, true, 13, true))


        chromosome = new NetworkChromosome(connections, nodes, mutationOp, crossoverOp);
        const threshold = chromosome.allNodes.size() * chromosome.allNodes.size()
        expect(chromosome.isRecurrentPath(deepHiddenNode, hiddenNode, 0, threshold)).toBeTruthy()
        expect(chromosome.isRecurrentPath(deepHiddenNode, deepHiddenNode, 0, threshold)).toBeTruthy()
        expect(chromosome.isRecurrentPath(hiddenNode, deepHiddenNode, 0, threshold)).toBeFalsy()
        expect(chromosome.isRecurrentPath(nodes.get(4), deepHiddenNode, 0, threshold)).toBeTruthy();
        expect(chromosome.isRecurrentPath(nodes.get(0), nodes.get(3), 0, threshold)).toBeFalsy();
        expect(chromosome.isRecurrentPath(nodes.get(3), nodes.get(0), 0, threshold)).toBeTruthy();
        expect(chromosome.isRecurrentPath(nodes.get(0), nodes.get(1), 0, threshold)).toBeFalsy()
    })

    test("Test getRegressionNodes", () => {
        generator = new NetworkChromosomeGeneratorSparse(mutationOp, crossoverOp, genInputs,
            new List<ScratchEvent>([new WaitEvent(), new MouseMoveEvent()]), 0.5);
        chromosome = generator.get();
        const regressionNodes = chromosome.regressionNodes;
        expect(regressionNodes.get("WaitEvent").size()).toEqual(1);
        expect(regressionNodes.get("MouseMoveEvent").size()).toEqual(2);
    })

    test("Test updateOutputNodes", () =>{
        generator = new NetworkChromosomeGeneratorSparse(mutationOp, crossoverOp, genInputs,
            new List<ScratchEvent>([new WaitEvent()]), 0.5);
        chromosome = generator.get();
        const oldNodeSize = chromosome.allNodes.size();
        const oldOutputNodesSize = chromosome.outputNodes.size();
        const oldRegressionNodesSize = chromosome.regressionNodes.size;
        chromosome.updateOutputNodes(new List<ScratchEvent>([new MouseMoveEvent()]));
        expect(chromosome.allNodes.size()).toBeGreaterThan(oldNodeSize);
        expect(chromosome.outputNodes.size()).toBeGreaterThan(oldOutputNodesSize);
        expect(chromosome.regressionNodes.size).toBeGreaterThan(oldRegressionNodesSize);

    })

    test("Test toString", () => {
        expect(chromosome.toString()).toContain("Genome:\nNodeGenes: "
            + chromosome.allNodes + "\nConnectionGenes: " + chromosome.connections)
    })
})
