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
import {List} from '../utils/List';
import {WhiskerSearchConfiguration} from "../utils/WhiskerSearchConfiguration";
import {StatisticsCollector} from "../utils/StatisticsCollector";
import {FitnessFunction} from "../search/FitnessFunction";
import {SearchAlgorithmBuilder} from "../search/SearchAlgorithmBuilder";
import {SearchAlgorithm} from "../search/SearchAlgorithm";
import {TestChromosome} from "../testcase/TestChromosome";

export abstract class TestGenerator {

    _config: WhiskerSearchConfiguration;

    _fitnessFunctions: Map<number, FitnessFunction<TestChromosome>>;

    constructor(configuration: WhiskerSearchConfiguration) {
        this._config = configuration;
    }

    public abstract generateTests(project: ScratchProject): Promise<List<WhiskerTest>>;

    protected buildSearchAlgorithm(initializeFitnessFunction: boolean): SearchAlgorithm<any> {
        const builder = new SearchAlgorithmBuilder(this._config.getAlgorithm())
        .addSelectionOperator(this._config.getSelectionOperator())
        .addProperties(this._config.getSearchAlgorithmProperties());
        if (initializeFitnessFunction) {
            builder.initializeFitnessFunction(this._config.getFitnessFunctionType(),
                this._config.getSearchAlgorithmProperties().getChromosomeLength(),
                this._config.getFitnessFunctionTargets());
            this._fitnessFunctions = builder.fitnessFunctions;
        }
        builder.addChromosomeGenerator(this._config.getChromosomeGenerator());
        return builder.buildSearchAlgorithm();
    }

    protected extractCoverageGoals(): Map<number, FitnessFunction<any>> {
        return new SearchAlgorithmBuilder(this._config.getAlgorithm())
        .initializeFitnessFunction(this._config.getFitnessFunctionType(),
            this._config.getSearchAlgorithmProperties().getChromosomeLength(),
            this._config.getFitnessFunctionTargets()).fitnessFunctions;
    }

    protected collectStatistics(testSuite: List<WhiskerTest>): void {
        const statistics = StatisticsCollector.getInstance();

        StatisticsCollector.getInstance().bestCoverage =
            statistics.coveredFitnessFunctionsCount / statistics.fitnessFunctionCount;

        statistics.bestTestSuiteSize = testSuite.size();

        for (const test of testSuite) {
            statistics.testEventCount += test.getEventsCount();
        }
    }

    protected getTestSuite(tests: List<TestChromosome>): List<WhiskerTest> {
        const testSuite = new List<WhiskerTest>();
        const coveringTestsPerObjective = this.getCoveringTestsPerObjective(tests);
        const coveredObjectives = new Set<number>();

        // For each uncovered objective with a single covering test: Add the test
        for (const objective of coveringTestsPerObjective.keys()) {
            if (!coveredObjectives.has(objective) && coveringTestsPerObjective.get(objective).size() == 1) {
                const test = coveringTestsPerObjective.get(objective).get(0);
                testSuite.add(new WhiskerTest(test));
                this.updateCoveredObjectives(coveredObjectives, test);
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
                testSuite.add(new WhiskerTest(shortestTest));
                this.updateCoveredObjectives(coveredObjectives, shortestTest);
            }
        }

        return testSuite;
    }

    private getCoveringTestsPerObjective(tests: List<TestChromosome>): Map<number, List<TestChromosome>> {
        const coveringTestsPerObjective = new Map<number, List<TestChromosome>>();
        for (const objective of this._fitnessFunctions.keys()) {
            const fitnessFunction = this._fitnessFunctions.get(objective);
            const coveringTests = new List<TestChromosome>();
            for (const test of tests) {
                if (fitnessFunction.isCovered(test)) {
                    coveringTests.add(test)
                }
            }
            if (coveringTests.size() > 0) {
                coveringTestsPerObjective.set(objective, coveringTests);
            }
        }
        return coveringTestsPerObjective;
    }

    private updateCoveredObjectives(coveredObjectives: Set<number>, test: TestChromosome): void {
        for (const objective of this._fitnessFunctions.keys()) {
            if (this._fitnessFunctions.get(objective).isCovered(test)) {
                coveredObjectives.add(objective);
            }
        }
    }
}
