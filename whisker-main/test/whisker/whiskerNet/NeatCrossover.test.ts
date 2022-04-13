import {NeatMutation} from "../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/whiskerNet/Operators/NeatCrossover";
import {ConnectionGene} from "../../../src/whisker/whiskerNet/NetworkComponents/ConnectionGene";
import {NodeGene} from "../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {ActivationFunction} from "../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {HiddenNode} from "../../../src/whisker/whiskerNet/NetworkComponents/HiddenNode";
import {ClassificationNode} from "../../../src/whisker/whiskerNet/NetworkComponents/ClassificationNode";
import {InputNode} from "../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {BiasNode} from "../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";
import {WaitEvent} from "../../../src/whisker/testcase/events/WaitEvent";
import {NeatChromosome} from "../../../src/whisker/whiskerNet/Networks/NeatChromosome";
import {Container} from "../../../src/whisker/utils/Container";

describe("Test NeatCrossover", () => {

    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let parent1Connections: ConnectionGene[];
    let parent2Connections: ConnectionGene[];
    let nodes1: NodeGene[];
    let nodes2: NodeGene[];

    beforeEach(() => {
        const crossoverConfig = {
            "operator": "neatCrossover",
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
        mutationOp = new NeatMutation(mutationConfig);

        Container.debugLog = () => { /*No operation */ };

        // Create Nodes of first network
        nodes1 = [];
        const iNode1 = new InputNode(0, "Sprite1", "X-Position");
        const iNode2 = new InputNode(1, "Sprite1", "Y-Position");
        const iNode3 = new BiasNode(2);
        nodes1.push(iNode1);
        nodes1.push(iNode2);
        nodes1.push(iNode3);

        const oNode1 = new ClassificationNode(4, new WaitEvent(), ActivationFunction.SIGMOID);
        nodes1.push(oNode1);
        const hiddenNode1 = new HiddenNode(3, ActivationFunction.SIGMOID);
        nodes1.push(hiddenNode1);

        // Create Connections of first parent
        parent1Connections = [];
        parent1Connections.push(new ConnectionGene(iNode1, hiddenNode1, 1, true, 1, false));
        parent1Connections.push(new ConnectionGene(iNode2, hiddenNode1, 2, true, 2, false));
        parent1Connections.push(new ConnectionGene(iNode2, oNode1, 3, false, 4, false));
        parent1Connections.push(new ConnectionGene(iNode3, oNode1, 4, true, 5, false));
        parent1Connections.push(new ConnectionGene(hiddenNode1, oNode1, 5, true, 6, false));
        parent1Connections.push(new ConnectionGene(hiddenNode1, hiddenNode1, 0.1, true, 7, true));

        // Create Nodes of second network
        const iNode4 = iNode1.clone();
        const iNode5 = iNode2.clone();
        const iNode6 = iNode3.clone();
        nodes2 = [];
        nodes2.push(iNode4);
        nodes2.push(iNode5);
        nodes2.push(iNode6);

        const oNode2 = oNode1.clone();
        nodes2.push(oNode2);

        const hiddenNode2 = hiddenNode1.clone();
        const hiddenNode3 = new HiddenNode(5, ActivationFunction.SIGMOID);
        nodes2.push(hiddenNode2);
        nodes2.push(hiddenNode3);

        // Create Connections of second parent
        parent2Connections = [];
        parent2Connections.push(new ConnectionGene(iNode5, oNode2, 9, false, 4, false));
        parent2Connections.push(new ConnectionGene(hiddenNode3, hiddenNode2, 12, true, 8, false));
        parent2Connections.push(new ConnectionGene(iNode4, hiddenNode2, 6, false, 1, false));
        parent2Connections.push(new ConnectionGene(iNode5, hiddenNode2, 7, true, 2, false));
        parent2Connections.push(new ConnectionGene(iNode6, hiddenNode2, 8, true, 3, false));
        parent2Connections.push(new ConnectionGene(hiddenNode2, oNode2, 10, true, 6, false));
        parent2Connections.push(new ConnectionGene(iNode4, hiddenNode3, 11, true, 9, false));
    });


    test("CrossoverTest with first parent being fitter than second parent", () => {
        const parent1 = new NeatChromosome(nodes1, parent1Connections, mutationOp, crossoverOp, undefined);
        parent1.fitness = 1;
        const parent2 = new NeatChromosome(nodes2, parent2Connections, mutationOp, crossoverOp, undefined);
        parent2.fitness = 0;
        const child1 = crossoverOp.apply(parent1, parent2)[0];
        const child2 = crossoverOp.applyFromPair([parent1, parent2])[0];
        expect(child1.connections.length).toBe(6);
        expect(child1.connections.length).toEqual(child2.connections.length);
    });

    test("CrossoverTest with second parent being fitter than first parent", () => {
        const parent1 = new NeatChromosome(nodes1, parent1Connections, mutationOp, crossoverOp, undefined);
        parent1.fitness = 0;
        const parent2 = new NeatChromosome(nodes2, parent2Connections, mutationOp, crossoverOp, undefined);
        parent2.fitness = 1;
        const child1 = crossoverOp.apply(parent1, parent2)[0];
        const child2 = crossoverOp.applyFromPair([parent1, parent2])[0];
        expect(child1.connections.length).toBe(7);
        expect(child2.connections.length).toEqual(child1.connections.length);
    });

    test("CrossoverTest with both parents being equivalently fit", () => {
        const parent1 = new NeatChromosome(nodes1, parent1Connections, mutationOp, crossoverOp, undefined);
        parent1.fitness = 1;
        const parent2 = new NeatChromosome(nodes2, parent2Connections, mutationOp, crossoverOp, undefined);
        parent2.fitness = 1;
        const child1 = crossoverOp.apply(parent1, parent2)[0];
        expect(child1.connections.length).toBeGreaterThanOrEqual(5);
        expect(child1.connections.length).toBeLessThanOrEqual(6);
    });

    test("CrossoverTest with deactivated connections", () => {
        const inNode = new InputNode(0, "Sprite1", "X-Position");
        const outNode = new ClassificationNode(2, new WaitEvent(), ActivationFunction.SIGMOID);
        const nodes: NodeGene[] = [inNode, outNode];

        parent1Connections = [];
        parent1Connections.push(new ConnectionGene(inNode, outNode, 1, false, 0, false));
        const parent1 = new NeatChromosome(nodes, parent1Connections, mutationOp, crossoverOp, undefined);
        parent1.fitness = 1;

        parent2Connections = [];
        parent2Connections.push(new ConnectionGene(inNode, outNode, 2, false, 0, false));
        const parent2 = new NeatChromosome(nodes, parent2Connections, mutationOp, crossoverOp, undefined);
        parent2.fitness = 0.1;

        const child1 = crossoverOp.apply(parent1, parent2)[0];
        const child2 = crossoverOp.applyFromPair([parent1, parent2])[0];

        // Execute 10 times. Due to randomness the connection may get activated during crossover
        const inputs1 = child1.generateDummyInputs();
        const inputs2 = child2.generateDummyInputs();
        for (let i = 0; i < 10; i++) {
            expect(child1.activateNetwork(inputs1)).toBeTruthy();
            expect(child2.activateNetwork(inputs2)).toBeTruthy();
        }
    });

    test("CrossoverTest with excess genes and average weight", () => {
        const crossoverConfig = {
            "operator": "neatCrossover",
            "interspeciesRate": 0.001,
            // Always use the average
            "weightAverageRate": 1.0
        };
        const crossoverOp = new NeatCrossover(crossoverConfig);


        // Create Nodes of first network
        const iNode1 = new InputNode(0, "InputNode", "Nothing");
        const oNode1 = new ClassificationNode(1, new WaitEvent(), ActivationFunction.SIGMOID);
        nodes1 = [iNode1, oNode1];

        // Create Connections of first parent
        parent1Connections = [new ConnectionGene(iNode1, oNode1, 1, true, 1, false)];


        // Create Nodes of second network
        const iNode2 = iNode1.clone();
        const oNode2 = oNode1.clone();
        nodes2 = [iNode2, oNode2];

        // No connections for second network
        parent2Connections = [];


        const parent1 = new NeatChromosome(nodes1, parent1Connections, mutationOp, crossoverOp, undefined);
        parent1.fitness = 1;
        const parent2 = new NeatChromosome(nodes2, parent2Connections, mutationOp, crossoverOp, undefined);
        parent2.fitness = 0;


        const child = crossoverOp.apply(parent1, parent2)[0];


        expect(child.connections.length).toBe(1);
        expect(child.connections[0].weight).toBe(1);
    });
});
