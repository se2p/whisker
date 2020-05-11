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
import {StatementCoverageFitness} from '../testcase/StatementFitnessFunction';
import {List} from '../utils/List';
import {NotYetImplementedException} from '../core/exceptions/NotYetImplementedException';
import {SearchAlgorithmFactory} from '../search/SearchAlgorithmFactory';
import {TestChromosome} from '../testcase/TestChromosome';
import {SearchAlgorithmProperties} from '../search/SearchAlgorithmProperties';
import {WhiskerTest} from './WhiskerTest';
import {WhiskerSearchConfiguration} from "../utils/WhiskerSearchConfiguration";
import {SearchAlgorithmBuilder} from "../search/SearchAlgorithmBuilder";
import {SearchAlgorithmBuilderDev} from "../search/SearchAlgorithmBuilderDev";
import {BitstringChromosomeGenerator} from "../bitstring/BitstringChromosomeGenerator";
import {TestChromosomeGenerator} from "../testcase/TestChromosomeGenerator";
import {SearchAlgorithm} from "../search/SearchAlgorithm";

/**
 * To generate a test suite using single-objective search,
 * this class iterates over the list of coverage goals in
 * a project and instantiates a new search for each goal.
 */
export class IterativeSearchBasedTestGenerator implements TestGenerator {

    private _config: WhiskerSearchConfiguration;

    constructor(configuration: WhiskerSearchConfiguration) {
        this._config = configuration;
    }

    generateTests(project: ScratchProject): List<WhiskerTest> {
        const testSuite = new List<WhiskerTest>();
        const testChromosomes = new List<TestChromosome>();
        const fitnessFunctions = this._extractCoverageGoals(project);

        for (const fitnessFunction of fitnessFunctions) {
            if (this._isCovered(fitnessFunction, testChromosomes)) {
                // If already covered, we don't need to search again
                continue;
            }
            // TODO: Somehow set the fitness function as objective
            const searchAlgorithm = this._buildSearchAlgorithm();
            // TODO: Assuming there is at least one solution?
            const testChromosome = searchAlgorithm.findSolution().get(0);

            if (fitnessFunction.isCovered(testChromosome)) {
                testChromosomes.add(testChromosome);
                testSuite.add(new WhiskerTest(testChromosome));
            }
        }

        // TODO: Handle statistics

        return testSuite;
    }

    _isCovered(coverageGoal: StatementCoverageFitness, testSuite: List<TestChromosome>): boolean {
        // TODO: Could be written in a single line
        for (const testChromosome of testSuite) {
            if (coverageGoal.isCovered(testChromosome)) {
                return true;
            }
        }
        return false;
    }

    // eslint-disable-next-line no-unused-vars
    _extractCoverageGoals(project: ScratchProject): List<StatementCoverageFitness> {
        throw new NotYetImplementedException();
    }

    private _buildSearchAlgorithm(): SearchAlgorithm<any> {
        return new SearchAlgorithmBuilderDev(this._config.getAlgorithm())

            .addSelectionOperator(this._config.getSelectionOperator())
            .addProperties(this._config.getSearchAlgorithmProperties())
            .initializeFitnessFunction(this._config.getFitnessFunctionType(),
                this._config.getSearchAlgorithmProperties().getChromosomeLength())
            .addChromosomeGenerator(this._config.getChromosomeGenerator())

            .buildSearchAlgorithm();
    }
}
