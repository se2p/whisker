import {NeatChromosome} from "../../../src/whisker/NEAT/NeatChromosome";
import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";
import {List} from "../../../src/whisker/utils/List";
import {ConnectionGene} from "../../../src/whisker/NEAT/ConnectionGene";
import {NodeGene} from "../../../src/whisker/NEAT/NodeGene";
import {NodeType} from "../../../src/whisker/NEAT/NodeType";
import {Pair} from "../../../src/whisker/utils/Pair";

describe("NeatCrossover", () => {

    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let parent1Connections: List<ConnectionGene>
    let parent2Connections: List<ConnectionGene>
    let inputNodes: List<NodeGene>
    let outputNodes: List<NodeGene>

    beforeEach(() => {
        mutationOp = new NeatMutation();
        crossoverOp = new NeatCrossover();

        // Create Nodes of both networks
        inputNodes = new List<NodeGene>()
        inputNodes.add(new NodeGene(0, NodeType.INPUT))
        inputNodes.add(new NodeGene(1, NodeType.INPUT))
        inputNodes.add(new NodeGene(2, NodeType.INPUT))

        outputNodes = new List<NodeGene>()
        outputNodes.add(new NodeGene(4, NodeType.OUTPUT))

        const hiddenNode1 = new NodeGene(3, NodeType.HIDDEN)
        const hiddenNode2 = new NodeGene(5, NodeType.HIDDEN)


        // Create Connections of first parent
        parent1Connections = new List<ConnectionGene>();
        parent1Connections.add(new ConnectionGene(inputNodes.get(0), hiddenNode1, 0, true, 1));
        parent1Connections.add(new ConnectionGene(inputNodes.get(1), hiddenNode1, 0, true, 2));
        parent1Connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(0), 0, false, 4));
        parent1Connections.add(new ConnectionGene(inputNodes.get(2), outputNodes.get(0), 0, true, 5));
        parent1Connections.add(new ConnectionGene(hiddenNode1, outputNodes.get(0), 0, true, 6));


        // Create Connections of second parent
        parent2Connections = new List<ConnectionGene>();
        parent2Connections.add(new ConnectionGene(inputNodes.get(0), hiddenNode1, 0, false, 1));
        parent2Connections.add(new ConnectionGene(inputNodes.get(1), hiddenNode1, 0, true, 2));
        parent2Connections.add(new ConnectionGene(inputNodes.get(2), hiddenNode1, 0, true, 3));
        parent2Connections.add(new ConnectionGene(inputNodes.get(1), outputNodes.get(0), 0, false, 4));
        parent2Connections.add(new ConnectionGene(hiddenNode1, outputNodes.get(0), 0, true, 6));
        parent2Connections.add(new ConnectionGene(inputNodes.get(0), hiddenNode2, 0, true, 7));
        parent2Connections.add(new ConnectionGene(hiddenNode2, hiddenNode1, 0, true, 8));
    })


    test("CrossoverTest with first parent being fitter than second parent", () => {
        const parent1 = new NeatChromosome(parent1Connections, inputNodes, outputNodes, crossoverOp, mutationOp)
        parent1.fitness = 1;
        const parent2 = new NeatChromosome(parent2Connections, inputNodes, outputNodes, crossoverOp, mutationOp)
        parent2.fitness = 0;
        const child1 = crossoverOp.apply(parent1, parent2).getFirst()
        const child2 = crossoverOp.applyFromPair(new Pair<NeatChromosome>(parent1, parent2)).getFirst()
        expect(child1.connections.size()).toBe(5)
        expect(child1.connections.size()).toEqual(child2.connections.size())
    })

    test("CrossoverTest with second parent being fitter than first parent", () => {
        const parent1 = new NeatChromosome(parent1Connections, inputNodes, outputNodes, crossoverOp, mutationOp)
        parent1.fitness = 0;
        const parent2 = new NeatChromosome(parent2Connections, inputNodes, outputNodes, crossoverOp, mutationOp)
        parent2.fitness = 1;
        const child1 = crossoverOp.apply(parent1, parent2).getFirst()
        const child2 = crossoverOp.applyFromPair(new Pair<NeatChromosome>(parent1, parent2)).getFirst()
        expect(child1.connections.size()).toBe(7)
        expect(child2.connections.size()).toEqual(child1.connections.size())
    })

    test("CrossoverTest with both parents being equivalently fit", () => {
        const parent1 = new NeatChromosome(parent1Connections, inputNodes, outputNodes, crossoverOp, mutationOp)
        parent1.fitness = 1;
        const parent2 = new NeatChromosome(parent2Connections, inputNodes, outputNodes, crossoverOp, mutationOp)
        parent2.fitness = 1;
        const child1 = crossoverOp.apply(parent1, parent2).getFirst()
        const child2 = crossoverOp.applyFromPair(new Pair<NeatChromosome>(parent1, parent2)).getFirst()
        expect(child1.connections.size()).toBeGreaterThanOrEqual(4)
        expect(child2.connections.size()).toBeGreaterThanOrEqual(4)
    })
})
