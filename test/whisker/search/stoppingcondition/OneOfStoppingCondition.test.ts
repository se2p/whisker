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


import {List} from "../../../../src/whisker/utils/List";
import {OneMaxFitnessFunction} from "../../../../src/whisker/bitstring/OneMaxFitnessFunction";
import {BitstringChromosome} from "../../../../src/whisker/bitstring/BitstringChromosome";
import {RandomSearch} from "../../../../src/whisker/search/algorithms/RandomSearch";
import {OptimalSolutionStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OptimalSolutionStoppingCondition";
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {OneOfStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OneOfStoppingCondition";
import {BitflipMutation} from "../../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointCrossover} from "../../../../src/whisker/search/operators/SinglePointCrossover";

class DummySearchAlgorithm extends RandomSearch<BitstringChromosome> {
    setCurrentSolution(chromosome: BitstringChromosome) {
        this._bestIndividuals.clear();
        this._bestIndividuals.add(chromosome);
    }
    setIterations(iterations:number) {
        this._iterations = iterations;
    }
}

describe('OptimalSolutionStoppingCondition', () => {

    test('Both conditions false', () => {
        const bits = new List<Boolean>();
        bits.add(true);
        bits.add(false);
        const chromosome = new BitstringChromosome(bits,
            new BitflipMutation(), new SinglePointCrossover<BitstringChromosome>());
        const maxIterations = 10;
        const fitnessFunction = new OneMaxFitnessFunction(2);

        const algorithm = new DummySearchAlgorithm();
        algorithm.setFitnessFunction(fitnessFunction)
        algorithm.setCurrentSolution(chromosome)
        algorithm.setIterations(5);

        const stoppingCondition = new OneOfStoppingCondition(
            new FixedIterationsStoppingCondition(maxIterations),
            new OptimalSolutionStoppingCondition()
        );

        expect(stoppingCondition.isFinished(algorithm)).toBeFalsy();
    });

    test('Both conditions true', () => {
        const bits = new List<Boolean>();
        bits.add(true);
        bits.add(true);
        const chromosome = new BitstringChromosome(bits,
            new BitflipMutation(), new SinglePointCrossover<BitstringChromosome>());
        const maxIterations = 10;
        const fitnessFunction = new OneMaxFitnessFunction(2);

        const algorithm = new DummySearchAlgorithm();
        algorithm.setFitnessFunction(fitnessFunction);
        algorithm.setCurrentSolution(chromosome);
        algorithm.setIterations(maxIterations);

        const stoppingCondition = new OneOfStoppingCondition(
            new FixedIterationsStoppingCondition(maxIterations),
            new OptimalSolutionStoppingCondition()
        );

        expect(stoppingCondition.isFinished(algorithm)).toBeTruthy();
    });

    test('First condition true only', () => {
        const bits = new List<Boolean>();
        bits.add(true);
        bits.add(true);
        const chromosome = new BitstringChromosome(bits,
            new BitflipMutation(), new SinglePointCrossover<BitstringChromosome>());
        const maxIterations = 10;
        const fitnessFunction = new OneMaxFitnessFunction(2);

        const algorithm = new DummySearchAlgorithm();
        algorithm.setFitnessFunction(fitnessFunction)
        algorithm.setCurrentSolution(chromosome)
        algorithm.setIterations(5);

        const stoppingCondition = new OneOfStoppingCondition(
            new FixedIterationsStoppingCondition(maxIterations),
            new OptimalSolutionStoppingCondition()
        );

        expect(stoppingCondition.isFinished(algorithm)).toBeTruthy();
    });

    test('Second condition true only', () => {
        const bits = new List<Boolean>();
        bits.add(true);
        bits.add(false);
        const chromosome = new BitstringChromosome(bits,
            new BitflipMutation(), new SinglePointCrossover<BitstringChromosome>());
        const maxIterations = 10;
        const fitnessFunction = new OneMaxFitnessFunction(2);

        const algorithm = new DummySearchAlgorithm();
        algorithm.setFitnessFunction(fitnessFunction)
        algorithm.setCurrentSolution(chromosome)
        algorithm.setIterations(maxIterations);

        const stoppingCondition = new OneOfStoppingCondition(
            new FixedIterationsStoppingCondition(maxIterations),
            new OptimalSolutionStoppingCondition()
        );

        expect(stoppingCondition.isFinished(algorithm)).toBeTruthy();
    });

});
