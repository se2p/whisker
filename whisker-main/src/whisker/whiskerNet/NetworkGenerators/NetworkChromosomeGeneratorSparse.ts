import {List} from "../../utils/List";
import {NodeGene} from "../NetworkNodes/NodeGene";
import {ConnectionGene} from "../ConnectionGene";
import {Randomness} from "../../utils/Randomness";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {NetworkChromosomeGenerator} from "./NetworkChromosomeGenerator";
import {Mutation} from "../../search/Mutation";
import {NetworkChromosome} from "../NetworkChromosome";
import {Crossover} from "../../search/Crossover";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";

export class NetworkChromosomeGeneratorSparse extends NetworkChromosomeGenerator {

    /**
     * The probability multiple input features are connected to the network
     */
    protected readonly _inputRate: number;

    /**
     * Random number generator
     */
    private _random = Randomness.getInstance();

    /**
     * Constructs a new NetworkGenerator
     * @param mutationOp the used mutation operator
     * @param crossoverOp the used crossover operator
     * @param inputs a map which maps each sprite to its input feature-vector
     * @param scratchEvents all Scratch-Events the given project handles
     * @param inputRate the probability multiple input features are connected to the network
     */
    constructor(mutationOp: Mutation<NetworkChromosome>, crossoverOp: Crossover<NetworkChromosome>,
                inputs: Map<string, Map<string, number>>, scratchEvents: List<ScratchEvent>,
                inputRate: number) {
        super(mutationOp, crossoverOp, inputs, scratchEvents)
        this._inputRate = inputRate;
    }

    /**
     * Creates connections between input and output nodes according to the inputRate
     * @param inputNodes all inputNodes of the network sorted according to the sprites they represent
     * @param outputNodes all outputNodes of the network
     * @return the connectionGene List
     */
    createConnections(inputNodes: List<List<NodeGene>>, outputNodes: List<NodeGene>): List<ConnectionGene> {
        const connections = new List<ConnectionGene>();
        // Loop at least once and until we reach the maximum connection size or randomness tells us to Stop!
        do {
            // Choose a random Sprite to add its input to the network;
            const sprite = this._random.pickRandomElementFromList(inputNodes);

            // For each input of the Sprite create a connection to each Output-Node
            for (const inputNode of sprite) {
                for (const outputNode of outputNodes) {
                    const newConnection = new ConnectionGene(inputNode, outputNode, 0, true, 0, false)
                    // Check if the connection does not exist yet.
                    if (NeuroevolutionUtil.findConnection(connections, newConnection) === null) {
                        NeuroevolutionUtil.assignInnovationNumber(newConnection);
                        connections.add(newConnection)
                        outputNode.incomingConnections.add(newConnection);
                    }
                }
            }
        }
        while (this._random.nextDouble() < this._inputRate)
        return connections;
    }
}
