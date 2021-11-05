import {NeatPopulation} from "../../../src/whisker/whiskerNet/NeuroevolutionPopulations/NeatPopulation";
import {NetworkChromosome} from "../../../src/whisker/whiskerNet/Networks/NetworkChromosome";
import {NeatCrossover} from "../../../src/whisker/whiskerNet/Operators/NeatCrossover";
import {NeatMutation} from "../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NetworkChromosomeGeneratorSparse} from "../../../src/whisker/whiskerNet/NetworkGenerators/NetworkChromosomeGeneratorSparse";
import {NeuroevolutionUtil} from "../../../src/whisker/whiskerNet/NeuroevolutionUtil";
import {ConnectionGene} from "../../../src/whisker/whiskerNet/NetworkComponents/ConnectionGene";
import {NodeGene} from "../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {List} from "../../../src/whisker/utils/List";
import {ActivationFunction} from "../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NeuroevolutionProperties} from "../../../src/whisker/whiskerNet/NeuroevolutionProperties";
import {InputNode} from "../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {ClassificationNode} from "../../../src/whisker/whiskerNet/NetworkComponents/ClassificationNode";
import {ScratchEvent} from "../../../src/whisker/testcase/events/ScratchEvent";
import {WaitEvent} from "../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../src/whisker/testcase/events/MouseMoveEvent";

describe("NeuroevolutionUtil Tests", () => {

    let population: NeatPopulation<NetworkChromosome>;
    let populationSize: number;
    let crossoverOp: NeatCrossover;
    let mutation: NeatMutation;
    let genInputs: Map<string, Map<string, number>>;
    let events: List<ScratchEvent>;
    let generator: NetworkChromosomeGeneratorSparse;
    let properties: NeuroevolutionProperties<NetworkChromosome>;


    beforeEach(() => {
        const crossoverConfig = {
            "operator": "neatCrossover",
            "crossoverWithoutMutation": 0.2,
            "interspeciesRate": 0.001,
            "weightAverageRate": 0.4
        };
        crossoverOp = new NeatCrossover(crossoverConfig);

        const mutationConfig = {
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
        populationSize = 50;
        properties = new NeuroevolutionProperties<NetworkChromosome>(populationSize);
        properties.weightCoefficient = 0.4;
        properties.excessCoefficient = 1;
        properties.disjointCoefficient = 1;
        events = new List<ScratchEvent>([new MouseMoveEvent()]);
        generator = new NetworkChromosomeGeneratorSparse(mutationConfig, crossoverConfig, genInputs, events,0.4);
    })

    test("Test Speciation when a new Population gets created", () => {
        population = new NeatPopulation<NetworkChromosome>(generator, properties);
        population.generatePopulation();
        expect(population.speciesCount).toBeGreaterThanOrEqual(1);
        expect(population.species.size()).toBeGreaterThanOrEqual(1);
    })

    test("Test Speciation when a new Population gets created and a low speciation Threshold", () => {
        properties.distanceThreshold = 0.01;
        population = new NeatPopulation<NetworkChromosome>(generator, properties);
        population.generatePopulation();
        expect(population.speciesCount).toBeGreaterThanOrEqual(1);
        expect(population.species.size()).toBeGreaterThanOrEqual(1);
        // With this low threshold every unique connection leads to compatDistance above the Threshold
        // Therefore, we cannot have more than inputNodes * outputNodes connections
        expect(population.species.size()).toBeLessThanOrEqual(populationSize);
    })

    test("Test Speciation when a new Population gets created and a high speciation Threshold", () => {
        properties.distanceThreshold = 1000;
        population = new NeatPopulation<NetworkChromosome>(generator, properties);
        population.generatePopulation();
        expect(population.speciesCount).toBeGreaterThanOrEqual(1);
        expect(population.species.size()).toBeGreaterThanOrEqual(1);
        // With this low threshold every unique connection leads to compatDistance above the Threshold
        // Therefore, we cannot have more than inputNodes * outputNodes connections
        expect(population.species.size()).toBeLessThanOrEqual(populationSize);
    })

    test("Test Speciation with a chromosome mutated several times", () => {
        population = new NeatPopulation<NetworkChromosome>(generator, properties);
        const chromosome = generator.get();
        const mutant = chromosome.cloneStructure();
        for (let i = 0; i < 100; i++) {
            mutant.mutate();
            NeuroevolutionUtil.speciate(mutant, population, properties);
        }
        expect(population.speciesCount).toBeGreaterThan(1);
    })

    test("Test Compatibility Distance of clones", () => {
        const chromosome1 = generator.get();
        const chromosome2 = chromosome1.cloneStructure();
        const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4);
        expect(compatDistance).toBe(0);
    })

    test("Test Compatibility Distance of Chromosomes with disjoint connections", () => {
        const inputNode1 = new InputNode(0,"Sprite1", "X-Position");
        const inputNode2 = new InputNode(1,"Sprite2", "Y-Position");
        const outputNode = new ClassificationNode(2, new WaitEvent(), ActivationFunction.SIGMOID);

        const nodes = new List<NodeGene>();
        nodes.add(inputNode1);
        nodes.add(inputNode2);
        nodes.add(outputNode);


        const connection1 = new ConnectionGene(inputNode1, outputNode, 1, true, 0, false);
        const connection2 = new ConnectionGene(inputNode2, outputNode, 0.5, true, 1, false);

        const connections1 = new List<ConnectionGene>();
        connections1.add(connection1);

        const connections2 = new List<ConnectionGene>();
        connections2.add(connection2);

        const chromosome1 = new NetworkChromosome(connections1, nodes, mutation, crossoverOp);
        const chromosome2 = new NetworkChromosome(connections2, nodes, mutation, crossoverOp);

        const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4);
        expect(compatDistance).toBe(1);
    })

    test("Test Compatibility Distance of Chromosomes with disjoint connections switched", () => {
        const inputNode1 = new InputNode(0,"Sprite1", "X-Position");
        const inputNode2 = new InputNode(1,"Sprite2", "Y-Position");
        const outputNode = new ClassificationNode(2, new WaitEvent(), ActivationFunction.SIGMOID);

        const nodes = new List<NodeGene>();
        nodes.add(inputNode1);
        nodes.add(inputNode2);
        nodes.add(outputNode);


        const connection1 = new ConnectionGene(inputNode1, outputNode, 1, true, 0, false);
        const connection2 = new ConnectionGene(inputNode2, outputNode, 0.5, true, 1, false);

        const connections1 = new List<ConnectionGene>();
        connections1.add(connection1);

        const connections2 = new List<ConnectionGene>();
        connections2.add(connection2);

        const chromosome1 = new NetworkChromosome(connections2, nodes, mutation, crossoverOp);
        const chromosome2 = new NetworkChromosome(connections1, nodes, mutation, crossoverOp);

        const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4);
        expect(compatDistance).toBe(1)
    })

    test("Test Compatibility Distance of Chromosomes with excess connections", () => {
        const chromosome1 = generator.get();
        const chromosome2 = chromosome1.cloneStructure();

        const node1 = chromosome1.inputNodes.get("Sprite1").get("X-Position");
        const node2 = chromosome1.outputNodes.get(1);
        chromosome2.connections.add(new ConnectionGene(node1, node2, 1, true, 1000, false));
        const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4);
        expect(compatDistance).toBe(1);
    })

    test("Test Compatibility Distance of Chromosomes with same connections but different weights", () => {
        const inputNode1 = new InputNode(0,"Sprite1", "X-Position");
        const inputNode2 = new InputNode(1,"Sprite2", "Y-Position");
        const outputNode = new ClassificationNode(2, new WaitEvent(), ActivationFunction.SIGMOID);

        const nodes = new List<NodeGene>();
        nodes.add(inputNode1);
        nodes.add(inputNode2);
        nodes.add(outputNode);


        const connection1 = new ConnectionGene(inputNode1, outputNode, 1, true, 0, false);
        const connection2 = new ConnectionGene(inputNode1, outputNode, 0.5, true, 0, false);

        const connections1 = new List<ConnectionGene>();
        connections1.add(connection1);

        const connections2 = new List<ConnectionGene>();
        connections2.add(connection2);

        const chromosome1 = new NetworkChromosome(connections1, nodes, mutation, crossoverOp);
        const chromosome2 = new NetworkChromosome(connections2, nodes, mutation, crossoverOp);
        const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4);
        expect(compatDistance).toBe(0.4 * 0.5);
    })

    test("Test Compatibility Distance of undefined chromosome", () => {
        const chromosome1 = generator.get();
        const chromosome2 = undefined;
        const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome1, chromosome2, 1, 1, 0.4);
        expect(compatDistance).toBe(Number.MAX_SAFE_INTEGER);
    })

    test("Test Softmax calculation", () =>{
        const chromosome = generator.get();
        const stabiliseCount = chromosome.updateStabiliseCount(30);
        for (let i = 0; i < stabiliseCount + 1; i++) {
            chromosome.activateNetwork(genInputs)
        }
        const softmaxOutput = NeuroevolutionUtil.softmaxEvents(chromosome, events);
        expect(Math.round(softmaxOutput.reduce((a, b) => a + b))).toBe(1);

    })

    test("Test RELU activation functino", () =>{
        expect(NeuroevolutionUtil.relu(Math.PI)).toEqual(Math.PI);
        expect(NeuroevolutionUtil.relu(-Math.PI)).toEqual(0);
    })

    test("Test findConnection for connection which is inside the list", () =>{
        const connectionList = new List<ConnectionGene>()
        const chromosome = generator.get();
        for(const connection of chromosome.connections)
            connectionList.add(connection);
        expect(NeuroevolutionUtil.findConnection(connectionList, chromosome.connections.get(0))).toBe(chromosome.connections.get(0));
    })

    test("Test findConnection for connection which is not inside the list", () =>{
        const connectionList = new List<ConnectionGene>();
        const chromosome = generator.get();
        for(const connection of chromosome.connections)
            connectionList.add(connection);
        const inNode = new InputNode(100,"Sprite2", "X-Position");
        const outNode = new ClassificationNode(101, new WaitEvent(), ActivationFunction.SIGMOID);
        const newConnection = new ConnectionGene(inNode, outNode, 1, true, 100, false);
        expect(NeuroevolutionUtil.findConnection(connectionList, newConnection)).toBe(null);
    })

    test("Test Assign innovation number of a new connection", () =>{
        const inNode = new InputNode(100,"Sprite3", "X-Position");
        const outNode = new ClassificationNode(101, new WaitEvent(), ActivationFunction.SIGMOID);
        const newConnection = new ConnectionGene(inNode, outNode, 1, true, 100, false);
        NeuroevolutionUtil.assignInnovationNumber(newConnection);
        expect(newConnection.innovation).toBeLessThan(100);
    })

    test("Test Assign innovation number of a new connection which is similar to an existing one", () =>{
        const chromosome = generator.get();
        const existingConnection = chromosome.connections.get(0);
        const existingInode= existingConnection.source as InputNode;
        const existingOnode= existingConnection.target as ClassificationNode;
        const inNode = new InputNode(existingInode.uID, existingInode.sprite, existingInode.feature);
        const outNode = new ClassificationNode(existingOnode.uID, existingOnode.event, existingOnode.activationFunction);
        const newConnection = new ConnectionGene(inNode, outNode, 1, true, 100, false);
        NeuroevolutionUtil.assignInnovationNumber(newConnection);
        expect(newConnection.innovation).toBe(existingConnection.innovation);
    })
})
