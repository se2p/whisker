import {ChromosomeGenerator} from "../search/ChromosomeGenerator";
import {NeatChromosome} from "./NeatChromosome";
import {Mutation} from "../search/Mutation";
import {Crossover} from "../search/Crossover";
import {List} from "../utils/List";
import {NodeGene} from "./NodeGene";
import {NodeType} from "./NodeType";
import {ConnectionGene} from "./ConnectionGene";
import {NeatConfig} from "./NeatConfig";

export class NeatChromosomeGenerator implements ChromosomeGenerator<NeatChromosome> {


    private _mutationOp: Mutation<NeatChromosome>;

    private _crossoverOp: Crossover<NeatChromosome>;

    private _inputSize: number;

    private _outputSize: number;

    constructor(mutationOp: Mutation<NeatChromosome>, crossoverOp: Crossover<NeatChromosome>) {
        this._mutationOp = mutationOp;
        this._crossoverOp = crossoverOp;
        this.inputSize = NeatConfig.INPUT_NEURONS;
        this.outputSize = NeatConfig.OUTPUT_NEURONS;
    }

    /**
     * Creates and returns a random NeatChromosome with the specified number of input and output nodes and a random set
     * of connections in between them.
     * @ returns: A random initial Neat Phenotype
     */
    get(): NeatChromosome {
        const nodes = new Map<number, List<NodeGene>>()
        NodeGene._idCounter = 0;
        // Create the Input Nodes and add them to the nodes list
        const inputList = new List<NodeGene>()
        for (let i = 0; i < this._inputSize; i++) {
            inputList.add(new NodeGene(NodeType.INPUT, 0))
        }
        inputList.add(new NodeGene(NodeType.BIAS, 1))      // Bias
        nodes.set(0, inputList);

        // Create the Output Nodes and add them to the nodes list
        const outputList = new List<NodeGene>()
        for (let i = 0; i < this._outputSize; i++) {
            outputList.add(new NodeGene(NodeType.OUTPUT, 0))
        }
        nodes.set(NeatConfig.MAX_HIDDEN_LAYERS, outputList)


        // Create connections between the input and output nodes with random weights and random enable state
        const connections = new List<ConnectionGene>();
        let counter = 1;
        for (const inputNode of nodes.get(0)) {
            for (const outputNode of nodes.get(NeatConfig.MAX_HIDDEN_LAYERS)) {
                connections.add(new ConnectionGene(inputNode, outputNode, Math.random(), Math.random() < 0.8, counter))
                counter++;
            }
        }
        const neatChromosome = new NeatChromosome(connections, this._crossoverOp, this._mutationOp);
        neatChromosome.nodes = nodes;
        return neatChromosome;
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
