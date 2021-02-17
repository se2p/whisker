import {NEAT} from "../../../../src/whisker/search/algorithms/NEAT";
import {SearchAlgorithmBuilder} from "../../../../src/whisker/search/SearchAlgorithmBuilder";
import {SearchAlgorithmType} from "../../../../src/whisker/search/algorithms/SearchAlgorithmType";
import {NeatChromosome} from "../../../../src/whisker/NEAT/NeatChromosome";
import {SearchAlgorithm} from "../../../../src/whisker/search/SearchAlgorithm";
import {SearchAlgorithmProperties} from "../../../../src/whisker/search/SearchAlgorithmProperties";
import {NeatChromosomeGenerator} from "../../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatMutation} from "../../../../src/whisker/NEAT/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/NEAT/NeatCrossover";
import {NodeGene} from "../../../../src/whisker/NEAT/NodeGene";
import {NodeType} from "../../../../src/whisker/NEAT/NodeType";
import {List} from "../../../../src/whisker/utils/List";
import {ConnectionGene} from "../../../../src/whisker/NEAT/ConnectionGene";


describe("NEAT SearchAlgorithm", () => {
    let neat: SearchAlgorithm<NeatChromosome>
    const populationSize = 20;
    const hiddenLayerSize = 10;

    beforeEach(() => {
        const builder: SearchAlgorithmBuilder<NeatChromosome> = new SearchAlgorithmBuilder(SearchAlgorithmType.NEAT);
        builder.addChromosomeGenerator(new NeatChromosomeGenerator(new NeatMutation(), new NeatCrossover()))
        neat = builder.buildSearchAlgorithm();
    })

    test("NEAT findSolution", () => {
        neat.findSolution();

    })
})

describe("NEAT Helper Methods", () => {

    let neat: SearchAlgorithm<NeatChromosome>
    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let parent1Connections: List<ConnectionGene>
    let parent2Connections: List<ConnectionGene>

    beforeEach(() => {
        const builder: SearchAlgorithmBuilder<NeatChromosome> = new SearchAlgorithmBuilder(SearchAlgorithmType.NEAT);
        builder.addChromosomeGenerator(new NeatChromosomeGenerator(new NeatMutation(), new NeatCrossover()))
        neat = builder.buildSearchAlgorithm();
        mutationOp = new NeatMutation();
        crossoverOp = new NeatCrossover();

        // Create Nodes of both networks
        const node1 = new NodeGene(0, NodeType.INPUT, 0)
        const node2 = new NodeGene(1, NodeType.INPUT, 0)
        const node3 = new NodeGene(2, NodeType.INPUT, 0)
        const node4 = new NodeGene(3, NodeType.HIDDEN, 0.5)
        const node5 = new NodeGene(4, NodeType.OUTPUT, 1)
        const node6 = new NodeGene(5, NodeType.HIDDEN, 0.5)


        // Create Connections of first parent
        parent1Connections = new List<ConnectionGene>();
        parent1Connections.add(new ConnectionGene(node1, node4, 0, true, 1));
        parent1Connections.add(new ConnectionGene(node2, node4, 0, true, 2));
        parent1Connections.add(new ConnectionGene(node2, node5, 0, false, 4));
        parent1Connections.add(new ConnectionGene(node3, node5, 0, true, 5));
        parent1Connections.add(new ConnectionGene(node4, node5, 0, true, 6));


        // Create Connections of second parent
        parent2Connections = new List<ConnectionGene>();
        parent2Connections.add(new ConnectionGene(node1, node4, 0, false, 1));
        parent2Connections.add(new ConnectionGene(node2, node4, 0, true, 2));
        parent2Connections.add(new ConnectionGene(node3, node4, 0, true, 3));
        parent2Connections.add(new ConnectionGene(node2, node5, 0, false, 4));
        parent2Connections.add(new ConnectionGene(node4, node5, 0, true, 6));
        parent2Connections.add(new ConnectionGene(node1, node6, 0, true, 7));
        parent2Connections.add(new ConnectionGene(node6, node4, 0, true, 8));


    })

    test("Calculate Compatibility Distance", () => {
        const genome1 = new NeatChromosome(parent1Connections, crossoverOp, mutationOp);
        const genome2 = new NeatChromosome(parent2Connections, crossoverOp, mutationOp)
        const test = new NEAT();
        test.compatibilityDistance(genome1, genome2)
    })
})
