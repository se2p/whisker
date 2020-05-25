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


import {OneMaxFitnessFunction} from "../../../../src/whisker/bitstring/OneMaxFitnessFunction";
import {BitstringChromosome} from "../../../../src/whisker/bitstring/BitstringChromosome";
import {RandomSearch} from "../../../../src/whisker/search/algorithms/RandomSearch";
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {FixedTimeStoppingCondtion} from "../../../../src/whisker/search/stoppingconditions/FixedTimeStoppingCondition";

class DummySearchAlgorithm extends RandomSearch<BitstringChromosome> {
    setTimeElapsed(time:number) {
        this._startTime = Date.now() - time;
    }
}

describe('FixedTimeStoppingCondition', () => {

    test('Max reached', () => {
        const fitnessFunction = new OneMaxFitnessFunction(2);
        const algorithm = new DummySearchAlgorithm();
        const maxTime = 11;
        algorithm.setTimeElapsed(maxTime);
        const stoppingCondition = new FixedTimeStoppingCondtion(maxTime);

        expect(stoppingCondition.isFinished(algorithm)).toBeTruthy();
    });

    test('Max not reached', () => {
        const fitnessFunction = new OneMaxFitnessFunction(2);
        const algorithm = new DummySearchAlgorithm();
        const maxTime = 100;
        algorithm.setTimeElapsed(0);
        const stoppingCondition = new FixedTimeStoppingCondtion(maxTime);

        expect(stoppingCondition.isFinished(algorithm)).toBeFalsy();
    });

    test('Progress of 0.5', () => {
        const fitnessFunction = new OneMaxFitnessFunction(2);
        const algorithm = new DummySearchAlgorithm();
        const maxTime = 100;
        algorithm.setTimeElapsed(50);
        const stoppingCondition = new FixedTimeStoppingCondtion(maxTime);

        expect(stoppingCondition.getProgress(algorithm)).toBeGreaterThanOrEqual(0.5);
    });

});
