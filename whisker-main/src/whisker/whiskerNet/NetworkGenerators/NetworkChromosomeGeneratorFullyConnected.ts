import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";
import {NetworkChromosome} from "../NetworkChromosome";
import {Mutation} from "../../search/Mutation";
import {Crossover} from "../../search/Crossover";
import {List} from "../../utils/List";
import {NodeGene} from "../NetworkNodes/NodeGene";
import {ConnectionGene} from "../ConnectionGene";
import {NeatMutation} from "../NeatMutation";
import {ActivationFunction} from "../NetworkNodes/ActivationFunction";
import {InputNode} from "../NetworkNodes/InputNode";
import {BiasNode} from "../NetworkNodes/BiasNode";
import {ClassificationNode} from "../NetworkNodes/ClassificationNode";
import {RegressionNode} from "../NetworkNodes/RegressionNode";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {NodeType} from "../NetworkNodes/NodeType";

export class NetworkChromosomeGeneratorFullyConnected implements ChromosomeGenerator<NetworkChromosome> {

    /**
     * The mutation operator of the NetworkChromosomes
     */
    private _mutationOp: Mutation<NetworkChromosome>;

    /**
     * The crossover operator of th NetworkChromosomes
     * @private
     */
    private _crossoverOp: Crossover<NetworkChromosome>;

    /**
     * A map which maps each sprite to its input feature-vector
     */
    private readonly _inputs: Map<string, number[]>;

    /**
     * Number of available events -> number of output nodes
     */
    private readonly _outputSize: number;

    /**
     * Defines whether the networks get a regressionNode
     */
    private readonly _hasRegressionNode: boolean

    /**
     * Constructs a new NetworkGenerator
     * @param mutationOp the used mutation operator
     * @param crossoverOp the used crossover operator
     * @param inputs a map which maps each sprite to its input feature-vector
     * @param numOutputNodes number of needed output nodes
     * @param hasRegressionNode defines whether the networks get a regressionNode
     */
    constructor(mutationOp: Mutation<NetworkChromosome>, crossoverOp: Crossover<NetworkChromosome>,
                inputs: Map<string, number[]>, numOutputNodes: number, hasRegressionNode: boolean) {
        this._mutationOp = mutationOp;
        this._crossoverOp = crossoverOp;
        this._inputs = inputs;
        this._outputSize = numOutputNodes;
        this._hasRegressionNode = hasRegressionNode;
    }

    /**
     * Creates and returns a random NetworkChromosome with the specified number of input and output nodes
     * and a random set of connections in between them.
     * @return: generated NetworkChromosome
     */
    get(): NetworkChromosome {
        let nodeId = 0;
        const allNodes = new List<NodeGene>();

        // Create the Input Nodes and add them to the nodes list.
        // Sprites can have a different amount of feature set i.e different amount of columns.
        const inputNodes = new List<NodeGene>();
        this.inputs.forEach((value, key) => {
            value.forEach(() => {
                const iNode = new InputNode(nodeId, key);
                nodeId++;
                inputNodes.add(iNode)
                allNodes.add(iNode);
            });
        })


        // Add the Bias
        const biasNode = new BiasNode(nodeId++);
        allNodes.add(biasNode);

        // Create the classification output nodes and add them to the nodes list
        const outputNodes = new List<NodeGene>()
        while (outputNodes.size() < this.outputSize) {
            const oNode = new ClassificationNode(nodeId++, ActivationFunction.SIGMOID);
            outputNodes.add(oNode);
            allNodes.add(oNode);
        }

        if (this._hasRegressionNode) {
            const mouseX = new RegressionNode(nodeId++);
            const mouseY = new RegressionNode(nodeId++);
            outputNodes.add(mouseX);
            outputNodes.add(mouseY);
            allNodes.add(mouseX);
            allNodes.add(mouseY)
        }

        // Create connections between input and output nodes
        const connections = NetworkChromosomeGeneratorFullyConnected.createConnections(inputNodes, outputNodes);
        const chromosome = new NetworkChromosome(connections, allNodes, this._mutationOp, this._crossoverOp);

        // Perturb the weights
        const mutationOp = chromosome.getMutationOperator() as NeatMutation;
        mutationOp.mutateWeight(chromosome, 1, 1);

        return chromosome;
    }

    /**
     * Creates connections between input and output nodes according to the inputRate
     * @param inputNodes all inputNodes of the network sorted according to the sprites they represent
     * @param outputNodes all outputNodes of the network
     * @return the connectionGene List
     */
    private static createConnections(inputNodes: List<NodeGene>, outputNodes: List<NodeGene>): List<ConnectionGene> {
        const connections = new List<ConnectionGene>();
        // For each inputNode create a connection to each outputNode.
        for (const inputNode of inputNodes) {
            for (const outputNode of outputNodes) {
                const newConnection = new ConnectionGene(inputNode, outputNode, 0, true, 0, false)
                NeuroevolutionUtil.assignInnovationNumber(newConnection);
                connections.add(newConnection)
                outputNode.incomingConnections.add(newConnection);
            }
        }
        return connections;
    }

    setCrossoverOperator(crossoverOp: Crossover<NetworkChromosome>): void {
        this._crossoverOp = crossoverOp;
    }

    setMutationOperator(mutationOp: Mutation<NetworkChromosome>): void {
        this._mutationOp = mutationOp;
    }

    get inputs(): Map<string, number[]> {
        return this._inputs;
    }

    get outputSize(): number {
        return this._outputSize;
    }
}
