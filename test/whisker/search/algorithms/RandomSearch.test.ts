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

import {RandomSearch} from "../../../../src/whisker/search/algorithms/RandomSearch";
import {BitstringChromosomeGenerator} from "../../../../src/whisker/bitstring/BitstringChromosomeGenerator";
import {SearchAlgorithmProperties} from "../../../../src/whisker/search/SearchAlgorithmProperties";
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {OneMaxFitnessFunction} from "../../../../src/whisker/bitstring/OneMaxFitnessFunction";
import {OneOfStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OneOfStoppingCondition";
import {OptimalSolutionStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OptimalSolutionStoppingCondition";
import {BitflipMutation} from "../../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointCrossover} from "../../../../src/whisker/search/operators/SinglePointCrossover";
import {SearchAlgorithmType} from "../../../../src/whisker/search/algorithms/SearchAlgorithmType";
import {SearchAlgorithmBuilder} from "../../../../src/whisker/search/SearchAlgorithmBuilder";
import {FitnessFunctionType} from "../../../../src/whisker/search/FitnessFunctionType";
import {List} from "../../../../src/whisker/utils/List";
import {VMWrapperMock} from "../../utils/VMWrapperMock";
import {Container} from "../../../../src/whisker/utils/Container";

describe('RandomSearch', () => {

    beforeEach(() => {
        const mock = new VMWrapperMock();
        mock.init()
        Container.vmWrapper = mock;
    });

    test('Trivial bitstring with OneMax', async () => {

        const n = 2;
        const properties = new SearchAlgorithmProperties(1, n);
        const fitnessFunction = new OneMaxFitnessFunction(n);
        properties.setStoppingCondition(new OneOfStoppingCondition(
            new FixedIterationsStoppingCondition(1000),
            new OptimalSolutionStoppingCondition()));

        const builder = new SearchAlgorithmBuilder(SearchAlgorithmType.RANDOM)
            .addProperties(properties)
            .addChromosomeGenerator(new BitstringChromosomeGenerator(properties,
                new BitflipMutation(),
                new SinglePointCrossover()))
            .initializeFitnessFunction(FitnessFunctionType.ONE_MAX, n, new List());

        const randomSearch = builder.buildSearchAlgorithm();
        const solutions = await randomSearch.findSolution();
        const firstSolution = solutions.get(0);

        expect(await firstSolution.getFitness(fitnessFunction)).toBe(n);
    });

    test('Setter', () => {
        const n = 2;
        const properties = new SearchAlgorithmProperties(1, n);
        const fitnessFunction = new OneMaxFitnessFunction(n);
        const chromosomeGenerator = new BitstringChromosomeGenerator(properties, new BitflipMutation(), new SinglePointCrossover());
        const stoppingCondition = new OneOfStoppingCondition(
            new FixedIterationsStoppingCondition(1000),
            new OptimalSolutionStoppingCondition()
        );
        const randomSearch = new RandomSearch();

        properties.setStoppingCondition(stoppingCondition);
        randomSearch.setProperties(properties);
        expect(randomSearch["_properties"]).toBe(properties);
        expect(randomSearch["_stoppingCondition"]).toBe(stoppingCondition);

        randomSearch.setChromosomeGenerator(chromosomeGenerator);
        expect(randomSearch["_chromosomeGenerator"]).toBe(chromosomeGenerator);

        randomSearch.setFitnessFunction(fitnessFunction);
        expect(randomSearch["_fitnessFunction"]).toBe(fitnessFunction);

        expect(function () {
            randomSearch.setSelectionOperator(null);
        }).toThrow();
    });

});
