import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatChromosome} from "../../../src/whisker/NEAT/NeatChromosome";
import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";


describe("NeatMutation", () => {

    let neatChromosome: NeatChromosome;
    let neatChromosomeGenerator: NeatChromosomeGenerator
    let neatMutation: NeatMutation;
    let neatCrossover: NeatCrossover;
    const numInputs = 5
    const numOutputs = 7

    beforeEach(() => {
        neatMutation = new NeatMutation();
        neatCrossover = new NeatCrossover();
        neatChromosomeGenerator = new NeatChromosomeGenerator(neatMutation, neatCrossover)
        neatChromosomeGenerator.inputSize = numInputs;
        neatChromosomeGenerator.outputSize = numOutputs;
        neatChromosome = neatChromosomeGenerator.get();
    })

    test("MutateWeights", () => {
        const originalWeights = [];
        for (const connection of neatChromosome.getConnections())
            originalWeights.push(connection.weight)

        const mutatedWeights = [];
        const mutation = neatMutation.mutateWeight(neatChromosome)
        for (const connection of mutation.getConnections())
            mutatedWeights.push(connection.weight)
        originalWeights.sort();
        mutatedWeights.sort()
        expect(mutatedWeights).toHaveLength(originalWeights.length)
    })
})
