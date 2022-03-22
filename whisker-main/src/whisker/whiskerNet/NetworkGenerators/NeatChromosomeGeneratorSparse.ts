import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {Randomness} from "../../utils/Randomness";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {NeatChromosomeGeneratorFullyConnected} from "./NeatChromosomeGeneratorFullyConnected";
import {NeatPopulation} from "../NeuroevolutionPopulations/NeatPopulation";

export class NeatChromosomeGeneratorSparse extends NeatChromosomeGeneratorFullyConnected {

    /**
     * The probability that multiple input features will be connected to the network.
     */
    protected readonly _inputRate: number;

    /**
     * Random number generator.
     */
    private _random = Randomness.getInstance();

    /**
     * Constructs a new NeatChromosomeGeneratorSparse that connects all input-nodes to each output node.
     * @param mutationConfig the configuration parameters for the mutation operator.
     * @param crossoverConfig the configuration parameters for the crossover operator.
     * @param inputs maps each sprite by its name to its feature map.
     * @param scratchEvents all ScratchEvents for which output nodes have to be generated.
     * @param inputRate the probability that multiple input features will be connected to the network.
     */
    constructor(mutationConfig: Record<string, (string | number)>, crossoverConfig: Record<string, (string | number)>,
                inputs: Map<string, Map<string, number>>, scratchEvents: ScratchEvent[],
                inputRate: number) {
        super(mutationConfig, crossoverConfig, inputs, scratchEvents);
        this._inputRate = inputRate;
    }

    /**
     * Creates connections from a single sprite's input nodes to each output node. With a specified inputRate additional
     * sprite node groups are added to the network.
     * @param inputNodes all inputNodes of the generated network mapped to the sprites they represent ([sprite][nodes]).
     * @param outputNodes all outputNodes of the generated network.
     * @returns ConnectionGene[] the generated network connections.
     */
    createConnections(inputNodes: NodeGene[][], outputNodes: NodeGene[]):ConnectionGene[] {
        const connections: ConnectionGene[] = [];
        // Loop at least once and until we reach the maximum connection size or randomness tells us to Stop!
        do {
            // Choose a random Sprite to add its input to the network;
            const sprite = this._random.pick(inputNodes);

            // For each input of the Sprite create a connection to each Output-Node
            for (const inputNode of sprite) {
                for (const outputNode of outputNodes) {
                    const newConnection = new ConnectionGene(inputNode, outputNode, 0, true, 0, false);
                    // Check if the connection does not exist yet.
                        NeatPopulation.assignInnovationNumber(newConnection);
                        connections.push(newConnection);
                        outputNode.incomingConnections.push(newConnection);
                }
            }
        }
        while (this._random.nextDouble() < this._inputRate);
        return connections;
    }
}
