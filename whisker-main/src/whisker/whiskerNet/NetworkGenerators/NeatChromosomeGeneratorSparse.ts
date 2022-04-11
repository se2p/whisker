import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {Randomness} from "../../utils/Randomness";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {NeatChromosomeGeneratorFullyConnected} from "./NeatChromosomeGeneratorFullyConnected";
import Arrays from "../../utils/Arrays";
import {BiasNode} from "../NetworkComponents/BiasNode";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {RegressionNode} from "../NetworkComponents/RegressionNode";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";

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
     * @param activationFunction the activation function used for the generated nodes.
     * @param inputs maps each sprite by its name to its feature map.
     * @param scratchEvents all ScratchEvents for which output nodes have to be generated.
     * @param inputRate the probability that multiple input features will be connected to the network.
     */
    constructor(mutationConfig: Record<string, (string | number)>, crossoverConfig: Record<string, (string | number)>,
                activationFunction: ActivationFunction, inputs: Map<string, Map<string, number>>,
                scratchEvents: ScratchEvent[], inputRate: number) {
        super(mutationConfig, crossoverConfig, activationFunction, inputs, scratchEvents);
        this._inputRate = inputRate;
    }

    /**
     * Creates connections from a single sprite's input nodes to each output node. With a specified inputRate additional
     * sprite node groups are added to the network.
     * @param chromosome the network for which connections should be generated.
     * @param inputNodes all inputNodes of the generated network mapped to the sprite feature they represent
     * ([sprite][feature]).
     * @returns ConnectionGene[] the generated network's connections.
     */
    createConnections(chromosome:NeatChromosome, inputNodes: NodeGene[][]): ConnectionGene[] {
        const connections: ConnectionGene[] = [];
        const outputNodes = chromosome.allNodes.filter(node => node instanceof ClassificationNode || node instanceof RegressionNode);
        const availableSprites: NodeGene[][] = [...inputNodes].filter(nodeGroup => !(nodeGroup[0] instanceof BiasNode));

        // Start by connected the bias Node to every output node. We do this to mitigate the number of defect networks
        // since it may happen that the only connected sprite gets invisible, at which point the sparse network has
        // no input signal.
        const biasNode = inputNodes.find(nodeGroup => nodeGroup[0] instanceof BiasNode)[0];
        for (const outputNode of outputNodes) {
            const newConnection = new ConnectionGene(biasNode, outputNode, 0, true, 0, false);
            chromosome.addConnection(newConnection);
        }
        // Loop at least once and until we reach the maximum connection size or randomness tells us to Stop!
        do {
            // Choose a random Sprite to add its input to the network;
            const sprite = this._random.pick(availableSprites);
            Arrays.remove(availableSprites, sprite);

            // For each input of the Sprite create a connection to each Output-Node
            for (const inputNode of sprite) {
                for (const outputNode of outputNodes) {
                    const newConnection = new ConnectionGene(inputNode, outputNode, 0, true, 0, false);
                    chromosome.addConnection(newConnection);
                }
            }
        }
        while (this._random.nextDouble() < this._inputRate && availableSprites.length > 0);
        return connections;
    }
}
