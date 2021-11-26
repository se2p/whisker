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
import {Randomness} from "../../utils/Randomness";
import Arrays from "../../utils/Arrays";

export class SinglePointRelativeCrossover<C extends ListChromosome<any>> extends Crossover<C> {

    constructor(private readonly _reservedCodons: number) {
        super();
    }

    private applyAtPosition(parent1: C, parent2: C, parent1Position: number, parent2Position: number): C {

        // parent1 up to parent1Position + parent2 from parent2Position onwards
        const parent1Genes = parent1.getGenes();
        const parent2Genes = parent2.getGenes();

        const offspringGenes = Arrays.clone(parent1Genes);
        Arrays.clear(offspringGenes);

        for (let i = 0; i < parent1Position; i++) {
            offspringGenes.push(parent1Genes[i]);
        }
        for (let i = parent2Position; i < parent2Genes.length; i++) {
            offspringGenes.push(parent2Genes[i]);
        }

        return parent1.cloneWith(offspringGenes);
    }

    apply(parent1: C, parent2: C): Pair<C> {
        const parent1EventSpaced = Arrays.chunk(parent1.getGenes(), this._reservedCodons);
        const parent2EventSpaced = Arrays.chunk(parent2.getGenes(), this._reservedCodons);

        // Can only cross over if length is at least 2
        if (parent1EventSpaced.length < 2 || parent2EventSpaced.length < 2) {
            return [parent1, parent2];
        }

        // Relative position of crossover
        const splitPoint = Randomness.getInstance().nextDouble();

        const pos1 = (Math.floor((parent1EventSpaced.length - 1) * splitPoint) + 1) * this._reservedCodons;
        const pos2 = (Math.floor((parent2EventSpaced.length - 1) * splitPoint) + 1) * this._reservedCodons;

        const offspring1 = this.applyAtPosition(parent1, parent2, pos1, pos2);
        const offspring2 = this.applyAtPosition(parent2, parent1, pos2, pos1);

        return [offspring1, offspring2];
    }
}
