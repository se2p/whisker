import {NodeGene} from "../NetworkNodes/NodeGene";
import {ConnectionGene} from "../ConnectionGene";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {NetworkChromosomeGenerator} from "./NetworkChromosomeGenerator";
import {NetworkChromosome} from "../NetworkChromosome";

export class NetworkChromosomeGeneratorExistingNetwork extends NetworkChromosomeGenerator {

    /**
     * The template of the existing Network
     */
    private networkTemplate: Record<string, Record<string, (string| number)>>

    /**
     * Constructs a new NetworkGenerator
     * @param networkTemplate the template of the existing network from which we want to create a population of.
     */
    constructor(networkTemplate: Record<string, Record<string, (string| number)>>) {
        super(networkTemplate.mutation, networkTemplate.crossover);
        this.networkTemplate = networkTemplate;
    }

    /**
     * Creates and returns a random NetworkChromosome with the specified number of input and output nodes
     * and a random set of connections in between them.
     * @return: generated NetworkChromosome
     */
    get(): NetworkChromosome {
        return new NetworkChromosome(null,null, this._mutationOp, this._crossoverOp);
    }

    /**
     * Creates connections between input and output nodes according to the inputRate
     * @param inputNodes all inputNodes of the network sorted according to the sprites they represent
     * @param outputNodes all outputNodes of the network
     * @return the connectionGene List
     */
    createConnections(inputNodes: NodeGene[][], outputNodes: NodeGene[]): ConnectionGene[] {
        const connections = [];
        // For each inputNode create a connection to each outputNode.
        for (const inputNodeVector of inputNodes) {
            for (const inputNode of inputNodeVector) {
                for (const outputNode of outputNodes) {
                    const newConnection = new ConnectionGene(inputNode, outputNode, 0, true, 0, false)
                    NeuroevolutionUtil.assignInnovationNumber(newConnection);
                    connections.push(newConnection)
                    outputNode.incomingConnections.push(newConnection);
                }
            }
        }
        return connections;
    }
}
