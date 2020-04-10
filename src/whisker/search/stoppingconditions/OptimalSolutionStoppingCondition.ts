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
import {FitnessFunction} from "../FitnessFunction";
import {SearchAlgorithm} from "../SearchAlgorithm";

export class OptimalSolutionStoppingCondition<T extends Chromosome> implements StoppingCondition<T> {

    private readonly _fitnessFunction: FitnessFunction<T>;

    constructor(fitnessFunction : FitnessFunction<T>) {
        this._fitnessFunction = fitnessFunction;
    }

    isFinished(algorithm: SearchAlgorithm<T>): boolean {
        let solutions = algorithm.getCurrentSolution();

        // TODO: This could be written in a single line by extending the List class?
        for (let i = 0; i < solutions.size(); i++) {
            const fitness = solutions.get(i).getFitness(this._fitnessFunction);
            if(this._fitnessFunction.isOptimal(fitness)) {
                return true;
            }
        }
        return false;
    }
}
