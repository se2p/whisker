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
import {TestChromosome} from '../testcase/TestChromosome';
import {WhiskerTest} from './WhiskerTest';
import {StatisticsCollector} from "../utils/StatisticsCollector";
import {FitnessFunction} from "../search/FitnessFunction";
import {WhiskerTestListWithSummary} from "./WhiskerTestListWithSummary";

/**
 * To generate a test suite using single-objective search,
 * this class iterates over the list of coverage goals in
 * a project and instantiates a new search for each goal.
 */
export class IterativeSearchBasedTestGenerator extends TestGenerator {

    async generateTests(project: ScratchProject): Promise<WhiskerTestListWithSummary> {
        const testChromosomes = new List<TestChromosome>();
        this._fitnessFunctions = this.extractCoverageGoals();
        let numGoal = 1;
        const totalGoals = this._fitnessFunctions.size;

        for (const fitnessFunction of this._fitnessFunctions.values()) {
            console.log("Current goal "+numGoal+"/"+totalGoals+": "+fitnessFunction);
            numGoal++;
            if (await this._isCovered(fitnessFunction, testChromosomes)) {
                // If already covered, we don't need to search again
                console.log("Goal "+fitnessFunction+" already covered, skipping.");
                continue;
            }
            // TODO: Somehow set the fitness function as objective
            const searchAlgorithm = this.buildSearchAlgorithm(false);
            searchAlgorithm.setFitnessFunction(fitnessFunction);
            // TODO: Assuming there is at least one solution?
            const testChromosome = (await searchAlgorithm.findSolution()).get(0);

            if (await fitnessFunction.isCovered(testChromosome)) {
                console.log("Goal "+fitnessFunction+" was successfully covered, keeping test.");
                testChromosomes.add(testChromosome);
                StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount();
            } else {
                console.log("Goal "+fitnessFunction+" was not successfully covered.");
            }
        }
        const testSuite = await this.getTestSuite(testChromosomes);
        await this.collectStatistics(testSuite);
        return new WhiskerTestListWithSummary(testSuite, '');
    }

    async _isCovered(coverageGoal: FitnessFunction<any>, testSuite: List<TestChromosome>): Promise<boolean> {
        // TODO: Could be written in a single line
        for (const testChromosome of testSuite) {
            if (await coverageGoal.isCovered(testChromosome)) {
                return true;
            }
        }
        return false;
    }
}
