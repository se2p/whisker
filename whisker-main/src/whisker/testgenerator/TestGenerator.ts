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

import {WhiskerTest} from './WhiskerTest';
import {ScratchProject} from '../scratch/ScratchProject';
import {WhiskerSearchConfiguration} from "../utils/WhiskerSearchConfiguration";
import {StatisticsCollector} from "../utils/StatisticsCollector";
import {FitnessFunction} from "../search/FitnessFunction";
import {SearchAlgorithmBuilder} from "../search/SearchAlgorithmBuilder";
import {SearchAlgorithm} from "../search/SearchAlgorithm";
import {TestChromosome} from "../testcase/TestChromosome";
import {WhiskerTestListWithSummary} from "./WhiskerTestListWithSummary";
import Arrays from "../utils/Arrays";
import {TestMinimizer} from "./TestMinimizer";
import {Randomness} from "../utils/Randomness";
import {Container} from "../utils/Container";
import {AssertionGenerator} from './AssertionGenerator';

export abstract class TestGenerator {

    /**
     * Search parameters set by the config file.
     */
    protected _config: WhiskerSearchConfiguration;

    /**
     * Maps each FitnessFunction to a unique identifier
     */
    protected _fitnessFunctions: Map<number, FitnessFunction<TestChromosome>>;

    constructor(configuration: WhiskerSearchConfiguration) {
        this._config = configuration;
    }

    public abstract generateTests(project: ScratchProject): Promise<WhiskerTestListWithSummary>;

    protected buildSearchAlgorithm(initializeFitnessFunction: boolean): SearchAlgorithm<any> {
        const builder = new SearchAlgorithmBuilder(this._config.getAlgorithm())
            .addSelectionOperator(this._config.getSelectionOperator())
            .addLocalSearchOperators(this._config.getLocalSearchOperators())
            .addProperties(this._config.searchAlgorithmProperties);
        if (initializeFitnessFunction) {
            builder.initializeFitnessFunction(this._config.getFitnessFunctionType(),
                this._config.searchAlgorithmProperties['chromosomeLength'], // FIXME: unsafe access
                this._config.getFitnessFunctionTargets());
            this._fitnessFunctions = builder.fitnessFunctions;
        }
        builder.addChromosomeGenerator(this._config.getChromosomeGenerator());
        return builder.buildSearchAlgorithm();
    }

    protected extractCoverageGoals(): Map<number, FitnessFunction<any>> {
        return new SearchAlgorithmBuilder(this._config.getAlgorithm())
            .initializeFitnessFunction(this._config.getFitnessFunctionType(),
                this._config.searchAlgorithmProperties['chromosomeLength'], // FIXME: unsafe access
                this._config.getFitnessFunctionTargets()).fitnessFunctions;
    }

    protected collectStatistics(testSuite: WhiskerTest[]): void {
        const statistics = StatisticsCollector.getInstance();

        StatisticsCollector.getInstance().bestCoverage =
            statistics.coveredFitnessFunctionsCount / statistics.fitnessFunctionCount;

        statistics.bestTestSuiteSize = testSuite.length;

        for (const test of testSuite) {
            statistics.testEventCount += test.getEventsCount();
        }
    }

    protected async getTestSuite(tests: TestChromosome[]): Promise<WhiskerTest[]> {
        let whiskerTests: WhiskerTest[];

        if (this._config.isMinimizationActive()) {
            whiskerTests = await this.getMinimizedTestSuite(tests);
        } else {
            whiskerTests = await this.getCoveringTestSuite(tests);
        }

        if (this._config.isAssertionGenerationActive()) {
            const assertionGenerator = new AssertionGenerator();
            if (this._config.isMinimizeAssertionsActive()) {
                await assertionGenerator.addStateChangeAssertions(whiskerTests);
            } else {
                await assertionGenerator.addAssertions(whiskerTests);
            }
        }

        return whiskerTests;
    }

    protected async getMinimizedTestSuite(tests: TestChromosome[]): Promise<WhiskerTest[]> {
        const minimizedSuite: WhiskerTest[] = [];
        const coveredObjectives = new Set<number>();
        const nTestsPreMinimization = tests.length;
        const timeBudget = Container.config.getMinimizationTimeBudget() === 0 ?
            Number.POSITIVE_INFINITY : Container.config.getMinimizationTimeBudget();
        const startTime = Date.now();

        Container.debugLog(`Starting minimization for ${nTestsPreMinimization} tests and a time-limit of ${timeBudget}`);

        // Sort by depth as leaves in the CDG cover all previous targets.
        const sortedFitnessFunctions = new Map<number, FitnessFunction<TestChromosome>>([...this._fitnessFunctions].sort((a, b) =>
            b[1].getCDGDepth() - a[1].getCDGDepth()
        ));

        // Map statements to the tests that cover them.
        const fitnessMap = new Map<number, TestChromosome[]>();
        for (const [objective, fitnessFunction] of sortedFitnessFunctions.entries()) {
            fitnessMap.set(objective, []);
            for (const test of tests) {
                if (await fitnessFunction.isCovered(test)) {
                    fitnessMap.get(objective).push(test);
                }
            }
        }

        // Iterate over all tests and minimize them if we have time left.
        for (const [objective, coveringTests] of fitnessMap.entries()) {
            if (coveredObjectives.has(objective)) {
                continue;
            }
            if (coveringTests.length > 0) {
                const testToMinimize = Randomness.getInstance().pick(coveringTests);
                let test: TestChromosome;

                // We have still time for minimization left
                if (Date.now() - startTime < timeBudget) {
                    const minimizer = new TestMinimizer(this._fitnessFunctions.get(objective),
                        Container.config.searchAlgorithmProperties['reservedCodons']);
                    test = await minimizer.minimize(testToMinimize, timeBudget);
                }

                // No time left, hence we do not minimize the test.
                else {
                    test = testToMinimize;
                }
                minimizedSuite.push(new WhiskerTest(test));
                await this.updateCoveredObjectives(coveredObjectives, test);
            }
        }

        StatisticsCollector.getInstance().minimizedTests = nTestsPreMinimization - minimizedSuite.length;
        Container.debugLog(`Minimization finished with a difference of ${minimizedSuite.length - nTestsPreMinimization} tests and a duration of ${Date.now() - startTime} ms`);
        return minimizedSuite;
    }

    protected async getCoveringTestSuite(tests: TestChromosome[]): Promise<WhiskerTest[]> {
        const testSuite: WhiskerTest[] = [];
        const coveringTestsPerObjective = await this.getCoveringTestsPerObjective(tests);
        const coveredObjectives = new Set<number>();

        // For each uncovered objective with a single covering test: Add the test
        for (const objective of coveringTestsPerObjective.keys()) {
            if (!coveredObjectives.has(objective) && coveringTestsPerObjective.get(objective).length === 1) {
                const [test] = coveringTestsPerObjective.get(objective);
                testSuite.push(new WhiskerTest(test));
                await this.updateCoveredObjectives(coveredObjectives, test);
            }
        }

        // For each yet uncovered objective: Add the shortest test
        for (const objective of coveringTestsPerObjective.keys()) {
            if (!coveredObjectives.has(objective)) {
                let shortestTest = undefined;
                for (const test of coveringTestsPerObjective.get(objective)) {
                    if (shortestTest == undefined || shortestTest.getLength() > test.getLength()) {
                        shortestTest = test;
                    }
                }
                testSuite.push(new WhiskerTest(shortestTest));
                await this.updateCoveredObjectives(coveredObjectives, shortestTest);
            }
        }

        return testSuite;
    }

    private async getCoveringTestsPerObjective(tests: TestChromosome[]): Promise<Map<number, TestChromosome[]>> {
        const coveringTestsPerObjective = new Map<number, TestChromosome[]>();
        for (const objective of this._fitnessFunctions.keys()) {
            const fitnessFunction = this._fitnessFunctions.get(objective);
            const coveringTests: TestChromosome[] = [];
            for (const test of tests) {
                if (await fitnessFunction.isCovered(test)) {
                    coveringTests.push(test);
                }
            }
            if (coveringTests.length > 0) {
                coveringTestsPerObjective.set(objective, coveringTests);
            }
        }
        return coveringTestsPerObjective;
    }

    private async updateCoveredObjectives(coveredObjectives: Set<number>, test: TestChromosome): Promise<void> {
        for (const objective of this._fitnessFunctions.keys()) {
            if (await this._fitnessFunctions.get(objective).isCovered(test)) {
                coveredObjectives.add(objective);
            }
        }
    }

    /**
     * Summarizes all uncovered statements with the following information:
     *   - ApproachLevel
     *   - BranchDistance
     *   - Fitness
     * @returns string in JSON format
     */
    public async summarizeSolution(archive: Map<number, TestChromosome>): Promise<string> {
        const summary = [];
        const bestIndividuals = Arrays.distinct(archive.values());
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const curSummary = {};
            if (!archive.has(fitnessFunctionKey)) {
                const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
                curSummary['block'] = fitnessFunction.toString();
                let fitness = Number.MAX_VALUE;
                let approachLevel = Number.MAX_VALUE;
                let branchDistance = Number.MAX_VALUE;
                let CFGDistance = Number.MAX_VALUE;
                for (const chromosome of bestIndividuals) {
                    const curFitness = await chromosome.getFitness(fitnessFunction);
                    if (curFitness < fitness) {
                        fitness = curFitness;
                        approachLevel = fitnessFunction.getApproachLevel(chromosome);
                        branchDistance = fitnessFunction.getBranchDistance(chromosome);
                        if (branchDistance === 0) {
                            CFGDistance = fitnessFunction.getCFGDistance(chromosome, approachLevel > 0);
                        } else {
                            CFGDistance = Number.MAX_VALUE;
                            //this means that it was unnecessary to calculate cfg distance, since
                            //branch distance was not 0;
                        }
                    }
                }
                curSummary['ApproachLevel'] = approachLevel;
                curSummary['BranchDistance'] = branchDistance;
                curSummary['CFGDistance'] = CFGDistance;
                curSummary['Fitness'] = fitness;
                if (Object.keys(curSummary).length > 0) {
                    summary.push(curSummary);
                }
            }

        }
        return JSON.stringify({'uncoveredBlocks': summary}, undefined, 4);
    }
}
