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
import {MIOProperties} from '../SearchAlgorithmProperties';
import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {FitnessFunction} from "../FitnessFunction";
import {Randomness} from "../../utils/Randomness";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {LocalSearch} from "../operators/LocalSearch/LocalSearch";
import {TestChromosome} from "../../testcase/TestChromosome";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import Arrays from "../../utils/Arrays";
import {Container} from "../../utils/Container";
import {Selection} from '../Selection';

/**
 * The Many Independent Objective (MIO) Algorithm.
 *
 * @param <C> The chromosome type.
 * @author Adina Deiner
 */
export class MIO<C extends Chromosome> extends SearchAlgorithmDefault<C> {

    /**
     * Defines SearchParameters set within the config file.
     */
    protected override _properties: MIOProperties<C>;

    /**
     * Function determining how good a chromosome performs with respect to a target statement.
     */
    private _heuristicFunctions: Map<number, (number) => number>;

    /**
     * Maps all covered statements to the Chromosomes covering them.
     */
    private _archiveCovered: Map<number, C>;

    /**
     * Maps uncovered Statements to the chromosomes closest to covering them with respect to the given fitnessFunction.
     */
    private _archiveUncovered: Map<number, Heuristic<C>[]>;

    /**
     * Contains all uncovered independent FitnessFunctions. These include the last statements inside branches and the
     * last statements of hat related statements.
     */
    private _uncoveredIndependentFitnessFunctions: Map<number, FitnessFunction<C>>

    /**
     * Defines the probability of sampling a new Chromosome instead of mutating an existing one during search.
     */
    private _randomSelectionProbability: number;

    /**
     * Defines the probability of sampling a new Chromosome instead of mutating an existing one
     * at the start of the search.
     */
    private _randomSelectionProbabilityStart: number;

    /**
     * Defines the probability of sampling a new Chromosome instead of mutating an existing one during FocusPhase.
     */
    private _randomSelectionProbabilityFocusedPhase: number;

    /**
     * Defines the number of Chromosomes which held in each uncovered target archive/population during search.
     */
    private _maxArchiveSize: number;

    /**
     * Defines the number of Chromosomes which held in each uncovered target archive/population
     * at the start of the search.
     */
    private _maxArchiveSizeStart: number;

    /**
     * Defines the number of Chromosomes which held in each uncovered target archive/population during FocusPhase.
     */
    private _maxArchiveSizeFocusedPhase: number;

    /**
     * Defines the number of mutations applied to a given Chromosome within one round of mutation during search.
     */
    private _maxMutationCount: number;

    /**
     * Defines the number of mutations applied to a given Chromosome within one round of mutation
     * at the start of the search.
     */
    private _maxMutationCountStart: number;

    /**
     * Defines the number of mutations applied to a given Chromosome within one round of mutation during FocusPhase.
     */
    private _maxMutationCountFocusedPhase: number;

    /**
     * A Map mapping to each fitnessFunction a counter determining how often the fitnessFunction has been selected for a
     * mutation/randomSampling round. When selecting a FitnessFunction for the next mutation/randomSampling round
     * we always choose the FitnessFunction with the lowest samplingCounter value.
     */
    private _samplingCounter: Map<number, number>;

    private _localSearchOperators: LocalSearch<C>[] = [];

    private readonly _random = Randomness.getInstance();

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setProperties(properties: MIOProperties<C>): void {
        this._properties = properties;
        this._stoppingCondition = this._properties.stoppingCondition;
        this.extractRandomSelectionProbabilities();
        this.extractArchiveSizes();
        this.extractMutationCounter();
    }

    /**
     * Extracts the probability for sampling a random chromosome out of the set properties.
     */
    private extractRandomSelectionProbabilities(): void {
        this._randomSelectionProbabilityStart = this._properties.selectionProbability.start;
        this._randomSelectionProbabilityFocusedPhase = this._properties.selectionProbability.focusedPhase;
    }

    /**
     * Extracts the maximum number of chromosomes stored for a fitness function out of the set properties.
     */
    private extractArchiveSizes(): void {
        this._maxArchiveSizeStart = this._properties.maxArchiveSize.start;
        this._maxArchiveSizeFocusedPhase = this._properties.maxArchiveSize.focusedPhase;
    }

    /**
     * Extracts the number of mutations on the same chromosome out of the set properties.
     */
    private extractMutationCounter(): void {
        this._maxMutationCountStart = this._properties.maxMutationCount.start;
        this._maxMutationCountFocusedPhase = this._properties.maxMutationCount.focusedPhase;
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void {
        this._fitnessFunctions = fitnessFunctions;
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessFunctions.size;
    }

    /**
     * Sets the functions for calculating the heuristic values.
     * @param heuristicFunctions The functions for calculating the heuristic values in the range of [0, 1]
     *          from the fitness values, where 0 is the worst value and 1 is the best value.
     */
    setHeuristicFunctions(heuristicFunctions: Map<number, (number) => number>): void {
        this._heuristicFunctions = heuristicFunctions;
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

    /**
     * Returns a list of solutions for the given problem.
     *
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<Map<number, C>> {
        await this.setStartValues();
        let mutationCounter = 0;
        while (!(await this._stoppingCondition.isFinished(this))) {
            // If we have no chromosomes saved in our archives so far or if randomness tells us to do so
            // we sample a new chromosome randomly.
            if ((this._archiveUncovered.size === 0 && this._archiveCovered.size === 0) || this._maxMutationCount === 0
                || this._random.nextDouble() < this._randomSelectionProbability) {
                const chromosome = this._chromosomeGenerator.get();
                await chromosome.evaluate(true);
                await this.updateArchive(chromosome);
                // By chance apply LocalSearch to the randomly generated chromosome.
                await this.applyLocalSearch(chromosome);
                this._iterations++;
                StatisticsCollector.getInstance().incrementIterationCount();
            } else {
                // Otherwise, we choose a chromosome to mutate from one of our populations, preferring uncovered ones.
                const anyUncovered: boolean = this._archiveUncovered.size > 0;
                const fitnessFunctionKey = this.getOptimalFitnessFunctionKey(anyUncovered);
                const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
                this._samplingCounter.set(fitnessFunctionKey, this._samplingCounter.get(fitnessFunctionKey) + 1);
                let chromosome: C;
                if (anyUncovered) {
                    const archiveTuples = this._archiveUncovered.get(fitnessFunctionKey);
                    chromosome = this._random.pick(archiveTuples).chromosome;
                } else {
                    chromosome = this._archiveCovered.get(fitnessFunctionKey);
                }
                chromosome.targetFitness = fitnessFunction;
                let currentHeuristic = await this.getHeuristicValue(chromosome, fitnessFunctionKey);
                while (mutationCounter < this._maxMutationCount && !this._archiveCovered.has(fitnessFunctionKey)) {
                    const mutant = chromosome.mutate();
                    mutant.targetFitness = fitnessFunction;
                    await mutant.evaluate(true);
                    await this.updateArchive(mutant);
                    const mutantHeuristic = await this.getHeuristicValue(mutant, fitnessFunctionKey);
                    // If the mutant improved keep mutating on the mutant instead of on the initial chosen chromosome
                    if (currentHeuristic <= mutantHeuristic) {
                        chromosome = mutant;
                        currentHeuristic = mutantHeuristic;
                    }
                    mutationCounter++;
                    this._iterations++;
                    StatisticsCollector.getInstance().incrementIterationCount();
                }
                // Randomly apply LocalSearch to the final mutant. Applying LocalSearch to each mutant is
                // too cost intensive and provides hardly any benefit.
                await this.applyLocalSearch(chromosome);
                // Reset mutationCounter
                mutationCounter = 0;
            }
            if (!this.isFocusedPhaseReached()) {
                await this.updateParameters();
            }
            Container.debugLog(`Iteration ${this._iterations}, covered goals total: ${this._archiveCovered.size}/${this._fitnessFunctions.size}, \
open independent goals: ${this._uncoveredIndependentFitnessFunctions.size}`);
        }
        return this._archiveCovered;
    }

    /**
     * Apply all LocalSearch operators with a given probability iff they are applicable at all.
     * @param chromosome the chromosome to apply LocalSearch on
     */
    private async applyLocalSearch(chromosome: C): Promise<void> {
        for (const localSearch of this._localSearchOperators) {
            if (await localSearch.isApplicable(chromosome) && this._random.nextDouble() < localSearch.getProbability()) {
                const modifiedChromosome = await localSearch.apply(chromosome);
                await this.updateArchive(modifiedChromosome);
            }
        }
    }

    /**
     * Sets the appropriate starting values for the search.
     */
    private async setStartValues(): Promise<void> {
        this._iterations = 0;
        this._startTime = Date.now();
        this._bestIndividuals = [];
        this._archiveCovered = new Map<number, C>();
        this._archiveUncovered = new Map<number, Heuristic<C>[]>();
        this._samplingCounter = new Map<number, number>();
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            this._samplingCounter.set(fitnessFunctionKey, 0);
        }
        await this.updateParameters();
        StatisticsCollector.getInstance().iterationCount = 0;
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = 0;
        StatisticsCollector.getInstance().startTime = Date.now();
        this._uncoveredIndependentFitnessFunctions = new Map<number, FitnessFunction<C>>(this.getIndependentStatements());
    }

    /**
     * Extracts independent statements from the Scratch-Project and filters the whole fitnessFunctionsMap with these,
     * while keeping the corresponding key structure untouched, i.e the same key in both fitnessMaps points to the same
     * statement.
     */
    private getIndependentStatements(): Map<number, FitnessFunction<C>> {
        const fitnessFunctions = [...this._fitnessFunctions.values()] as unknown as StatementFitnessFunction[];
        // We can only extract independent block statements if we indeed deal with scratch blocks.
        if (fitnessFunctions[0] instanceof StatementFitnessFunction) {
            const mergeNodeStatements = StatementFitnessFunction.getMergeNodeMap(fitnessFunctions);
            let independentFitnessFunctions: StatementFitnessFunction[] = [];
            [...mergeNodeStatements.values()].forEach(statementList => independentFitnessFunctions.push(...statementList));
            independentFitnessFunctions = Arrays.distinct(independentFitnessFunctions);
            const independentFitnessFunctionMap = new Map<number, FitnessFunction<C>>();
            this._fitnessFunctions.forEach((value, key) => {
                if (independentFitnessFunctions.includes(value as unknown as StatementFitnessFunction)) {
                    independentFitnessFunctionMap.set(key, value);
                }
            });
            return independentFitnessFunctionMap;
        } else
            return this._fitnessFunctions;
    }

    /**
     * Updates the archive of best chromosomes.
     *
     * @param chromosome The candidate chromosome for the archive.
     */
    protected override async updateArchive(chromosome: C): Promise<void> {
        await this.updateCoveredArchive(chromosome);
        await this.updateUncoveredArchive(chromosome);
    }

    /**
     * Updates the archive containing all covered Statements so far. This archive consists of all block statements
     * contained in the given Scratch-Project.
     * @param chromosome The candidate chromosome for the archive
     */
    private async updateCoveredArchive(chromosome: C): Promise<void> {
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const heuristicValue = await this.getHeuristicValue(chromosome, fitnessFunctionKey);
            if (heuristicValue == 1) {
                if (this._archiveCovered.has(fitnessFunctionKey)) {
                    const oldBestChromosome = this._archiveCovered.get(fitnessFunctionKey);
                    if (oldBestChromosome.getLength() > chromosome.getLength() ||
                        await this.compareChromosomesWithEqualHeuristic(chromosome, oldBestChromosome) > 0) {
                        this.setBestCoveringChromosome(chromosome, fitnessFunctionKey);
                    }
                } else {
                    StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount(this._fitnessFunctions.get(fitnessFunctionKey));
                    if (this._archiveUncovered.has(fitnessFunctionKey)) {
                        this._archiveUncovered.delete(fitnessFunctionKey);
                    }
                    this.setBestCoveringChromosome(chromosome, fitnessFunctionKey);
                    Container.debugLog(`Found test for goal: ${this._fitnessFunctions.get(fitnessFunctionKey)}`);
                    if (this._archiveCovered.size == this._fitnessFunctions.size) {
                        StatisticsCollector.getInstance().createdTestsToReachFullCoverage = this._iterations;
                        StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
                    }
                    // If the covered statement is an independent one, delete it from the independent fitness
                    // function map.
                    if (this._uncoveredIndependentFitnessFunctions.has(fitnessFunctionKey)) {
                        this._uncoveredIndependentFitnessFunctions.delete(fitnessFunctionKey);
                    }
                }
            }
        }
    }

    /**
     * Updates the archive containing all unCovered Statements. To reduce the amount of duplicate archive populations,
     * this archive consists of all independent block statements defined by the independentFitnessFunctions attribute.
     * @param chromosome The candidate chromosome for the archive
     */
    private async updateUncoveredArchive(chromosome: C): Promise<void> {
        for (const fitnessFunctionKey of this._uncoveredIndependentFitnessFunctions.keys()) {
            const heuristicValue = await this.getHeuristicValue(chromosome, fitnessFunctionKey);
            // Check for heuristicValue > 0 to make sure we only add chromosomes that are somewhere near of covering
            // the given statement. Note, that a fitnessValue of Infinity leads to a heuristicValue of 0.
            if (heuristicValue > 0 && !this._archiveCovered.has(fitnessFunctionKey)) {
                let archiveTuples: Heuristic<C>[] = [];
                if (this._archiveUncovered.has(fitnessFunctionKey)) {
                    archiveTuples = this._archiveUncovered.get(fitnessFunctionKey);
                } else {
                    archiveTuples = [];
                }
                const newTuple = {chromosome, heuristicValue};
                newTuple.chromosome.targetFitness = this._fitnessFunctions.get(fitnessFunctionKey);
                // Do not add duplicates in any population!
                if (this.tuplesContainChromosome(archiveTuples, newTuple)) {
                    continue;
                }
                if (archiveTuples.length < this._maxArchiveSize) {
                    archiveTuples.push(newTuple);
                } else {
                    const worstArchiveTuple = await this.getWorstChromosomeHeuristicTuple(archiveTuples);
                    const worstHeuristicValue = worstArchiveTuple.heuristicValue;
                    const worstChromosome = worstArchiveTuple.chromosome;
                    if (worstHeuristicValue < heuristicValue || (worstHeuristicValue == heuristicValue
                        && await this.compareChromosomesWithEqualHeuristic(chromosome, worstChromosome) >= 0)) {
                        Arrays.remove(archiveTuples, worstArchiveTuple);
                        archiveTuples.push(newTuple);
                        this._samplingCounter.set(fitnessFunctionKey, 0);
                    }
                }
                this._archiveUncovered.set(fitnessFunctionKey, archiveTuples);
            }
        }
    }

    /**
     * Check if the given List of tuples already contains the tuple we want to add. Two tuples are similar if they
     * possess exactly the same genes.
     * @param tupleList the list into which we want to add the tuple
     * @param tupleToAdd the tuple we want to add to the tupleList
     * @return boolean determining if the tupleList already contains the tupleToAdd
     */
    private tuplesContainChromosome(tupleList: Heuristic<C>[],
                                    tupleToAdd: Heuristic<C>): boolean {
        const chromosomeToAdd = tupleToAdd.chromosome as unknown as TestChromosome;
        const genesToAdd = JSON.stringify(chromosomeToAdd.getGenes());
        for (const tuple of tupleList) {
            const chromosome = tuple.chromosome as unknown as TestChromosome;
            if (genesToAdd === JSON.stringify(chromosome.getGenes())) {
                return true;
            }
        }
        return false;
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
        this._archiveCovered.set(fitnessFunctionKey, chromosome);
        this._bestIndividuals = Arrays.distinct(this._archiveCovered.values());
        StatisticsCollector.getInstance().bestTestSuiteSize = this._bestIndividuals.length;
        this._samplingCounter.set(fitnessFunctionKey, 0);
    }

    /**
     * Determines the worst tuple from a list of tuples, each consisting of a chromosome and a
     * corresponding heuristic value of the chromosome.
     *
     * @param chromosomeHeuristicTuples The list of tuples to compare.
     * @returns The worst tuple of the list.
     */
    private async getWorstChromosomeHeuristicTuple(chromosomeHeuristicTuples: Heuristic<C>[]): Promise<Heuristic<C>> {
        let worstTuple: Heuristic<C>;
        let worstHeuristicValue = 1;
        for (const tuple of chromosomeHeuristicTuples) {
            const {chromosome, heuristicValue} = tuple;
            if (worstTuple == undefined ||
                heuristicValue < worstHeuristicValue ||
                (heuristicValue === worstHeuristicValue &&
                    await this.compareChromosomesWithEqualHeuristic(worstTuple.chromosome, chromosome) > 0)) {
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
    private async compareChromosomesWithEqualHeuristic(chromosome1: C, chromosome2: C): Promise<number> {
        let heuristicSum1 = 0;
        let heuristicSum2 = 0;
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            heuristicSum1 += await this.getHeuristicValue(chromosome1, fitnessFunctionKey);
            heuristicSum2 += await this.getHeuristicValue(chromosome2, fitnessFunctionKey);
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
    private async getHeuristicValue(chromosome: C, fitnessFunctionKey: number): Promise<number> {
        const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
        const fitnessValue = await chromosome.getFitness(fitnessFunction);
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
    private async updateParameters(): Promise<void> {
        const overallProgress = await this._stoppingCondition.getProgress(this);
        const progressUntilFocusedPhaseReached = overallProgress / this._properties.startOfFocusedPhase;
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
                while (archiveTuples.length > this._maxArchiveSize) {
                    Arrays.remove(archiveTuples, await this.getWorstChromosomeHeuristicTuple(archiveTuples));
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

    setFitnessFunction(fitnessFunction: FitnessFunction<C>): void {
        throw new Error('Method not implemented.');
    }

    setSelectionOperator(selectionOperator: Selection<C>): void {
        throw new Error('Method not implemented.');
    }
}

/**
 * Stores a chromosome and a corresponding heuristic value of the chromosome.
 */
interface Heuristic<C extends Chromosome> {
    chromosome: C;
    heuristicValue: number;
}
