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

import {StoppingCondition} from '../StoppingCondition';
import {Chromosome} from "../Chromosome";
import {SearchAlgorithm} from "../SearchAlgorithm";
import {List} from "../../utils/List";

export class OneOfStoppingCondition<T extends Chromosome> implements StoppingCondition<T> {

    private readonly _conditions = new List<StoppingCondition<T>>();

    constructor(...stoppingCondition : StoppingCondition<T>[]) {
        this._conditions.addAll(stoppingCondition);
    }

    isFinished(algorithm: SearchAlgorithm<T>): boolean {
        // TODO: This could be written in a single line by extending the List class?
        for (let i = 0; i < this._conditions.size(); i++) {
            const stoppingCondition = this._conditions.get(i);
            if(stoppingCondition.isFinished(algorithm)) {
                return true;
            }
        }
        return false;
    }
}
