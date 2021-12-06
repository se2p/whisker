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


import {AbstractVariableLengthMutation} from "./AbstractVariableLengthMutation";
import {TestChromosome} from "../testcase/TestChromosome";

export class VariableLengthConstrainedChromosomeMutation extends AbstractVariableLengthMutation<TestChromosome> {

    constructor(min: number, max: number, length: number, reservedCodons:number , gaussianMutationPower: number) {
        super(min, max, length, reservedCodons, gaussianMutationPower);
    }

    protected _getMutationProbability(idx: number, numberOfCodons: number): number {
        return 1 / numberOfCodons;
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
        // If we have some information about lastImprovedFitnessCodon use this codon as a stopping point for mutation.
        // Value of 2 equals clicking Flag, hence no improvement.
        if(chromosome.lastImprovedFitnessCodon > 2){
            return super.applyUpTo(chromosome, chromosome.lastImprovedFitnessCodon + this._reservedCodons);
        }
        // Else if we have some information about lastImprovedCoverageCodon use this codon as a stopping point for mutation.
        // Value of 2 equals clicking Flag, hence no improvement.
        else if(chromosome.lastImprovedCodon > 2){
            return super.applyUpTo(chromosome, chromosome.lastImprovedCodon + this._reservedCodons);
        }
        // Otherwise, mutate the whole chromosome.
        else{
            return super.applyUpTo(chromosome, chromosome.getLength());
        }
    }
}
