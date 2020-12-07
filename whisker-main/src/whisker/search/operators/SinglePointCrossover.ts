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

import { Crossover } from "../Crossover";
import { Pair } from "../../utils/Pair";
import {ListChromosome} from "../ListChromosome";
import {Preconditions} from "../../utils/Preconditions";
import {Randomness} from "../../utils/Randomness";

export class SinglePointCrossover<C extends ListChromosome<any>> implements Crossover<C> {

    applyAtPosition (parent1: C, parent2: C, xoverPosition: number): Pair<C> {
        Preconditions.checkArgument(parent1.getLength() === parent2.getLength());

        const parent1Genes = parent1.getGenes();
        const parent2Genes = parent2.getGenes();

        // TODO: Yuck. How to do this properly?
        const offspring1Genes = parent1Genes.clone()
        const offspring2Genes = parent2Genes.clone()
        offspring1Genes.clear();
        offspring2Genes.clear();

        for (let i = 0; i < xoverPosition; i++) {
            offspring1Genes.add(parent1Genes.get(i));
            offspring2Genes.add(parent2Genes.get(i));
        }
        for (let i = xoverPosition; i < parent1Genes.size(); i++) {
            offspring1Genes.add(parent2Genes.get(i));
            offspring2Genes.add(parent1Genes.get(i));
        }

        return Pair.of(parent1.cloneWith(offspring1Genes), parent2.cloneWith(offspring2Genes));
    }

    apply (parent1: C, parent2: C): Pair<C> {
        Preconditions.checkArgument(parent1.getLength() === parent2.getLength());
        const xoverPosition = Randomness.getInstance().nextInt(0, parent1.getLength());
        return this.applyAtPosition(parent1, parent2, xoverPosition);
    }

    applyFromPair(parents: Pair<C>): Pair<C> {
        return this.apply(parents.getFirst(), parents.getSecond());
    }

}
