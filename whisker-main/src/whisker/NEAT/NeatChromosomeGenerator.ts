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

export class NeatChromosomeGenerator implements ChromosomeGenerator<NeatChromosome> {

    // Arbitrary easily detectable value in case of bugs => a connection should never have this value
    private static readonly TEMP_INNOVATION_NUMBER = 100000;

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
        //Create some input for testing the generated network
        const input = []
        while (input.length < this.inputSize)
            input.push(Math.random())
        // Loop until we get a valid chromosome
        let positionId = 0;
        // Create the Input Nodes and add them to the nodes list
        const inputList = new List<NodeGene>()
        while (inputList.size() < this.inputSize) {
            inputList.add(new NodeGene(positionId, NodeType.INPUT))
            positionId++;
        }
        inputList.add(new NodeGene(positionId, NodeType.BIAS))    // Bias
        positionId++;

        // Create the Output Nodes and add them to the nodes list
        const outputList = new List<NodeGene>()
        while (outputList.size() < this.outputSize) {
            outputList.add(new NodeGene(positionId, NodeType.OUTPUT))
            positionId++;
        }
        const generatedChromosome = this.createConnections(inputList, outputList);
        generatedChromosome.generateNetwork();

        return generatedChromosome;
    }

    private createConnections(inputNodes: List<NodeGene>, outputNodes: List<NodeGene>): NeatChromosome {
        const connections = new List<ConnectionGene>();
        let inputNode = this._random.pickRandomElementFromList(inputNodes);
        // We dont want the Bias as a first connection of the Network; only input nodes
        while (inputNode.type === NodeType.BIAS) {
            inputNode = this._random.pickRandomElementFromList(inputNodes);
        }
        const outputNode = this._random.pickRandomElementFromList(outputNodes);
        const newConnection = new ConnectionGene(inputNode, outputNode, Math.random(), true, NeatChromosomeGenerator.TEMP_INNOVATION_NUMBER)
        this.assignInnovationNumber(newConnection);
        connections.add(newConnection)
        return new NeatChromosome(connections, inputNodes, outputNodes, this._crossoverOp, this._mutationOp);
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
