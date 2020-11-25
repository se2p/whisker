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

import {FitnessFunction} from "../search/FitnessFunction";
import {IntegerListChromosome} from "../integerlist/IntegerListChromosome";
import {Trace} from 'scratch-vm/src/engine/tracing'
import {List} from "../utils/List";
import {Mutation} from "../search/Mutation";
import {Crossover} from "../search/Crossover";

// TODO: Is-a IntegerListChromosome or has-a IntegerListChromosome?

export class TestChromosome extends IntegerListChromosome {

    // TODO: We should probably store the last execution trace
    // -> When fitness is calculated without any mutation we
    //    don't need to re-execute the test but use the trace
    private _trace: Trace;

    constructor(codons: List<number>, mutationOp: Mutation<IntegerListChromosome>, crossoverOp: Crossover<IntegerListChromosome>) {
        super(codons, mutationOp, crossoverOp);
        this._trace = null;
    }

    async getFitness(fitnessFunction: FitnessFunction<this>): Promise<number> {
        const fitness = await fitnessFunction.getFitness(this);
        // TODO: cache execution traces?
        return fitness;
    }

    get trace(): Trace {
        return this._trace;
    }

    set trace(value: Trace) {
        this._trace = value;
    }

    clone() {
        const clone = new TestChromosome(this.getGenes(), this.getMutationOperator(), this.getCrossoverOperator());
        clone.trace = this._trace;
        return clone;
    }
}
