import {NeatChromosomeGeneratorFullyConnected} from "./NeatChromosomeGeneratorFullyConnected";
import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {RegressionNode} from "../NetworkComponents/RegressionNode";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {HiddenNode} from "../NetworkComponents/HiddenNode";

export class NeatChromosomeGeneratorHiddenNodeFC extends NeatChromosomeGeneratorFullyConnected {

    /**
     * Creates connections from each input node to every output node by placing a hidden node in between.
     * @param chromosome the network for which connections should be generated.
     * @param inputNodes all inputNodes of the generated network mapped to the sprite feature they represent
     * ([sprite][feature]).
     * @returns ConnectionGene[] the generated network's connections.
     */
    createConnections(chromosome: NeatChromosome, inputNodes: NodeGene[][]): ConnectionGene[] {
        const connections: ConnectionGene[] = [];
        const outputNodes = chromosome.allNodes.filter(node => node instanceof ClassificationNode || node instanceof RegressionNode);
        // For each inputNode create a connection to each outputNode.
        for (const inputNodeVector of inputNodes) {
            const hiddenNode = new HiddenNode(chromosome.allNodes.length, this.activationFunction);
            chromosome.allNodes.push(hiddenNode);
            for (const inputNode of inputNodeVector) {
                const inputHiddenConnection = new ConnectionGene(inputNode, hiddenNode, 0, true, 0, false);
                chromosome.addConnection(inputHiddenConnection);
            }
            for (const outputNode of outputNodes) {
                const hiddenOutputConnection = new ConnectionGene(hiddenNode, outputNode, 0, true, 0, false);
                chromosome.addConnection(hiddenOutputConnection);
            }
        }
        return connections;
    }

}
