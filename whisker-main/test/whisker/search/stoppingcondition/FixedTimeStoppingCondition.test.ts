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

import {BitstringChromosome} from "../../../../src/whisker/bitstring/BitstringChromosome";
import {RandomSearch} from "../../../../src/whisker/search/algorithms/RandomSearch";
import {FixedTimeStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedTimeStoppingCondition";
import {Container} from "../../../../src/whisker/utils/Container";
import {StatisticsCollector} from "../../../../src/whisker/utils/StatisticsCollector";

class DummySearchAlgorithm extends RandomSearch<BitstringChromosome> {
    setTimeElapsed(time: number) {
        this._startTime = Date.now() - time;
        StatisticsCollector.getInstance().startTime = this._startTime;
    }
}

describe('FixedTimeStoppingCondition', () => {

    test('Max reached', async () => {
        const algorithm = new DummySearchAlgorithm();
        const maxTime = 11;
        algorithm.setTimeElapsed(maxTime);
        Container.acceleration = 1;
        const stoppingCondition = new FixedTimeStoppingCondition(maxTime - 1);

        expect(await stoppingCondition.isFinished()).toBeTruthy();
    });

    test('Max not reached', async () => {
        const algorithm = new DummySearchAlgorithm();
        const maxTime = 100;
        algorithm.setTimeElapsed(0);
        Container.acceleration = 1;
        const stoppingCondition = new FixedTimeStoppingCondition(maxTime);

        expect(await stoppingCondition.isFinished()).toBeFalsy();
    });

    test('Progress of 0.5', async () => {
        const algorithm = new DummySearchAlgorithm();
        const maxTime = 100;
        algorithm.setTimeElapsed(50);
        Container.acceleration = 1;
        const stoppingCondition = new FixedTimeStoppingCondition(maxTime);

        expect(await stoppingCondition.getProgress()).toBeGreaterThanOrEqual(0.5);
    });

});
