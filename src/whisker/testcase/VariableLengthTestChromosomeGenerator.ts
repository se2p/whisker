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

import {SearchAlgorithmProperties} from "../search/SearchAlgorithmProperties";
import {Randomness} from "../utils/Randomness";
import {TestChromosome} from "./TestChromosome";
import {Mutation} from "../search/Mutation";
import {Crossover} from "../search/Crossover";
import {TestChromosomeGenerator} from "./TestChromosomeGenerator";

export class VariableLengthTestChromosomeGenerator extends TestChromosomeGenerator {

    constructor(properties: SearchAlgorithmProperties<TestChromosome>,
                mutationOp: Mutation<TestChromosome>,
                crossoverOp: Crossover<TestChromosome>) {
        super(properties, mutationOp, crossoverOp);
    }

    protected getLength(): number {
        return 2; // TODO: This should be a parameter
        // return Randomness.getInstance().nextInt(1, this._length);
    }

}
