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
import {Species} from "./Species";

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
    private _timePlayed: number;
    private _nonAdjustedFitness: number     // non shared Fitness with species
    private _fitness: number    // shared Fitness with species
    private _points: number
    private _champion: boolean;     // true if this Chromosome is the best member of a species
    private _eliminate: boolean;     // true if this Chromosome is marked dead in its species
    private _expectedOffspring: number // number of children this Chromosome is allowed to produce
    private _populationChampion: boolean      // A population champion is the best chromosome of the whole population
    private _numberOffspringPopulationChamp: number;    // Number of children the population champion is allowed to produce
    private _species: Species<NeatChromosome> // Points to the species of this Chromosome

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
        this._champion = false;
        this._eliminate = false;
    }

    /**
     * Deep clone of a NeatChromosome (what a rhyme)
     */
    clone(): NeatChromosome {
        return this.cloneWith(this.connections)
    }

    /**
     * Deep clone of a NeatChromosome using a defined list of genes
     * @param newGenes the genes the network should be initialised with
     */
    cloneWith(newGenes: List<ConnectionGene>): NeatChromosome {
        const cloneConnections = new List<ConnectionGene>();
        const cloneInputNodes = new List<NodeGene>();
        const cloneOutputNodes = new List<NodeGene>();
        const cloneAllNodes = new List<NodeGene>();

        for (const node of this._allNodes) {
            const nodeClone = node.clone();
            cloneAllNodes.add(nodeClone);
            if (nodeClone.type === NodeType.INPUT || nodeClone.type === NodeType.BIAS)
                cloneInputNodes.add(nodeClone);
            if (nodeClone.type === NodeType.OUTPUT)
                cloneOutputNodes.add(nodeClone);
        }
        for (const originalConnection of newGenes) {

            // search for the fromNode in the List of cloned Nodes; if it is nonexistent so far, create a clone of it
            let fromNode = this.searchNode(originalConnection.from, cloneAllNodes);
            if (fromNode === null) {
                fromNode = originalConnection.from.clone();
                cloneAllNodes.add(fromNode);
            }

            // search for the toNode in the List of cloned Nodes; if it is nonexistent so far, create a clone of it
            let toNode = this.searchNode(originalConnection.to, cloneAllNodes);
            if (toNode === null) {
                toNode = originalConnection.to.clone();
                cloneAllNodes.add(toNode);
            }
            cloneConnections.add(originalConnection.copyWithNodes(fromNode, toNode));
        }
        const chromosomeClone = new NeatChromosome(cloneConnections, cloneInputNodes, cloneOutputNodes, this._crossoverOp, this._mutationOp);
        chromosomeClone.fitness = this.fitness;
        chromosomeClone.timePlayed = this.timePlayed;
        chromosomeClone.generateNetwork();
        return chromosomeClone;
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
            if (!this.containsNode(connection.from)) {
                const layer = this.findLayerOfNode(this._layerMap, connection.to) - 1
                this._layerMap = this.insertNodeToLayer(this._layerMap, connection.from, layer)
                this._allNodes.add(connection.from);
            }
            if (!this.containsNode(connection.to)) {
                const layer = this.findLayerOfNode(this._layerMap, connection.from) + 1
                this._layerMap = this.insertNodeToLayer(this._layerMap, connection.to, layer)
                this._allNodes.add(connection.to);
            }
            // add the connection to the list of input connections of the node
            if (!connection.to.incomingConnections.contains(connection))
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
                console.log(this)
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
                            if (connection.enabled)
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

    // TODO: pulbic only for testing
    /**
     * Calculates the compatibility distance between two chromosomes; used for speciating
     * @param chromosome1 the first chromosome
     * @param chromosome2 the second chromosome
     * @return the compatibility distance of both chromosomes
     */
    public compatibilityDistance(chromosome2: NeatChromosome): number {
        let matching = 0;
        let disjoint = 0;
        let excess = 0;
        let weight = 0;
        let distance = 0;
        let lowestMaxInnovation;

        // Save first connections in a Map <InnovationNumber, Connection>
        const genome1Innovations = new Map<number, ConnectionGene>()
        for (const connection of this.connections) {
            genome1Innovations.set(connection.innovation, connection)
        }

        // Save second connections in a Map <InnovationNumber, Connection>
        const genome2Innovations = new Map<number, ConnectionGene>()
        for (const connection of chromosome2.connections) {
            genome2Innovations.set(connection.innovation, connection)
        }

        // Get the highest innovation Number of the genome with the least gene innovationNumber
        // Later used to decide between excess and disjoint genes
        if (genome1Innovations.size === 0 || genome2Innovations.size === 0)
            lowestMaxInnovation = 0;
        else {
            const genome1Highest = Array.from(genome1Innovations.keys()).pop()
            const genome2Highest = Array.from(genome2Innovations.keys()).pop()
            lowestMaxInnovation = Math.min(genome1Highest, genome2Highest)
        }

        // Save in a set to remove duplicates
        let allInnovations = new Set<number>(genome1Innovations.keys());
        genome2Innovations.forEach((value, key) => allInnovations.add(key))
        allInnovations = new Set([...allInnovations].sort());

        for (const innovation of allInnovations) {
            // If both share the connection then increasing matching and sum the weight difference
            if (genome1Innovations.has(innovation) && genome2Innovations.has(innovation)) {
                matching++;
                weight += Math.abs(genome1Innovations.get(innovation).weight - genome2Innovations.get(innovation).weight)
            }
                // If the innovationNumber is lower then the lowestMaxInnovation
            // its a disjoint connection otherwise its an excess connection
            else {
                innovation < lowestMaxInnovation ? disjoint++ : excess++;
            }
        }

        // get number of genes in the bigger Genome for normalization
        const N = Math.max(this.connections.size(), chromosome2.connections.size())

        if (N > 0)
            distance = (excess * NeatConfig.EXCESS_COEFFICIENT + disjoint * NeatConfig.DISJOINT_COEFFICIENT) / N +
                ((weight / matching) * NeatConfig.WEIGHT_COEFFICIENT);
        return distance;
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

    flushNodeValues(): void {
        for (const node of this.allNodes) {
            if (node.type === NodeType.HIDDEN || node.type === NodeType.OUTPUT) {
                node.activationValue = 0;
                node.activationCount = 0;
                node.activatedFlag = false;
            }
        }
    }

    containsNode(node: NodeGene): boolean {
        for (const n of this.allNodes)
            if (n.equals(node))
                return true
        return false;
    }

    searchNode(node: NodeGene, allNodes: List<NodeGene>): NodeGene {
        for (const n of allNodes)
            if (n.equals(node))
                return n;
        return null;
    }

    containsConnection(connection: ConnectionGene, connections: List<ConnectionGene>): boolean {
        for (const c of connections)
            if (c.equalsByNodes(connection))
                return true
        return false;
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

    /**
     * In NEAT we are interested in the shared fitness in the species -> the fitness function would only give
     * us the non-shared value
     * @param fitnessFunction
     */
    getFitness(fitnessFunction: FitnessFunction<this>): number {
        return this.fitness;
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

    set allNodes(value: List<NodeGene>
    ) {
        this._allNodes = value;
    }

    get trace(): ExecutionTrace {
        return this._trace;
    }

    set trace(value: ExecutionTrace
    ) {
        this._trace = value;
    }

    get timePlayed(): number {
        return this._timePlayed;
    }

    set timePlayed(value: number) {
        this._timePlayed = value;
    }

    get connections(): List<ConnectionGene> {
        return this._connections;
    }

    set connections(value: List<ConnectionGene>) {
        this._connections = value;
    }

    get fitness(): number {
        return this._fitness;
    }

    set fitness(value: number) {
        this._fitness = value;
    }

    get nonAdjustedFitness(): number {
        return this._nonAdjustedFitness;
    }

    set nonAdjustedFitness(value: number) {
        this._nonAdjustedFitness = value;
    }

    get points(): number {
        return this._points;
    }

    set points(value: number) {
        this._points = value;
    }


    get champion(): boolean {
        return this._champion;
    }

    set champion(value: boolean) {
        this._champion = value;
    }

    get eliminate(): boolean {
        return this._eliminate;
    }

    set eliminate(value: boolean) {
        this._eliminate = value;
    }

    get expectedOffspring(): number {
        return this._expectedOffspring;
    }

    set expectedOffspring(value: number) {
        this._expectedOffspring = value;
    }


    get populationChampion(): boolean {
        return this._populationChampion;
    }

    set populationChampion(value: boolean) {
        this._populationChampion = value;
    }

    get numberOffspringPopulationChamp(): number {
        return this._numberOffspringPopulationChamp;
    }

    set numberOffspringPopulationChamp(value: number) {
        this._numberOffspringPopulationChamp = value;
    }

    get species(): Species<NeatChromosome> {
        return this._species;
    }

    set species(value: Species<NeatChromosome>) {
        this._species = value;
    }

    toString(): string {
        return "Genome:\nNodeGenes: " + this.allNodes + "\nConnectionGenes: " + this._connections;
    }

    equals(other: unknown):
        boolean {
        if (!(other instanceof NeatChromosome)) return false;
        return this.connections === other.connections;
    }
}
