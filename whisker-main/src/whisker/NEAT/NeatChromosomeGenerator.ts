import {ChromosomeGenerator} from "../search/ChromosomeGenerator";
import {NeatChromosome} from "./NeatChromosome";
import {Mutation} from "../search/Mutation";
import {Crossover} from "../search/Crossover";
import {List} from "../utils/List";
import {NodeGene} from "./NodeGene";
import {NodeType} from "./NodeType";
import {ConnectionGene} from "./ConnectionGene";
import {NeatMutation} from "./NeatMutation";
import {Randomness} from "../utils/Randomness";
import {ActivationFunctions} from "./ActivationFunctions";

export class NeatChromosomeGenerator implements ChromosomeGenerator<NeatChromosome> {

    public static _innovations = new List<ConnectionGene>();

    private _mutationOp: Mutation<NeatChromosome>;

    private _crossoverOp: Crossover<NeatChromosome>;

    private _inputSize: number;

    private _outputSize: number;

    private _random = Randomness.getInstance();

    private readonly _connectionRate: number;

    private readonly _regressionNode: boolean

    constructor(mutationOp: Mutation<NeatChromosome>, crossoverOp: Crossover<NeatChromosome>, numInputNodes: number,
                numOutputNodes: number, connectionRate: number, regressionNode: boolean) {
        this._mutationOp = mutationOp;
        this._crossoverOp = crossoverOp;
        this._inputSize = numInputNodes;
        this._outputSize = numOutputNodes;
        this._connectionRate = connectionRate;
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

        // Create the Input Nodes and add them to the nodes list
        const inputList = new List<NodeGene>()
        while (inputList.size() < this.inputSize) {
            const iNode = new NodeGene(nodeId, NodeType.INPUT, ActivationFunctions.NONE);
            inputList.add(iNode);
            allNodes.add(iNode);
            nodeId++;
        }
        const biasNode = new NodeGene(nodeId, NodeType.BIAS, ActivationFunctions.NONE);
        inputList.add(biasNode);
        allNodes.add(biasNode);
        nodeId++;

        // Create the Output Nodes and add them to the nodes list
        const outputList = new List<NodeGene>()
        while (outputList.size() < this.outputSize) {
            const oNode = new NodeGene(nodeId, NodeType.CLASSIFICATION_OUTPUT, ActivationFunctions.SIGMOID);
            outputList.add(oNode);
            allNodes.add(oNode);
            nodeId++;
        }

        const generatedChromosome = this.createConnections(inputList, outputList, allNodes);


        if (this._regressionNode) {
            console.log("Regression")
            this.addRegressionNode(generatedChromosome, nodeId);
        }

        // Perturb the weights
        const mutationOp = generatedChromosome.getMutationOperator() as NeatMutation;
        mutationOp.mutateWeight(generatedChromosome, 1, 1);

        return generatedChromosome;
    }

    private createConnections(inputNodes: List<NodeGene>, outputNodes: List<NodeGene>, allNodes: List<NodeGene>): NeatChromosome {
        const connections = new List<ConnectionGene>();
        const maxConnections = inputNodes.size() * outputNodes.size();

        // Loop at least once and until we reach the maximum connection size or randomness tells us to Stop!
        do {

            // Choose a random Sprite to add its input to the network; Exclude the Bias
            let inputSprite = this._random.nextInt(0, inputNodes.size() - 1)

            // Get to the Start of the input values of the Sprite, since we currently only look at the position in terms of
            // x- and y-Coordinates each sprite as an inputSize of 2.
            if (inputSprite % 2 === 1)
                inputSprite--;

            // Get Both Nodes
            const inputNodeX = inputNodes.get(inputSprite);
            const inputNodeY = inputNodes.get(++inputSprite);

            // Add the connection from the x-Coordinate if it doesnt exist yet.
            let outputNode = this._random.pickRandomElementFromList(outputNodes);
            let newConnection = new ConnectionGene(inputNodeX, outputNode, 0, true, 0, false)

            if (!this.findConnection(connections, newConnection)) {
                this.assignInnovationNumber(newConnection);
                connections.add(newConnection)
            }

            // Add the connection from the y-Coordinate if it doesnt exist yet.
            outputNode = this._random.pickRandomElementFromList(outputNodes);
            newConnection = new ConnectionGene(inputNodeY, outputNode, 0, true, 0, false)
            if (!this.findConnection(connections, newConnection)) {
                this.assignInnovationNumber(newConnection);
                connections.add(newConnection)
            }
        }
        while (this._random.nextDouble() < this._connectionRate && connections.size() < maxConnections)
        return new NeatChromosome(connections, allNodes, this._mutationOp, this._crossoverOp);
    }

    private addRegressionNode(chromosome: NeatChromosome, nodeId: number) {

        const maxConnections = this._inputSize;
        chromosome.regression = true;

        // Create the regression Nodes
        const mouseX = new NodeGene(nodeId, NodeType.REGRESSION_OUTPUT, ActivationFunctions.SIGMOID);
        nodeId++;
        const mouseY = new NodeGene(nodeId, NodeType.REGRESSION_OUTPUT, ActivationFunctions.SIGMOID);

        // Add both regression nodes to the node and outputNode List
        chromosome.outputNodes.add(mouseX);
        chromosome.outputNodes.add(mouseY);
        chromosome.allNodes.add(mouseX);
        chromosome.allNodes.add(mouseY);

        // Loop at least once and until we reach the maximum connection size or randomness tells us to Stop!
        do {

            // Choose a random Sprite to add its input to the network; Exclude the Bias
            let inputSprite = this._random.nextInt(0, chromosome.inputNodes.size() - 1)

            // Get to the Start of the input values of the Sprite, since we currently only look at the position in terms of
            // x- and y-Coordinates each sprite as an inputSize of 2.
            if (inputSprite % 2 === 1)
                inputSprite--;

            // Get Both Nodes
            const inputNodeX = chromosome.inputNodes.get(inputSprite);
            const inputNodeY = chromosome.inputNodes.get(++inputSprite);

            // Add the connection from the x-Coordinate if it doesnt exist yet to the position of the mouse in the x dimension.
            let newConnection = new ConnectionGene(inputNodeX, mouseX, 0, true, 0, false)
            if (!this.findConnection(chromosome.connections, newConnection)) {
                this.assignInnovationNumber(newConnection);
                chromosome.connections.add(newConnection)
            }

            // Add the connection from the x-Coordinate if it doesnt exist yet to the position of the mouse in the y dimension.
            newConnection = new ConnectionGene(inputNodeX, mouseY, 0, true, 0, false)
            if (!this.findConnection(chromosome.connections, newConnection)) {
                this.assignInnovationNumber(newConnection);
                chromosome.connections.add(newConnection)
            }

            // Add the connection from the y-Coordinate if it doesnt exist yet to the position of the mouse in the x dimension
            newConnection = new ConnectionGene(inputNodeY, mouseX, 0, true, 0, false)
            if (!this.findConnection(chromosome.connections, newConnection)) {
                this.assignInnovationNumber(newConnection);
                chromosome.connections.add(newConnection)
            }

            // Add the connection from the y-Coordinate if it doesnt exist yet to the position of the mouse in the y dimension.
            newConnection = new ConnectionGene(inputNodeY, mouseY, 0, true, 0, false)
            if (!this.findConnection(chromosome.connections, newConnection)) {
                this.assignInnovationNumber(newConnection);
                chromosome.connections.add(newConnection)
            }
        }
        while (this._random.nextDouble() < this._connectionRate && chromosome.connections.size() < maxConnections)
    }

    private findConnection(connections: List<ConnectionGene>, connection: ConnectionGene): ConnectionGene {
        for (const con of connections) {
            if (con.equalsByNodes(connection)) return con;
        }
        return null;
    }

    private assignInnovationNumber(newInnovation: ConnectionGene): void {
        // Check if innovation already happened in this generation if Yes assign the same innovation number
        const oldInnovation = this.findConnection(NeatMutation._innovations, newInnovation)
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
    set inputSize(value: number) {
        this._inputSize = value;
    }

    get inputSize(): number {
        return this._inputSize;
    }

    // Used for Testing
    set outputSize(value: number) {
        this._outputSize = value;
    }

    get outputSize(): number {
        return this._outputSize;
    }
}
