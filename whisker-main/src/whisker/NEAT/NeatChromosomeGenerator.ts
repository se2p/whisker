import {ChromosomeGenerator} from "../search/ChromosomeGenerator";
import {NeatChromosome} from "./NeatChromosome";
import {Mutation} from "../search/Mutation";
import {Crossover} from "../search/Crossover";
import {List} from "../utils/List";
import {NodeGene} from "./NodeGene";
import {NodeType} from "./NodeType";
import {ConnectionGene} from "./ConnectionGene";
import {NeatConfig} from "./NeatConfig";
import {NeatMutation} from "./NeatMutation";

export class NeatChromosomeGenerator implements ChromosomeGenerator<NeatChromosome> {


    private _mutationOp: Mutation<NeatChromosome>;

    private _crossoverOp: Crossover<NeatChromosome>;

    private _inputSize: number;

    private _outputSize: number;

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
        let valid = false;
        let generatedChromosome : NeatChromosome;
        //Create some input for testing the generated network
        const input = []
        while (input.length < this.inputSize)
            input.push(Math.random())
        // Loop until we get a valid chromosome
        while(!valid) {
            NodeGene._idCounter = 0;
            // Create the Input Nodes and add them to the nodes list
            const inputList = new List<NodeGene>()
            for (let i = 0; i < this._inputSize; i++) {
                inputList.add(new NodeGene(i, NodeType.INPUT))
            }
            inputList.add(new NodeGene(inputList.size(), NodeType.BIAS))    // Bias

            // Create the Output Nodes and add them to the nodes list
            const outputList = new List<NodeGene>()
            for (let i = 0; i < this._outputSize; i++) {
                outputList.add(new NodeGene(inputList.size() + i, NodeType.OUTPUT))
            }
            generatedChromosome = this.createConnections(inputList, outputList);
            generatedChromosome.generateNetwork();
            if(generatedChromosome.activateNetwork(input, true) !== null)
                valid = true;
        }
        return generatedChromosome;
    }

    private createConnections(inputNodes:List<NodeGene>, outputNodes:List<NodeGene>) : NeatChromosome{
        const connections = new List<ConnectionGene>();
        let counter = 1;
        for (const inputNode of inputNodes) {
            for (const outputNode of outputNodes) {
                // Do not connect the Bias Node and do not connect all inputs to the outputs
                if ((inputNode.type !== NodeType.BIAS) && (Math.random() < NeatConfig.INITIAL_CONNECTION_RATE)) {
                    connections.add(new ConnectionGene(inputNode, outputNode, Math.random(), Math.random() < 0.6, counter))
                    counter++;
                }
            }
        }
        return new NeatChromosome(connections, inputNodes, outputNodes, this._crossoverOp, this._mutationOp);
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
