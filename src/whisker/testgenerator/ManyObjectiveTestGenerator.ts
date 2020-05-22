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
import {StatementCoverageFitness} from '../testcase/fitness/StatementFitnessFunction';
import {NotYetImplementedException} from '../core/exceptions/NotYetImplementedException';
import {WhiskerSearchConfiguration} from "../utils/WhiskerSearchConfiguration";
import {SearchAlgorithm} from "../search/SearchAlgorithm";
import {SearchAlgorithmBuilder} from "../search/SearchAlgorithmBuilder";

/**
 * A many-objective search algorithm can generate tests
 * for all coverage objectives at the same time.
 */
export class ManyObjectiveTestGenerator implements TestGenerator {

    private _config: WhiskerSearchConfiguration;

    constructor(configuration: WhiskerSearchConfiguration) {
        this._config = configuration;
    }

    generateTests(project: ScratchProject): List<WhiskerTest> {
        // TODO: Ensure this is a many-objective algorithm taking all goals
        const searchAlgorithm = this._buildSearchAlgorithm();

        // TODO: Assuming there is at least one solution?
        const testChromosomes = searchAlgorithm.findSolution();

        const testSuite = new List<WhiskerTest>();
        for (const testChromosome of testChromosomes) {
            testSuite.add(new WhiskerTest(testChromosome));
        }

        // TODO: Handle statistics

        return testSuite;
    }

    private _buildSearchAlgorithm(): SearchAlgorithm<any> {
        // TODO: Shared with IterativeSearchBasedTestGenerator, probably best to extract
        return new SearchAlgorithmBuilder(this._config.getAlgorithm())

            .addSelectionOperator(this._config.getSelectionOperator())
            .addProperties(this._config.getSearchAlgorithmProperties())
            .initializeFitnessFunction(this._config.getFitnessFunctionType(),
                this._config.getSearchAlgorithmProperties().getChromosomeLength(),
                this._config.getFitnessFunctionTargets())
            .addChromosomeGenerator(this._config.getChromosomeGenerator())

            .buildSearchAlgorithm();
    }
}
