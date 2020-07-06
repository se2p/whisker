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

    public abstract generateTests(project: ScratchProject): List<WhiskerTest>;

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
        for (const test of tests) {
            let addTest = true;
            for (const whiskerTest of testSuite) {
                if (this.compareTestCoverage(test, whiskerTest.chromosome)) {
                    addTest = false;
                    break;
                }
            }
            if (addTest) {
                testSuite.add(new WhiskerTest(test));
            }
        }
        return testSuite;
    }

    private compareTestCoverage(test1: TestChromosome, test2: TestChromosome): boolean {
        for (const fitnessFunction of this._fitnessFunctions.values()) {
            if (fitnessFunction.isCovered(test1) != fitnessFunction.isCovered(test2)) {
                return false;
            }
        }
        return true;
    }
}
