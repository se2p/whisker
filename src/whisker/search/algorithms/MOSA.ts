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
 * along with Whisker. ßIf not, see http://www.gnu.org/licenses/.
 *
 */

import {Chromosome} from '../Chromosome';
import {List} from '../../utils/List';
import {SearchAlgorithmProperties} from '../SearchAlgorithmProperties';
import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {FitnessFunction} from "../FitnessFunction";
import {StoppingCondition} from "../StoppingCondition";
import {PopulationFactory} from '../PopulationFactory';
import {Randomness} from "../../utils/Randomness";
import {Selection} from "../Selection";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {StatisticsCollector} from "../../utils/StatisticsCollector";

/**
 * The Many-Objective Sorting Algorithm (MOSA).
 *
 * @param <C> The chromosome type.
 * @author Adina Deiner
 */
export class MOSA<C extends Chromosome> extends SearchAlgorithmDefault<C> {

    private _chromosomeGenerator: ChromosomeGenerator<C>;

    private _properties: SearchAlgorithmProperties<C>;

    private _fitnessFunctions: Map<number, FitnessFunction<C>>;

    private _stoppingCondition: StoppingCondition<C>;

    private _iterations = 0;

    private _bestIndividuals = new List<C>();

    private _archive = new Map<number, C>();

    private _selectionOperator: Selection<C>;

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        this._properties = properties;
        this._stoppingCondition = this._properties.getStoppingCondition();
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void {
        this._fitnessFunctions = fitnessFunctions;
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessFunctions.size;
    }

    setSelectionOperator(selectionOperator: Selection<C>): void {
        this._selectionOperator = selectionOperator;
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getCurrentSolution(): List<C> {
        return this._bestIndividuals;
    }

    /**
     * Returns a list of solutions for the given problem.
     *
     * @returns Solution for the given problem
     */
    findSolution(): List<C> {
        this._bestIndividuals.clear();
        this._archive.clear();
        this._iterations = 0;
        StatisticsCollector.getInstance().iterationCount = 0;
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = 0;
        const parentPopulation = PopulationFactory.generate(this._chromosomeGenerator, this._properties.getPopulationSize());
        this.updateArchive(parentPopulation);
        while (!this._stoppingCondition.isFinished(this)) {
            const offspringPopulation = this.generateOffspringPopulation(parentPopulation, this._iterations > 0);
            this.updateArchive(offspringPopulation);
            const chromosomes = new List<C>();
            chromosomes.addList(parentPopulation);
            chromosomes.addList(offspringPopulation);
            const fronts = this.preferenceSorting(chromosomes);
            parentPopulation.clear();
            for (const front of fronts) {
                this.subVectorDominanceSorting(front);
                if (parentPopulation.size() + front.size() <= this._properties.getPopulationSize()) {
                    parentPopulation.addList(front);
                } else {
                    parentPopulation.addList(front.subList(0, (this._properties.getPopulationSize() - parentPopulation.size())));
                    break;
                }
            }
            this.updateArchive(parentPopulation);
            parentPopulation.reverse(); // reverse order from descending to ascending by quality for rank selection
            this._bestIndividuals = new List<C>(Array.from(this._archive.values())).distinct();
            this._iterations++;
            StatisticsCollector.getInstance().bestTestSuiteSize = this._bestIndividuals.size();
            StatisticsCollector.getInstance().incrementIterationCount();
        }
        return this._bestIndividuals;
    }

    /**
     * Generates an offspring population by evolving the parent population using selection,
     * crossover and mutation.
     *
     * @param parentPopulation The population to use for the evolution.
     * @param useRankSelection Whether to use rank selection for selecting the parents.
     * @returns The offspring population.
     */
    private generateOffspringPopulation(parentPopulation: List<C>, useRankSelection: boolean): List<C> {
        const offspringPopulation = new List<C>();
        while (offspringPopulation.size() < parentPopulation.size()) {
            const parent1 = this.selectChromosome(parentPopulation, useRankSelection);
            const parent2 = this.selectChromosome(parentPopulation, useRankSelection);

            let child1 = parent1;
            let child2 = parent2;
            if (Randomness.getInstance().nextDouble() < this._properties.getCrossoverProbability()) {
                const crossover = parent1.crossover(parent2);
                child1 = crossover.getFirst();
                child2 = crossover.getSecond();
            }
            if (Randomness.getInstance().nextDouble() < this._properties.getMutationProbablity()) {
                child1 = child1.mutate();
            }
            if (Randomness.getInstance().nextDouble() < this._properties.getMutationProbablity()) {
                child2 = child2.mutate();
            }
            offspringPopulation.add(child1);
            if (offspringPopulation.size() < parentPopulation.size()) {
                offspringPopulation.add(child2);
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
    private selectChromosome(population: List<C>, useRankSelection: boolean): C {
        if (useRankSelection) {
            return this._selectionOperator.apply(population);
        } else {
            const randomIndex = Randomness.getInstance().nextInt(0, population.size());
            return population.get(randomIndex);
        }
    }

    /**
     * Updates the archive of best chromosomes.
     *
     * @param chromosomes The candidate chromosomes for the archive.
     */
    private updateArchive(chromosomes: List<C>): void {
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
            let bestLength = this._archive.has(fitnessFunctionKey)
                ? this._archive.get(fitnessFunctionKey).getLength()
                : Number.MAX_SAFE_INTEGER;
            for (const candidateChromosome of chromosomes) {
                const candidateFitness = fitnessFunction.getFitness(candidateChromosome);
                const candidateLength = candidateChromosome.getLength();
                if (fitnessFunction.isOptimal(candidateFitness) && candidateLength < bestLength) {
                    bestLength = candidateLength;
                    if (!this._archive.has(fitnessFunctionKey)) {
                        StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount();
                    }
                    this._archive.set(fitnessFunctionKey, candidateChromosome);
                }
            }
        }
    }

    /**
     * Performs the preference sorting of the chromosomes.
     *
     * @param chromosomes The chromosomes to sort.
     * @returns The resulting fronts.
     */
    private preferenceSorting(chromosomes: List<C>): List<List<C>> {
        const fronts = new List<List<C>>();
        const bestFront = new List<C>();
        const chromosomesForNonDominatedSorting = chromosomes.clone();
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            if (!this._archive.has(fitnessFunctionKey)) {
                const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
                let bestChromosome = chromosomes.get(0);
                let bestFitness = fitnessFunction.getFitness(bestChromosome);
                for (const candidateChromosome of chromosomes.subList(1, chromosomes.size())) {
                    const candidateFitness = fitnessFunction.getFitness(candidateChromosome);
                    const compareValue = fitnessFunction.compare(candidateFitness, bestFitness);
                    if (compareValue > 0 || (compareValue == 0
                        && candidateChromosome.getLength() < bestChromosome.getLength())) {
                        bestChromosome = candidateChromosome;
                        bestFitness = candidateFitness;
                    }
                }
                if (!bestFront.contains(bestChromosome)) {
                    bestFront.add(bestChromosome);
                    chromosomesForNonDominatedSorting.remove(bestChromosome);
                }
            }
        }
        if (bestFront.size() > 0) {
            fronts.add(bestFront);
        }
        if (bestFront.size() > this._properties.getPopulationSize()) {
            fronts.add(chromosomesForNonDominatedSorting);
        } else {
            fronts.addList(this.fastNonDominatedSorting(chromosomesForNonDominatedSorting));
        }
        return fronts;
    }

    /**
     * Performs the fast non dominated sorting of the chromosomes.
     *
     * @param chromosomes The chromosomes to sort.
     * @returns The resulting fronts.
     */
    private fastNonDominatedSorting(chromosomes: List<C>): List<List<C>> {
        const fronts = new List<List<C>>();
        const dominatedValues = new Map<C, List<C>>();
        const dominationCount = new Map<C, number>();
        const firstFront = new List<C>();
        for (const p of chromosomes) {
            const dominatedValuesP = new List<C>();
            let dominationCountP = 0;
            for (const q of chromosomes) {
                if (this.dominates(p, q)) {
                    dominatedValuesP.add(q);
                } else if (this.dominates(q, p)) {
                    dominationCountP++;
                }
            }
            if (dominationCountP == 0) {
                firstFront.add(p);
            }
            dominatedValues.set(p, dominatedValuesP);
            dominationCount.set(p, dominationCountP);
        }
        let currentFront = firstFront;
        while (currentFront.size() > 0) {
            fronts.add(currentFront);
            const nextFront = new List<C>();
            for (const p of currentFront) {
                for (const q of dominatedValues.get(p)) {
                    const dominationCountQ = dominationCount.get(q) - 1;
                    dominationCount.set(q, dominationCountQ);
                    if (dominationCountQ == 0) {
                        nextFront.add(q);
                    }
                }
            }
            currentFront = nextFront;
        }
        return fronts;
    }

    /**
     * Determines whether the first chromosome dominates the second chromosome.
     *
     * @param chromosome1 The first chromosome to compare.
     * @param chromosome2 The second chromosome to compare.
     * @return True if the first chromosome dominates the second chromosome, false otherwise.
     */
    private dominates(chromosome1: C, chromosome2: C): boolean {
        let dominatesAtLeastOnce = false;
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            if (!this._archive.has(fitnessFunctionKey)) {
                const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
                const fitness1 = fitnessFunction.getFitness(chromosome1);
                const fitness2 = fitnessFunction.getFitness(chromosome2)
                const compareValue = fitnessFunction.compare(fitness1, fitness2);
                if (compareValue < 0) {
                    return false;
                } else if (compareValue > 0) {
                    dominatesAtLeastOnce = true;
                }
            }
        }
        return dominatesAtLeastOnce;
    }

    /**
     * Sorts the front in descending order according to sub vector dominance.
     *
     * @param front The front to sort.
     */
    private subVectorDominanceSorting(front: List<C>): void {
        const distances = new Map<C, number>();
        for (const chromosome1 of front) {
            distances.set(chromosome1, 0);
            for (const chromosome2 of front) {
                if (chromosome1 !== chromosome2) {
                    const svd = this.calculateSVD(chromosome1, chromosome2);
                    if (distances.get(chromosome1) < svd) {
                        distances.set(chromosome1, svd);
                    }
                }
            }
        }
        front.shuffle();
        // sort in ascending order by distance, small distances are better -> the first is the best
        front.sort((c1: C, c2: C) => distances.get(c1) - distances.get(c2));
    }

    /**
     * Counts the number of fitness values of chromosome2 that are better than the corresponding
     * fitness values of chromosome1.
     *
     * @param chromosome1 The first chromosome for the svd calculation.
     * @param chromosome2 The second chromosome for the svd calculation.
     * @return The number of superior fitness values of chromosome2 in comparison to chromosome1.
     */
    private calculateSVD(chromosome1: C, chromosome2: C): number {
        let svd = 0;
        for (const fitnessFunction of this._fitnessFunctions.values()) {
            const fitness1 = fitnessFunction.getFitness(chromosome1);
            const fitness2 = fitnessFunction.getFitness(chromosome2);
            const compareValue = fitnessFunction.compare(fitness1, fitness2);
            if (compareValue < 0) { // chromosome2 is better
                svd++;
            }
        }
        return svd;
    }
}
