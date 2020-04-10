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

import {Crossover} from '../search/Crossover';
import {BitstringChromosome} from './BitstringChromosome';
import {Pair} from '../utils/Pair';
import {List} from '../utils/List';
import {Randomness} from '../utils/Randomness';
import {Preconditions} from '../utils/Preconditions';


export class BitstringSinglePointCrossover implements Crossover<BitstringChromosome> {

    applyAtPosition (parent1: BitstringChromosome, parent2: BitstringChromosome, xoverPosition: number): Pair<BitstringChromosome> {
        const parent1Bits = parent1.getBits();
        const parent2Bits = parent2.getBits();
        Preconditions.checkArgument(parent1Bits.size() === parent2Bits.size());

        const offspring1Bits = new List<Boolean>();
        const offspring2Bits = new List<Boolean>();

        for (let i = 0; i < xoverPosition; i++) {
            offspring1Bits.add(parent1Bits.get(i));
            offspring2Bits.add(parent2Bits.get(i));
        }
        for (let i = xoverPosition; i < parent1Bits.size(); i++) {
            offspring1Bits.add(parent2Bits.get(i));
            offspring2Bits.add(parent1Bits.get(i));
        }

        return Pair.of(new BitstringChromosome(offspring1Bits), new BitstringChromosome(offspring2Bits));
    }

    apply (parent1: BitstringChromosome, parent2: BitstringChromosome): Pair<BitstringChromosome> {
        const parent1Bits = parent1.getBits();
        const parent2Bits = parent2.getBits();
        Preconditions.checkArgument(parent1Bits.size() === parent2Bits.size());

        const xoverPosition = Randomness.getInstance().nextInt(0, parent1Bits.size());
        return this.applyAtPosition(parent1, parent2, xoverPosition);
    }

    applyFromPair (parents: Pair<BitstringChromosome>): Pair<BitstringChromosome> {
        return this.apply(parents.getFirst(), parents.getSecond());
    }
}
