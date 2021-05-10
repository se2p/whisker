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
import {Randomness} from "../../utils/Randomness";
import {StoppingCondition} from "../StoppingCondition";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {StatisticsCollector} from "../../utils/StatisticsCollector";

/**
 * The Many Independent Objective (MIO) Algorithm.
 *
 * @param <C> The chromosome type.
 * @author Adina Deiner
 */
export class MIO<C extends Chromosome> extends SearchAlgorithmDefault<C> {

    private _chromosomeGenerator: ChromosomeGenerator<C>;

    private _properties: SearchAlgorithmProperties<C>;

    private _fitnessFunctions: Map<number, FitnessFunction<C>>;

    private _heuristicFunctions: Map<number, Function>;

    private _iterations: number;

    private _stoppingCondition: StoppingCondition<C>;

    private _bestIndividuals: List<C>;

    private _archiveCovered: Map<number, C>;

    private _archiveUncovered: Map<number, List<ChromosomeHeuristicTuple<C>>>;

    private _randomSelectionProbability: number;

    private _randomSelectionProbabilityStart: number;

    private _randomSelectionProbabilityFocusedPhase: number;

    private _maxArchiveSize: number;

    private _maxArchiveSizeStart: number;

    private _maxArchiveSizeFocusedPhase: number;

    private _maxMutationCount: number;

    private _maxMutationCountStart: number;

    private _maxMutationCountFocusedPhase: number;

    private _mutationCounter: number;

    private _samplingCounter: Map<number, number>;

    private _startTime: number;

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        this._properties = properties;
        this._stoppingCondition = this._properties.getStoppingCondition();
        this.extractRandomSelectionProbabilities();
        this.extractArchiveSizes();
        this.extractMutationCounter();
    }

    /**
     * Extracts the probability for sampling a random chromosome out of the set properties.
     */
    private extractRandomSelectionProbabilities(): void {
        this._randomSelectionProbabilityStart = this._properties.getSelectionProbabilityStart();
        this._randomSelectionProbabilityFocusedPhase = this._properties.getSelectionProbabilityFocusedPhase();
    }

    /**
     * Extracts the maximum number of chromosomes stored for a fitness function out of the set properties.
     */
    private extractArchiveSizes(): void {
        this._maxArchiveSizeStart = this._properties.getMaxArchiveSizeStart();
        this._maxArchiveSizeFocusedPhase = this._properties.getMaxArchiveSizeFocusedPhase();
    }

    /**
     * Extracts the number of mutations on the same chromosome out of the set properties.
     */
    private extractMutationCounter(): void {
        this._maxMutationCountStart = this._properties.getMaxMutationCountStart();
        this._maxMutationCountFocusedPhase = this._properties.getMaxMutationCountFocusedPhase();
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void {
        this._fitnessFunctions = fitnessFunctions;
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessFunctions.size;
    }

    setHeuristicFunctions(heuristicFunctions: Map<number, Function>): void {
        this._heuristicFunctions = heuristicFunctions;
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
    async findSolution(): Promise<List<C>> {
        this.setStartValues();
        let chromosome: C;
        while (!(this._stoppingCondition.isFinished(this))) {
            if (this._mutationCounter < this._maxMutationCount && chromosome != undefined) {
                const mutatedChromosome = chromosome.mutate();
                await mutatedChromosome.evaluate();
                this._mutationCounter++;
                this.updateArchive(mutatedChromosome);
            } else {
                chromosome = this.getNewChromosome();
                await chromosome.evaluate();
                this._mutationCounter = 0;
                this.updateArchive(chromosome);
            }
            this._iterations++;
            StatisticsCollector.getInstance().incrementIterationCount();
            if (!this.isFocusedPhaseReached()) {
                this.updateParameters();
            }
            console.log("Iteration " + this._iterations + ", covered goals: "
                + this._archiveCovered.size + "/" + this._fitnessFunctions.size);
        }
        return this._bestIndividuals;
    }

/**
 * Summarize the solution saved in _archive.
 * @returns: For each statement that is not covered, it returns 4 items:
 * 		- Not covered: the statement that’s not covered by any
 *        function in the _bestIndividuals.
 *     	- ApproachLevel: the approach level of that statement
 *     	- BranchDistance: the branch distance of that statement
 *     	- Fitness: the fitness value of that statement
 */

    summarizeSolution(): string {
        const summary = [];
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const curSummary = {};
            if (!this._archiveCovered.has(fitnessFunctionKey)) {
                const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
                curSummary['block'] = fitnessFunction.toString();
                let fitness = 999;
                let approachLevel = 999;
                let branchDistance = 999;
                let CFGDistance = 999;
                for (const chromosome of this._bestIndividuals) {
                    const curFitness = fitnessFunction.getFitness(chromosome);
                    if (curFitness < fitness) {
                        fitness = curFitness;
                        approachLevel = fitnessFunction.getApproachLevel(chromosome);
                        branchDistance = fitnessFunction.getBranchDistance(chromosome);
                        if (approachLevel === 0 && branchDistance === 0) {
                            CFGDistance = fitnessFunction.getCFGDistance(chromosome);
                        }
                        else {
                            CFGDistance = 999;
                            //this means that it was unnecessary to calculate cfg distance, since
                            //approach level or branch distance was not 0;
                        }
                    }
                }
                curSummary['ApproachLevel'] = approachLevel;
                curSummary['BranchDistance'] = branchDistance;
                curSummary['CFGDistanceUnNormalized'] = CFGDistance;
                curSummary['Fitness'] = fitness;
                if (Object.keys(curSummary).length > 0){
                    summary.push(curSummary);
                }
            }

        }
        return JSON.stringify({'uncoveredBlocks': summary});
    }

    /**
     * Sets the appropriate starting values for the search.
     */
    private setStartValues(): void {
        this._iterations = 0;
        this._startTime = Date.now();
        this._mutationCounter = 0;
        this._bestIndividuals = new List<C>();
        this._archiveCovered = new Map<number, C>();
        this._archiveUncovered = new Map<number, List<ChromosomeHeuristicTuple<C>>>();
        this._samplingCounter = new Map<number, number>();
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            this._samplingCounter.set(fitnessFunctionKey, 0);
        }
        this.updateParameters();
        StatisticsCollector.getInstance().iterationCount = 0;
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = 0;
    }

    /**
     * Creates a new chromosome by random or by mutating a chromosome from the archive.
     *
     * @returns A new chromosome.
     */
    private getNewChromosome(): C {
        if ((this._archiveUncovered.size == 0 && this._archiveCovered.size == 0)
            || Randomness.getInstance().nextDouble() < this._randomSelectionProbability) {
            return this._chromosomeGenerator.get();
        } else {
            const anyUncovered: boolean = this._archiveUncovered.size > 0;
            const fitnessFunctionKey = this.getOptimalFitnessFunctionKey(anyUncovered);
            this._samplingCounter.set(fitnessFunctionKey, this._samplingCounter.get(fitnessFunctionKey) + 1);
            if (anyUncovered) {
                const archiveTuples = this._archiveUncovered.get(fitnessFunctionKey);
                const randomIndex = Randomness.getInstance().nextInt(0, archiveTuples.size());
                return archiveTuples.get(randomIndex).getChromosome().mutate();
            } else {
                return this._archiveCovered.get(fitnessFunctionKey).mutate();
            }
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
                        this.setBestCoveringChromosome(chromosome, fitnessFunctionKey);
                    }
                } else {
                    StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount();
                    this._archiveUncovered.delete(fitnessFunctionKey);
                    this.setBestCoveringChromosome(chromosome, fitnessFunctionKey);
                    if(this._archiveCovered.size == this._fitnessFunctions.size) {
                        StatisticsCollector.getInstance().createdTestsToReachFullCoverage = this._iterations;
                        StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
                    }
                }
            } else if (heuristicValue > 0 && !this._archiveCovered.has(fitnessFunctionKey)) {
                let archiveTuples: List<ChromosomeHeuristicTuple<C>>;
                if (this._archiveUncovered.has(fitnessFunctionKey)) {
                    archiveTuples = this._archiveUncovered.get(fitnessFunctionKey);
                } else {
                    archiveTuples = new List<ChromosomeHeuristicTuple<C>>();
                }
                const newTuple = new ChromosomeHeuristicTuple<C>(chromosome, heuristicValue);
                if (archiveTuples.size() < this._maxArchiveSize) {
                    archiveTuples.add(newTuple);
                    this._samplingCounter.set(fitnessFunctionKey, 0);
                } else {
                    const worstArchiveTuple = this.getWorstChromosomeHeuristicTuple(archiveTuples);
                    const worstHeuristicValue = worstArchiveTuple.getHeuristicValue();
                    const worstChromosome = worstArchiveTuple.getChromosome();
                    if (worstHeuristicValue < heuristicValue || (worstHeuristicValue == heuristicValue
                        && this.compareChromosomesWithEqualHeuristic(chromosome, worstChromosome) >= 0)) {
                        archiveTuples.remove(worstArchiveTuple);
                        archiveTuples.add(newTuple);
                        this._samplingCounter.set(fitnessFunctionKey, 0);
                    }
                }
                this._archiveUncovered.set(fitnessFunctionKey, archiveTuples);
            }
        }
    }

    getFitnessFunctions(): Iterable<FitnessFunction<C>> {
        return this._fitnessFunctions.values();
    }

    /**
     * Sets the best chromosome for a covered fitness function.
     *
     * @param chromosome The best chromosome for the fitness function.
     * @param fitnessFunctionKey The key of the fitness function.
     */
    private setBestCoveringChromosome(chromosome, fitnessFunctionKey): void {
        console.log("Found test for goal: " + this._fitnessFunctions.get(fitnessFunctionKey));
        this._archiveCovered.set(fitnessFunctionKey, chromosome);
        this._bestIndividuals = new List<C>(Array.from(this._archiveCovered.values())).distinct();
        StatisticsCollector.getInstance().bestTestSuiteSize = this._bestIndividuals.size();
        this._samplingCounter.set(fitnessFunctionKey, 0);
    }

    /**
     * Determines the worst tuple from a list of tuples, each consisting of a chromosome and a
     * corresponding heuristic value of the chromosome.
     *
     * @param chromosomeHeuristicTuples The list of tuples to compare.
     * @returns The worst tuple of the list.
     */
    private getWorstChromosomeHeuristicTuple(chromosomeHeuristicTuples: List<ChromosomeHeuristicTuple<C>>): ChromosomeHeuristicTuple<C> {
        let worstTuple: ChromosomeHeuristicTuple<C>;
        let worstHeuristicValue = 1;
        for (const tuple of chromosomeHeuristicTuples) {
            const heuristicValue = tuple.getHeuristicValue();
            const chromosome = tuple.getChromosome();
            if (worstTuple == undefined || heuristicValue < worstHeuristicValue
                || (heuristicValue == worstHeuristicValue
                    && chromosome.getLength() > worstTuple.getChromosome().getLength())) {
                worstHeuristicValue = heuristicValue;
                worstTuple = tuple;
            }
        }
        return worstTuple;
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
        return this._heuristicFunctions.get(fitnessFunctionKey)(fitnessValue);
    }

    /**
     * Determines if the focused phase is reached.
     *
     * @returns True if the focused phase is reached, false otherwise.
     */
    private isFocusedPhaseReached(): boolean {
        return this._randomSelectionProbability == this._randomSelectionProbabilityFocusedPhase
            && this._maxArchiveSize == this._maxArchiveSizeFocusedPhase
            && this._maxMutationCount == this._maxMutationCountFocusedPhase;
    }

    /**
     * Updates the probability for the random selection, the maximum size of the archive population
     * and the maximum number of mutations of the same chromosome according to the overall progress
     * of the search and the start of the focused phase.
     */
    private updateParameters(): void {
        const overallProgress = this._stoppingCondition.getProgress(this);
        const progressUntilFocusedPhaseReached = overallProgress / this._properties.getStartOfFocusedPhase();
        const previousMaxArchiveSize = this._maxArchiveSize;
        if (progressUntilFocusedPhaseReached >= 1) {
            this._randomSelectionProbability = this._randomSelectionProbabilityFocusedPhase;
            this._maxArchiveSize = this._maxArchiveSizeFocusedPhase;
            this._maxMutationCount = this._maxMutationCountFocusedPhase;
        } else {
            this._randomSelectionProbability = this._randomSelectionProbabilityStart
                + (this._randomSelectionProbabilityFocusedPhase - this._randomSelectionProbabilityStart)
                * progressUntilFocusedPhaseReached;
            this._maxArchiveSize = Math.round(this._maxArchiveSizeStart
                + (this._maxArchiveSizeFocusedPhase - this._maxArchiveSizeStart)
                * progressUntilFocusedPhaseReached);
            this._maxMutationCount = Math.round(this._maxMutationCountStart
                + (this._maxMutationCountFocusedPhase - this._maxMutationCountStart)
                * progressUntilFocusedPhaseReached);
        }
        if (previousMaxArchiveSize > this._maxArchiveSize) {
            for (const fitnessFunctionKey of this._archiveUncovered.keys()) {
                const archiveTuples = this._archiveUncovered.get(fitnessFunctionKey);
                while (archiveTuples.size() > this._maxArchiveSize) {
                    archiveTuples.remove(this.getWorstChromosomeHeuristicTuple(archiveTuples));
                }
                this._archiveUncovered.set(fitnessFunctionKey, archiveTuples);
            }
        }
    }

    /**
     * Determines the fitness function with the highest chance to get covered in the next iteration.
     *
     * @param useUncoveredFitnessFunctions Whether to get the optimal uncovered or covered fitness function.
     * @returns The key of the fitness function with the minimal sampling count.
     */
    private getOptimalFitnessFunctionKey(useUncoveredFitnessFunctions: boolean): number {
        let minimumSamplingCount = Number.MAX_VALUE;
        let optimalFitnessFunctionKey;
        const fitnessFunctionKeys = useUncoveredFitnessFunctions
            ? this._archiveUncovered.keys() : this._archiveCovered.keys();
        for (const fitnessFunctionKey of fitnessFunctionKeys) {
            const samplingCount = this._samplingCounter.get(fitnessFunctionKey);
            if (samplingCount < minimumSamplingCount) {
                minimumSamplingCount = samplingCount;
                optimalFitnessFunctionKey = fitnessFunctionKey;
            }
        }
        return optimalFitnessFunctionKey;
    }

    getStartTime(): number {
        return this._startTime;
    }
}

/**
 * A tuple storing a chromosome and a corresponding heuristic value of the chromosome.
 */
class ChromosomeHeuristicTuple<C> {

    private readonly _chromosome: C;
    private readonly _heuristicValue: number;

    /**
     * Creates a new tuple of a chromosome and a corresponding heuristic value.
     *
     * @param chromosome The chromosome.
     * @param heuristicValue The corresponding heuristic value.
     */
    constructor(chromosome: C, heuristicValue: number) {
        this._chromosome = chromosome;
        this._heuristicValue = heuristicValue;
    }

    /**
     * Gets the chromosome of the tuple.
     *
     * @returns The chromosome of the tuple.
     */
    getChromosome(): C {
        return this._chromosome;
    }

    /**
     * Gets the heuristic value of the tuple.
     *
     * @returns The heuristic value of the tuple.
     */
    getHeuristicValue(): number {
        return this._heuristicValue;
    }
}
