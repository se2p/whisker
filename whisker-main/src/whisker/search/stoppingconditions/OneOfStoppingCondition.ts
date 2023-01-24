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
import {OptimalSolutionStoppingCondition} from "./OptimalSolutionStoppingCondition";

export class OneOfStoppingCondition<T extends Chromosome> implements StoppingCondition<T> {

    private _conditions: StoppingCondition<T>[] = [];

    constructor(...stoppingConditions: StoppingCondition<T>[]) {
        // Immediately flatten nested OneOfStoppingConditions.
        this._conditions = this._flatten(stoppingConditions);
    }

    private _flatten(stoppingConditions: StoppingCondition<T>[]): StoppingCondition<T>[] {
        const flattened = [];
        for (const stoppingCondition of stoppingConditions) {
            if (stoppingCondition instanceof OneOfStoppingCondition) {
                flattened.push(...this._flatten(stoppingCondition.conditions));
            } else {
                flattened.push(stoppingCondition);
            }
        }
        return flattened;
    }

    async isFinished(algorithm: SearchAlgorithm<T>): Promise<boolean> {
        const promises = this._conditions.map((condition) => condition.isFinished(algorithm));
        const finished = await Promise.all(promises);
        return finished.includes(true);
    }

    async getProgress(algorithm: SearchAlgorithm<T>): Promise<number> {
        /*
         * We distinguish between stopping conditions tracking (A) how close we are to fulfilling an objective, vs.
         * (B) how much resources have been used. For measuring search progress, we are interested only in (B).
         * This filtering step is important and can impact the behavior of search algorithms. In particular, MIO
         * uses getProgress to decide if it should enter its "focused phase". The majority of Scratch programs are
         * very simple and we reach very high coverage almost instantly, meaning that MIO would immediately enter
         * its focused phase, unless we specifically filter out OptimalSolutionStoppingCondition here.
         */
        const resourceConditions = this.conditions.filter(condition =>
            !(condition instanceof OptimalSolutionStoppingCondition));
        const progress = await Promise.all(resourceConditions.map(async (condition) => await condition.getProgress(algorithm)));
        return Math.max(...progress);
    }

    get conditions(): StoppingCondition<T>[] {
        return this._conditions;
    }

    set conditions(value: StoppingCondition<T>[]) {
        this._conditions = value;
    }
}
