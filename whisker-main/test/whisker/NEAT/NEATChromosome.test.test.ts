import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";
import {ConnectionGene} from "../../../src/whisker/NEAT/ConnectionGene";
import {NodeGene} from "../../../src/whisker/NEAT/NodeGene";
import {NodeType} from "../../../src/whisker/NEAT/NodeType";
import {NeatChromosome} from "../../../src/whisker/NEAT/NeatChromosome";
import {Mutation} from "../../../src/whisker/search/Mutation";
import {Crossover} from "../../../src/whisker/search/Crossover";

describe('NeatChromosome', () => {

    let neatChromosome: NeatChromosome
    let generator: NeatChromosomeGenerator
    let mutationOp: Mutation<NeatChromosome>
    let crossoverOp: Crossover<NeatChromosome>
    const numInputs = 3
    const numOutputs = 2


    beforeEach(() => {
        mutationOp = new NeatMutation();
        crossoverOp = new NeatCrossover();
        generator = new NeatChromosomeGenerator(mutationOp, crossoverOp);
        generator.numInputNodes = numInputs;
        generator.numOutputNodes = numOutputs;
        neatChromosome = generator.get();
        neatChromosome.numInputNodes = numInputs
        neatChromosome.numOutputNodes = numOutputs;
    })

    test('Create Network without hidden layer', () => {
        neatChromosome.generateNetwork()
        // add +1 to the input Nodes due to the Bias Node
        expect(neatChromosome.getNodes().size).toBe(generator.numInputNodes + 1 + generator.numOutputNodes)
        expect(neatChromosome.getConnections().size()).toBe((generator.numInputNodes + 1) * generator.numOutputNodes)
    })

    test('Create Network with hidden layer', () => {
        const hiddenNode = new NodeGene(NodeType.HIDDEN, 0)
        neatChromosome.getConnections().add(new ConnectionGene(neatChromosome.getNodes().get(0), hiddenNode, 0.5, true))
        neatChromosome.getConnections().add(new ConnectionGene(hiddenNode, neatChromosome.getNodes().get(5), 0, true))
        neatChromosome.generateNetwork()
        // add +1 to the input Nodes due to the Bias Node
        expect(neatChromosome.getNodes().size).toBe(generator.numInputNodes + 1 + generator.numOutputNodes + 1)
        expect(neatChromosome.getConnections().size()).toBe((generator.numInputNodes + 1) * generator.numOutputNodes + 2)
    })
})
