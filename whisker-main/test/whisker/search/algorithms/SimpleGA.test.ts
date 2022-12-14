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
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {OneMaxFitnessFunction} from "../../../../src/whisker/bitstring/OneMaxFitnessFunction";
import {OneOfStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OneOfStoppingCondition";
import {OptimalSolutionStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OptimalSolutionStoppingCondition";
import {BitflipMutation} from "../../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointCrossover} from "../../../../src/whisker/search/operators/SinglePointCrossover";
import {SearchAlgorithmBuilder} from "../../../../src/whisker/search/SearchAlgorithmBuilder";
import {FitnessFunctionType} from "../../../../src/whisker/search/FitnessFunctionType";
import {SimpleGA} from "../../../../src/whisker/search/algorithms/SimpleGA";
import {RankSelection} from "../../../../src/whisker/search/operators/RankSelection";
import {TournamentSelection} from "../../../../src/whisker/search/operators/TournamentSelection";
import {VMWrapperMock} from "../../utils/VMWrapperMock";
import {Container} from "../../../../src/whisker/utils/Container";

describe('SimpleGA', () => {

    beforeEach(() => {
        const mock = new VMWrapperMock();
        mock.init();
        // @ts-ignore
        Container.vmWrapper = mock;

        Container.debugLog = () => { /* suppress output */
        };
    });

    test('Trivial bitstring with SimpleGA', async () => {
        const properties = {
            populationSize: 50,
            chromosomeLength: 10,
            stoppingCondition: new OneOfStoppingCondition(
                new FixedIterationsStoppingCondition(1000),
                new OptimalSolutionStoppingCondition()),
            mutationProbability: 0.2,
            crossoverProbability: 0.8,
            testGenerator: undefined,
            integerRange: undefined,
            reservedCodons: undefined
        };

        const fitnessFunction = new OneMaxFitnessFunction(properties.chromosomeLength);

        const builder = new SearchAlgorithmBuilder('simpleGA')
            .addProperties(properties)
            .addChromosomeGenerator(new BitstringChromosomeGenerator(properties,
                new BitflipMutation(), new SinglePointCrossover()))
            .addSelectionOperator(new RankSelection())
            .initializeFitnessFunction(FitnessFunctionType.ONE_MAX, properties.chromosomeLength, []);


        const search = builder.buildSearchAlgorithm();
        const solutions = await search.findSolution();
        const firstSolution = solutions.get(0);

        expect(await firstSolution.getFitness(fitnessFunction)).toBe(properties.chromosomeLength);
    });


    test('Setter', () => {
        const properties = {
            populationSize: 1,
            chromosomeLength: 10,
            stoppingCondition: new OneOfStoppingCondition(
                new FixedIterationsStoppingCondition(1000), // Plenty time...
                new OptimalSolutionStoppingCondition()
            ),
            testGenerator: undefined,
            mutationProbability: undefined,
            crossoverProbability: undefined,
            integerRange: undefined,
            reservedCodons: undefined
        };
        const fitnessFunction = new OneMaxFitnessFunction(properties.populationSize);
        const chromosomeGenerator = new BitstringChromosomeGenerator(properties, new BitflipMutation(), new SinglePointCrossover());
        const selectionFunction = new TournamentSelection(5);
        const search = new SimpleGA();

        search.setProperties(properties);
        expect(search["_properties"]).toBe(properties);
        expect(search["_stoppingCondition"]).toBe(properties.stoppingCondition);

        search.setChromosomeGenerator(chromosomeGenerator);
        expect(search["_chromosomeGenerator"]).toBe(chromosomeGenerator);

        search.setFitnessFunction(fitnessFunction);
        expect(search["_fitnessFunction"]).toBe(fitnessFunction);

        search.setSelectionOperator(selectionFunction);
        expect(search["_selectionOperator"]).toBe(selectionFunction);
    });

});
