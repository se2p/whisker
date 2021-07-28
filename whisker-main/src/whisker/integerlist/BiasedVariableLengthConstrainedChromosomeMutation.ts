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
import {Preconditions} from "../utils/Preconditions";

export class BiasedVariableLengthConstrainedChromosomeMutation extends AbstractVariableLengthMutation<TestChromosome> {

    constructor(min: number, max: number, length: number, gaussianMutationPower: number) {
        super(min, max, length, gaussianMutationPower);
    }

    protected _getMutationProbability(idx: number, numberOfCodons: number): number {
        Preconditions.checkArgument(idx < numberOfCodons);
        return 2 * (idx + 1) / (numberOfCodons * (numberOfCodons + 1));
    }

    apply(chromosome: TestChromosome): TestChromosome {
        if (chromosome.lastImprovedCodon == 0 || chromosome.lastImprovedCodon == chromosome.getLength() - 1) {
            return super.applyUpTo(chromosome, chromosome.getLength());
        } else {
            return super.applyUpTo(chromosome, chromosome.lastImprovedCodon + 1);
        }
    }
}
