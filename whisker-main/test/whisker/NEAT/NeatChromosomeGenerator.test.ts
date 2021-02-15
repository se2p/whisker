import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";
import {NeatConfig} from "../../../src/whisker/NEAT/NeatConfig";

describe('NeatChromosomeGenerator', () => {

    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let generator: NeatChromosomeGenerator

    beforeEach(() => {
        mutationOp = new NeatMutation();
        crossoverOp = new NeatCrossover();
        generator = new NeatChromosomeGenerator(mutationOp, crossoverOp);
    })

    test('Create initial random Chromosome', () => {
        const neatChromosome = generator.get();
        // add +1 to the input Nodes due to the Bias Node
        const nodes = neatChromosome.nodes.values()
        let nodeCounter = 0;
        for (const nodeList of nodes)
            nodeCounter += nodeList.size();
        expect(nodeCounter).toBe(NeatConfig.INPUT_NEURONS + 1 + NeatConfig.OUTPUT_NEURONS)
        expect(neatChromosome.connections.size()).toBe((NeatConfig.INPUT_NEURONS + 1) * NeatConfig.OUTPUT_NEURONS)
    })

    test('Create two random Chromosome and compare innovationNumbers', () => {
        const firstChromosome = generator.get();
        const firstInnovations = []
        for (const firstConnection of firstChromosome.connections)
            firstInnovations.push(firstConnection.innovation)

        const secondChromosome = generator.get();
        const secondInnovations = []
        for (const secondConnection of secondChromosome.connections)
            secondInnovations.push(secondConnection.innovation)

        expect(firstInnovations).toEqual(secondInnovations)
    })
})
