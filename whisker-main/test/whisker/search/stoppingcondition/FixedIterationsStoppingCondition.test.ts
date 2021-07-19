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
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {StatisticsCollector} from "../../../../src/whisker/utils/StatisticsCollector";

class DummySearchAlgorithm extends RandomSearch<BitstringChromosome> {
    setIterations(iterations: number) {
        this._iterations = iterations;
        StatisticsCollector.getInstance().iterationCount = iterations;
    }
}

describe('FixedIterationsStoppingCondition', () => {

    test('Max reached', async () => {
        const algorithm = new DummySearchAlgorithm();
        const maxIterations = 10;
        algorithm.setIterations(maxIterations);
        const stoppingCondition = new FixedIterationsStoppingCondition(maxIterations);

        expect(await stoppingCondition.isFinished()).toBeTruthy();
    });

    test('Max not reached', async () => {
        const algorithm = new DummySearchAlgorithm();
        const maxIterations = 10;
        algorithm.setIterations(5);
        const stoppingCondition = new FixedIterationsStoppingCondition(maxIterations);

        expect(await stoppingCondition.isFinished()).toBeFalsy();
    });

    test('Progress of 0.5', async () => {
        const algorithm = new DummySearchAlgorithm();
        const maxIterations = 10;
        algorithm.setIterations(5);
        const stoppingCondition = new FixedIterationsStoppingCondition(maxIterations);

        expect(await stoppingCondition.getProgress()).toBe(0.5);
    });

});
