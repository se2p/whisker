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

import {Crossover} from "../Crossover";
import {Pair} from "../../utils/Pair";
import {ListChromosome} from "../ListChromosome";
import {Preconditions} from "../../utils/Preconditions";
import {Randomness} from "../../utils/Randomness";
import Arrays from "../../utils/Arrays";

export class SinglePointCrossover<C extends ListChromosome<any>> extends Crossover<C> {

    applyAtPosition (parent1: C, parent2: C, xoverPosition: number): Pair<C> {
        Preconditions.checkArgument(parent1.getLength() === parent2.getLength());

        const parent1Genes = parent1.getGenes();
        const parent2Genes = parent2.getGenes();

        // TODO: Yuck. How to do this properly?
        const offspring1Genes = Arrays.clone(parent1Genes);
        const offspring2Genes = Arrays.clone(parent2Genes);
        Arrays.clear(offspring1Genes);
        Arrays.clear(offspring2Genes);

        for (let i = 0; i < xoverPosition; i++) {
            offspring1Genes.push(parent1Genes[i]);
            offspring2Genes.push(parent2Genes[i]);
        }
        for (let i = xoverPosition; i < parent1Genes.length; i++) {
            offspring1Genes.push(parent2Genes[i]);
            offspring2Genes.push(parent1Genes[i]);
        }

        return [parent1.cloneWith(offspring1Genes), parent2.cloneWith(offspring2Genes)];
    }

    apply (parent1: C, parent2: C): Pair<C> {
        Preconditions.checkArgument(parent1.getLength() === parent2.getLength());
        const xoverPosition = Randomness.getInstance().nextInt(0, parent1.getLength());
        return this.applyAtPosition(parent1, parent2, xoverPosition);
    }
}
