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

import {BitstringChromosomeGenerator} from "../../../../src/whisker/bitstring/BitstringChromosomeGenerator";
import {SearchAlgorithmProperties} from "../../../../src/whisker/search/SearchAlgorithmProperties";
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {OneMaxFitnessFunction} from "../../../../src/whisker/bitstring/OneMaxFitnessFunction";
import {OneOfStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OneOfStoppingCondition";
import {OptimalSolutionStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OptimalSolutionStoppingCondition";
import {OnePlusOneEA} from "../../../../src/whisker/search/algorithms/OnePlusOneEA";

describe('OnePlusOneEa', () => {

    test('Trivial bitstring with OneMax', () => {

        const n = 10;
        const properties = new SearchAlgorithmProperties(1, n, 0, 0);

        const fitnessFunction = new OneMaxFitnessFunction(n);
        const chromosomeGenerator = new BitstringChromosomeGenerator(properties);
        const stoppingCondition = new OneOfStoppingCondition(
            new FixedIterationsStoppingCondition(1000), // Plenty time...
            new OptimalSolutionStoppingCondition(fitnessFunction)
        );
        const search = new OnePlusOneEA();
        search.setFitnessFunction(fitnessFunction);
        search.setChromosomeGenerator(chromosomeGenerator);
        search.setStoppingCondition(stoppingCondition);

        const solutions = search.findSolution();
        const firstSolution = solutions.get(0);

        expect(firstSolution.getFitness(fitnessFunction)).toBe(n);
    });

});
