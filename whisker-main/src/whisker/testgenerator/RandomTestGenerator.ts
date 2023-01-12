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

import {TestGenerator} from './TestGenerator';
import {TestChromosome} from "../testcase/TestChromosome";
import {SearchAlgorithm} from "../search/SearchAlgorithm";
import {NotSupportedFunctionException} from "../core/exceptions/NotSupportedFunctionException";
import {FitnessFunction} from "../search/FitnessFunction";
import {StatisticsCollector} from "../utils/StatisticsCollector";
import {WhiskerTestListWithSummary} from "./WhiskerTestListWithSummary";
import {Randomness} from "../utils/Randomness";
import {Container} from "../utils/Container";
import {TestExecutor} from "../testcase/TestExecutor";
import {WhiskerSearchConfiguration} from "../utils/WhiskerSearchConfiguration";
import Arrays from "../utils/Arrays";

/**
 * A naive approach to generating tests by always selecting a random event from the set of available events
 * determined by the ScratchEventSelector.
 */
export class RandomTestGenerator extends TestGenerator implements SearchAlgorithm<TestChromosome> {

    /**
     * Saves the starting time of the Algorithm.
     */
    private _startTime: number;

    /**
     * Saves the number of Generations.
     */
    private _iterations: number;

    /**
     * Saves the best performing chromosomes seen so far.
     */
    private _tests: TestChromosome[] = [];

    /**
     * Maps to each FitnessFunction a Chromosome covering the given FitnessFunction.
     */
    private _archive = new Map<number, TestChromosome>();

    /**
     * Boolean determining if we have reached full test coverage.
     */
    protected _fullCoverageReached = false;

    /**
     * The minimum number of randomly selected events.
     */
    private readonly minSize: number

    /**
     * The maximum number of randomly selected events.
     */
    private readonly maxSize: number

    constructor(configuration: WhiskerSearchConfiguration, minSize: number, maxSize: number) {
        super(configuration);
        this.minSize = minSize;
        this.maxSize = maxSize;
    }

    /**
     * Generate tests by randomly sending events to the Scratch-VM.
     * After each Iteration the archive is updated with the trace of executed events.
     */
    async generateTests(): Promise<WhiskerTestListWithSummary> {
        this._iterations = 0;
        this._startTime = Date.now();
        StatisticsCollector.getInstance().iterationCount = 0;
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = 0;
        StatisticsCollector.getInstance().startTime = Date.now();
        this._fitnessFunctions = this.extractCoverageGoals();
        StatisticsCollector.getInstance().fitnessFunctionCount = this._fitnessFunctions.size;
        this._startTime = Date.now();
        const stoppingCondition = this._config.searchAlgorithmProperties.stoppingCondition;

        const eventExtractor = this._config.getEventExtractor();
        const randomTestExecutor = new TestExecutor(Container.vmWrapper, eventExtractor, null);

        while (!(await stoppingCondition.isFinished(this))) {
            console.log(`Iteration ${this._iterations}, covered goals: ${this._archive.size}/${this._fitnessFunctions.size}`);
            const numberOfEvents = Randomness.getInstance().nextInt(this.minSize, this.maxSize + 1);
            const randomEventChromosome = new TestChromosome([], undefined, undefined);
            await randomTestExecutor.executeRandomEvents(randomEventChromosome, numberOfEvents);
            await this.updateArchive(randomEventChromosome);
            this._iterations++;
            this.updateStatistics();
        }
        const testSuite = await this.getTestSuite(this._tests);
        this.collectStatistics(testSuite);
        return new WhiskerTestListWithSummary(testSuite, await this.summarizeSolution(this._archive));
    }

    private async updateArchive(chromosome: TestChromosome): Promise<void> {
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
            let bestLength = this._archive.has(fitnessFunctionKey)
                ? this._archive.get(fitnessFunctionKey).getLength()
                : Number.MAX_SAFE_INTEGER;
            const candidateFitness = await chromosome.getFitness(fitnessFunction);
            const candidateLength = chromosome.getLength();
            if (await fitnessFunction.isOptimal(candidateFitness) && candidateLength < bestLength) {
                bestLength = candidateLength;
                if (!this._archive.has(fitnessFunctionKey)) {
                    StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount(fitnessFunction);
                }
                this._archive.set(fitnessFunctionKey, chromosome);
                this._tests = Arrays.distinct(this._archive.values());
                console.log(`Found test for goal: ${fitnessFunction}`);
            }
        }
    }

    /**
     * Updates the StatisticsCollector on the following points:
     *  - bestTestSuiteSize
     *  - iterationCount
     *  - createdTestsToReachFullCoverage
     *  - timeToReachFullCoverage
     */
    protected updateStatistics(): void {
        StatisticsCollector.getInstance().bestTestSuiteSize = this._tests.length;
        StatisticsCollector.getInstance().incrementIterationCount();
        if (this._archive.size == this._fitnessFunctions.size && !this._fullCoverageReached) {
            this._fullCoverageReached = true;
            StatisticsCollector.getInstance().createdTestsToReachFullCoverage = this._iterations;
            StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
        }
    }

    getCurrentSolution(): TestChromosome[] {
        return this._tests;
    }

    getFitnessFunctions(): Iterable<FitnessFunction<TestChromosome>> {
        return this._fitnessFunctions.values();
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getStartTime(): number {
        return this._startTime;
    }

    async findSolution(): Promise<Map<number, TestChromosome>> {
        throw new NotSupportedFunctionException();
    }

    setChromosomeGenerator(): void {
        throw new NotSupportedFunctionException();
    }

    setFitnessFunction(): void {
        throw new NotSupportedFunctionException();
    }

    setFitnessFunctions(): void {
        throw new NotSupportedFunctionException();
    }

    setHeuristicFunctions(): void {
        throw new NotSupportedFunctionException();
    }

    setProperties(): void {
        throw new NotSupportedFunctionException();
    }

    setSelectionOperator(): void {
        throw new NotSupportedFunctionException();
    }

    setLocalSearchOperators(): void {
        throw new NotSupportedFunctionException();
    }
}
