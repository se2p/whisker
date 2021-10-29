import {List} from "../../utils/List";
import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {NetworkChromosomeGenerator} from "./NetworkChromosomeGenerator";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {InputNode} from "../NetworkComponents/InputNode";
import {BiasNode} from "../NetworkComponents/BiasNode";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {RegressionNode} from "../NetworkComponents/RegressionNode";
import {NeatMutation} from "../Operators/NeatMutation";

export class NetworkChromosomeGeneratorFullyConnected extends NetworkChromosomeGenerator {

    /**
     * A map mapping each sprite to its feature map.
     */
    private readonly _inputs: Map<string, Map<string, number>>;

    /**
     * All Scratch-Events the given Scratch project handles.
     */
    private readonly _scratchEvents: List<ScratchEvent>;

    /**
     * Constructs a new FullyConnectedNetworkGenerator connecting all input-features to all output nodes.
     * @param mutationConfig the configuration parameters for the mutation operator
     * @param crossoverConfig the configuration parameters for the crossover operator
     * @param inputs a map mapping each sprite to its input feature-vector
     * @param scratchEvents all Scratch-Events the given project handles
     */
    constructor(mutationConfig: Record<string, (string | number)>, crossoverConfig: Record<string, (string | number)>,
                inputs: Map<string, Map<string, number>>, scratchEvents: List<ScratchEvent>) {
        super(mutationConfig, crossoverConfig);
        this._inputs = inputs;
        this._scratchEvents = scratchEvents;
    }

    /**
     * Creates and returns a fully connected NetworkChromosome.
     * @return: generated NetworkChromosome
     */
    get(): NetworkChromosome {
        let nodeId = 0;
        const allNodes = new List<NodeGene>();

        // Create the Input Nodes and add them to the nodes list;
        // Sprites can have a different amount of features.
        const inputList = new List<List<NodeGene>>();
        this._inputs.forEach((value, spriteKey) => {
            const spriteList = new List<NodeGene>();
            value.forEach((value, featureKey) => {
                const iNode = new InputNode(nodeId++, spriteKey, featureKey);
                spriteList.add(iNode)
                allNodes.add(iNode);
            })
            inputList.add(spriteList)
        })


        // Add the Bias
        const biasNode = new BiasNode(nodeId++);
        allNodes.add(biasNode);

        // Create the classification output nodes and add them to the nodes list
        for (const event of this._scratchEvents) {
            const classificationNode = new ClassificationNode(nodeId++, event, ActivationFunction.SIGMOID);
            allNodes.add(classificationNode);
        }

        // Add regression nodes for each parameter of each parameterized Event
        const parameterizedEvents = this._scratchEvents.filter(event => event.numSearchParameter() > 0);
        if (!parameterizedEvents.isEmpty()) {
            this.addRegressionNodes(allNodes, parameterizedEvents, nodeId);
        }

        // Create connections between input and output nodes
        const outputNodes = allNodes.filter(node => node instanceof ClassificationNode || node instanceof RegressionNode);
        const connections = this.createConnections(inputList, outputNodes);
        const chromosome = new NetworkChromosome(connections, allNodes, this._mutationOp, this._crossoverOp);

        // Perturb the weights
        const mutationOp = chromosome.getMutationOperator() as NeatMutation;
        mutationOp.mutateWeight(chromosome, 2.5, 1);
        return chromosome;
    }

    /**
     * Creates connections between input and output nodes.
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
