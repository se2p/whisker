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
import {FitnessFunction} from "../search/FitnessFunction";
import {ExecutionTrace} from "../testcase/ExecutionTrace";
import {ActivationFunctions} from "./ActivationFunctions";

/**
 * A NeatChromosome representing a Chromosome in the NEAT-Algorithm
 */
export class NeatChromosome extends Chromosome {
    private _inputNodes = new List<NodeGene>();
    private _outputNodes = new List<NodeGene>();
    private _allNodes = new List<NodeGene>()
    private _layerMap = new Map<number, List<NodeGene>>();          // Map <Layer | Nodes>
    private _connections: List<ConnectionGene>
    private readonly _crossoverOp: Crossover<NeatChromosome>
    private readonly _mutationOp: Mutation<NeatChromosome>
    private _trace: ExecutionTrace;
    private _successScore: number;
    private _fitness: number
    private _adjustedFitness: number    // Fitness value in relation to the species the Chromosome is assigned to

    /**
     * Constructs a new NeatChromosome
     * @param connections the connections between the Nodes
     * @param inputNodes all input Nodes of this network
     * @param outputNodes all output Nodes of this network
     * @param crossoverOp the crossover Operator
     * @param mutationOp the mutation Operator
     */
    constructor(connections: List<ConnectionGene>, inputNodes: List<NodeGene>, outputNodes: List<NodeGene>,
                crossoverOp: Crossover<NeatChromosome>, mutationOp: Mutation<NeatChromosome>) {
        super();
        this._connections = connections;
        this._crossoverOp = crossoverOp;
        this._mutationOp = mutationOp;
        this._inputNodes = inputNodes;
        this._outputNodes = outputNodes;
        this.allNodes.addList(inputNodes);
        this.allNodes.addList(outputNodes);
        this._trace = null;
    }

    /**
     * Deep clone of a NeatChromosome (what a rhyme)
     */
    clone(): NeatChromosome {
        const copyConnections = new List<ConnectionGene>();
        for (const connection of this.connections)
            copyConnections.add(connection.copy());

        const copyInputNodes = new List<NodeGene>();
        for (const inputNode of this.inputNodes)
            copyInputNodes.add(inputNode.clone());

        const copyOutputNodes = new List<NodeGene>();
        for (const outputNode of this.outputNodes)
            copyOutputNodes.add(outputNode.clone());

        return new NeatChromosome(copyConnections, copyInputNodes, copyOutputNodes,
            this.getCrossoverOperator(), this.getMutationOperator());
    }

    /**
     * Deep clone of a NeatChromosome using a defined list of genes
     * @param newGenes the genes the network should be initialised with
     */
    cloneWith(newGenes: List<ConnectionGene>): NeatChromosome {
        const clone = this.clone();
        clone.connections = newGenes;
        return clone;
    }

    /**
     * Returns the length of the NeatChromosome defined by the number of connections
     */
    getLength(): number {
        return this._connections.size()
    }

    getCrossoverOperator(): Crossover<this> {
        return this._crossoverOp as Crossover<this>;
    }

    getMutationOperator(): Mutation<this> {
        return this._mutationOp as Mutation<this>;
    }

    generateNetwork(): void {
        // Set the input and output Nodes
        this._layerMap.set(0, this._inputNodes);
        this._layerMap.set(NeatConfig.MAX_HIDDEN_LAYERS, this._outputNodes)

        // Add the hidden Nodes
        for (const connection of this._connections) {
            if (!this._allNodes.contains(connection.from)) {
                const layer = this.findLayerOfNode(this._layerMap, connection.to) - 1
                this._layerMap = this.insertNodeToLayer(this._layerMap, connection.from, layer)
                this._allNodes.add(connection.from);
            }
            if (!this._allNodes.contains(connection.to)) {
                const layer = this.findLayerOfNode(this._layerMap, connection.from) + 1
                this._layerMap = this.insertNodeToLayer(this._layerMap, connection.to, layer)
                this._allNodes.add(connection.to);
            }
            // add the connection to the list of input connections of the node
            connection.to.incomingConnections.add(connection)
        }
    }

    activateNetwork(inputs: number[]): number[] {
        const output = []
        let activatedOnce = false;
        let abortCount = 0;  // Used if we have created a network which has not one path from input to output Node
        this.generateNetwork();

        for (let i = 0; i < inputs.length; i++) {
            // Input Nodes have no activation function -> the activationValue is the same as the nodeValue
            const inputNode = this.inputNodes.get(i);
            inputNode.activationValue = inputs[i];
            inputNode.nodeValue = inputs[i];
        }

        while (!activatedOnce || !this.isOutputActivated()) {

            abortCount++;
            if (abortCount >= 50) {
                console.error("Defect Network detected")
                return null;
            }

            // For each node, compute the sum of its incoming activation
            for (const layer of this._layerMap.keys()) {
                for (const node of this._layerMap.get(layer)) {
                    if (node.type !== NodeType.INPUT && node.type !== NodeType.BIAS) {
                        // reset activation value and activation flag
                        node.nodeValue = 0;
                        node.activatedFlag = false;

                        for (const connection of node.incomingConnections) {
                            node.nodeValue += connection.weight * connection.from.getActivationValue();
                            if (connection.from.activatedFlag || connection.from.type === NodeType.INPUT || connection.from.type === NodeType.BIAS)
                                node.activatedFlag = true;
                        }
                    }
                }
            }

            for (const layer of this._layerMap.keys()) {
                for (const node of this._layerMap.get(layer)) {
                    if (node.type === NodeType.HIDDEN) {
                        // Only activate the node if it received an input from the layer before
                        if (node.activatedFlag) {
                            node.activationValue = ActivationFunctions.sigmoid(node.nodeValue);
                            node.activationCount++;
                        }
                    } else if (node.type === NodeType.OUTPUT) {
                        const softMaxVector: number[] = []
                        for (const outputNode of this.outputNodes)
                            softMaxVector.push(outputNode.nodeValue)
                        // Only activate the node if it received an input from the layer before
                        if (node.activatedFlag) {
                            node.activationValue = ActivationFunctions.softmax(node.nodeValue, softMaxVector);
                            node.activationCount++;
                            output.push(node.activationValue)
                        }
                    }
                }
            }
            activatedOnce = true;
        }

        return output;
    }

    /**
     * Checks if each output Node has been activated at least once
     */
    isOutputActivated(): boolean {
        for (const outputNode of this.outputNodes) {
            if (outputNode.activationCount == 0)
                return false;
        }
        return true;
    }

    insertNodeToLayer(map: Map<number, List<NodeGene>>, target: NodeGene, layer: number):
        Map<number, List<NodeGene>> {
        // if element already in List do nothing
        if (this.findLayerOfNode(map, target) > 0
        )
            return map;

        if (map.get(layer) === undefined) {
            const layerList = new List<NodeGene>()
            layerList.add(target)
            map.set(layer, layerList)
        } else {
            const layerList = map.get(layer);
            layerList.add(target)
        }
        return new Map([...map].sort((a, b) => a[0] - b[0]));
    }

    findLayerOfNode(map: Map<number, List<NodeGene>>, target: NodeGene):
        number {
        for (const [key, value] of map) {
            for (const node of value) {
                if (node.equals(target))
                    return key;
            }
        }
        return -1;
    }

    getFitness(fitnessFunction: FitnessFunction<this>):
        number {
        const fitness = fitnessFunction.getFitness(this);
        return fitness;
    }


    get layerMap(): Map<number, List<NodeGene>> {
        return this._layerMap;
    }

    set layerMap(value: Map<number, List<NodeGene>>) {
        this._layerMap = value;
    }

    get inputNodes(): List<NodeGene> {
        return this._inputNodes;
    }

    set inputNodes(value: List<NodeGene>) {
        this._inputNodes = value;
    }

    get outputNodes(): List<NodeGene> {
        return this._outputNodes;
    }

    set outputNodes(value: List<NodeGene>) {
        this._outputNodes = value;
    }

    get allNodes(): List<NodeGene> {
        return this._allNodes;
    }

    set allNodes(value
                     :
                     List<NodeGene>
    ) {
        this._allNodes = value;
    }

    get trace()
        :
        ExecutionTrace {
        return this._trace;
    }

    set trace(value
                  :
                  ExecutionTrace
    ) {
        this._trace = value;
    }

    get successScore()
        :
        number {
        return this._successScore;
    }

    set successScore(value
                         :
                         number
    ) {
        this._successScore = value;
    }

    get connections()
        :
        List<ConnectionGene> {
        return this._connections;
    }

    set connections(value
                        :
                        List<ConnectionGene>
    ) {
        this._connections = value;
    }

    get fitness()
        :
        number {
        return this._fitness;
    }

    set fitness(value
                    :
                    number
    ) {
        this._fitness = value;
    }

    get adjustedFitness()
        :
        number {
        return this._adjustedFitness;
    }

    set adjustedFitness(value
                            :
                            number
    ) {
        this._adjustedFitness = value;
    }

    toString()
        :
        string {
        return "Genome:\nNodeGenes: " + this.allNodes + "\nConnectionGenes: " + this._connections;
    }

    public

    equals(other
               :
               unknown
    ):
        boolean {
        if (!(other instanceof NeatChromosome)) return false;
        return this.connections === other.connections;
    }
}
