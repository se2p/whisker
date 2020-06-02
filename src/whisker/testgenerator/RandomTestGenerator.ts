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
import {ScratchProject} from '../scratch/ScratchProject';
import {List} from '../utils/List';
import {WhiskerTest} from './WhiskerTest';
import {SearchAlgorithmProperties} from '../search/SearchAlgorithmProperties';
import {WhiskerSearchConfiguration} from "../utils/WhiskerSearchConfiguration";
import {ChromosomeGenerator} from "../search/ChromosomeGenerator";
import {TestChromosome} from "../testcase/TestChromosome";
import {SearchAlgorithm} from "../search/SearchAlgorithm";
import {Selection} from "../search/Selection";
import {NotSupportedFunctionException} from "../core/exceptions/NotSupportedFunctionException";
import {FitnessFunction} from "../search/FitnessFunction";
import {Chromosome} from "../search/Chromosome";
import {SearchAlgorithmBuilder} from "../search/SearchAlgorithmBuilder";
import {StatisticsCollector} from "../utils/StatisticsCollector";

/**
 * A naive approach to generating tests is to simply
 * use the chromosome factory and generate completely
 * random tests.
 */
export class RandomTestGenerator implements TestGenerator, SearchAlgorithm<TestChromosome> {

    private _config: WhiskerSearchConfiguration;

    private _startTime: number;

    private _iterations = 0;

    private _fitnessFunctions: Map<number, FitnessFunction<TestChromosome>>;

    private _tests = new List<TestChromosome>();

    constructor(configuration: WhiskerSearchConfiguration) {
        this._config = configuration;
        this._fitnessFunctions = this._extractCoverageGoals();
    }

    // eslint-disable-next-line no-unused-vars
    generateTests(project: ScratchProject): List<WhiskerTest> {
        const testSuite = new List<WhiskerTest>();
        const uncoveredGoals = new List<FitnessFunction<TestChromosome>>();
        StatisticsCollector.getInstance().fitnessFunctionCount = this._fitnessFunctions.size;

        for (const ff of this._fitnessFunctions.values()) {
            uncoveredGoals.add(ff);
        }

        const chromosomeGenerator = this._config.getChromosomeGenerator();
        const stoppingCondition = this._config.getSearchAlgorithmProperties().getStoppingCondition();

        while(!stoppingCondition.isFinished(this)) {
            console.log("Iteration "+this._iterations+": "+uncoveredGoals.size()+"/"+this._fitnessFunctions.size +" goals remaining");
            this._iterations++;
            StatisticsCollector.getInstance().incrementIterationCount();
            const testChromosome = chromosomeGenerator.get();
            const coveredGoals = new List<FitnessFunction<TestChromosome>>();
            for (const ff of uncoveredGoals) {
                if (ff.isCovered(testChromosome)) {
                    console.log("Goal "+ff+" was successfully covered, keeping test.");
                    this._tests.add(testChromosome);
                    testSuite.add(new WhiskerTest(testChromosome));
                    coveredGoals.add(ff);
                    StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount();
                }
            }
            for(const ff of coveredGoals) {
                uncoveredGoals.remove(ff);
            }
        }

        StatisticsCollector.getInstance().bestCoverage = (this._fitnessFunctions.size / StatisticsCollector.getInstance().coveredFitnessFunctionsCount);
        StatisticsCollector.getInstance().bestTestSuiteSize = testSuite.size();

        return testSuite;
    }

    // eslint-disable-next-line no-unused-vars
    _extractCoverageGoals(): Map<number, FitnessFunction<Chromosome>> {
        const builder = new SearchAlgorithmBuilder(
            this._config.getAlgorithm()
        ).initializeFitnessFunction(this._config.getFitnessFunctionType(),
            this._config.getSearchAlgorithmProperties().getChromosomeLength(),
            this._config.getFitnessFunctionTargets());
        return builder.fitnessFunctions;
    }

    getCurrentSolution(): List<TestChromosome> {
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

    findSolution(): List<TestChromosome> {
        throw new NotSupportedFunctionException();
    }

    setChromosomeGenerator(generator: ChromosomeGenerator<TestChromosome>): void {
        throw new NotSupportedFunctionException();
    }

    setFitnessFunction(fitnessFunction: FitnessFunction<TestChromosome>): void {
        throw new NotSupportedFunctionException();
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<TestChromosome>>): void {
        throw new NotSupportedFunctionException();
    }

    setHeuristicFunctions(heuristicFunctions: Map<number, Function>): void {
        throw new NotSupportedFunctionException();
    }

    setProperties(properties: SearchAlgorithmProperties<TestChromosome>): void {
        throw new NotSupportedFunctionException();
    }

    setSelectionOperator(selectionOperator: Selection<TestChromosome>): void {
        throw new NotSupportedFunctionException();
    }



}
