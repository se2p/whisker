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

import {StoppingCondition} from "./StoppingCondition";
import {Chromosome} from "./Chromosome";

/**
 * This class stores all relevant properties from a search algorithm.
 *
 * @author Sophia Geserer
 */
export class SearchAlgorithmProperties<C extends Chromosome> {

    /**
     * The size of the population that will be initially generated.
     */
    private _populationSize: number;

    /**
     * The length of a chromosome.
     */
    private _chromosomeLength: number;

    /**
     * The propability for applying crossover to chromosomes.
     */
    private _crossoverProbability: number;

    /**
     * The probability to apply mutation to a chromosome.
     */
    private _mutationProbablity: number;

    /**
     * The number of mutations on the same chromosome at start.
     */
    private _maxMutationCountStart: number;

    /**
     * The number of mutations on the same chromosome in the focused phase.
     */
    private _maxMutationCountFocusedPhase: number;

    /**
     * The stopping condition for the corresponding search algorithm.
     */
    private _stoppingCondition: StoppingCondition<C>;

    /**
     * The probability for sampling a random chromosome at start.
     */
    private _selectionProbabilityStart: number;

    /**
     * The probability for sampling a random chromosome in the focused phase.
     */
    private _selectionProbabilityFocusedPhase: number;

    /**
     * The maximum number of chromosomes stored for a fitness function at start.
     */
    private _maxArchiveSizeStart: number;

    /**
     * The maximum number of chromosomes stored for a fitness function in the focused phase.
     */
    private _maxArchiveSizeFocusedPhase: number;

    /**
     * The percentage of iterations.
     */
    private _startOfFocusedPhase: number;

    /**
     * The minimum of the range.
     */
    private _minRange: number;

    /**
     * The maximum of the range.
     */
    private _maxRange: number;

    /**
     * Defines the used TestGenerator approach
     */
    private _testGenerator: string

    /**
     * Constructs an object that stores all relevant properties of a search algorithm.
     * @param populationSize the size of the population
     * @param chromosomeLength the length of each chromosome
     */
    constructor(populationSize: number, chromosomeLength: number) {
        this._populationSize = populationSize;
        this._chromosomeLength = chromosomeLength;
    }

    /**
     * Returns the population size.
     * @returns population size
     */
    getPopulationSize(): number {
        return this._populationSize;
    }

    /**
     * Returns the size of a chromosome.
     * @returns the length of a chromosome
     */
    getChromosomeLength(): number {
        return this._chromosomeLength;
    }

    /**
     * Returns the crossover probability.
     * @returns probability to apply crossover
     */
    getCrossoverProbability(): number {
        return this._crossoverProbability;
    }

    /**
     * Returns the mutation probability.
     * @returns probability to apply mutation
     */
    getMutationProbablity(): number {
        return this._mutationProbablity;
    }

    /**
     * Returns the number of mutations on the same chromosome at start.
     * @returns the number of mutations (start)
     */
    getMaxMutationCountStart(): number {
        return this._maxMutationCountStart;
    }

    /**
     * Returns the number of mutations on the same chromosome in the focused phase.
     * @returns the number of mutations (focused phase)
     */
    getMaxMutationCountFocusedPhase(): number {
        return this._maxMutationCountFocusedPhase;
    }

    /**
     * Returns the stopping condition that is specified for the search algorithm.
     * @returns the specified stopping condition
     */
    getStoppingCondition(): StoppingCondition<C> {
        return this._stoppingCondition;
    }

    /**
     * Returns the probability for sampling a random chromosome at start.
     * @returns the probability for sampling a random chromosome (start)
     */
    getSelectionProbabilityStart(): number {
        return this._selectionProbabilityStart;
    }

    /**
     * Returns the probability for sampling a random chromosome in the focused phase.
     * @returns the probability for sampling a random chromosome (focused phase)
     */
    getSelectionProbabilityFocusedPhase(): number {
        return this._selectionProbabilityFocusedPhase;
    }

    /**
     * Returns the maximum number of chromosomes stored for a fitness function at start.
     * @returns the maximum number of chromosomes for a fitness function (start)
     */
    getMaxArchiveSizeStart(): number {
        return this._maxArchiveSizeStart;
    }

    /**
     * Returns the maximum number of chromosomes stored for a fitness function in the focused phase.
     * @returns the maximum number of chromosomes for a fitness function (focused phase)
     */
    getMaxArchiveSizeFocusedPhase(): number {
        return this._maxArchiveSizeFocusedPhase;
    }

    /**
     * Returns the percentage of iterations.
     * @returns the percentage of iterations
     */
    getStartOfFocusedPhase(): number {
        return this._startOfFocusedPhase;
    }

    /**
     * Returns the minimum of range.
     * @returns the minimum of the range
     */
    getMinIntRange(): number {
        return this._minRange;
    }

    /**
     * Returns the maximum of range.
     * @returns the maximum of the range
     */
    getMaxIntRange(): number {
        return this._maxRange;
    }

    /**
     * Returns the used TestGenerator
     * @returns the used TestGenerator as string
     */
    getTestGenerator(): string {
        return this._testGenerator;
    }

    /**
     * Sets the size of the population to the specified number.
     * @param populationSize the new population size
     */
    setPopulationSize(populationSize: number): void {
        this._populationSize = populationSize;
    }

    /**
     * Sets the length of the chromosomes to the specified size.
     * @param chromosomeLength the length of the chromosomes
     */
    setChromosomeLength(chromosomeLength: number): void {
        this._chromosomeLength = chromosomeLength;
    }

    /**
     * Sets the probability for crossover to the specified number.
     * @param crossoverProbability the new crossover probability
     */
    setCrossoverProbability(crossoverProbability: number): void {
        this._crossoverProbability = crossoverProbability;
    }

    /**
     * Sets the probability for mutation to the specified number.
     * @param mutationProbablity the new mutation probability
     */
    setMutationProbablity(mutationProbablity: number): void {
        this._mutationProbablity = mutationProbablity;
    }

    /**
     * Sets the number of mutations on the same chromosome.
     * @param maxMutationCountStart the number of mutations (start)
     * @param maxMutationCountFocusedPhase the number of mutations (focused phase)
     */
    setMaxMutationCounter(maxMutationCountStart: number, maxMutationCountFocusedPhase: number): void {
        this._maxMutationCountStart = maxMutationCountStart;
        this._maxMutationCountFocusedPhase = maxMutationCountFocusedPhase;
    }

    /**
     * Sets the stopping condition to the given condition.
     * @param stoppingCondition the stopping condition
     */
    setStoppingCondition(stoppingCondition: StoppingCondition<C>): void {
        this._stoppingCondition = stoppingCondition;
    }

    /**
     * Sets the probability for sampling a random chromosome.
     * @param selectionProbabilityStart the probability for sampling (start)
     * @param selectionProbabilityFocusedPhase the probability for sampling (focused phase)
     */
    setSelectionProbabilities(selectionProbabilityStart: number, selectionProbabilityFocusedPhase: number): void {
        this._selectionProbabilityStart = selectionProbabilityStart;
        this._selectionProbabilityFocusedPhase = selectionProbabilityFocusedPhase;
    }

    /**
     * Sets the maximum number of chromosomes stored for a fitness function at start.
     * @param maxArchiveSizeStart the max. number of chromosomes for a fitness function (start)
     * @param maxArchiveSizeFocusedPhase the max. number of chromosomes for a fitness function (focused phase)
     */
    setMaxArchiveSizes(maxArchiveSizeStart: number, maxArchiveSizeFocusedPhase: number): void {
        this._maxArchiveSizeStart = maxArchiveSizeStart;
        this._maxArchiveSizeFocusedPhase = maxArchiveSizeFocusedPhase;
    }

    /**
     * Sets the percentage of iterations.
     * @param startOfFocusedPhase The percentage of iterations as decimal value after which the
     *          focused search starts.
     */
    setStartOfFocusedPhase(startOfFocusedPhase: number): void {
        this._startOfFocusedPhase = startOfFocusedPhase;
    }

    /**
     * Sets the minimum and maximum number of the integer range.
     * @param min the minimum of the range
     * @param max the maximum of the range
     */
    setIntRange(min: number, max: number): void {
        this._minRange = min;
        this._maxRange = max;
    }

    /**
     * Sets the used TestGenerator
     * @param generator the used TestGenerator as string
     */
    setTestGenerator(generator: string): void {
        this._testGenerator = generator;
    }
}
