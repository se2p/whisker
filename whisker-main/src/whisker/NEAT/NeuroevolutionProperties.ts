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


import {NeatChromosome} from "./NeatChromosome";
import {StoppingCondition} from "../search/StoppingCondition";

/**
 * This class stores all relevant properties for a Neuroevolution Algorithm.
 */
export class NeuroevolutionProperties<C extends NeatChromosome> {

    // ----------------- Population Management -------------------
    /**
     * The size of the population that will be initially generated.
     */
    private _populationSize: number;

    /**
     * Specifies how many member of the species survive in each generation
     */
    private _parentsPerSpecies: number

    /**
     * Specifies when Species start go get penalized due to their age
     * This helps younger species to be able to develop themself for some time
     */
    private _penalizingAge: number

    /**
     * Specifies how much of a boost young generations should get (1.0 resembles no boost at all).
     */
    private _ageSignificance: number

    /**
     * The probability of adding an input node to the network during the generation of the network population
     */
    private _creationConnectionRate: number


    // ----------------- Mutation -------------------
    /**
     * The Probability of applying Mutation without Crossover
     */
    private _mutationWithoutCrossover: number

    /**
     * The probability for adding a new connection between nodes during mutation
     */
    private _mutationAddConnection: number

    /**
     * The rate of adding a recurrent connection during the "addConnection" mutation
     */
    private _recurrentConnection: number

    /**
     * How often we try finding a new connection that fits our desires (recurrent/not recurrent) during the
     * "addConnection" mutation
     */
    private _addConnectionTries: number

    /**
     * The Population Champion gets a unique probability of mutating the connections of his network
     */
    private _populationChampionConnectionMutation: number

    /**
     * The probability for adding a new node to the network during mutation
     */
    private _mutationAddNode: number

    /**
     * The probability for mutating the weights of the connections between nodes
     */
    private _mutateWeights: number

    /**
     * Defines how strong the weights are perturbed during weight mutation
     */
    private _perturbationPower

    /**
     * The probability for enabling/disabling a connection between nodes
     */
    private _mutateToggleEnableConnection: number

    /**
     * The probability for enabling a connection between nodes
     */
    private _mutateEnableConnection: number


    // ----------------- Crossover -------------------
    /**
     * The Probability of applying Crossover without a Mutation following
     */
    private _crossoverWithoutMutation: number

    /**
     * Defines how to handle connection weights during Crossover
     */
    private _crossoverAverageWeights: number

    /**
     * Defines how often organisms mate outside of their species
     */
    private _interspeciesMating: number


    // ----------------- Compatibility Distance -------------------
    /**
     * Determines up to which distance threshold two organisms belong to the same species
     */
    private _distanceThreshold: number

    /**
     * Defines the importance of disjoint connections
     */
    private _disjointCoefficient

    /**
     * Defines the importance of excess connections
     */
    private _excessCoefficient: number

    /**
     * Defines the importance of the weights in case of matching connections
     */
    private _weightCoefficient: number


    // ----------------- Miscellaneous -------------------
    /**
     * The stopping condition for the corresponding search algorithm.
     */
    private _stoppingCondition: StoppingCondition<C>;

    /**
     * Constructs an object that stores all relevant properties of a Neuroevolution Algorithm.
     * @param populationSize the size of the population
     */
    constructor(populationSize: number) {
        this._populationSize = populationSize;
    }

    // Getter and Setter

    get populationSize(): number {
        return this._populationSize;
    }

    set populationSize(value: number) {
        this._populationSize = value;
    }

    get parentsPerSpecies(): number {
        return this._parentsPerSpecies;
    }

    set parentsPerSpecies(value: number) {
        this._parentsPerSpecies = value;
    }

    get penalizingAge(): number {
        return this._penalizingAge;
    }

    set penalizingAge(value: number) {
        this._penalizingAge = value;
    }

    get ageSignificance(): number {
        return this._ageSignificance;
    }

    set ageSignificance(value: number) {
        this._ageSignificance = value;
    }

    get creationConnectionRate(): number {
        return this._creationConnectionRate;
    }

    set creationConnectionRate(value: number) {
        this._creationConnectionRate = value;
    }

    get mutationWithoutCrossover(): number {
        return this._mutationWithoutCrossover;
    }

    set mutationWithoutCrossover(value: number) {
        this._mutationWithoutCrossover = value;
    }

    get mutationAddConnection(): number {
        return this._mutationAddConnection;
    }

    set mutationAddConnection(value: number) {
        this._mutationAddConnection = value;
    }

    get recurrentConnection(): number {
        return this._recurrentConnection;
    }

    set recurrentConnection(value: number) {
        this._recurrentConnection = value;
    }

    get addConnectionTries(): number {
        return this._addConnectionTries;
    }

    set addConnectionTries(value: number) {
        this._addConnectionTries = value;
    }

    get populationChampionConnectionMutation(): number {
        return this._populationChampionConnectionMutation;
    }

    set populationChampionConnectionMutation(value: number) {
        this._populationChampionConnectionMutation = value;
    }

    get mutationAddNode(): number {
        return this._mutationAddNode;
    }

    set mutationAddNode(value: number) {
        this._mutationAddNode = value;
    }

    get mutateWeights(): number {
        return this._mutateWeights;
    }

    set mutateWeights(value: number) {
        this._mutateWeights = value;
    }

    get perturbationPower() : number {
        return this._perturbationPower;
    }

    set perturbationPower(value: number) {
        this._perturbationPower = value;
    }

    get mutateToggleEnableConnection(): number {
        return this._mutateToggleEnableConnection;
    }

    set mutateToggleEnableConnection(value: number) {
        this._mutateToggleEnableConnection = value;
    }

    get mutateEnableConnection(): number {
        return this._mutateEnableConnection;
    }

    set mutateEnableConnection(value: number) {
        this._mutateEnableConnection = value;
    }

    get crossoverWithoutMutation(): number {
        return this._crossoverWithoutMutation;
    }

    set crossoverWithoutMutation(value: number) {
        this._crossoverWithoutMutation = value;
    }

    get crossoverAverageWeights(): number {
        return this._crossoverAverageWeights;
    }

    set crossoverAverageWeights(value: number) {
        this._crossoverAverageWeights = value;
    }

    get interspeciesMating(): number {
        return this._interspeciesMating;
    }

    set interspeciesMating(value: number) {
        this._interspeciesMating = value;
    }

    get distanceThreshold(): number {
        return this._distanceThreshold;
    }

    set distanceThreshold(value: number) {
        this._distanceThreshold = value;
    }

    get disjointCoefficient() : number {
        return this._disjointCoefficient;
    }

    set disjointCoefficient(value: number) {
        this._disjointCoefficient = value;
    }

    get excessCoefficient(): number {
        return this._excessCoefficient;
    }

    set excessCoefficient(value: number) {
        this._excessCoefficient = value;
    }

    get weightCoefficient(): number {
        return this._weightCoefficient;
    }

    set weightCoefficient(value: number) {
        this._weightCoefficient = value;
    }

    get stoppingCondition(): StoppingCondition<C> {
        return this._stoppingCondition;
    }

    set stoppingCondition(value: StoppingCondition<C>) {
        this._stoppingCondition = value;
    }
}
