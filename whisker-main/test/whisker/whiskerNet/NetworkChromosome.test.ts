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
import {ClickStageEvent} from "../../../src/whisker/testcase/events/ClickStageEvent";
import {KeyPressEvent} from "../../../src/whisker/testcase/events/KeyPressEvent";

describe('Test NetworkChromosome', () => {

    let mutationOp: Mutation<NetworkChromosome>;
    let mutationConfig: Record<string, (string | number)>;
    let crossoverConfig: Record<string, (string | number)>;
    let crossoverOp: Crossover<NetworkChromosome>;
    let genInputs: Map<string, Map<string, number>>;
    let generator: NetworkChromosomeGeneratorSparse;
    let chromosome: NetworkChromosome;
    let properties: NeuroevolutionProperties<NetworkChromosome>;

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
        const events = new List<ScratchEvent>([new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()])
        generator = new NetworkChromosomeGeneratorSparse(mutationConfig, crossoverConfig, genInputs, events, 0.4)
        chromosome = generator.get();
        properties = new NeuroevolutionProperties<NetworkChromosome>(10)
    })

    test('Constructor Test', () => {
        expect(chromosome.allNodes.size()).toEqual(19);
        expect(chromosome.outputNodes.size()).toEqual(9);
        expect(chromosome.classificationNodes.size).toEqual(4);
        expect(chromosome.regressionNodes.size).toEqual(4);
        expect(chromosome.inputNodes.get("Sprite1").size).toEqual(5);
        expect(chromosome.inputNodes.get("Sprite2").size).toEqual(4);
        expect(chromosome.connections.size()).toBeGreaterThanOrEqual(36);
        expect(chromosome.getCrossoverOperator() instanceof NeatCrossover).toBeTruthy();
        expect(chromosome.getMutationOperator() instanceof NeatMutation).toBeTruthy();
        expect(chromosome.networkFitness).toEqual(0);
        expect(chromosome.sharedFitness).toEqual(0);
        expect(chromosome.species).toEqual(null);
        expect(chromosome.isSpeciesChampion).toBeFalsy();
        expect(chromosome.isPopulationChampion).toBeFalsy();
        expect(chromosome.hasDeathMark).toBeFalsy();
        expect(chromosome.expectedOffspring).toEqual(0);
        expect(chromosome.numberOffspringPopulationChamp).toEqual(0);
        expect(chromosome.trace).toEqual(null);
        expect(chromosome.coverage.size).toEqual(0)
        expect(chromosome.codons.size()).toEqual(0);
        expect(chromosome.isRecurrent).toBeFalsy();

        expect(chromosome.outputNodes.get(0).incomingConnections.size()).toBeGreaterThanOrEqual(4)
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
        chromosome.codons = new List<number>([1, 2, 3]);
        chromosome.isRecurrent = true;
        chromosome.coverage = new Set<string>("B")

        expect(chromosome.networkFitness).toEqual(4)
        expect(chromosome.sharedFitness).toEqual(2)
        expect(chromosome.species).toEqual(species)
        expect(chromosome.isSpeciesChampion).toBeTruthy()
        expect(chromosome.isPopulationChampion).toBeTruthy()
        expect(chromosome.hasDeathMark).toBeTruthy()
        expect(chromosome.expectedOffspring).toEqual(1)
        expect(chromosome.numberOffspringPopulationChamp).toEqual(2)
        expect(chromosome.trace).toEqual(undefined)
        expect(chromosome.codons.getElements()).toEqual([1, 2, 3])
        expect(chromosome.getLength()).toEqual(3)
        expect(chromosome.isRecurrent).toBeTruthy()
        expect(chromosome.coverage).toContain("B")
    })

    test("Clone Test without hidden Layer", () => {
        chromosome.generateNetwork();
        const clone = chromosome.cloneStructure();
        expect(clone.connections.size()).toEqual(chromosome.connections.size())
        expect(clone.allNodes.size()).toEqual(chromosome.allNodes.size())
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size)
        expect(clone.outputNodes.size()).toEqual(chromosome.outputNodes.size())
        expect(clone.sharedFitness).toEqual(chromosome.sharedFitness)
    })

    test("Clone Test with given gene without hidden Layer", () => {
        const clone = chromosome.cloneWith(chromosome.connections);
        expect(clone.connections.size()).toEqual(chromosome.connections.size());
        expect(clone.allNodes.size()).toEqual(chromosome.allNodes.size());
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.outputNodes.size()).toEqual(chromosome.outputNodes.size());
        expect(clone.sharedFitness).toEqual(chromosome.sharedFitness);
    })

    test("Clone Test with hidden Layer", () => {
        const clone = chromosome.cloneStructure();
        expect(clone.connections.size()).toEqual(chromosome.connections.size());
        expect(clone.connections.get(0)).not.toBe(chromosome.connections.get(0));
        expect(clone.allNodes.size()).toEqual(chromosome.allNodes.size());
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.outputNodes.size()).toEqual(chromosome.outputNodes.size());
        expect(clone.sharedFitness).toEqual(chromosome.sharedFitness);
    })

    test("Clone Test with given gene and hidden Layer", () => {
        const clone = chromosome.cloneWith(chromosome.connections);
        expect(clone.connections.size()).toEqual(chromosome.connections.size());
        expect(clone.connections.get(0)).not.toBe(chromosome.connections.get(0));
        expect(clone.allNodes.size()).toEqual(chromosome.allNodes.size());
        expect(clone.inputNodes.size).toEqual(chromosome.inputNodes.size);
        expect(clone.outputNodes.size()).toEqual(chromosome.outputNodes.size());
        expect(clone.sharedFitness).toEqual(chromosome.sharedFitness);
    })

    test('Test generateNetwork with hidden Layer', () => {
        const inputNode = chromosome.inputNodes.get("Sprite1").get("X-Position");
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
        expect(chromosome.allNodes.size()).toEqual(9 + 1 + 2 + 4 + 5);
        expect(hiddenNode.incomingConnections.size()).toEqual(1);
        expect(deepHiddenNode.incomingConnections.size()).toEqual(1);
        expect(chromosome.regressionNodes.get(new WaitEvent().constructor.name).size()).toEqual(1);
        expect(chromosome.regressionNodes.get(new MouseMoveEvent().constructor.name).size()).toEqual(2);
    })

    test('Test stabilizedCounter without hidden Layer', () => {
        const nodes = new List<NodeGene>();
        nodes.add(new InputNode(0, "Sprite1", "X-Position"));
        nodes.add(new InputNode(1, "Sprite1", "Y-Position"));
        nodes.add(new BiasNode(2));

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(3, new WaitEvent, ActivationFunction.SIGMOID))
        nodes.add(new ClassificationNode(4, new ClickStageEvent(), ActivationFunction.SIGMOID))

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
        expect(counter).toEqual(2);
    })

    test('Test stabilizedCounter with hidden Layer', () => {
        const nodes = new List<NodeGene>()
        nodes.add(new InputNode(0, "Sprite1", "X-Position"));
        nodes.add(new InputNode(1, "Sprite1", "Y-Position"));
        nodes.add(new BiasNode(2))

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(3, new WaitEvent, ActivationFunction.SIGMOID))
        nodes.add(new ClassificationNode(4, new ClickStageEvent(), ActivationFunction.SIGMOID))

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
        expect(counter).toEqual(4);
    })

    test('Test stabilizedCounter with unstable network', () => {
        const nodes = new List<NodeGene>()
        nodes.add(new InputNode(0, "Sprite1", "X-Position"));
        nodes.add(new InputNode(1, "Sprite1", "Y-Position"));
        nodes.add(new BiasNode(2))

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(3, new WaitEvent, ActivationFunction.SIGMOID))
        nodes.add(new ClassificationNode(4, new ClickStageEvent(), ActivationFunction.SIGMOID))

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
        expect(counter).toEqual(-1);
    })

    test('Network activation without hidden layer', () => {
        // Create input Nodes
        const nodes = new List<NodeGene>();
        nodes.add(new InputNode(0, "Sprite1", "X-Position"));
        nodes.add(new InputNode(1, "Sprite1", "Y-Position"));
        nodes.add(new InputNode(2, "Sprite1", "Costumes"));
        nodes.add(new BiasNode(3));

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(4, new WaitEvent, ActivationFunction.SIGMOID));
        nodes.add(new ClassificationNode(5, new ClickStageEvent(), ActivationFunction.SIGMOID));
        nodes.add(new RegressionNode(6, new WaitEvent(), "Duration", ActivationFunction.NONE));
        nodes.add(new RegressionNode(7, new MouseMoveEvent(), "X", ActivationFunction.NONE));

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.1, true, 1, false));
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(5), 0.2, true, 1, false));
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 0.3, false, 1, false));
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(5), 0.4, false, 1, false));
        connections.add(new ConnectionGene(nodes.get(3), nodes.get(4), 0.5, true, 1, false));
        connections.add(new ConnectionGene(nodes.get(3), nodes.get(5), 0.6, false, 1, false));
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(6), 0.7, true, 1, false));
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(7), 0.8, true, 1, false));
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(6), 0.9, false, 1, false));
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(7), 1, true, 1, false));

        chromosome = new NetworkChromosome(connections, nodes, mutationOp, crossoverOp);
        const inputs = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        inputs.set("Sprite1", sprite1);
        chromosome.activateNetwork(inputs);
        const availableEvents = new List<ScratchEvent>([new WaitEvent(), new ClickStageEvent()]);
        const softmaxOutput: number[] = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents)
        for (let i = 0; i < softmaxOutput.length; i++) {
            softmaxOutput[i] = Number(softmaxOutput[i].toFixed(3))
        }
        expect(chromosome.outputNodes.get(0).nodeValue).toEqual(0.6);
        expect(chromosome.outputNodes.get(1).nodeValue).toEqual(0.2);
        expect(chromosome.outputNodes.get(2).nodeValue).toEqual(0.7)
        expect(chromosome.outputNodes.get(3).nodeValue).toEqual(2.8)
        expect(softmaxOutput).toEqual([0.599, 0.401]);
        expect(Math.round(softmaxOutput.reduce((a, b) => a + b))).toEqual(1);
    })

    test('Network activation with hidden layer', () => {
        const nodes = new List<NodeGene>();
        nodes.add(new InputNode(0, "Sprite1", "X-Position"));
        nodes.add(new InputNode(1, "Sprite2", "X-Position"));
        nodes.add(new InputNode(2, "Sprite2", "Costumes"));
        nodes.add(new BiasNode(3));

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(4, new WaitEvent, ActivationFunction.SIGMOID));
        nodes.add(new ClassificationNode(5, new ClickStageEvent(), ActivationFunction.SIGMOID));

        const hiddenNode = new HiddenNode(6, ActivationFunction.SIGMOID);
        const deepHiddenNode = new HiddenNode(7, ActivationFunction.SIGMOID);
        nodes.add(hiddenNode);
        nodes.add(deepHiddenNode);

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.1, true, 1, false));
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(5), 0.2, true, 1, false));
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 0.3, false, 1, false));
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(5), 0.4, false, 1, false));
        connections.add(new ConnectionGene(nodes.get(3), nodes.get(4), 0.5, true, 1, false));
        connections.add(new ConnectionGene(nodes.get(3), nodes.get(5), 0.6, false, 1, false));
        connections.add(new ConnectionGene(nodes.get(1), hiddenNode, 0.7, true, 1, false));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.8, true, 1, false));
        connections.add(new ConnectionGene(deepHiddenNode, nodes.get(5), 0.9, true, 1, false));

        chromosome = new NetworkChromosome(connections, nodes, mutationOp, crossoverOp)
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
        const availableEvents = new List<ScratchEvent>([new WaitEvent(), new ClickStageEvent()]);
        const softmaxOutput: number[] = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents)
        for (let i = 0; i < softmaxOutput.length; i++) {
            softmaxOutput[i] = Number(softmaxOutput[i].toFixed(3))
        }
        expect(hiddenNode.nodeValue).toEqual(1.4)
        expect(Number(hiddenNode.activationValue.toFixed(3))).toEqual(0.999)
        expect(Number(deepHiddenNode.nodeValue.toFixed(3))).toEqual(0.799)
        expect(Number(deepHiddenNode.activationValue.toFixed(3))).toEqual(0.980)
        expect(Number(nodes.get(7).nodeValue.toFixed(3))).toEqual(1.082)
        expect(nodes.get(6).nodeValue).toEqual(0.6)
        expect(softmaxOutput).toEqual([0.382, 0.618]);
        expect(Math.round(softmaxOutput.reduce((a, b) => a + b))).toEqual(1);
    })

    test('Network activation with recurrent connections', () => {
        // Create input Nodes
        const nodes = new List<NodeGene>()
        nodes.add(new InputNode(0, "Sprite1", "X-Position"));
        nodes.add(new InputNode(1, "Sprite1", "Y-Position"));
        nodes.add(new InputNode(2, "Sprite1", "Costumes"));
        nodes.add(new BiasNode(3));

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(4, new WaitEvent, ActivationFunction.SIGMOID));
        nodes.add(new ClassificationNode(5, new ClickStageEvent(), ActivationFunction.SIGMOID));

        const hiddenNode = new HiddenNode(6, ActivationFunction.SIGMOID);
        const deepHiddenNode = new HiddenNode(7, ActivationFunction.SIGMOID);
        nodes.add(hiddenNode);
        nodes.add(deepHiddenNode);

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(3), 0.1, true, 1, false));
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.2, true, 1, false));
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(3), 0.3, false, 1, false));
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 0.4, false, 1, false));
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(3), 0.5, true, 1, false));
        connections.add(new ConnectionGene(nodes.get(2), nodes.get(4), 0.6, false, 1, false));
        connections.add(new ConnectionGene(nodes.get(1), hiddenNode, 0.7, true, 1, false));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.8, true, 1, false));
        connections.add(new ConnectionGene(deepHiddenNode, hiddenNode, 1, true, 1, true));
        connections.add(new ConnectionGene(deepHiddenNode, nodes.get(4), 0.9, true, 1, false));

        chromosome = new NetworkChromosome(connections, nodes, mutationOp, crossoverOp)
        const inputs = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        inputs.set("Sprite1", sprite1);
        chromosome.activateNetwork(inputs);
        const availableEvents = new List<ScratchEvent>([new WaitEvent(), new ClickStageEvent()]);
        const stabilizeCount = chromosome.stabilizedCounter(30);
        for (let i = 0; i < stabilizeCount + 1; i++) {
            chromosome.activateNetwork(inputs)
        }
        const firstOutput = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents)
        // New input has to propagate through network.
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 4);
        inputs.set("Sprite1", sprite1);
        chromosome.activateNetwork(inputs);
        chromosome.activateNetwork(inputs)
        const secondOutput = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents)
        chromosome.activateNetwork(inputs)
        chromosome.activateNetwork(inputs)
        const thirdOutput = NeuroevolutionUtil.softmaxEvents(chromosome, availableEvents)
        expect(firstOutput).toEqual(secondOutput)
        expect(firstOutput).not.toEqual(thirdOutput)
        expect(Math.round(firstOutput.reduce((a, b) => a + b))).toEqual(1);
        expect(Math.round(secondOutput.reduce((a, b) => a + b))).toEqual(1);
        expect(Math.round(thirdOutput.reduce((a, b) => a + b))).toEqual(1);
    })

    test("Test the recurrent Network check", () => {
        // Create input Nodes
        const nodes = new List<NodeGene>()
        nodes.add(new InputNode(0, "Sprite1", "X-Position"));
        nodes.add(new InputNode(1, "Sprite1", "Y-Position"));
        nodes.add(new InputNode(2, "Sprite1", "Costumes"));
        nodes.add(new BiasNode(3));

        // Create classification Output Nodes
        nodes.add(new ClassificationNode(4, new WaitEvent, ActivationFunction.SIGMOID));
        nodes.add(new ClassificationNode(5, new ClickStageEvent(), ActivationFunction.SIGMOID));

        const hiddenNode = new HiddenNode(6, ActivationFunction.SIGMOID);
        const deepHiddenNode = new HiddenNode(7, ActivationFunction.SIGMOID);
        nodes.add(hiddenNode);
        nodes.add(deepHiddenNode);

        // Create Connections
        const connections = new List<ConnectionGene>();
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(4), 0.2, true, 1, false));
        connections.add(new ConnectionGene(nodes.get(0), nodes.get(5), 0.5, false, 2, false));
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(4), 0.2, false, 3, false));
        connections.add(new ConnectionGene(nodes.get(1), nodes.get(5), 1, true, 4, false));
        connections.add(new ConnectionGene(nodes.get(3), nodes.get(4), 0.2, true, 5, false));
        connections.add(new ConnectionGene(nodes.get(3), nodes.get(5), 0.7, true, 6, false));
        connections.add(new ConnectionGene(nodes.get(0), hiddenNode, 0.3, true, 7, false));
        connections.add(new ConnectionGene(hiddenNode, nodes.get(4), 0.7, true, 8, false));
        connections.add(new ConnectionGene(hiddenNode, deepHiddenNode, 0.3, true, 9, false));
        connections.add(new ConnectionGene(deepHiddenNode, hiddenNode, 1, true, 10, true));
        connections.add(new ConnectionGene(deepHiddenNode, nodes.get(5), 1, true, 11, false));
        connections.add(new ConnectionGene(deepHiddenNode, deepHiddenNode, 1, true, 12, true));
        connections.add(new ConnectionGene(nodes.get(5), deepHiddenNode, 1, true, 13, true));

        chromosome = new NetworkChromosome(connections, nodes, mutationOp, crossoverOp);
        const threshold = chromosome.allNodes.size() * chromosome.allNodes.size();
        expect(chromosome.isRecurrentPath(deepHiddenNode, hiddenNode, 0, threshold)).toBeTruthy();
        expect(chromosome.isRecurrentPath(deepHiddenNode, deepHiddenNode, 0, threshold)).toBeTruthy();
        expect(chromosome.isRecurrentPath(hiddenNode, deepHiddenNode, 0, threshold)).toBeFalsy();
        expect(chromosome.isRecurrentPath(nodes.get(5), deepHiddenNode, 0, threshold)).toBeTruthy();
        expect(chromosome.isRecurrentPath(nodes.get(0), nodes.get(4), 0, threshold)).toBeFalsy();
        expect(chromosome.isRecurrentPath(nodes.get(4), nodes.get(0), 0, threshold)).toBeTruthy();
        expect(chromosome.isRecurrentPath(nodes.get(0), nodes.get(1), 0, threshold)).toBeFalsy();
    })

    test("Test getRegressionNodes", () => {
        generator = new NetworkChromosomeGeneratorSparse(mutationConfig, crossoverConfig, genInputs,
            new List<ScratchEvent>([new WaitEvent(), new MouseMoveEvent()]), 0.5);
        chromosome = generator.get();
        const regressionNodes = chromosome.regressionNodes;
        expect(regressionNodes.get("WaitEvent").size()).toEqual(1);
        expect(regressionNodes.get("MouseMoveEvent").size()).toEqual(2);
    })

    test("Test updateOutputNodes", () => {
        generator = new NetworkChromosomeGeneratorSparse(mutationConfig, crossoverConfig, genInputs,
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
