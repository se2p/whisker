import {NodeGene} from "../NetworkNodes/NodeGene";
import {ConnectionGene} from "../ConnectionGene";
import {Randomness} from "../../utils/Randomness";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {NetworkChromosomeGeneratorFullyConnected} from "./NetworkChromosomeGeneratorFullyConnected";

export class NetworkChromosomeGeneratorSparse extends NetworkChromosomeGeneratorFullyConnected {

    /**
     * The probability that multiple input features are connected to the network
     */
    protected readonly _inputRate: number;

    /**
     * Random number generator
     */
    private _random = Randomness.getInstance();

    /**
     * Constructs a new SparseNetworkGenerator, only connecting some input sprites to the output nodes.
     * @param mutationConfig the configuration parameters for the mutation operator
     * @param crossoverConfig the configuration parameters for the crossover operator
     * @param inputs a map which maps each sprite to its input feature-vector
     * @param scratchEvents all Scratch-Events the given project handles
     * @param inputRate the probability multiple input features are connected to the network
     */
    constructor(mutationConfig: Record<string, (string | number)>, crossoverConfig: Record<string, (string | number)>,
                inputs: Map<string, Map<string, number>>, scratchEvents: ScratchEvent[],
                inputRate: number) {
        super(mutationConfig, crossoverConfig, inputs, scratchEvents);
        this._inputRate = inputRate;
    }

    /**
     * Creates connections between input and output nodes according to the inputRate
     * @param inputNodes all inputNodes of the network sorted according to the sprites they represent
     * @param outputNodes all outputNodes of the network
     * @return the connectionGene List
     */
    createConnections(inputNodes: NodeGene[][], outputNodes: NodeGene[]): ConnectionGene[] {
        const connections = [];
        // Loop at least once and until we reach the maximum connection size or randomness tells us to Stop!
        do {
            // Choose a random Sprite to add its input to the network;
            const sprite = this._random.pick(inputNodes);

            // For each input of the Sprite create a connection to each Output-Node
            for (const inputNode of sprite) {
                for (const outputNode of outputNodes) {
                    const newConnection = new ConnectionGene(inputNode, outputNode, 0, true, 0, false)
                    // Check if the connection does not exist yet.
                    if (NeuroevolutionUtil.findConnection(connections, newConnection) === null) {
                        NeuroevolutionUtil.assignInnovationNumber(newConnection);
                        connections.push(newConnection)
                        outputNode.incomingConnections.push(newConnection);
                    }
                }
            }
        }
        while (this._random.nextDouble() < this._inputRate)
        return connections;
    }
}
