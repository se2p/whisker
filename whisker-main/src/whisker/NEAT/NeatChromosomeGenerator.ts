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

    private _inputs: number[][];

    private _outputSize: number;

    private _random = Randomness.getInstance();

    private readonly _connectionRate: number;

    private readonly _regressionNode: boolean

    constructor(mutationOp: Mutation<NeatChromosome>, crossoverOp: Crossover<NeatChromosome>, inputs: number[][],
                numOutputNodes: number, connectionRate: number, regressionNode: boolean) {
        this._mutationOp = mutationOp;
        this._crossoverOp = crossoverOp;
        this._inputs = inputs;
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
        const flattenedInputNodes = new List<NodeGene>();

        // Create the Input Nodes and add them to the nodes list; Each row of the inputArray represents
        // one Sprite. Sprites can have a different amount of infos i.e different amount of columns.
        const inputList = new List<List<NodeGene>>()
        for (let i = 0; i < this.inputs.length; i++) {
            const spriteList = new List<NodeGene>();
            const spriteInput = this.inputs[i];
            spriteInput.forEach(() => {
                const iNode = new NodeGene(nodeId, NodeType.INPUT, ActivationFunctions.NONE);
                spriteList.add(iNode)
                flattenedInputNodes.add(iNode);
                allNodes.add(iNode);
                nodeId++;
            })
            inputList.add(spriteList)
        }

        // Add the Bias only to the flattenedList which is later given to the Chromosome
        const biasNode = new NodeGene(nodeId, NodeType.BIAS, ActivationFunctions.NONE);
        flattenedInputNodes.add(biasNode);
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

        console.log(generatedChromosome)
        return generatedChromosome;
    }

    private createConnections(inputNodes: List<List<NodeGene>>, outputNodes: List<NodeGene>, allNodes: List<NodeGene>): NeatChromosome {
        const connections = new List<ConnectionGene>();
        const maxConnections = inputNodes.size() * outputNodes.size();

        // Loop at least once and until we reach the maximum connection size or randomness tells us to Stop!
        do {
            // Choose a random Sprite to add its input to the network;
            const sprite = this._random.pickRandomElementFromList(inputNodes);

            // For each input of the Sprite create a connection to a random output Node
            for(const inputNode of sprite){
                // Pick a random output Node and create the new Connection between the input and output Node
                const outputNode = this._random.pickRandomElementFromList(outputNodes);
                const newConnection = new ConnectionGene(inputNode, outputNode, 0, true, 0, false);

                // Check if the connection does not exist yet.
                if (!this.findConnection(connections, newConnection)) {
                    this.assignInnovationNumber(newConnection);
                    connections.add(newConnection)
                }

            }
        }
        while (this._random.nextDouble() < this._connectionRate && connections.size() < maxConnections)
        return new NeatChromosome(connections, allNodes, this._mutationOp, this._crossoverOp);
    }

    private addRegressionNode(chromosome: NeatChromosome, nodeId: number) {

        const maxConnections = chromosome.inputNodes.size();
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
    get inputs(): number[][] {
        return this._inputs;
    }

    set inputs(value: number[][]) {
        this._inputs = value;
    }

// Used for Testing
    set outputSize(value: number) {
        this._outputSize = value;
    }

    get outputSize(): number {
        return this._outputSize;
    }
}
