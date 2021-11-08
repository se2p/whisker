import {NodeGene} from "../NetworkNodes/NodeGene";
import {ConnectionGene} from "../ConnectionGene";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {NetworkChromosomeGenerator} from "./NetworkChromosomeGenerator";
import {NetworkChromosome} from "../NetworkChromosome";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {InputNode} from "../NetworkNodes/InputNode";
import {BiasNode} from "../NetworkNodes/BiasNode";
import {ClassificationNode} from "../NetworkNodes/ClassificationNode";
import {ActivationFunction} from "../NetworkNodes/ActivationFunction";
import {RegressionNode} from "../NetworkNodes/RegressionNode";
import {NeatMutation} from "../NeatMutation";

export class NetworkChromosomeGeneratorFullyConnected extends NetworkChromosomeGenerator {

    /**
     * A map mapping each sprite to its feature map.
     */
    private readonly _inputs: Map<string, Map<string, number>>;

    /**
     * All Scratch-Events the given Scratch project handles.
     */
    private readonly _scratchEvents: ScratchEvent[];

    /**
     * Constructs a new FullyConnectedNetworkGenerator connecting all input-features to all output nodes.
     * @param mutationConfig the configuration parameters for the mutation operator
     * @param crossoverConfig the configuration parameters for the crossover operator
     * @param inputs a map mapping each sprite to its input feature-vector
     * @param scratchEvents all Scratch-Events the given project handles
     */
    constructor(mutationConfig: Record<string, (string | number)>, crossoverConfig: Record<string, (string | number)>,
                inputs: Map<string, Map<string, number>>, scratchEvents: ScratchEvent[]) {
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
        const allNodes: NodeGene[] = [];

        // Create the Input Nodes and add them to the nodes list;
        // Sprites can have a different amount of infos i.e different amount of feature vector sizes.
        const inputList: NodeGene[][] = [];
        this._inputs.forEach((value, spriteKey) => {
            const spriteList: NodeGene[] = [];
            value.forEach((value, featureKey) => {
                const iNode = new InputNode(nodeId++, spriteKey, featureKey);
                spriteList.push(iNode)
                allNodes.push(iNode);
            })
            inputList.push(spriteList)
        })


        // Add the Bias
        const biasNode = new BiasNode(nodeId++);
        allNodes.push(biasNode);

        // Create the classification output nodes and add them to the nodes list
        for (const event of this._scratchEvents) {
            const classificationNode = new ClassificationNode(nodeId++, event, ActivationFunction.SIGMOID);
            allNodes.push(classificationNode);
        }

        // Add regression nodes for each parameter of each parameterized Event
        const parameterizedEvents = this._scratchEvents.filter(event => event.numSearchParameter() > 0);
        if (parameterizedEvents.length !== 0) {
            this.addRegressionNodes(allNodes, parameterizedEvents, nodeId);
        }

        // Create connections between input and output nodes
        const outputNodes = allNodes.filter(node => node instanceof ClassificationNode || node instanceof RegressionNode);
        const connections = this.createConnections(inputList, outputNodes);
        const chromosome = new NetworkChromosome(connections, allNodes, this._mutationOp, this._crossoverOp);
        NetworkChromosome.idCounter++;

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
    createConnections(inputNodes: NodeGene[][], outputNodes: NodeGene[]): ConnectionGene[] {
        const connections: ConnectionGene[] = [];
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
