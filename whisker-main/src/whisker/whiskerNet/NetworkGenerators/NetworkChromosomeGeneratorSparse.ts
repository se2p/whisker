import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";
import {NetworkChromosome} from "../NetworkChromosome";
import {Mutation} from "../../search/Mutation";
import {Crossover} from "../../search/Crossover";
import {List} from "../../utils/List";
import {NodeGene} from "../NetworkNodes/NodeGene";
import {ConnectionGene} from "../ConnectionGene";
import {NeatMutation} from "../NeatMutation";
import {Randomness} from "../../utils/Randomness";
import {ActivationFunction} from "../NetworkNodes/ActivationFunction";
import {InputNode} from "../NetworkNodes/InputNode";
import {BiasNode} from "../NetworkNodes/BiasNode";
import {ClassificationNode} from "../NetworkNodes/ClassificationNode";
import {RegressionNode} from "../NetworkNodes/RegressionNode";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";

export class NetworkChromosomeGeneratorSparse implements ChromosomeGenerator<NetworkChromosome> {

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
     * All potential input features for the network
     */
    private readonly _inputs: number[][];

    /**
     * Number of available events -> number of output nodes
     */
    private readonly _outputSize: number;

    /**
     * Random generator
     */
    private _random = Randomness.getInstance();

    /**
     * The probability multiple input features are connected to the network
     */
    private readonly _inputRate: number;

    /**
     * Defines whether the networks get a regressionNode
     */
    private readonly _hasRegressionNode: boolean

    /**
     * Constructs a new NetworkGenerator
     * @param mutationOp the used mutation operator
     * @param crossoverOp the used crossover operator
     * @param inputs all potential input features
     * @param numOutputNodes number of needed output nodes
     * @param inputRate the probability multiple input features are connected to the network
     * @param hasRegressionNode defines whether the networks get a regressionNode
     */
    constructor(mutationOp: Mutation<NetworkChromosome>, crossoverOp: Crossover<NetworkChromosome>, inputs: number[][],
                numOutputNodes: number, inputRate: number, hasRegressionNode: boolean) {
        this._mutationOp = mutationOp;
        this._crossoverOp = crossoverOp;
        this._inputs = inputs;
        this._outputSize = numOutputNodes;
        this._inputRate = inputRate;
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
        const flattenedInputNodes = new List<NodeGene>();

        // Create the Input Nodes and add them to the nodes list; Each row of the inputArray represents one Sprite.
        // Sprites can have a different amount of infos i.e different amount of columns.
        const inputList = new List<List<NodeGene>>()
        for (let i = 0; i < this.inputs.length; i++) {
            const spriteList = new List<NodeGene>();
            const spriteInput = this.inputs[i];
            spriteInput.forEach(() => {
                const iNode = new InputNode(nodeId);
                nodeId++;
                spriteList.add(iNode)
                flattenedInputNodes.add(iNode);
                allNodes.add(iNode);
            })
            inputList.add(spriteList)
        }

        // Add the Bias
        const biasNode = new BiasNode(nodeId);
        nodeId++;
        flattenedInputNodes.add(biasNode);
        allNodes.add(biasNode);

        // Create the classification output nodes and add them to the nodes list
        const outputList = new List<NodeGene>()
        while (outputList.size() < this.outputSize) {
            const oNode = new ClassificationNode(nodeId, ActivationFunction.SIGMOID);
            nodeId++;
            outputList.add(oNode);
            allNodes.add(oNode);
        }

        // Create connections between input and output nodes
        const connections = this.createConnections(inputList, outputList);
        const chromosome = new NetworkChromosome(connections, allNodes, this._mutationOp, this._crossoverOp);

        // Add regression if we have mouse Input
        if (this._hasRegressionNode) {
            this.addRegressionNode(chromosome, inputList, nodeId);
        }

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
    private createConnections(inputNodes: List<List<NodeGene>>, outputNodes: List<NodeGene>): List<ConnectionGene> {
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

    /**
     * Adds two regression Nodes (x and y) for the mouseMove event
     * @param chromosome the network to which the regression nodes should be added
     * @param inputNodes all inputNodes of the network sorted according to the sprites they represent
     * @param nodeId counter to assign id's to the new regression nodes
     * @private
     */
    private addRegressionNode(chromosome: NetworkChromosome, inputNodes: List<List<NodeGene>>, nodeId: number) {

        chromosome.hasRegression = true;
        const regressionNodes = new List<NodeGene>();

        // Create the regression Nodes and add them to a List
        const mouseX = new RegressionNode(nodeId);
        nodeId++;
        regressionNodes.add(mouseX)
        const mouseY = new RegressionNode(nodeId);
        regressionNodes.add(mouseY)

        // Add both regression nodes to the node and outputNode List
        chromosome.outputNodes.add(mouseX);
        chromosome.outputNodes.add(mouseY);
        chromosome.allNodes.add(mouseX);
        chromosome.allNodes.add(mouseY);

        // Loop at least once and until we reach the maximum connection size or randomness tells us to Stop!
        do {
            // Choose a random Sprite to add its input to the network; Exclude the Bias
            const spriteInputs = this._random.pickRandomElementFromList(inputNodes);

            // For each input of the Sprite create a connection to both RegressionNodes
            for (const inputNode of spriteInputs) {
                for (const regNode of regressionNodes) {
                    const newConnection = new ConnectionGene(inputNode, regNode, 0, true, 0, false)
                    // Check if the connection does not exist yet.
                    if (NeuroevolutionUtil.findConnection(chromosome.connections, newConnection) === null) {
                        NeuroevolutionUtil.assignInnovationNumber(newConnection);
                        chromosome.connections.add(newConnection)
                        regNode.incomingConnections.add(newConnection);
                    }
                }
            }
        }
        while (this._random.nextDouble() < this._inputRate)
    }

    setCrossoverOperator(crossoverOp: Crossover<NetworkChromosome>): void {
        this._crossoverOp = crossoverOp;
    }

    setMutationOperator(mutationOp: Mutation<NetworkChromosome>): void {
        this._mutationOp = mutationOp;
    }

    get inputs(): number[][] {
        return this._inputs;
    }

    get outputSize(): number {
        return this._outputSize;
    }
}
