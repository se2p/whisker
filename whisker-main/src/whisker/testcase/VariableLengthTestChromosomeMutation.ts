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


import {AbstractVariableLengthMutation} from "../integerlist/AbstractVariableLengthMutation";
import {TestChromosome} from "./TestChromosome";

export class VariableLengthTestChromosomeMutation extends AbstractVariableLengthMutation<TestChromosome> {

    constructor(min: number, max: number, length: number, gaussianMutationPower: number) {
        super(min, max, length, gaussianMutationPower);
    }

    /**
     * Returns a mutated deep copy of the given chromosome.
     * Each integer in the codon list mutates with a probability of one divided by the lists size.
     * If a index inside the list mutates it executes one of the following mutations with equal probability:
     *  - add a new codon to the list at the index
     *  - replace the current codon at the index using gaussian noise
     *  - remove the current codon at the index
     * @param chromosome The original chromosome, that mutates.
     * @return A mutated deep copy of the given chromosome.
     */
    apply(chromosome: TestChromosome): TestChromosome {
        if (chromosome.lastImprovedCodon == 0 || chromosome.lastImprovedCodon == chromosome.getLength() - 1) {
            return super.applyUpTo(chromosome, chromosome.getLength());
        } else {
            console.log("Mutating up to " + chromosome.lastImprovedCodon +" at length "+chromosome.getLength());
            return super.applyUpTo(chromosome, chromosome.lastImprovedCodon + 1);
        }
    }
}
