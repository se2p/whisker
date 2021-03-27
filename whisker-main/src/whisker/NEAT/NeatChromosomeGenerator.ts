import {ChromosomeGenerator} from "../search/ChromosomeGenerator";
import {NeatChromosome} from "./NeatChromosome";
import {Mutation} from "../search/Mutation";
import {Crossover} from "../search/Crossover";
import {List} from "../utils/List";
import {NodeGene} from "./NetworkNodes/NodeGene";
import {ConnectionGene} from "./ConnectionGene";
import {NeatMutation} from "./NeatMutation";
import {Randomness} from "../utils/Randomness";
import {ActivationFunction} from "./NetworkNodes/ActivationFunction";
import {InputNode} from "./NetworkNodes/InputNode";
import {BiasNode} from "./NetworkNodes/BiasNode";
import {ClassificationNode} from "./NetworkNodes/ClassificationNode";
import {RegressionNode} from "./NetworkNodes/RegressionNode";

export class NeatChromosomeGenerator implements ChromosomeGenerator<NeatChromosome> {

    public static _innovations = new List<ConnectionGene>();

    private _mutationOp: Mutation<NeatChromosome>;

    private _crossoverOp: Crossover<NeatChromosome>;

    private _inputs: number[][];

    private _outputSize: number;

    private _random = Randomness.getInstance();

    private readonly _inputRate: number;

    private readonly _regressionNode: boolean

    constructor(mutationOp: Mutation<NeatChromosome>, crossoverOp: Crossover<NeatChromosome>, inputs: number[][],
                numOutputNodes: number, inputRate: number, regressionNode: boolean) {
        this._mutationOp = mutationOp;
        this._crossoverOp = crossoverOp;
        this._inputs = inputs;
        this._outputSize = numOutputNodes;
        this._inputRate = inputRate;
        this._regressionNode = regressionNode;
    }

    /**
     * Creates and returns a random NeatChromosome with the specified number of input and output nodes and a random set
     * of connections in between them.
     * @ returns: A random initial Neat Phenotype
     */
    get(): NeatChromosome {
        let nodeId = 0;
        const allNodes = new List<NodeGene>();
        const flattenedInputNodes = new List<NodeGene>();

        // Create the Input Nodes and add them to the nodes list; Each row of the inputArray represents
        // one Sprite. Sprites can have a different amount of infos i.e different amount of columns.
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

        // Add the Bias only to the flattenedList which is later given to the Chromosome
        const biasNode = new BiasNode(nodeId);
        nodeId++;
        flattenedInputNodes.add(biasNode);
        allNodes.add(biasNode);

        // Create the classification Output Nodes and add them to the nodes list
        const outputList = new List<NodeGene>()
        while (outputList.size() < this.outputSize) {
            const oNode = new ClassificationNode(nodeId, ActivationFunction.SIGMOID);
            nodeId++;
            outputList.add(oNode);
            allNodes.add(oNode);
        }

        const connections = this.createConnections(inputList, outputList);
        const chromosome = new NeatChromosome(connections, allNodes, this._mutationOp, this._crossoverOp);

        // Add regression if we have mouse Input
        if (this._regressionNode) {
            this.addRegressionNode(chromosome, inputList, nodeId);
        }

        // Perturb the weights
        const mutationOp = chromosome.getMutationOperator() as NeatMutation;
        mutationOp.mutateWeight(chromosome, 1, 1);

        return chromosome;
    }

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
                    if (!NeatChromosomeGenerator.findConnection(connections, newConnection)) {
                        NeatChromosomeGenerator.assignInnovationNumber(newConnection);
                        connections.add(newConnection)
                        outputNode.incomingConnections.add(newConnection);
                    }
                }
            }
        }
        while (this._random.nextDouble() < this._inputRate)
        return connections;
    }

    private addRegressionNode(chromosome: NeatChromosome, inputNodes: List<List<NodeGene>>, nodeId: number) {

        chromosome.regression = true;
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
                    if (!NeatChromosomeGenerator.findConnection(chromosome.connections, newConnection)) {
                        NeatChromosomeGenerator.assignInnovationNumber(newConnection);
                        chromosome.connections.add(newConnection)
                        regNode.incomingConnections.add(newConnection);
                    }
                }
            }
        }
        while (this._random.nextDouble() < this._inputRate)
    }

    private static findConnection(connections: List<ConnectionGene>, connection: ConnectionGene): ConnectionGene {
        for (const con of connections) {
            if (con.equalsByNodes(connection)) return con;
        }
        return null;
    }

    private static assignInnovationNumber(newInnovation: ConnectionGene): void {
        // Check if innovation already happened in this generation if Yes assign the same innovation number
        const oldInnovation = NeatChromosomeGenerator.findConnection(NeatMutation._innovations, newInnovation)
        if (oldInnovation !== null)
            newInnovation.innovation = oldInnovation.innovation;
        // If No assign a new one
        else {
            newInnovation.innovation = ConnectionGene.getNextInnovationNumber();
            NeatMutation._innovations.add(newInnovation);
        }
    }

    setCrossoverOperator(crossoverOp: Crossover<NeatChromosome>): void {
        this._crossoverOp = crossoverOp;
    }

    setMutationOperator(mutationOp: Mutation<NeatChromosome>): void {
        this._mutationOp = mutationOp;
    }


    // Used for Testing
    get inputs(): number[][] {
        return this._inputs;
    }

    set inputs(value: number[][]) {
        this._inputs = value;
    }

    set outputSize(value: number) {
        this._outputSize = value;
    }

    get outputSize(): number {
        return this._outputSize;
    }
}
