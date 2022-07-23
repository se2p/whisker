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

import {GeneticAlgorithmProperties} from "../search/SearchAlgorithmProperties";
import {Randomness} from "../utils/Randomness";
import {TestChromosome} from "./TestChromosome";
import {Mutation} from "../search/Mutation";
import {Crossover} from "../search/Crossover";
import {TestChromosomeGenerator} from "./TestChromosomeGenerator";

export class VariableLengthTestChromosomeGenerator extends TestChromosomeGenerator {

    private readonly _minInitialLength: number;
    private readonly _maxInitialLength: number;

    constructor(properties: GeneticAlgorithmProperties<TestChromosome>,
                mutationOp: Mutation<TestChromosome>,
                crossoverOp: Crossover<TestChromosome>,
                minInitialLength: number,
                maxInitialLength: number) {
        super(properties, mutationOp, crossoverOp);
        this._minInitialLength = minInitialLength;
        this._maxInitialLength = maxInitialLength;
    }

    /**
     * Randomly select a length in the range of [minInitialLength, maxInitialLength] that includes the reserved
     * codon space.
     * @returns number representing the length of the codon sequence that should be generated.
     */
    protected override getLength(): number {
        const length = Randomness.getInstance().nextInt(this._minInitialLength, this._maxInitialLength);
        return length * this._properties.reservedCodons;
    }

}
