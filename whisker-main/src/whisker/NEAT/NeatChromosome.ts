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
import {NeatConfig} from "./NeatConfig";

/**
 * A NeatChromosome representing a Chromosome in the NEAT-Algorithm
 */
export class NeatChromosome extends Chromosome {

    private _nodes = new Map<number, List<NodeGene>>();          // Map <Layer | Nodes>
    private readonly _connections: List<ConnectionGene>
    private readonly _crossoverOp: Crossover<NeatChromosome>
    private readonly _mutationOp: Mutation<NeatChromosome>
    private _fitness: number
    private _inputSize: number;
    private _outputSize: number;

    /**
     * Constructs a new NeatChromosome
     * @param connections the connections between the Nodes
     * @param crossoverOp the crossover Operator
     * @param mutationOp the mutation Operator
     */
    constructor(connections: List<ConnectionGene>,
                crossoverOp: Crossover<NeatChromosome>, mutationOp: Mutation<NeatChromosome>) {
        super();
        this._connections = connections;
        this._crossoverOp = crossoverOp;
        this._mutationOp = mutationOp;
    }

    /**
     * Deep clone of a NeatChromosome
     */
    clone(): NeatChromosome {
        return new NeatChromosome(this.getConnections(), this.getCrossoverOperator(), this.getMutationOperator());
    }

    /**
     * Deep clone of a NeatChromosome using a defined list of genes
     * @param newGenes the genes the network should be initialised with
     */
    cloneWith(newGenes: List<ConnectionGene>): NeatChromosome {
        return new NeatChromosome(newGenes, this.getCrossoverOperator(), this.getMutationOperator());
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

    getNodes(): Map<number, List<NodeGene>> {
        return this._nodes;
    }

    getConnections(): List<ConnectionGene> {
        return this._connections;
    }

    generateNetwork() {
        this._nodes.clear();
        NodeGene._idCounter = 0;
        // Create the Input Nodes and add them to the nodes list
        const inputList = new List<NodeGene>()
        for (let i = 0; i < this._inputSize; i++) {
            inputList.add(new NodeGene(NodeType.INPUT, 0))
        }
        inputList.add(new NodeGene(NodeType.BIAS, 1))      // Bias
        this._nodes.set(0, inputList);

        // Create the Output Nodes and add them to the nodes list
        const outputList = new List<NodeGene>()
        for (let i = 0; i < this._outputSize; i++) {
            outputList.add(new NodeGene(NodeType.OUTPUT, 0))
        }
        this._nodes.set(NeatConfig.MAX_HIDDEN_LAYERS, outputList)

        // Add the hidden Nodes
        for (const connection of this._connections) {
            if (this.findLayerOfNode(this._nodes, connection.from) < 0) {
                const layer = this.findLayerOfNode(this._nodes, connection.to) - 1
                this._nodes = this.insertNodeToLayer(this._nodes, new NodeGene(NodeType.HIDDEN, 0), layer)
            }
            if (this.findLayerOfNode(this._nodes, connection.to) < 0) {
                const layer = this.findLayerOfNode(this._nodes, connection.from) + 1
                this._nodes = this.insertNodeToLayer(this._nodes, new NodeGene(NodeType.HIDDEN, 0), layer)
            }
            // add the connection to the list of input connections of the node
            this.findNode(this._nodes, connection.to).inputConnections.add(connection)
        }
    }

    insertNodeToLayer(map: Map<number, List<NodeGene>>, target: NodeGene, layer: number): Map<number, List<NodeGene>> {
        // if element already in List do nothing
        if (this.findLayerOfNode(map, target) > 0)
            return map;

        if (map.get(layer) === undefined) {
            const layerList = new List<NodeGene>()
            layerList.add(target)
            map.set(layer, layerList)
        } else {
            const layerList = map.get(layer);
            layerList.add(target)
        }
        return this.sortMapByKeys(map)
    }

    findLayerOfNode(map: Map<number, List<NodeGene>>, target: NodeGene): number {
        for (const [key, value] of map) {
            for (const node of value) {
                if (node.equals(target))
                    return key;
            }
        }
        return -1;
    }

    findNode(map: Map<number, List<NodeGene>>, target: NodeGene): NodeGene {
        for (const [key, value] of map) {
            for (const node of value) {
                if (node.equals(target))
                    return node;
            }
        }
        return undefined;
    }

    sortMapByKeys(map: Map<number, List<NodeGene>>): Map<number, List<NodeGene>> {
        return new Map([...map].sort((a, b) => a[0] - b[0]));
    }

    activateNetwork(inputs: number[]): number[] {
        const output = []
        this.generateNetwork();

        // Set the values of the input nodes to the given input
        let i = 0;
        for (const inputNode of this._nodes.get(0)) {
            if (inputNode.type === NodeType.INPUT)
                inputNode.value = inputs[i++]
        }

        // TODO: recurrent calculus
        // activate hidden Layers in order => FeedForward Network
        for (let i = 1; i < NeatConfig.MAX_HIDDEN_LAYERS; i++) {
            let nodeSum = 0
            const layer = this._nodes.get(i);
            if (layer !== undefined) {
                for (const hiddenNode of layer) {
                    for (const connection of hiddenNode.inputConnections) {
                        if (connection.enabled) {
                            nodeSum += this.findNode(this._nodes, connection.from).value * connection.weight
                        }
                    }
                    hiddenNode.value = this.sigmoid(nodeSum);
                }
            }
        }

        // activate output Nodes and push to output Array
        const outputNodes = this._nodes.get(NeatConfig.MAX_HIDDEN_LAYERS)
        for (const outputNode of outputNodes) {
            let nodeSum = 0;
            for (const connection of outputNode.inputConnections) {
                if (connection.enabled) {
                    nodeSum += this.findNode(this._nodes, connection.from).value * connection.weight;
                }
            }
            outputNode.value = this.sigmoid(nodeSum);
            output.push(outputNode.value)
        }

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

    get fitness(): number {
        return this._fitness;
    }

    set fitness(value: number) {
        this._fitness = value;
    }

    get nodes(): Map<number, List<NodeGene>> {
        return this._nodes;
    }

    set nodes(value: Map<number, List<NodeGene>>) {
        this._nodes = value;
    }

    toString(): string {
        let nodeString = "";
        for(const nodes of this.nodes.values()){
            nodeString += nodes
        }
        return "Genome:\nNodeGenes: " + nodeString+ "\nConnectionGenes: " + this._connections;
    }
}
