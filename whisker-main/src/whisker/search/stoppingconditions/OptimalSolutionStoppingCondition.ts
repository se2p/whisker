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
import {StatisticsCollector} from "../../utils/StatisticsCollector";

export class OptimalSolutionStoppingCondition<T extends Chromosome> implements StoppingCondition<T> {

    isFinished(algorithm: SearchAlgorithm<T>): boolean {
        const fitnessFunctionCount = [...algorithm.getFitnessFunctions()].length;
        return StatisticsCollector.getInstance().coveredFitnessFunctionsCount === fitnessFunctionCount;
    }

    getProgress(algorithm: SearchAlgorithm<T>): number {
        const fitnessFunctionCount = [...algorithm.getFitnessFunctions()].length;
        return fitnessFunctionCount / StatisticsCollector.getInstance().coveredFitnessFunctionsCount;
    }
}
