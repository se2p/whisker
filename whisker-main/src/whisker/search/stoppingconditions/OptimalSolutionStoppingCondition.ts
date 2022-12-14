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

import {StoppingCondition} from '../StoppingCondition';
import {Chromosome} from "../Chromosome";
import {SearchAlgorithm} from "../SearchAlgorithm";

export class OptimalSolutionStoppingCondition<T extends Chromosome> implements StoppingCondition<T> {

    isFinished(algorithm: SearchAlgorithm<T>): boolean {
        const solutions = algorithm.getCurrentSolution();
        const fitnessFunctions = algorithm.getFitnessFunctions();

        // TODO: This could be written in a single line by extending the List class?
        for (const f of fitnessFunctions) {
            let fitnessCovered = false;
            for (const solution of solutions) {
                const fitness = solution.getFitness(f);
                if (f.isOptimal(fitness)) {
                    fitnessCovered = true;
                    break;
                }
            }

            if (!fitnessCovered) {
                return false;
            }
        }

        return true;
    }

    getProgress(algorithm: SearchAlgorithm<T>): number {
        let coveredFitnessFunctions = 0;
        let totalFitnessFunctions = 0;
        for (const f of algorithm.getFitnessFunctions()) {
            totalFitnessFunctions++;
            for (const solution of algorithm.getCurrentSolution()) {
                if (f.isOptimal(solution.getFitness(f))) {
                    coveredFitnessFunctions++;
                    break;
                }
            }
        }
        return coveredFitnessFunctions / totalFitnessFunctions;
    }
}
