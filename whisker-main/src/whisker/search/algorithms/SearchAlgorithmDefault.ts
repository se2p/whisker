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

import {Chromosome} from "../Chromosome";
import {SearchAlgorithmProperties} from "../SearchAlgorithmProperties";
import {ChromosomeGenerator} from "../ChromosomeGenerator";
import {FitnessFunction} from "../FitnessFunction";
import {Selection} from "../Selection";
import {SearchAlgorithm} from "../SearchAlgorithm";
import {NotSupportedFunctionException} from "../../core/exceptions/NotSupportedFunctionException";
import {LocalSearch} from "../operators/LocalSearch/LocalSearch";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {StoppingCondition} from "../StoppingCondition";
import {TestChromosome} from "../../testcase/TestChromosome";
import Arrays from "../../utils/Arrays";

/**
 * Represents a strategy to search for an approximated solution to a given problem.
 *
 * @param <C> the solution encoding of the problem
 * @author Sophia Geserer
 */
export abstract class SearchAlgorithmDefault<C extends Chromosome> implements SearchAlgorithm<C> {

    /**
     * Defines SearchParameters set within the config file.
     */
    protected _properties: SearchAlgorithmProperties<C>;

    /**
     * Generator responsible for generating initial Chromosome.
     */
    protected _chromosomeGenerator: ChromosomeGenerator<C>;

    /**
     * Defines the stopping condition of the SearchAlgorithm.
     */
    protected _stoppingCondition: StoppingCondition<C>;

    /**
     * Archive mapping to each fitnessFunction the Chromosome solving it.
     */
    protected _archive = new Map<number, C>();

    /**
     * List of best performing Chromosomes.
     */
    protected _bestIndividuals: C[] = [];

    /**
     * FitnessFunction the concrete SearchAlgorithm is optimizing for.
     */
    protected _fitnessFunction: FitnessFunction<C>;

    /**
     * Maps each FitnessFunction to a unique identifier.
     */
    protected _fitnessFunctions: Map<number, FitnessFunction<C>>;

    /**
     * Boolean determining if we have reached full test coverage.
     */
    protected _fullCoverageReached = false;

    /**
     * Saves the number of generations.
     */
    protected _iterations = 0;

    /**
     * Starting time of the algorithm.
     */
    protected _startTime: number;

    async findSolution(): Promise<Map<number, C>> {
        throw new NotSupportedFunctionException();
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        throw new NotSupportedFunctionException();
    }

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        throw new NotSupportedFunctionException();
    }

    setFitnessFunction(fitnessFunction: FitnessFunction<C>): void {
        throw new NotSupportedFunctionException();
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void {
        throw new NotSupportedFunctionException();
    }

    setHeuristicFunctions(heuristicFunctions: Map<number, (number) => number>): void {
        throw new NotSupportedFunctionException();
    }

    setSelectionOperator(selectionOperator: Selection<C>): void {
        throw new NotSupportedFunctionException();
    }

    setLocalSearchOperators(localSearchOperators: LocalSearch<C>[]): void {
        throw new NotSupportedFunctionException();
    }

    getNumberOfIterations(): number {
        throw new NotSupportedFunctionException();
    }

    getCurrentSolution(): C[] {
        throw new NotSupportedFunctionException();
    }

    getFitnessFunctions(): Iterable<FitnessFunction<C>> {
        throw new NotSupportedFunctionException();
    }

    getStartTime(): number {
        throw new NotSupportedFunctionException();
    }

    /**
     * Evaluates the current Population of Chromosomes and stops as soon as we have reached a stopping criterion.
     * @param population the population to evaluate.
     */
    protected async evaluatePopulation(population: C[]): Promise<void> {
        for (const chromosome of population) {
            // Check if we have already reached our stopping condition; if so stop and exclude non-executed chromosomes
            if (this._stoppingCondition.isFinished(this)) {
                const executedChromosomes = population.filter(chromosome => (chromosome as unknown as TestChromosome).trace);
                Arrays.clear(population);
                population.push(...executedChromosomes);
                return;
            } else {
                await chromosome.evaluate();
                this.updateArchive(chromosome);
            }
        }
    }

    /**
     * Updates the archive of best chromosomes.
     *
     * @param candidateChromosome The candidate chromosome for the archive.
     */
    protected updateArchive(candidateChromosome: C): void {
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
            let bestLength = this._archive.has(fitnessFunctionKey)
                ? this._archive.get(fitnessFunctionKey).getLength()
                : Number.MAX_SAFE_INTEGER;
            const candidateFitness = candidateChromosome.getFitness(fitnessFunction);
            const candidateLength = candidateChromosome.getLength();
            if (fitnessFunction.isOptimal(candidateFitness) && candidateLength < bestLength) {
                bestLength = candidateLength;
                if (!this._archive.has(fitnessFunctionKey)) {
                    StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount(fitnessFunction);
                }
                this._archive.set(fitnessFunctionKey, candidateChromosome);
            }
        }
        this._bestIndividuals = Arrays.distinct(this._archive.values());
    }

    /**
     * Updates the StatisticsCollector on the following points:
     *  - bestTestSuiteSize
     *  - iterationCount
     *  - createdTestsToReachFullCoverage
     *  - timeToReachFullCoverage
     */
    protected updateStatistics(): void {
        StatisticsCollector.getInstance().bestTestSuiteSize = this._bestIndividuals.length;
        StatisticsCollector.getInstance().incrementIterationCount();
        if (this._archive.size == this._fitnessFunctions.size && !this._fullCoverageReached) {
            this._fullCoverageReached = true;
            StatisticsCollector.getInstance().createdTestsToReachFullCoverage =
                (this._iterations + 1) * this._properties['populationSize']; // FIXME: unsafe access
            StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
        }
    }
}
