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
import {SearchAlgorithm} from '../SearchAlgorithm';
import {List} from '../../utils/List';
import {SearchAlgorithmProperties} from '../SearchAlgorithmProperties';
import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {FitnessFunction} from "../FitnessFunction";
import {StoppingCondition} from "../StoppingCondition";
import {Randomness} from "../../utils/Randomness";

/**
 * The Many Independent Objective (MIO) Algorithm.
 *
 * @param <C> The chromosome type.
 * @author Adina Deiner
 */
export class MIO<C extends Chromosome> implements SearchAlgorithm<C> {

    _chromosomeGenerator: ChromosomeGenerator<C>;

    _properties: SearchAlgorithmProperties<C>;

    private _fitnessFunctions: Map<number, FitnessFunction<C>>;

    private _heuristics: Map<number, Function>;

    private _stoppingCondition: StoppingCondition<C>;

    private _iterations: number;

    private _maxIterations: number;

    private _bestIndividuals = new List<C>();

    private _archiveCovered = new Map<number, C>();

    private _archiveUncovered = new Map<number, List<C>>();

    private _startOfFocusedPhase;

    private _randomSelectionProbability: number;

    private _randomSelectionProbabilityStart: number;

    private _randomSelectionProbabilityFocusedPhase: number;

    private _maxArchiveSize: number;

    private _maxArchiveSizeStart: number;

    private _maxArchiveSizeFocusedPhase: number;

    setChromosomeGenerator(generator: ChromosomeGenerator<C>) {
        this._chromosomeGenerator = generator;
    }

    setProperties(properties: SearchAlgorithmProperties<C>) {
        this._properties = properties;
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>) {
        this._fitnessFunctions = fitnessFunctions;
    }

    setHeuristics(heuristics: Map<number, Function>) {
        this._heuristics = heuristics;
    }

    setStoppingCondition(stoppingCondition: StoppingCondition<C>) {
        this._stoppingCondition = stoppingCondition;
    }

    setRandomSelectionProbabilityStart(randomSelectionProbabilityStart: number) {
        this._randomSelectionProbabilityStart = randomSelectionProbabilityStart;
    }

    setRandomSelectionProbabilityFocusedPhase(randomSelectionProbabilityFocusedPhase: number) {
        this._randomSelectionProbabilityFocusedPhase = randomSelectionProbabilityFocusedPhase;
    }

    setMaximumArchiveSizeStart(maxArchiveSizeStart: number) {
        this._maxArchiveSizeStart = maxArchiveSizeStart;
    }

    setMaximumArchiveSizeFocusedPhase(maxArchiveSizeFocusedPhase: number) {
        this._maxArchiveSizeFocusedPhase = maxArchiveSizeFocusedPhase;
    }

    setStartOfFocusedPhase(startOfFocusedPhase: number) {
        this._startOfFocusedPhase = startOfFocusedPhase;
    }

    setMaximumNumberOfIterations(maxIterations: number) {
        this._maxIterations = maxIterations;
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
        this._archiveCovered.clear();
        this._archiveUncovered.clear();
        this._iterations = 0;
        this.updateParameters();
        let chromosome: C;
        while (!this._stoppingCondition.isFinished(this)) {
            chromosome = this.getNextChromosome();
            this.updateArchive(chromosome);
            this._iterations++;
            if (!this.isFocusedPhaseReached()) {
                this.updateParameters();
            }
        }
        return this._bestIndividuals;
    }

    /**
     * Creates a new chromosome by random or by mutating a chromosome from the archive.
     *
     * @returns A new chromosome.
     */
    private getNextChromosome(): C {
        if ((this._archiveUncovered.size == 0 && this._archiveCovered.size == 0)
            || Randomness.getInstance().nextDouble() < this._randomSelectionProbability) {
            return this._chromosomeGenerator.get();
        } else {
            let chromosome: C;
            if (this._archiveUncovered.size > 0) {
                const fitnessFunctions = Array.from(this._archiveUncovered.keys());
                const randomIndex = Randomness.getInstance().nextInt(0, fitnessFunctions.length);
                const selectedFitnessFunction = fitnessFunctions[randomIndex];
                const chromosomes = this._archiveUncovered.get(selectedFitnessFunction);
                const randomChromosomeIndex = Randomness.getInstance().nextInt(0, chromosomes.size());
                chromosome = chromosomes.get(randomChromosomeIndex).mutate();
            } else {
                const fitnessFunctions = Array.from(this._archiveCovered.keys());
                const randomIndex = Randomness.getInstance().nextInt(0, fitnessFunctions.length);
                const selectedFitnessFunction = fitnessFunctions[randomIndex];
                chromosome = this._archiveCovered.get(selectedFitnessFunction).mutate();
            }
            return chromosome;
        }
    }

    /**
     * Updates the archive of best chromosomes.
     *
     * @param chromosome The candidate chromosome for the archive.
     */
    private updateArchive(chromosome: C): void {
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const heuristicValue = this.getHeuristicValue(chromosome, fitnessFunctionKey);
            if (heuristicValue == 1) {
                if (this._archiveCovered.has(fitnessFunctionKey)) {
                    const oldBestChromosome = this._archiveCovered.get(fitnessFunctionKey);
                    if (this.compareChromosomesWithEqualHeuristic(chromosome, oldBestChromosome) > 0) {
                        this.updateBestChromosome(oldBestChromosome, chromosome, fitnessFunctionKey);
                    }
                } else {
                    this.updateBestChromosome(null, chromosome, fitnessFunctionKey);
                    this._archiveUncovered.delete(fitnessFunctionKey);
                }
            } else if (heuristicValue > 0 && !this._archiveCovered.has(fitnessFunctionKey)) {
                let archiveChromosomes: List<C>;
                if (this._archiveUncovered.has(fitnessFunctionKey)) {
                    archiveChromosomes = this._archiveUncovered.get(fitnessFunctionKey);
                } else {
                    archiveChromosomes = new List<C>();
                }
                if (archiveChromosomes.size() < this._maxArchiveSize) {
                    archiveChromosomes.add(chromosome);
                } else {
                    const worstChromosome = this.getWorstChromosome(archiveChromosomes, fitnessFunctionKey);
                    const worstHeuristicValue = this.getHeuristicValue(worstChromosome, fitnessFunctionKey);
                    if (worstHeuristicValue < heuristicValue || (worstHeuristicValue == heuristicValue
                        && this.compareChromosomesWithEqualHeuristic(chromosome, worstChromosome) >= 0)) {
                        archiveChromosomes.remove(worstChromosome);
                        archiveChromosomes.add(chromosome);
                    }
                }
                this._archiveUncovered.set(fitnessFunctionKey, archiveChromosomes);
            }
        }
    }

    /**
     * Updates the best chromosome for a covered fitness function.
     *
     * @param oldBest The old best chromosome.
     * @param newBest The new best chromosome.
     * @param fitnessFunctionKey The key of the fitness function.
     */
    private updateBestChromosome(oldBest, newBest, fitnessFunctionKey) {
        if (oldBest != null) {
            this._bestIndividuals.remove(oldBest);
        }
        this._bestIndividuals.add(newBest);
        this._archiveCovered.set(fitnessFunctionKey, newBest);
    }

    /**
     * Determines the worst chromosome from a list of chromosomes.
     *
     * @param chromosomes The chromosomes to compare
     * @param fitnessFunctionKey The key of the fitness function to use for the comparison.
     * @returns The worst chromosome of the list.
     */
    private getWorstChromosome(chromosomes: List<C>, fitnessFunctionKey: number): C {
        let worstChromosome: C;
        let worstHeuristicValue = 1;
        for (const chromosome of chromosomes) {
            const heuristicValue = this.getHeuristicValue(chromosome, fitnessFunctionKey);
            if (worstChromosome == undefined || heuristicValue < worstHeuristicValue
                || (heuristicValue == worstHeuristicValue
                    && chromosome.getLength() > worstChromosome.getLength())) {
                worstHeuristicValue = heuristicValue;
                worstChromosome = chromosome;
            }
        }
        return worstChromosome;
    }

    /**
     * Compares two chromosomes with the same heuristic value for a fitness function.
     *
     * @param chromosome1 The first chromosome to compare.
     * @param chromosome2 The second chromosome to compare.
     * @return A positive value if chromosome1 is better, a negative value if chromosome2 is better,
     *         zero if both are equal.
     */
    private compareChromosomesWithEqualHeuristic(chromosome1: C, chromosome2: C): number {
        const lengthDifference = chromosome2.getLength() - chromosome1.getLength();
        if (lengthDifference != 0) {
            return lengthDifference;
        }
        let heuristicSum1 = 0;
        let heuristicSum2 = 0;
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            heuristicSum1 += this.getHeuristicValue(chromosome1, fitnessFunctionKey);
            heuristicSum2 += this.getHeuristicValue(chromosome2, fitnessFunctionKey);
        }
        return heuristicSum1 - heuristicSum2;
    }

    /**
     * Calculates the heuristic value for a chromosome and a given fitness function.
     *
     * @param chromosome The chromosome to use for the calculation.
     * @param fitnessFunctionKey The key of the fitness function to use for the calculation.
     * @returns The heuristic value of the chromosome for the given fitness function.
     */
    private getHeuristicValue(chromosome: C, fitnessFunctionKey: number): number {
        const fitnessValue = this._fitnessFunctions.get(fitnessFunctionKey).getFitness(chromosome);
        const heuristicValue = this._heuristics.get(fitnessFunctionKey)(fitnessValue);
        return heuristicValue;
    }

    /**
     * Determines if the focused phase is reached.
     *
     * @returns True if the focused phase is reached, false otherwise.
     */
    private isFocusedPhaseReached(): boolean {
        return this._randomSelectionProbability == this._randomSelectionProbabilityFocusedPhase
            && this._maxArchiveSize == this._maxArchiveSizeFocusedPhase;
    }

    /**
     * Updates the probability for the random selection and the maximum size of the archive population
     * according to the overall progress of the search and the start of the focused phase.
     */
    private updateParameters(): void {
        const overallProgress = this._iterations / this._maxIterations;
        const progressUntilFocusedPhaseReached = overallProgress / this._startOfFocusedPhase;
        const previousArchiveSize = this._maxArchiveSize;
        if (progressUntilFocusedPhaseReached >= 1) {
            this._randomSelectionProbability = this._randomSelectionProbabilityFocusedPhase;
            this._maxArchiveSize = this._maxArchiveSizeFocusedPhase;
        } else {
            this._randomSelectionProbability = this._randomSelectionProbabilityStart
                + (this._randomSelectionProbabilityFocusedPhase - this._randomSelectionProbabilityStart)
                * progressUntilFocusedPhaseReached;
            this._maxArchiveSize = Math.round(this._maxArchiveSizeStart
                + (this._maxArchiveSizeFocusedPhase - this._maxArchiveSizeStart)
                * progressUntilFocusedPhaseReached);
        }
        if (previousArchiveSize > this._maxArchiveSize) {
            for (const fitnessFunctionKey of this._archiveUncovered.keys()) {
                const population = this._archiveUncovered.get(fitnessFunctionKey);
                while (population.size() > this._maxArchiveSize) {
                    population.remove(this.getWorstChromosome(population, fitnessFunctionKey));
                }
                this._archiveUncovered.set(fitnessFunctionKey, population);
            }
        }
    }

    // TODO: parameter M -> mutate multiple times

    // TODO: FDS
}
