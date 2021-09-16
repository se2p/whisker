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
import {Randomness} from "../../utils/Randomness";

export class SinglePointRelativeCrossover<C extends ListChromosome<any>> implements Crossover<C> {

    private applyAtPosition (parent1: C, parent2: C, parent1Position: number, parent2Position: number): C {

        // parent1 up to parent1Position + parent2 from parent2Position onwards
        const parent1Genes = parent1.getGenes();
        const parent2Genes = parent2.getGenes();

        const offspringGenes = parent1Genes.clone()
        offspringGenes.clear();

        for (let i = 0; i < parent1Position; i++) {
            offspringGenes.add(parent1Genes.get(i));
        }
        for (let i = parent2Position; i < parent2Genes.size(); i++) {
            offspringGenes.add(parent2Genes.get(i));
        }

        return parent1.cloneWith(offspringGenes);
    }

    apply (parent1: C, parent2: C): Pair<C> {

        // Can only cross over if length is at least 2
        if (parent1.getLength() < 2 || parent2.getLength() < 2) {
            return Pair.of(parent1, parent2);
        }

        // Relative position of crossover
        const splitPoint = Randomness.getInstance().nextDouble();

        const pos1 = Math.floor((parent1.getLength() - 1) * splitPoint) + 1;
        const pos2 = Math.floor((parent2.getLength() - 1) * splitPoint) + 1;

        const offspring1 = this.applyAtPosition(parent1, parent2, pos1, pos2);
        const offspring2 = this.applyAtPosition(parent2, parent1, pos2, pos1);

        return Pair.of(offspring1, offspring2);
    }

    applyFromPair(parents: Pair<C>): Pair<C> {
        return this.apply(parents.getFirst(), parents.getSecond());
    }

}
