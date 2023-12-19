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

import {Chromosome} from "./Chromosome";

/**
 * The Chromosome defines a gene representation for valid solutions to a given optimization problem.
 *
 * @param <C> the type of the chromosomes produced as offspring by mutation and crossover
 * @author Sophia Geserer
 */
export abstract class ListChromosome<T> extends Chromosome {

    private _genes: T[];

    protected constructor(genes: T[]) {
        super();
        this._genes = [...genes];
    }

    /**
     * A chromosome consists of a sequence of genes. This method returns the number of genes.
     */
    getLength(): number {
        return this._genes.length;
    }

    getGenes(): T[] {
        return this._genes;
    }

    setGenes(genes: T[]): void {
        this._genes = genes;
    }

    public override toString = () : string => {
        let result = "";
        for(const gene of this.getGenes()) {
            result += gene + ":";
        }

        return result;
    }

    /**
     * Create a copy with newGenes
     * TODO: This is a bit of a hack because of polymorphism. There must be a nicer way?
     * @param newGenes
     */
    abstract override cloneWith(newGenes: T[]);
}
