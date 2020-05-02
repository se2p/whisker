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
import {OnePlusOneEABuilder} from "../../../../src/whisker/search/algorithms/OnePlusOneEABuilder";

describe('OnePlusOneEa', () => {

    test('Trivial bitstring with OneMax', () => {

        const n = 10;
        const properties = new SearchAlgorithmProperties(1, n, 0, 0);
        const fitnessFunction = new OneMaxFitnessFunction(n);

        const builder = new OnePlusOneEABuilder()
            .addProperties(properties)
            .addChromosomeGenerator(new BitstringChromosomeGenerator(properties))
            .addFitnessFunction(fitnessFunction)
            .addStoppingCondition(
                new OneOfStoppingCondition(
                    new FixedIterationsStoppingCondition(1000),
                    new OptimalSolutionStoppingCondition(fitnessFunction)));

        const search = builder.buildSearchAlgorithm();
        const solutions = search.findSolution();
        const firstSolution = solutions.get(0);

        expect(firstSolution.getFitness(fitnessFunction)).toBe(n);
    });

    test('Setter', () => {
        const n = 10;
        const properties = new SearchAlgorithmProperties(1, n, 0, 0);
        const fitnessFunction = new OneMaxFitnessFunction(n);
        const chromosomeGenerator = new BitstringChromosomeGenerator(properties);
        const stoppingCondition = new OneOfStoppingCondition(
            new FixedIterationsStoppingCondition(1000), // Plenty time...
            new OptimalSolutionStoppingCondition(fitnessFunction)
        );
        const search = new OnePlusOneEA();

        search.setProperties(properties);
        expect(search["_properties"]).toBe(properties);

        search.setChromosomeGenerator(chromosomeGenerator);
        expect(search["_chromosomeGenerator"]).toBe(chromosomeGenerator);

        search.setStoppingCondition(stoppingCondition);
        expect(search["_stoppingCondition"]).toBe(stoppingCondition);

        search.setFitnessFunction(fitnessFunction);
        expect(search["_fitnessFunction"]).toBe(fitnessFunction);

        expect(function() {
            search.setSelectionOperator(null);
        }).toThrow();
    });

});