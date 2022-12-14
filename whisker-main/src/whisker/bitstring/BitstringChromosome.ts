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

import {Crossover} from "../search/Crossover";
import {Mutation} from "../search/Mutation";
import {ListChromosome} from "../search/ListChromosome";

export class BitstringChromosome extends ListChromosome<boolean> {

    /**
     * The crossover operation that defines how to manipulate the gene of two chromosomes.
     */
    private readonly _crossoverOp: Crossover<BitstringChromosome>;

    /**
     * The mutation operator that defines how to mutate the chromosome.
     */
    private readonly _mutationOp: Mutation<BitstringChromosome>;

    constructor(bits: boolean[], mutationOp: Mutation<BitstringChromosome>, crossoverOp: Crossover<BitstringChromosome>) {
        super(bits);
        this._crossoverOp = crossoverOp;
        this._mutationOp = mutationOp;
    }

    getCrossoverOperator(): Crossover<this> {
        return this._crossoverOp as Crossover<this>;
    }

    getMutationOperator(): Mutation<this> {
        return this._mutationOp as Mutation<this>;
    }

    cloneWith(newGenes: boolean[]) {
        return new BitstringChromosome(newGenes, this._mutationOp, this._crossoverOp);
    }

    clone() {
        return new BitstringChromosome(this.getGenes(), this._mutationOp, this._crossoverOp);
    }
}
