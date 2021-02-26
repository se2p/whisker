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
import {NeatParameter} from "./NeatParameter";
import {ActivationFunctions} from "./ActivationFunctions";

export class NeatChromosomeGenerator implements ChromosomeGenerator<NeatChromosome> {

    public static _innovations = new List<ConnectionGene>();

    private _mutationOp: Mutation<NeatChromosome>;

    private _crossoverOp: Crossover<NeatChromosome>;

    private _inputSize: number;

    private _outputSize: number;

    private _random = Randomness.getInstance();

    constructor(mutationOp: Mutation<NeatChromosome>, crossoverOp: Crossover<NeatChromosome>, numInputNodes: number,
                numOutputNodes: number) {
        this._mutationOp = mutationOp;
        this._crossoverOp = crossoverOp;
        this.inputSize = numInputNodes;
        this.outputSize = numOutputNodes;
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
            const oNode = new NodeGene(nodeId, NodeType.OUTPUT, ActivationFunctions.SIGMOID);
            outputList.add(oNode);
            allNodes.add(oNode);
            nodeId++;
        }

        const generatedChromosome = this.createConnections(inputList, outputList, allNodes);
        const mutationOp = generatedChromosome.getMutationOperator() as NeatMutation;
        mutationOp.mutateWeight(generatedChromosome, 1, 1);

        return generatedChromosome;
    }

    private createConnections(inputNodes: List<NodeGene>, outputNodes: List<NodeGene>, allNodes: List<NodeGene>): NeatChromosome {
        const connections = new List<ConnectionGene>();
        let inputNode = this._random.pickRandomElementFromList(inputNodes);
        // We dont want the Bias as a first connection of the Network; only input nodes
        while (inputNode.type === NodeType.BIAS) {
            inputNode = this._random.pickRandomElementFromList(inputNodes);
        }
        let outputNode = this._random.pickRandomElementFromList(outputNodes);
        let newConnection = new ConnectionGene(inputNode, outputNode, 0, true, 0, false)
        this.assignInnovationNumber(newConnection);
        connections.add(newConnection)
        while (this._random.nextDouble() < NeatParameter.STARTING_CONNECTION_RATE) {
            inputNode = this._random.pickRandomElementFromList(inputNodes);
            outputNode = this._random.pickRandomElementFromList(outputNodes);
            newConnection = new ConnectionGene(inputNode, outputNode, 0, true, 0, false)
            // Only add the connection if its a new one
            if (this.findConnection(connections, newConnection) === null) {
                this.assignInnovationNumber(newConnection);
                connections.add(newConnection);
            }
        }
        return new NeatChromosome(connections, allNodes, this._mutationOp, this._crossoverOp);
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
