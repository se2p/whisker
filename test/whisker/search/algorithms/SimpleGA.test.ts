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
import {BitflipMutation} from "../../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointCrossover} from "../../../../src/whisker/search/operators/SinglePointCrossover";
import {SearchAlgorithmType} from "../../../../src/whisker/search/algorithms/SearchAlgorithmType";
import {SearchAlgorithmBuilder} from "../../../../src/whisker/search/SearchAlgorithmBuilder";
import {FitnessFunctionType} from "../../../../src/whisker/search/FitnessFunctionType";
import {SimpleGA} from "../../../../src/whisker/search/algorithms/SimpleGA";
import {RankSelection} from "../../../../src/whisker/search/operators/RankSelection";
import {TournamentSelection} from "../../../../src/whisker/search/operators/TournamentSelection";

describe('SimpleGA', () => {

    test('Trivial bitstring with SimpleGA', () => {

        const n = 10;
        const properties = new SearchAlgorithmProperties(50, n);
        const fitnessFunction = new OneMaxFitnessFunction(n);
        properties.setStoppingCondition(new OneOfStoppingCondition(
            new FixedIterationsStoppingCondition(1000),
            new OptimalSolutionStoppingCondition(fitnessFunction)));
        properties.setMutationProbablity(0.2);
        properties.setCrossoverProbability(0.8);

        const builder = new SearchAlgorithmBuilder(SearchAlgorithmType.SIMPLEGA)
            .addProperties(properties)
            .addChromosomeGenerator(new BitstringChromosomeGenerator(properties,
                new BitflipMutation(), new SinglePointCrossover()))
            .addSelectionOperator(new RankSelection())
            .initializeFitnessFunction(FitnessFunctionType.ONE_MAX, n);


        const search = builder.buildSearchAlgorithm();
        const solutions = search.findSolution();
        const firstSolution = solutions.get(0);

        expect(firstSolution.getFitness(fitnessFunction)).toBe(n);
    });


    test('Setter', () => {
        const n = 10;
        const properties = new SearchAlgorithmProperties(1, n);
        const fitnessFunction = new OneMaxFitnessFunction(n);
        const chromosomeGenerator = new BitstringChromosomeGenerator(properties, new BitflipMutation(), new SinglePointCrossover());
        const stoppingCondition = new OneOfStoppingCondition(
            new FixedIterationsStoppingCondition(1000), // Plenty time...
            new OptimalSolutionStoppingCondition(fitnessFunction)
        );
        const selectionFunction = new TournamentSelection(5, fitnessFunction);
        properties.setStoppingCondition(stoppingCondition);
        const search = new SimpleGA();

        search.setProperties(properties);
        expect(search["_properties"]).toBe(properties);
        expect(search["_stoppingCondition"]).toBe(stoppingCondition);

        search.setChromosomeGenerator(chromosomeGenerator);
        expect(search["_chromosomeGenerator"]).toBe(chromosomeGenerator);

        search.setFitnessFunction(fitnessFunction);
        expect(search["_fitnessFunction"]).toBe(fitnessFunction);

        // TODO: Doesn't currently work, selection not integrated in builder yet
        // search.setSelectionOperator(selectionFunction);
        // expect(search["_selectionFunction"]).toBe(selectionFunction);
    });

});
