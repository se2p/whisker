/*
 * Copyright (C) 2020 Whisker contributors
 *
 * This file is part of the Whisker test generator for Scratch.
 *
 * Whisker is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Whisker is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Whisker. If not, see http://www.gnu.org/licenses/.
 *
 */

import {Chromosome} from "../search/Chromosome";
import {List} from "../utils/List";
import {NodeGene} from "./NodeGene";
import {ConnectionGene} from "./ConnectionGene";
import {Crossover} from "../search/Crossover";
import {Mutation} from "../search/Mutation";
import {NodeType} from "./NodeType";

/**
 * A NeatChromosome representing a Chromosome in the NEAT-Algorithm
 */
export class NeatChromosome extends Chromosome {

    private readonly _nodes: Map<number, NodeGene>
    private readonly _connections: List<ConnectionGene>
    private readonly _crossoverOp: Crossover<NeatChromosome>
    private readonly _mutationOp: Mutation<NeatChromosome>
    private _inputSize: number;
    private _outputSize: number;

    /**
     * Constructs a new NeatChromosome
     * @param nodes the Nodes of a neural network
     * @param connections the connections between the Nodes
     * @param crossoverOp the crossover Operator
     * @param mutationOp the mutation Operator
     */
    constructor(nodes: Map<number, NodeGene>, connections: List<ConnectionGene>,
                crossoverOp: Crossover<NeatChromosome>, mutationOp: Mutation<NeatChromosome>) {
        super();
        this._nodes = nodes;
        this._connections = connections;
        this._crossoverOp = crossoverOp;
        this._mutationOp = mutationOp;
    }

    /**
     * Deep clone of a NeatChromosome
     */
    clone(): NeatChromosome {
        return new NeatChromosome(this.getNodes(), this.getConnections(),
            this.getCrossoverOperator(), this.getMutationOperator());
    }

    /**
     * Deep clone of a NeatChromosome using a defined list of genes
     * @param newGenes the genes the network should be initialised with
     */
    cloneWith(newGenes: List<NodeGene | ConnectionGene>): NeatChromosome {
        return new NeatChromosome(newGenes[0], newGenes[1], this.getCrossoverOperator(), this.getMutationOperator());
    }

    /**
     * Returns the length of the NeatChromosome by adding the size of the NodeGenes and ConnectionGenes Lists
     */
    getLength(): number {
        return this.getConnections().size() + this.getConnections().size();
    }

    getCrossoverOperator(): Crossover<this> {
        return this._crossoverOp as Crossover<this>;
    }

    getMutationOperator(): Mutation<this> {
        return this._mutationOp as Mutation<this>;
    }

    getNodes(): Map<number, NodeGene> {
        return this._nodes;
    }

    getConnections(): List<ConnectionGene> {
        return this._connections;
    }

    generateNetwork() {
        this._nodes.clear();
        NodeGene._idCounter = 0;
        // Create the Input Nodes and add them to the nodes list
        for (let i = 0; i < this._inputSize; i++) {
            const inputNode = new NodeGene(NodeType.INPUT, 0)
            this._nodes.set(inputNode.id, inputNode);
        }
        const biasNode = new NodeGene(NodeType.BIAS, 1)
        this._nodes.set(biasNode.id, biasNode)      // Bias

        // Create the Output Nodes and add them to the nodes list
        for (let i = 0; i < this._outputSize; i++) {
            const outputNode = new NodeGene(NodeType.OUTPUT, 0)
            this._nodes.set(outputNode.id, outputNode);
        }

        // Add the hidden Nodes
        for (const connection of this._connections) {
            if (!this._nodes.has(connection.from.id))
                this._nodes.set(connection.from.id, new NodeGene(NodeType.HIDDEN, 0))
            if (!this._nodes.has(connection.to.id))
                this._nodes.set(connection.to.id, new NodeGene(NodeType.HIDDEN, 0))
            // add the connection to the list of input connections of the node
            this._nodes.get(connection.to.id).inputConnections.add(connection)
        }
    }

    findInMap(map: Map<number, NodeGene>, target: NodeGene): number {
        for (const [key, value] of map) {
            if (value.equals(target))
                return key;
        }
        return -1;
    }

    activateNetwork(inputs: number[]): number[] {
        const output = []
        this.generateNetwork();

        // Set the values of the input nodes to the given input
        for (let i = 0; i < this._inputSize; i++) {
            this._nodes.get(i).value = inputs[i];
        }

        this._nodes.forEach((node) => {
            let sum = 0;
            if (node.type === NodeType.HIDDEN) {
                for (const connection of node.inputConnections) {
                    if (connection.enabled) {
                        sum += this._nodes.get(connection.from.id).value * connection.weight
                    }
                }
                node.value = this.sigmoid(sum)
            }
        })

        this._nodes.forEach((node) => {
            let sum = 0;
            if (node.type === NodeType.OUTPUT) {
                for (const connection of node.inputConnections) {
                    if (connection.enabled) {
                        sum += this._nodes.get(connection.from.id).value * connection.weight
                    }
                }
                node.value = this.sigmoid(sum)
                output.push(node.value)
            }
        })
        return output;
    }

    private sigmoid(x: number): number {
        // TODO Auto-generated method stub
        return (1 / (1 + Math.exp(-x)));
    }

    // Used for Testing
    set inputSize(value: number) {
        this._inputSize = value;
    }

    // Used for Testing
    set outputSize(value: number) {
        this._outputSize = value;
    }

    toString(): string {
        const printNodeList = new List<NodeGene>();
        this._nodes.forEach(value => printNodeList.add(value))
        return "Genome:\nNodeGenes: " + printNodeList + "\nConnectionGenes: " + this._connections;
    }
}
