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
 * Stores all relevant properties of a search algorithm.
 *
 * @author Sophia Geserer
 */
export type SearchAlgorithmProperties<C extends Chromosome> =
    | RandomSearchProperties<C>
    | MIOProperties<C>
    | OnePlusOneProperties<C>
    | GeneticAlgorithmProperties<C>
    ;

type TestGenerator =
    | "random"
    | "iterative"
    | "manyObjective"
    | "neuroevolution"
    ;

/**
 * Properties common to all search algorithms.
 */
interface CommonProperties<C extends Chromosome> {

    /**
     * Defines the used TestGenerator approach
     */
    testGenerator: TestGenerator

    /**
     * The stopping condition for the corresponding search algorithm.
     */
    stoppingCondition: StoppingCondition<C>;
}

/**
 * Properties that all algorithms expect Random Search have in common.
 */
interface AdditionalProperties<C extends Chromosome> extends CommonProperties<C> {

    /**
     * The length of a chromosome.
     */
    chromosomeLength: number;

    /**
     * The allowed integer range.
     */
    integerRange: IntegerRange;

    /**
     * The number of codons that are reserved for each event-codon (event-codon + overapproximation of required
     * parameter codons).
     */
    reservedCodons: number;
}

/**
 * Properties for Random Search.
 */
export type RandomSearchProperties<C extends Chromosome> = CommonProperties<C>;

/**
 * Properties for MIO.
 */
export interface MIOProperties<C extends Chromosome> extends AdditionalProperties<C> {

    /**
     * The number of mutations on the same chromosome at different phases of the search.
     */
    maxMutationCount: MaxMutationCount;

    /**
     * The probability for sampling a random chromosome at different phases of the search
     */
    selectionProbability: SelectionProbability;

    /**
     * Defines the percentage of depleted search resources after which MIO's focus phase starts.
     */
    startOfFocusedPhase: number;

    /**
     * The maximum number of chromosomes stored for a fitness function at different phases of the search.
     */
    maxArchiveSize: MaxArchiveSize;
}

/**
 * Properties for (1+1)EA.
 */
export interface OnePlusOneProperties<C extends Chromosome> extends AdditionalProperties<C> {

    /**
     * The probability to apply mutation to a chromosome.
     */
    mutationProbability: number;
}

/**
 * Properties for most genetic search algorithms. Note that some search algorithms define the own, specific properties,
 * such as MIO, Random Search and (1+1)EA.
 */
export interface GeneticAlgorithmProperties<C extends Chromosome> extends AdditionalProperties<C> {

    /**
     * The size of the population that will be initially generated.
     */
    populationSize: number;

    /**
     * The probability to apply mutation to a chromosome.
     */
    mutationProbability: number;

    /**
     * The probability for applying crossover to chromosomes.
     */
    crossoverProbability: number;
}

export interface SelectionProbability {

    /**
     * The probability for sampling a random chromosome at start.
     */
    start: number;

    /**
     * The probability for sampling a random chromosome in the focused phase.
     */
    focusedPhase: number;
}

export interface IntegerRange {

    /**
     * The minimum of the range.
     */
    min: number;

    /**
     * The maximum of the range.
     */
    max: number;
}

export interface MaxArchiveSize {

    /**
     * The maximum number of chromosomes stored for a fitness function at start.
     */
    start: number;

    /**
     * The maximum number of chromosomes stored for a fitness function in the focused phase.
     */
    focusedPhase: number;
}

export interface MaxMutationCount {

    /**
     * The number of mutations on the same chromosome at start.
     */
    start: number;

    /**
     * The number of mutations on the same chromosome in the focused phase.
     */
    focusedPhase: number;
}
