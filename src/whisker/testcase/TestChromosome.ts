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

import { ExecutionTrace } from "./ExecutionTrace";
import {FitnessFunction} from "../search/FitnessFunction";
import {IntegerListChromosome} from "../integerlist/IntegerListChromosome";

// TODO: Is-a IntegerListChromosome or has-a IntegerListChromosome?

export class TestChromosome extends IntegerListChromosome {

    // TODO: We should probably store the last execution trace
    // -> When fitness is calculated without any mutation we
    //    don't need to re-execute the test but use the trace
    private _trace: ExecutionTrace;

    getFitness(fitnessFunction: FitnessFunction<this>): number {
        const fitness = fitnessFunction.getFitness(this);
        // TODO: cache execution traces?
        return fitness;
    }

}
