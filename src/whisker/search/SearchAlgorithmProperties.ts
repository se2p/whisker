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

import { StoppingCondition } from "./StoppingCondition";
import {Chromosome} from "./Chromosome";

/**
 * This class stores all relevant properties from a search algorithm.
 *
 * TODO: not complete yet
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
     * Constructs an object that stores all relevant properties of a search algorithm.
     * @param populationSize the size of the population
     * @param crossoverProbability the probability for crossover
     * @param mutationProbability the probability for mutation
     */
    constructor(populationSize: number, crossoverProbability: number, mutationProbability: number) {
        this._populationSize = populationSize;
        this._crossoverProbability = crossoverProbability;
        this._mutationProbablity = mutationProbability;
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

}
