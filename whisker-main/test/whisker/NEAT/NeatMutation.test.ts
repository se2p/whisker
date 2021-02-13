import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatChromosome} from "../../../src/whisker/NEAT/NeatChromosome";
import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";
import {ConnectionGene} from "../../../src/whisker/NEAT/ConnectionGene";
import {NodeGene} from "../../../src/whisker/NEAT/NodeGene";
import {NodeType} from "../../../src/whisker/NEAT/NodeType";


describe("NeatMutation", () => {

    let neatChromosome: NeatChromosome;
    let neatChromosomeGenerator: NeatChromosomeGenerator
    let neatMutation: NeatMutation;
    let neatCrossover: NeatCrossover;

    beforeEach(() => {
        neatMutation = new NeatMutation();
        neatCrossover = new NeatCrossover();
        neatChromosomeGenerator = new NeatChromosomeGenerator(neatMutation, neatCrossover)
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

    test("MutateAddConnection without hidden Layer", () => {
        const originalConnections = neatChromosome.getConnections();
        const mutant = neatMutation.mutateAddConnection(neatChromosome)
        const mutatedConnections = mutant.getConnections();
        // No Changes should happen since the generated network without hidden Layers is already fully connected
        expect(originalConnections.size()).toEqual(mutatedConnections.size())
    })

    test("MutateAddConnection with hidden Layer", () => {
        const inputNodes = neatChromosome.nodes.get(0)
        const hiddenLayerNode = new NodeGene(NodeType.HIDDEN, 0);
        const hiddenLayerNode2 = new NodeGene(NodeType.HIDDEN, 0);
        // create some new connections, those will create new nodes in createNetwork()
        // which is called by mutateAddConnection
        neatChromosome.getConnections().add(new ConnectionGene(inputNodes.get(0), hiddenLayerNode,1,true))
        neatChromosome.getConnections().add(new ConnectionGene(hiddenLayerNode, hiddenLayerNode2,1,true))
        neatChromosome.getConnections().add(new ConnectionGene(inputNodes.get(2), new NodeGene(NodeType.HIDDEN, 0),1,true))
        neatChromosome.getConnections().add(new ConnectionGene(inputNodes.get(2), new NodeGene(NodeType.HIDDEN, 0),1,true))
        const originalConnections = neatChromosome.getConnections().size();

        // Make some rounds of mutations to ensure a mutation eventually happens
        for (let i = 0; i < 20; i++) {
            neatChromosome = neatMutation.mutateAddConnection(neatChromosome)
        }
        expect(originalConnections).not.toEqual(neatChromosome.getConnections().size())
    })
})
