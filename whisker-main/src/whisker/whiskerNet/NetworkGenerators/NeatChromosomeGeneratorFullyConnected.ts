import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {InputNode} from "../NetworkComponents/InputNode";
import {BiasNode} from "../NetworkComponents/BiasNode";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {RegressionNode} from "../NetworkComponents/RegressionNode";
import {NeatMutation} from "../Operators/NeatMutation";
import {NeatChromosomeGenerator} from "./NeatChromosomeGenerator";
import {NeatChromosome} from "../Networks/NeatChromosome";

export class NeatChromosomeGeneratorFullyConnected extends NeatChromosomeGenerator {

    /**
     * Maps each sprite by its name to its feature map.
     */
    private readonly _inputs: Map<string, Map<string, number>>;

    /**
     * All ScratchEvents for which output nodes have to be generated.
     */
    private readonly _scratchEvents: ScratchEvent[];

    /**
     * Constructs a new NeatChromosomeGeneratorFullyConnected that connects all input-nodes to each output node.
     * @param mutationConfig the configuration parameters for the mutation operator.
     * @param crossoverConfig the configuration parameters for the crossover operator.
     * @param activationFunction the activation function used for the generated nodes.
     * @param inputs maps each sprite by its name to its feature map.
     * @param scratchEvents all ScratchEvents for which output nodes have to be generated.
     */
    constructor(mutationConfig: Record<string, (string | number)>, crossoverConfig: Record<string, (string | number)>,
                activationFunction: ActivationFunction, private readonly inputs: Map<string, Map<string, number>>,
                scratchEvents: ScratchEvent[]) {
        super(mutationConfig, crossoverConfig, activationFunction);
        this._inputs = inputs;
        this._scratchEvents = scratchEvents;
    }

    /**
     * Generates a single fully connected NeatChromosome.
     * @returns NeatChromosome with each input node connected to every output node.
     */
    get(): NeatChromosome {
        NodeGene._uIDCounter = 0;
        const allNodes: NodeGene[] = [];

        // Create the Input Nodes and add them to the nodes list;
        // Sprites can have a different amount of features.
        const inputList: NodeGene[][] = [];
        this._inputs.forEach((value, spriteKey) => {
            const spriteList: NodeGene[] = [];
            value.forEach((value, featureKey) => {
                const iNode = new InputNode(allNodes.length, spriteKey, featureKey);
                spriteList.push(iNode);
                allNodes.push(iNode);
            });
            inputList.push(spriteList);
        });

        // Add the Bias
        const biasNode = new BiasNode(allNodes.length);
        allNodes.push(biasNode);
        inputList.push([biasNode]);

        // Create the classification output nodes and add them to the nodes list
        for (const event of this._scratchEvents) {
            const classificationNode = new ClassificationNode(allNodes.length, event, ActivationFunction.NONE);
            allNodes.push(classificationNode);
        }

        // Add regression nodes for each parameter of each parameterized Event
        const parameterizedEvents = this._scratchEvents.filter(event => event.numSearchParameter() > 0);
        if (parameterizedEvents.length !== 0) {
            this.addRegressionNodes(allNodes, parameterizedEvents);
        }

        // Create connections between input and output nodes
        const chromosome = new NeatChromosome(allNodes, [], this._mutationOp, this._crossoverOp, this.activationFunction);
        this.createConnections(chromosome, inputList);

        // Perturb the weights
        const mutationOp = chromosome.getMutationOperator() as NeatMutation;
        mutationOp.mutateWeight(chromosome, 1);
        chromosome.generateNetwork();
        return chromosome;
    }

    /**
     * Creates connections from each input node to every output node.
     * @param chromosome the network for which connections should be generated.
     * @param inputNodes all inputNodes of the generated network mapped to the sprite feature they represent
     * ([sprite][feature]).
     * @returns ConnectionGene[] the generated network's connections.
     */
    createConnections(chromosome:NeatChromosome, inputNodes:NodeGene[][]): ConnectionGene[] {
        const connections: ConnectionGene[] = [];
        const outputNodes = chromosome.allNodes.filter(node => node instanceof ClassificationNode || node instanceof RegressionNode);
        // For each inputNode create a connection to each outputNode.
        for (const inputNodeVector of inputNodes) {
            for (const inputNode of inputNodeVector) {
                for (const outputNode of outputNodes) {
                    const newConnection = new ConnectionGene(inputNode, outputNode, 0, true, 0, false);
                    chromosome.addConnection(newConnection);
                }
            }
        }
        return connections;
    }
}
