import {ChromosomeGenerator} from "../search/ChromosomeGenerator";
import {NeatChromosome} from "./NeatChromosome";
import {Mutation} from "../search/Mutation";
import {Crossover} from "../search/Crossover";
import {ScratchEventExtractor} from "../testcase/ScratchEventExtractor";
import {Container} from "../utils/Container";
import {List} from "../utils/List";
import {NodeGene} from "./NodeGene";
import {NodeType} from "./NodeType";
import {ConnectionGene} from "./ConnectionGene";

export class NeatChromosomeGenerator implements ChromosomeGenerator<NeatChromosome> {


    private _mutationOp: Mutation<NeatChromosome>;

    private _crossoverOp: Crossover<NeatChromosome>;

    private _numInputNodes : number;

    private _numOutputNodes: number;

    constructor(mutationOp: Mutation<NeatChromosome>, crossoverOp: Crossover<NeatChromosome>) {
        this._mutationOp = mutationOp;
        this._crossoverOp = crossoverOp;
    }

    /**
     * Creates and returns a random NeatChromosome with the specified number of input and output nodes and a random set
     * of connections inbetween them.
     * @ returns: A random initial Neat Phenotype
     */
    get(): NeatChromosome {
        const nodes = new List<NodeGene>();
        // Create the Input and Output Nodes and add them to the nodes list
        for (let i = 0; i < this._numInputNodes; i++) {
            nodes.add(new NodeGene(NodeType.INPUT));
        }
        for (let i = 0; i < this._numOutputNodes; i++) {
            nodes.add(new NodeGene(NodeType.OUTPUT));
        }


        // Create connections between the input and output nodes with random weights and random enable state
        const connections = new List<ConnectionGene>();
        for (let i = 0; i < this._numInputNodes; i++) {
            for (let o = this._numInputNodes; o < nodes.size(); o++) {
                connections.add(new ConnectionGene(nodes.get(i), nodes.get(o), Math.random(), Math.random() < 0.8))
            }
        }
        return new NeatChromosome(nodes, connections, this._crossoverOp, this._mutationOp);
    }

    setCrossoverOperator(crossoverOp: Crossover<NeatChromosome>): void {
        this._crossoverOp = crossoverOp;
    }

    setMutationOperator(mutationOp: Mutation<NeatChromosome>): void {
        this._mutationOp = mutationOp;
    }


    // Used for Testing
    set numInputNodes(value: number) {
        this._numInputNodes = value;
    }

    // Used for Testing
    set numOutputNodes(value: number) {
        this._numOutputNodes = value;
    }
}
