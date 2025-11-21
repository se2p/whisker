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

import {GeneticAlgorithmProperties} from '../SearchAlgorithmProperties';
import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {FitnessFunction} from "../FitnessFunction";
import {Randomness} from "../../utils/Randomness";
import {Selection} from "../Selection";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {LocalSearch} from "../operators/LocalSearch/LocalSearch";
import Arrays from "../../utils/Arrays";
import logger from '../../../util/logger';
import {Chromosome} from "../Chromosome";

/**
 * The Many-Objective Sorting Algorithm (MOSA).
 *
 * @param <C> The chromosome type.
 * @author Adina Deiner
 */
export class MOSA<C extends Chromosome> extends SearchAlgorithmDefault<C> {

    /**
     * Defines SearchParameters set within the config file.
     */
    protected override _properties: GeneticAlgorithmProperties<C>;

    /**
     * Defines the selection operator used by this MOSA instance.
     */
    private _selectionOperator: Selection<C>;

    /**
     * List containing all LocalSearchOperators defined via the config file.
     */
    private _localSearchOperators: LocalSearch<C>[] = []

    /**
     * Stores all keys of objectives that still have to be optimised.
     */
    private _nonOptimisedObjectives: number[]

    /**
     * Random number Generator.
     */
    private readonly _random = Randomness.getInstance();

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setProperties(properties: GeneticAlgorithmProperties<C>): void {
        this._properties = properties;
        this._stoppingCondition = this._properties.stoppingCondition;
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void {
        this._fitnessFunctions = fitnessFunctions;
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessFunctions.size;
    }

    setSelectionOperator(selectionOperator: Selection<C>): void {
        this._selectionOperator = selectionOperator;
    }

    setLocalSearchOperators(localSearchOperators: LocalSearch<C>[]): void {
        this._localSearchOperators = localSearchOperators;
        for (const localSearchOperator of localSearchOperators) {
            localSearchOperator.setAlgorithm(this);
        }
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getCurrentSolution(): C[] {
        return this._bestIndividuals;
    }

    getFitnessFunctions(): Iterable<FitnessFunction<C>> {
        return this._fitnessFunctions.values();
    }

    private async _generateInitialPopulation(): Promise<C[]> {
        const population: C[] = [];
        for (let i = 0; i < this._properties.populationSize; i++) {
            if (await this._stoppingCondition.isFinished(this)) {
                break;
            }
            population.push(await this._chromosomeGenerator.get());
        }
        return population;
    }


    /**
     * Returns a list of solutions for the given problem.
     *
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<Map<number, C>> {
        Arrays.clear(this._bestIndividuals);
        this._archive.clear();
        this._iterations = 0;
        this._startTime = Date.now();
        StatisticsCollector.getInstance().iterationCount = 0;
        StatisticsCollector.getInstance().startTime = Date.now();
        const parentPopulation = await this._generateInitialPopulation();
        await this.evaluatePopulation(parentPopulation);
        this._nonOptimisedObjectives = [...this._fitnessFunctions.keys()].filter(key => !this._archive.has(key));
        await this._applyLocalSearch(parentPopulation);


        if (await this._stoppingCondition.isFinished(this)) {
            this.updateStatistics();
        }
        while (!(await this._stoppingCondition.isFinished(this))) {
            logger.debug(`Iteration ${this._iterations}: covered objectives:  ${this._archive.size}/${this._fitnessFunctions.size}`);
            const offspringPopulation = await this._generateOffspringPopulation(parentPopulation, this._iterations > 0);
            await this.evaluatePopulation(offspringPopulation);
            this._nonOptimisedObjectives = [...this._fitnessFunctions.keys()].filter(key => !this._archive.has(key));
            const chromosomes = [...parentPopulation, ...offspringPopulation];

            const objectives = new Map([...this._fitnessFunctions.entries()]
                .filter(([key]) => !this._archive.has(key)));
            const fronts = await preferenceSorting(chromosomes, this._properties.populationSize,
                objectives, this._compareChromosomes);

            Arrays.clear(parentPopulation);
            for (const front of fronts) {
                await this._subVectorDominanceSorting(front);
                if (parentPopulation.length + front.length <= this._properties.populationSize) {
                    parentPopulation.push(...front);
                } else {
                    parentPopulation.push(...front.slice(0, (this._properties.populationSize - parentPopulation.length)));
                    break;
                }
            }
            parentPopulation.reverse(); // reverse order from descending to ascending by quality for rank selection
            await this._applyLocalSearch(parentPopulation);
            this._iterations++;
            this.updateStatistics();
        }

        // TODO: This should probably be printed somewhere outside the algorithm, in the TestGenerator
        for (const uncoveredKey of this._nonOptimisedObjectives) {
            logger.debug(`Not covered: ${this._fitnessFunctions.get(uncoveredKey).toString()}`);
        }
        return this._archive;
    }

    /**
     * Applies the specified LocalSearch operators to the given population.
     * @param population The population to which LocalSearch should be applied to.
     */
    private async _applyLocalSearch(population: C[]) {
        // Go through the best performing chromosomes of the population.
        for (const chromosome of population) {
            // Go through each localSearch operator
            for (const localSearch of this._localSearchOperators) {
                // Check if the given localSearchOperator is applicable to the chosen chromosome
                if (await localSearch.isApplicable(chromosome) && !await this._stoppingCondition.isFinished(this) &&
                    this._random.nextDouble() < localSearch.getProbability()) {
                    const modifiedChromosome = await localSearch.apply(chromosome);
                    // If local search improved the original chromosome, replace it.
                    if (localSearch.hasImproved(chromosome, modifiedChromosome)) {
                        Arrays.replace(population, chromosome, modifiedChromosome);
                        await this.updateArchive(modifiedChromosome);
                        this.updateStatistics();
                    }
                }
            }
        }
    }

    /**
     * Generates an offspring population by evolving the parent population using selection,
     * crossover and mutation.
     *
     * @param parentPopulation The population to use for the evolution.
     * @param useRankSelection Whether to use rank selection for selecting the parents.
     * @returns The offspring population.
     */
    private async _generateOffspringPopulation(parentPopulation: C[], useRankSelection: boolean): Promise<C[]> {
        const offspringPopulation = [];
        while (offspringPopulation.length < parentPopulation.length) {
            const parent1 = await this._selectChromosome(parentPopulation, useRankSelection);
            // TODO: Does it affect the search that we may pick the same parent twice?
            const parent2 = await this._selectChromosome(parentPopulation, useRankSelection);
            let child1: C;
            let child2: C;
            if (this._random.nextDouble() < this._properties.crossoverProbability) {
                [child1, child2] = await parent1.crossover(parent2);
            } else {
                [child1, child2] = [parent1.clone() as C, parent2.clone() as C];
            }
            if (this._random.nextDouble() < this._properties.mutationProbability) {
                child1 = await child1.mutate();
            }
            if (this._random.nextDouble() < this._properties.mutationProbability) {
                child2 = await child2.mutate();
            }

            // If no mutation/crossover was applied clone the parents
            if (!child1) {
                child1 = parent1.clone() as C;
            }
            if (!child2) {
                child2 = parent2.clone() as C;
            }

            offspringPopulation.push(child1);
            if (offspringPopulation.length < parentPopulation.length) {
                offspringPopulation.push(child2);
            }
        }
        return offspringPopulation;
    }

    /**
     * Selects a chromosome from a population using rank or random selection.
     *
     * @param population The population to select from.
     * @param useRankSelection Whether to use rank selection.
     * @returns The selected chromosome.
     */
    private async _selectChromosome(population: C[], useRankSelection: boolean): Promise<C> {
        if (useRankSelection) {
            return await this._selectionOperator.apply(population);
        } else {
            const randomIndex = this._random.nextInt(0, population.length);
            return population[randomIndex];
        }
    }

    /**
     * Sorts the front in descending order according to sub vector dominance.
     *
     * @param front The front to sort.
     */
    private async _subVectorDominanceSorting(front: C[]): Promise<void> {
        const distances = new Map<C, number>();
        for (const chromosome1 of front) {
            distances.set(chromosome1, 0);
            for (const chromosome2 of front) {
                if (chromosome1 !== chromosome2) {
                    const svd = await this._calculateSVD(chromosome1, chromosome2);
                    if (distances.get(chromosome1) < svd) {
                        distances.set(chromosome1, svd);
                    }
                }
            }
        }
        // sort in ascending order by distance, small distances are better -> the first is the best
        front.sort((c1: C, c2: C) => distances.get(c1) - distances.get(c2));
    }

    /**
     * Counts how often the fitness values of chromosome2 are better than the corresponding
     * fitness values of chromosome1.
     *
     * @param chromosome1 The first chromosome for the svd calculation.
     * @param chromosome2 The second chromosome for the svd calculation.
     * @return In how many objectives chromosome2 is better than chromosome1.
     */
    private async _calculateSVD(chromosome1: C, chromosome2: C): Promise<number> {
        let svd = 0;
        for (const fitnessFunction of this._fitnessFunctions.values()) {
            const fitness1 = await chromosome1.getFitness(fitnessFunction);
            const fitness2 = await chromosome2.getFitness(fitnessFunction);
            const compareValue = fitnessFunction.compare(fitness1, fitness2);
            if (compareValue < 0) { // chromosome2 is better
                svd++;
            }
        }
        return svd;
    }

    getStartTime(): number {
        return this._startTime;
    }

    /**
     * Updates the StatisticsCollector on the following points:
     *  - number of iterations
     *  - bestTestSuiteSize
     *  - createdTestsToReachFullCoverage
     *  - timeToReachFullCoverage
     *  - coverage over time timeline
     */
    protected override updateStatistics(): void {
        StatisticsCollector.getInstance().incrementIterationCount();
        StatisticsCollector.getInstance().bestTestSuiteSize = this._bestIndividuals.length;
        if (this._archive.size == this._fitnessFunctions.size && !this._fullCoverageReached) {
            this._fullCoverageReached = true;
            StatisticsCollector.getInstance().createdTestsToReachFullCoverage =
                (this._iterations + 1) * this._properties.populationSize;
            StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
        }
        this.updateCoverageTimeLine();
    }

    setFitnessFunction(): void {
        throw new Error('Method not implemented.');
    }

    /**
     * Compares the given chromosomes based on their fitness towards a coverage objective.
     * If both chromosomes achieve the same fitness, their length is used as a secondary criterion.
     * @param chromosome1 The first chromosome to be compared.
     * @param chromosome2 The second chromosome to be compared.
     * @param objective The coverage objective based on which the chromosomes will be compared.
     * @returns a positive value if the first chromosome is better,
     * a negative value if the second chromosome is better, and 0 if they are equal.
     */
    private async _compareChromosomes(chromosome1: Chromosome, chromosome2: Chromosome,
                                      objective: FitnessFunction<Chromosome>): Promise<number> {
        const fitness1 = await chromosome1.getFitness(objective);
        const fitness2 = await chromosome2.getFitness(objective);
        const compareValue = objective.compare(fitness1, fitness2);
        if (compareValue != 0) {
            return compareValue;
        }
        return chromosome1.getLength() - chromosome2.getLength();
    }
}

/**
 * Comparator for chromosomes.
 * @param c1 The first chromosome to compare.
 * @param c2 The second chromosome to compare.
 * @param objective The objective to compare the chromosomes by.
 * @returns a positive value if the first chromosome is better, a negative value if the second chromosome is better,
 * and 0 if they are equal.
 */
export type ChromosomeComparator = (
    c1: Chromosome,
    c2: Chromosome,
    objective: FitnessFunction<Chromosome>) => Promise<number>;

/**
 * Performs the preference sorting of the chromosomes.
 *
 * @param chromosomes The chromosomes to sort.
 * @param populationSize The total size of the algorithm's population.
 * @param objectives The objectives representing the domination criterion.
 * @param comparator Compares two chromosomes (+ -> first chromosome is better, - -> second chromosome is better).
 * @returns The resulting fronts.
 */
export const preferenceSorting = async <C extends Chromosome>(
    chromosomes: C[], populationSize: number,
    objectives: Map<number, FitnessFunction<C>>,
    comparator: ChromosomeComparator): Promise<C[][]> => {
    const fronts: C[][] = [];
    const bestFront: C[] = [];
    const chromosomesForNonDominatedSorting = [...chromosomes];
    for (const [key, objective] of objectives.entries()) {
        let bestChromosome = chromosomes[0];
        let bestFitness = await bestChromosome.getFitness(objective, key);
        for (const candidateChromosome of chromosomes.slice(1)) {
            const candidateFitness = await candidateChromosome.getFitness(objective, key);
            if (await comparator(candidateChromosome, bestChromosome, objective) > 0) {
                bestChromosome = candidateChromosome;
                bestFitness = candidateFitness;
            }
        }
        logger.debug(`Best Fitness for ${objective.toString()}: ${bestFitness}`);
        if (!bestFront.includes(bestChromosome)) {
            bestFront.push(bestChromosome);
            Arrays.remove(chromosomesForNonDominatedSorting, bestChromosome);
        }
    }
    if (bestFront.length > 0) {
        fronts.push(bestFront);
    }
    if (bestFront.length > populationSize) {
        fronts.push(chromosomesForNonDominatedSorting);
    } else {
        const remainingFronts = await fastNonDomSort(
            chromosomesForNonDominatedSorting, [...objectives.values()], comparator);
        fronts.push(...remainingFronts);
    }
    return fronts;
};

/**
 * Performs the fast non dominated sorting of the chromosomes.
 *
 * @param chromosomes The chromosomes to sort.
 * @param objectives The objectives representing the domination criterion.
 * @param comparator Compares two chromosomes (+ -> first chromosome is better, - -> second chromosome is better).
 * @returns The resulting fronts.
 */
export const fastNonDomSort = async <C extends Chromosome>(
    chromosomes: C[],
    objectives: FitnessFunction<C>[],
    comparator: ChromosomeComparator): Promise<C[][]> => {
    const fronts = [];
    const dominatedValues = new Map<C, C[]>();
    const dominationCount = new Map<C, number>();
    const firstFront = [];
    for (const p of chromosomes) {
        const dominatedValuesP: C[] = [];
        let dominationCountP = 0;
        for (const q of chromosomes) {
            if (p === q) {
                continue;
            }
            if (await dominates(p, q, objectives, comparator)) {
                dominatedValuesP.push(q);
            } else if (await dominates(q, p, objectives, comparator)) {
                dominationCountP++;
            }
        }
        if (dominationCountP == 0) {
            firstFront.push(p);
        }
        dominatedValues.set(p, dominatedValuesP);
        dominationCount.set(p, dominationCountP);
    }
    let currentFront = firstFront;
    while (currentFront.length > 0) {
        fronts.push(currentFront);
        const nextFront: C[] = [];
        for (const p of currentFront) {
            for (const q of dominatedValues.get(p)) {
                const dominationCountQ = dominationCount.get(q) - 1;
                dominationCount.set(q, dominationCountQ);
                if (dominationCountQ == 0) {
                    nextFront.push(q);
                }
            }
        }
        currentFront = nextFront;
    }
    return fronts;
};

/**
 * Determines whether the first chromosome dominates the second chromosome.
 *
 * @param chromosome1 The first chromosome to compare.
 * @param chromosome2 The second chromosome to compare.
 * @param objectives The objectives representing the domination criterion.
 * @param comparator Compares two chromosomes (+ -> first chromosome is better, - -> second chromosome is better).
 * @return True if the first chromosome dominates the second chromosome, false otherwise.
 */
export const dominates = async <C extends Chromosome>(
    chromosome1: C, chromosome2: C,
    objectives: FitnessFunction<C>[],
    comparator: ChromosomeComparator): Promise<boolean> => {
    let dominatesAtLeastOnce = false;
    for (const objective of objectives) {
        const compareValue = await comparator(chromosome1, chromosome2, objective);
        if (compareValue < 0) {
            return false;
        } else if (compareValue > 0) {
            dominatesAtLeastOnce = true;
        }
    }
    return dominatesAtLeastOnce;
};
