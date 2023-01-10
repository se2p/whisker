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

import {StoppingCondition} from "../StoppingCondition";
import {Chromosome} from "../Chromosome";
import {Container} from "../../utils/Container";
import {StatisticsCollector} from "../../utils/StatisticsCollector";

export class FixedTimeStoppingCondition<T extends Chromosome> implements StoppingCondition<T> {

    private readonly _maxTime: number;

    constructor(maxTime: number) {
        this._maxTime = maxTime;
    }

    async isFinished(): Promise<boolean> {
        return (Date.now() - StatisticsCollector.getInstance().startTime) > this.maxTime;
    }

    async getProgress(): Promise<number> {
        return (Date.now() - StatisticsCollector.getInstance().startTime) / this.maxTime;
    }

    get maxTime(): number {
        return this._maxTime / Container.acceleration;
    }
}
