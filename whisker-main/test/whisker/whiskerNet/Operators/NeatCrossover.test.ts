import {NeatMutation} from "../../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/Operators/NeatCrossover";
import {ConnectionGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/ConnectionGene";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {HiddenNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/HiddenNode";
import {ClassificationNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/ClassificationNode";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {NeatChromosome} from "../../../../src/whisker/whiskerNet/Networks/NeatChromosome";
import {Container} from "../../../../src/whisker/utils/Container";
import {NetworkLayer} from "../../../../src/whisker/whiskerNet/Networks/NetworkChromosome";

describe("Test NeatCrossover", () => {

    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let parent1Connections: ConnectionGene[];
    let parent2Connections: ConnectionGene[];
    const layer1: NetworkLayer = new Map<number, NodeGene[]>();
    const layer2: NetworkLayer = new Map<number, NodeGene[]>();

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
        const iNode1 = new InputNode(0, "Sprite1", "X-Position");
        const iNode2 = new InputNode(1, "Sprite1", "Y-Position");
        const iNode3 = new BiasNode(2);
        layer1.set(0, [iNode1, iNode2, iNode3]);

        const oNode1 = new ClassificationNode(4, new WaitEvent(), ActivationFunction.SIGMOID);
        layer1.set(1, [oNode1]);
        const hiddenNode1 = new HiddenNode(3, 0.5,ActivationFunction.SIGMOID);
        layer1.set(0.5, [hiddenNode1]);

        // Create Connections of first parent
        parent1Connections = [];
        parent1Connections.push(new ConnectionGene(iNode1, hiddenNode1, 1, true, 1));
        parent1Connections.push(new ConnectionGene(iNode2, hiddenNode1, 2, true, 2));
        parent1Connections.push(new ConnectionGene(iNode2, oNode1, 3, false, 4));
        parent1Connections.push(new ConnectionGene(iNode3, oNode1, 4, true, 5));
        parent1Connections.push(new ConnectionGene(hiddenNode1, oNode1, 5, true, 6));
        parent1Connections.push(new ConnectionGene(hiddenNode1, hiddenNode1, 0.1, true, 7));

        // Create Nodes of second network
        const iNode4 = iNode1.clone();
        const iNode5 = iNode2.clone();
        const iNode6 = iNode3.clone();
        layer2.set(0, [iNode4, iNode5, iNode6]);

        const oNode2 = oNode1.clone();
        layer2.set(1, [oNode2]);

        const hiddenNode2 = hiddenNode1.clone();
        const hiddenNode3 = new HiddenNode(5, 0.5,ActivationFunction.SIGMOID);
        layer2.set(0.5, [hiddenNode2, hiddenNode3]);

        // Create Connections of second parent
        parent2Connections = [];
        parent2Connections.push(new ConnectionGene(iNode5, oNode2, 9, false, 4));
        parent2Connections.push(new ConnectionGene(hiddenNode3, hiddenNode2, 12, true, 8));
        parent2Connections.push(new ConnectionGene(iNode4, hiddenNode2, 6, false, 1));
        parent2Connections.push(new ConnectionGene(iNode5, hiddenNode2, 7, true, 2));
        parent2Connections.push(new ConnectionGene(iNode6, hiddenNode2, 8, true, 3));
        parent2Connections.push(new ConnectionGene(hiddenNode2, oNode2, 10, true, 6));
        parent2Connections.push(new ConnectionGene(iNode4, hiddenNode3, 11, true, 9));
    });


    test("CrossoverTest with first parent being fitter than second parent", () => {
        const parent1 = new NeatChromosome(layer1, parent1Connections, mutationOp, crossoverOp, undefined);
        parent1.fitness = 1;
        const parent2 = new NeatChromosome(layer2, parent2Connections, mutationOp, crossoverOp, undefined);
        parent2.fitness = 0;
        const child1 = crossoverOp.apply(parent1, parent2)[0];
        const child2 = crossoverOp.applyFromPair([parent1, parent2])[0];
        expect(child1.connections.length).toBe(6);
        expect(child1.connections.length).toEqual(child2.connections.length);
        expect(child1.layers.size).toEqual(parent1.layers.size);
        expect(child1.layers.get(0).length).toEqual(parent1.layers.get(0).length);
        expect(child1.layers.get(1).length).toEqual(parent1.layers.get(1).length);
        expect(child1.layers.get(0.5).length).toEqual(parent1.layers.get(0.5).length);
    });

    test("CrossoverTest with second parent being fitter than first parent", () => {
        const parent1 = new NeatChromosome(layer1, parent1Connections, mutationOp, crossoverOp, undefined);
        parent1.fitness = 0;
        const parent2 = new NeatChromosome(layer2, parent2Connections, mutationOp, crossoverOp, undefined);
        parent2.fitness = 1;
        const child1 = crossoverOp.apply(parent1, parent2)[0];
        const child2 = crossoverOp.applyFromPair([parent1, parent2])[0];
        expect(child1.connections.length).toBe(7);
        expect(child2.connections.length).toEqual(child1.connections.length);
        expect(child2.connections.length).toEqual(child2.connections.length);
        expect(child2.layers.size).toEqual(parent2.layers.size);
        expect(child2.layers.get(0).length).toEqual(parent2.layers.get(0).length);
        expect(child2.layers.get(1).length).toEqual(parent2.layers.get(1).length);
        expect(child2.layers.get(0.5).length).toEqual(parent2.layers.get(0.5).length);
    });

    test("CrossoverTest with both parents being equivalently fit", () => {
        const parent1 = new NeatChromosome(layer1, parent1Connections, mutationOp, crossoverOp, undefined);
        parent1.fitness = 1;
        const parent2 = new NeatChromosome(layer2, parent2Connections, mutationOp, crossoverOp, undefined);
        parent2.fitness = 1;
        const child1 = crossoverOp.apply(parent1, parent2)[0];
        expect(child1.connections.length).toBeGreaterThanOrEqual(5);
        expect(child1.connections.length).toBeLessThanOrEqual(6);

        expect(child1.connections.length).toBe(6);
        expect(child1.layers.size).toEqual(parent1.layers.size);
        expect(child1.layers.get(0).length).toEqual(parent1.layers.get(0).length);
        expect(child1.layers.get(1).length).toEqual(parent1.layers.get(1).length);
        expect(child1.layers.get(0.5).length).toEqual(parent1.layers.get(0.5).length);
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
        const layer1:NetworkLayer = new Map<number, NodeGene[]>();
        layer1.set(0, [iNode1]);
        layer1.set(1, [oNode1]);

        // Create Connections of first parent
        parent1Connections = [new ConnectionGene(iNode1, oNode1, 1, true, 1)];

        // Create Nodes of second network
        const iNode2 = iNode1.clone();
        const oNode2 = oNode1.clone();
        const layer2:NetworkLayer = new Map<number, NodeGene[]>();
        layer2.set(0, [iNode2]);
        layer2.set(1, [oNode2]);

        // No connections for second network
        parent2Connections = [];


        const parent1 = new NeatChromosome(layer1, parent1Connections, mutationOp, crossoverOp, undefined);
        parent1.fitness = 1;
        const parent2 = new NeatChromosome(layer2, parent2Connections, mutationOp, crossoverOp, undefined);
        parent2.fitness = 0;


        const child = crossoverOp.apply(parent1, parent2)[0];


        expect(child.connections.length).toBe(1);
        expect(child.connections[0].weight).toBe(1);
    });
});
