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
import {FitnessFunction} from "../search/FitnessFunction";
import {ExecutionTrace} from "../testcase/ExecutionTrace";
import {Species} from "./Species";
import assert from "assert";

/**
 * A NeatChromosome representing a Chromosome in the NEAT-Algorithm
 */
export class NeatChromosome extends Chromosome {
    private _inputNodes = new List<NodeGene>();
    private _outputNodes = new List<NodeGene>();
    private _allNodes = new List<NodeGene>()
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
    private _loop: boolean
    private _networkFitness: number
    private _codons: List<number>       // Saves the codons to later transform the NeatChromosome into a TestChromosome
    private _isRecurrent: boolean
    private _regression: boolean;

    /**
     * Constructs a new NeatChromosome
     * @param connections the connections between the Nodes
     * @param allNodes all the nodes of a Chromosome
     * @param crossoverOp the crossover Operator
     * @param mutationOp the mutation Operator
     */
    constructor(connections: List<ConnectionGene>, allNodes: List<NodeGene>,
                mutationOp: Mutation<NeatChromosome>, crossoverOp: Crossover<NeatChromosome>) {
        super();
        this._connections = connections;
        this._crossoverOp = crossoverOp;
        this._mutationOp = mutationOp;
        this._trace = null;
        this._champion = false;
        this._populationChampion = false;
        this._numberOffspringPopulationChamp = 0;
        this._nonAdjustedFitness = 0;
        this._fitness = 0;
        this._expectedOffspring = 0;
        this._eliminate = false;
        this._species = null;
        this._allNodes = allNodes;
        this._inputNodes = new List<NodeGene>();
        this._outputNodes = new List<NodeGene>();
        this._loop = false;
        this._networkFitness = 0;
        this._codons = new List<number>();
        this._isRecurrent = false;
        this._regression = false;
        this.generateNetwork();
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
        const connectionsClone = new List<ConnectionGene>();
        const nodesClone = new List<NodeGene>();

        // duplicate Nodes
        for (const node of this.allNodes) {
            const nodeClone = node.clone()
            nodesClone.add(nodeClone);
        }

        for (const connection of newGenes) {
            const fromNode = this.searchNode(connection.from, nodesClone)
            const toNode = this.searchNode(connection.to, nodesClone)
            const connectionClone = connection.copyWithNodes(fromNode, toNode);
            connectionsClone.add(connectionClone);
        }

        return new NeatChromosome(connectionsClone, nodesClone, this.getMutationOperator(), this.getCrossoverOperator());
    }


    getLength(): number {
        return this._codons.size();
    }

    getCrossoverOperator(): Crossover<this> {
        return this._crossoverOp as Crossover<this>;
    }

    getMutationOperator(): Mutation<this> {
        return this._mutationOp as Mutation<this>;
    }

    generateNetwork(): void {
        this.sortConnections();
        // Place the input and output nodes into their lists
        for (const node of this.allNodes) {
            if ((!this.inputNodes.contains(node)) && (node.type === NodeType.INPUT || node.type === NodeType.BIAS)) {
                this.inputNodes.add(node);
            }
            if ((!this.outputNodes.contains(node)) && (node.type === NodeType.CLASSIFICATION_OUTPUT ||
                node.type === NodeType.REGRESSION_OUTPUT))
                this.outputNodes.add(node);
        }

        // Go through each connection and set up the incoming connections of each Node
        for (const connection of this.connections) {
            const toNode = connection.to;
            // Add the connection to the incoming connections of the toNode if it is not present yet and enabled
            if (!toNode.incomingConnections.contains(connection) && connection.enabled) {
                toNode.incomingConnections.add(connection);
            }
        }
    }

    public stabilizedCounter(period: number, verifyMode: boolean): number {
        this.generateNetwork();
        this.flushNodeValues();

        // Recurrent Networks are by definition unstable; 50 iterations however, should be enough to let them
        // stabilize enough.
        if(this.isRecurrent)
            return 50;

        if (period === 0)
            period = 30;

        // First activate input Nodes
        for (const iNode of this.allNodes) {
            if (iNode.type === NodeType.INPUT) {
                iNode.lastActivationValue = iNode.activationValue;
                iNode.activationCount++;
                iNode.activationValue = 1;
                iNode.nodeValue = 1;
            }
        }

        // activate the network
        let done = false;
        let rounds = 0;
        let stableCounter = 0;
        let level = 0;
        const limit = period + 90;

        while (!done) {

            if (rounds >= limit) {
                if (!verifyMode) {
                    console.error("Network is unstable");
                    console.log(this)
                }
                return -1;
            }

            this.activateNetwork(verifyMode);

            if (!this.outputsOff()) {

                let hasChanged = false;
                for (const oNode of this.outputNodes) {
                    if (oNode.lastActivationValue !== oNode.activationValue) {
                        hasChanged = true;
                        break;
                    }
                }
                if (!hasChanged) {
                    stableCounter++;
                    if (stableCounter >= period) {
                        done = true;
                        level = rounds;
                        break;
                    }
                } else {
                    stableCounter = 0;
                }
            }
            rounds++;
        }
        return (level - period + 1);
    }

    activateNetwork(verifyMode: boolean): boolean {
        let activatedOnce = false;
        this.generateNetwork();
        let abortCount = 0;
        let incomingValue = 0;

        while (this.outputsOff() || !activatedOnce) {

            abortCount++;
            if (abortCount >= 30) {
                if (!verifyMode) {
                    console.error("Inputs Disconnected from output!")
                    console.log(this)
                }
                return false
            }

            // For each node compute the sum of its incoming connections
            for (const node of this.allNodes) {

                if (node.type !== NodeType.INPUT && node.type !== NodeType.BIAS) {

                    // Reset the activation Flag and the activation value
                    node.nodeValue = 0.0
                    node.activatedFlag = false;

                    for (const connection of node.incomingConnections) {
                        incomingValue = connection.weight * connection.from.activationValue;
                        if (connection.from.activatedFlag || connection.from.type === NodeType.INPUT) {
                            node.activatedFlag = true;
                        }
                        node.nodeValue += incomingValue;
                    }
                }
            }

            // Activate all the non-sensor nodes by their incoming activation
            for (const node of this.allNodes) {
                if (node.type !== NodeType.INPUT && node.type !== NodeType.BIAS) {
                    // Only activate if we received some input
                    if (node.activatedFlag) {
                        node.lastActivationValue = node.activationValue;
                        node.activationValue = node.getActivationValue();
                        node.activationCount++;

                    }
                }
            }
            activatedOnce = true;
        }
        return true;
    }

    public setUpInputs(inputs: number[]): void {
        for (let i = 0; i < this.inputNodes.size(); i++) {
            const iNode = this.inputNodes.get(i);
            if (iNode.type === NodeType.INPUT) {
                iNode.activationCount++;
                iNode.nodeValue = inputs[i];
                iNode.activationValue = inputs[i];
            }
        }
    }

    public isRecurrentNetwork(node1: NodeGene, node2: NodeGene, level: number, threshold: number): boolean {
        this.generateNetwork();

        level++;

        // Reset the traverse flag
        for (const node of this.allNodes)
            node.traversed = false;

        if (level > threshold) {
            this.loop = true;
            this.isRecurrent = false;
            return false;
        }

        if (node1 === node2) {
            this.isRecurrent = true;
            return true;
        }

        for (const inConnection of node1.incomingConnections) {
            if (!inConnection.recurrent) {
                if (!inConnection.from.traversed) {
                    inConnection.from.traversed = true;
                    if (this.isRecurrentNetwork(inConnection.from, node2, level, threshold)) {
                        this._isRecurrent = true;
                        return true;
                    }
                }
            }
        }
        node1.traversed = true;
        this.isRecurrent = false;
        return false;
    }


    /**
     * Checks if at least one output has been activated
     */
    outputsOff(): boolean {
        let activatedOnce = true
        for (const outputNode of this.outputNodes) {
            if (!(outputNode.activationCount == 0))
                activatedOnce = false;
        }
        return activatedOnce;
    }

    flushNodeValues(): void {
        for (const node of this.allNodes) {
            node.reset();
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

    sortConnections():void{
        this.connections.sort((a,b) => a.innovation - b.innovation);
    }

    /**
     * In NEAT we are interested in the shared fitness in the species -> the fitness function would only give
     * us the non-shared value
     * @param fitnessFunction
     */
    getFitness(fitnessFunction: FitnessFunction<this>): number {
        return fitnessFunction.getFitness(this);
    }

    public getNumEvents(): number {
        assert (this._trace != null);
        return this._trace.events.size();
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

    set fitness(value: number) {
        this._fitness = value;
    }

    get networkFitness(): number {
        return this._networkFitness;
    }

    set networkFitness(value: number) {
        this._networkFitness = value;
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

    get loop(): boolean {
        return this._loop;
    }

    set loop(value: boolean) {
        this._loop = value;
    }

    get codons(): List<number> {
        return this._codons;
    }

    set codons(value: List<number>) {
        this._codons = value;
    }

    get isRecurrent(): boolean {
        return this._isRecurrent;
    }

    set isRecurrent(value: boolean) {
        this._isRecurrent = value;
    }

    get regression(): boolean {
        return this._regression;
    }

    set regression(value: boolean) {
        this._regression = value;
    }

    toString(): string {
        return "Genome:\nNodeGenes: " + this.allNodes + "\nConnectionGenes: " + this._connections;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof NeatChromosome)) return false;
        for (const connection of this.connections) {
            if (!connection.equalsByNodes(other.connections)) {
                return false;
            }
        }
        return true;
    }
}
