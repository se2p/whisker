import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";
import {NeatConfig} from "../../../src/whisker/NEAT/NeatConfig";

describe('NeatChromosomeGenerator', () => {

    test('Create initial random Chromosome', () => {
        const mutationOp = new NeatMutation();
        const crossoverOp = new NeatCrossover();
        const generator = new NeatChromosomeGenerator(mutationOp, crossoverOp);
        const neatChromosome = generator.get();
        // add +1 to the input Nodes due to the Bias Node
        const nodes = neatChromosome.getNodes().values()
        let nodeCounter = 0;
        for(const nodeList of nodes)
            nodeCounter += nodeList.size();
        expect(nodeCounter).toBe(NeatConfig.INPUT_NEURONS + 1 + NeatConfig.OUTPUT_NEURONS)
        expect(neatChromosome.getConnections().size()).toBe((NeatConfig.INPUT_NEURONS + 1) * NeatConfig.OUTPUT_NEURONS)
    })
})
