import {List} from "../../utils/List";
import {NodeGene} from "../NetworkNodes/NodeGene";
import {ConnectionGene} from "../ConnectionGene";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {NetworkChromosomeGenerator} from "./NetworkChromosomeGenerator";
import {NetworkChromosome} from "../NetworkChromosome";

export class NetworkChromosomeGeneratorTemplateNetwork extends NetworkChromosomeGenerator {

    /**
     * The template of the existing Network
     */
    private networkTemplate: Record<string, Record<string, (string| number)>>

    /**
     * Constructs a new NetworkGenerator which generates copies of an existing network.
     * @param networkTemplate the template of the existing network from which we want to create a population of.
     * @param mutationConfig the configuration parameters for the mutation operator
     * @param crossoverConfig the configuration parameters for the crossover operator
     */
    constructor(mutationConfig: Record<string, (string | number)>, crossoverConfig: Record<string, (string | number)>,
                networkTemplate: Record<string, Record<string, (string| number)>>) {
        super(mutationConfig, crossoverConfig);
        this.networkTemplate = networkTemplate;
    }

    /**
     * Creates and returns a random NetworkChromosome with the specified number of input and output nodes
     * and a random set of connections in between them.
     * @return: generated NetworkChromosome
     */
    get(): NetworkChromosome {
        console.log(this.networkTemplate);
        return new NetworkChromosome(null,null, this._mutationOp, this._crossoverOp);
    }

    /**
     * Creates connections between input and output nodes according to the inputRate
     * @param inputNodes all inputNodes of the network sorted according to the sprites they represent
     * @param outputNodes all outputNodes of the network
     * @return the connectionGene List
     */
    createConnections(inputNodes: List<List<NodeGene>>, outputNodes: List<NodeGene>): List<ConnectionGene> {
        const connections = new List<ConnectionGene>();
        // For each inputNode create a connection to each outputNode.
        for (const inputNodeVector of inputNodes.getElements()) {
            for (const inputNode of inputNodeVector) {
                for (const outputNode of outputNodes) {
                    const newConnection = new ConnectionGene(inputNode, outputNode, 0, true, 0, false)
                    NeuroevolutionUtil.assignInnovationNumber(newConnection);
                    connections.add(newConnection)
                    outputNode.incomingConnections.add(newConnection);
                }
            }
        }
        return connections;
    }
}
