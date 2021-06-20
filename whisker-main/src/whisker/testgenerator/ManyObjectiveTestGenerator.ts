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
import {WhiskerTestListWithSummary} from "./WhiskerTestListWithSummary";
import {ReductionLocalSearch} from "../search/operators/LocalSearch/ReductionLocalSearch";
import {Container} from "../utils/Container";

/**
 * A many-objective search algorithm can generate tests
 * for all coverage objectives at the same time.
 */
export class ManyObjectiveTestGenerator extends TestGenerator {

    async generateTests(project: ScratchProject): Promise<WhiskerTestListWithSummary> {

        // TODO: Ensure this is a many-objective algorithm taking all goals
        const searchAlgorithm = this.buildSearchAlgorithm(true);

        // TODO: Assuming there is at least one solution?
        const testChromosomes = await searchAlgorithm.findSolution();

        // Check if we can remove unnecessary events in our final testSuite.
        const reductionOperator = new ReductionLocalSearch(Container.vmWrapper, Container.config.getEventExtractor(), 1);
        for (const chromosome of testChromosomes) {
            if (reductionOperator.isApplicable(chromosome)) {
                const reducedChromosome = await reductionOperator.apply(chromosome);
                if (reductionOperator.hasImproved(chromosome, reducedChromosome)) {
                    testChromosomes.replace(chromosome, reducedChromosome);
                }
            }
        }

        const testSuite = await this.getTestSuite(testChromosomes);

        await this.collectStatistics(testSuite);

        const summary = searchAlgorithm.summarizeSolution();

        return new WhiskerTestListWithSummary(testSuite, summary);
    }
}
