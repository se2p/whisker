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
import {NeatPopulation} from "../NeuroevolutionPopulations/NeatPopulation";
import {Innovation, InnovationProperties} from "../NetworkComponents/Innovation";

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
     * @param inputs maps each sprite by its name to its feature map.
     * @param scratchEvents all ScratchEvents for which output nodes have to be generated.
     */
    constructor(mutationConfig: Record<string, (string | number)>, crossoverConfig: Record<string, (string | number)>,
                private readonly inputs: Map<string, Map<string, number>>, scratchEvents: ScratchEvent[]) {
        super(mutationConfig, crossoverConfig);
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
            const classificationNode = new ClassificationNode(allNodes.length, event, ActivationFunction.SIGMOID);
            allNodes.push(classificationNode);
        }

        // Add regression nodes for each parameter of each parameterized Event
        const parameterizedEvents = this._scratchEvents.filter(event => event.numSearchParameter() > 0);
        if (parameterizedEvents.length !== 0) {
            this.addRegressionNodes(allNodes, parameterizedEvents);
        }

        // Create connections between input and output nodes
        const outputNodes = allNodes.filter(node => node instanceof ClassificationNode || node instanceof RegressionNode);
        const connections = this.createConnections(inputList, outputNodes);
        const chromosome = new NeatChromosome(allNodes, connections, this._mutationOp, this._crossoverOp);

        // Perturb the weights
        const mutationOp = chromosome.getMutationOperator() as NeatMutation;
        mutationOp.mutateWeight(chromosome, 1);
        return chromosome;
    }

    /**
     * Creates connections from each input node to every output.
     * @param inputNodes all inputNodes of the generated network mapped to the sprites they represent ([sprite][nodes]).
     * @param outputNodes all outputNodes of the generated network.
     * @returns ConnectionGene[] the generated network connections.
     */
    createConnections(inputNodes: NodeGene[][], outputNodes: NodeGene[]): ConnectionGene[] {
        const connections: ConnectionGene[] = [];
        // For each inputNode create a connection to each outputNode.
        for (const inputNodeVector of inputNodes) {
            for (const inputNode of inputNodeVector) {
                for (const outputNode of outputNodes) {
                    const newConnection = new ConnectionGene(inputNode, outputNode, 0, true, 0, false);
                    this.assignInnovation(newConnection);
                    connections.push(newConnection);
                    outputNode.incomingConnections.push(newConnection);
                }
            }
        }
        return connections;
    }

    protected assignInnovation(newConnection: ConnectionGene): void {
        const innovation = NeatPopulation.findInnovation(newConnection, 'newConnection');
        // Check if this innovation has occurred before.
        if (innovation) {
            newConnection.innovation = innovation.firstInnovationNumber;
        } else {
            const innovationProperties: InnovationProperties = {
                type: 'newConnection',
                idSourceNode: newConnection.source.uID,
                idTargetNode: newConnection.target.uID,
                firstInnovationNumber: Innovation._currentHighestInnovationNumber + 1,
                recurrent: newConnection.isRecurrent
            };
            const newInnovation = Innovation.createInnovation(innovationProperties);
            NeatPopulation.innovations.push(newInnovation);
            newConnection.innovation = newInnovation.firstInnovationNumber;
        }
    }
}
