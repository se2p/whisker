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


import {Preconditions} from "../utils/Preconditions";
import {VariableLengthConstrainedChromosomeMutation} from "./VariableLengthConstrainedChromosomeMutation";

export class BiasedVariableLengthConstrainedChromosomeMutation extends VariableLengthConstrainedChromosomeMutation {

    constructor(min: number, max: number, length: number, reservedCodons:number , gaussianMutationPower: number) {
        super(min, max, length, reservedCodons, gaussianMutationPower);
    }

    protected override _getMutationProbability(idx: number, numberOfCodons: number): number {
        Preconditions.checkArgument(idx < numberOfCodons);
        return 2 * (idx + 1) / (numberOfCodons * (numberOfCodons + 1));
    }
}
