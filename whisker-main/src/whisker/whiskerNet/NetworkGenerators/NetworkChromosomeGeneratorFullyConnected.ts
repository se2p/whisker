import {List} from "../../utils/List";
import {NodeGene} from "../NetworkNodes/NodeGene";
import {ConnectionGene} from "../ConnectionGene";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {NetworkChromosomeGenerator} from "./NetworkChromosomeGenerator";

export class NetworkChromosomeGeneratorFullyConnected extends NetworkChromosomeGenerator {

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
