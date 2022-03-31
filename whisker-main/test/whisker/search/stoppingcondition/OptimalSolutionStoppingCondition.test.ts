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
import {OptimalSolutionStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OptimalSolutionStoppingCondition";
import {BitflipMutation} from "../../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointCrossover} from "../../../../src/whisker/search/operators/SinglePointCrossover";
import Arrays from "../../../../src/whisker/utils/Arrays";

class DummySearchAlgorithm extends RandomSearch<BitstringChromosome> {

    setCurrentSolution(chromosome: BitstringChromosome) {
        Arrays.clear(this._bestIndividuals);
        this._bestIndividuals.push(chromosome);
    }
}

describe('OptimalSolutionStoppingCondition', () => {

    test('Optimal value', async () => {
        const bits = [true, true];
        const chromosome = new BitstringChromosome(bits,
            new BitflipMutation(), new SinglePointCrossover<BitstringChromosome>());
        const fitnessFunction = new OneMaxFitnessFunction(2);
        const algorithm = new DummySearchAlgorithm();
        algorithm.setFitnessFunction(fitnessFunction);
        algorithm.setCurrentSolution(chromosome);

        const stoppingCondition = new OptimalSolutionStoppingCondition();

        expect(await stoppingCondition.isFinished(algorithm)).toBeTruthy();
    });

    test('Non-Optimal value', async () => {
        const bits = [false, true];
        const chromosome = new BitstringChromosome(bits,
            new BitflipMutation(), new SinglePointCrossover<BitstringChromosome>());
        const fitnessFunction = new OneMaxFitnessFunction(2);
        const algorithm = new DummySearchAlgorithm();
        algorithm.setFitnessFunction(fitnessFunction);
        algorithm.setCurrentSolution(chromosome);

        const stoppingCondition = new OptimalSolutionStoppingCondition();

        expect(await stoppingCondition.isFinished(algorithm)).toBeFalsy();
    });


    test('Do not fail on empty list', async () => {
        const fitnessFunction = new OneMaxFitnessFunction(2);
        const algorithm = new DummySearchAlgorithm();
        algorithm.setFitnessFunction(fitnessFunction);
        // No current solution is set:
        // algorithm.setCurrentSolution(chromosome)

        const stoppingCondition = new OptimalSolutionStoppingCondition();

        expect(await stoppingCondition.isFinished(algorithm)).toBeFalsy();
    });
});
