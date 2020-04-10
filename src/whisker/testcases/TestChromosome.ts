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

import { Chromosome } from "../search/Chromosome";
import { ExecutionTrace } from "./ExecutionTrace";
import {NotYetImplementedException} from "../core/exceptions/NotYetImplementedException";
import {Mutation} from "../search/Mutation";
import {Crossover} from "../search/Crossover";
import {FitnessFunction} from "../search/FitnessFunction";

export class TestChromosome extends Chromosome {

    private _trace: ExecutionTrace;

    protected getMutationOperator(): Mutation<this> {
        throw new NotYetImplementedException();
    }

    protected getCrossoverOperator(): Crossover<this> {
        throw new NotYetImplementedException();
    }

    getFitness(fitnessFunction: FitnessFunction<this>): number {
        throw new NotYetImplementedException();
    }

}
