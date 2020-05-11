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
import {OneOfStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OneOfStoppingCondition";
import {FitnessFunction} from "../../../../src/whisker/search/FitnessFunction";
import {BitstringChromosome} from "../../../../src/whisker/bitstring/BitstringChromosome";
import {SingleBitFitnessFunction} from "../../../../src/whisker/bitstring/SingleBitFitnessFunction";
import {List} from "../../../../src/whisker/utils/List";
import {RankSelection} from "../../../../src/whisker/search/operators/RankSelection";
import {SearchAlgorithmBuilderDev} from "../../../../src/whisker/search/SearchAlgorithmBuilderDev";
import {FitnessFunctionType, SearchAlgorithmType} from "../../../../src/whisker/search/algorithms/SearchAlgorithmType";
import {OneMaxFitnessFunction} from "../../../../src/whisker/bitstring/OneMaxFitnessFunction";
import {OptimalSolutionStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OptimalSolutionStoppingCondition";
import {BitflipMutation} from "../../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointCrossover} from "../../../../src/whisker/search/operators/SinglePointCrossover";

describe('BuillderBitstringChromosome', () => {

    test('Build MOSA', () => {
        const builder: SearchAlgorithmBuilderDev<BitstringChromosome> = new SearchAlgorithmBuilderDev(SearchAlgorithmType.MOSA);
        expect(builder.buildSearchAlgorithm()).not.toBeNull();
    });

    test('Build MIO', () => {
        const builder: SearchAlgorithmBuilderDev<BitstringChromosome> = new SearchAlgorithmBuilderDev(SearchAlgorithmType.MIO);
        expect(builder.buildSearchAlgorithm()).not.toBeNull();
    });

    test('Build Random', () => {
        const builder: SearchAlgorithmBuilderDev<BitstringChromosome> = new SearchAlgorithmBuilderDev(SearchAlgorithmType.RANDOM);
        expect(builder.buildSearchAlgorithm()).not.toBeNull();
    });

    test('Build OnePlusOne', () => {
        const builder: SearchAlgorithmBuilderDev<BitstringChromosome> = new SearchAlgorithmBuilderDev(SearchAlgorithmType.ONE_PLUS_ONE);
        expect(builder.buildSearchAlgorithm()).not.toBeNull();
    });

    test('Setter', () => {
        const chromosomeLength = 10;
        const populationSize = 50;
        const iterations = 100;
        const crossoverProbability = 1;
        const mutationProbability = 1;

        const properties = new SearchAlgorithmProperties(populationSize, chromosomeLength);
        const chromosomeGenerator = new BitstringChromosomeGenerator(properties,
            new BitflipMutation(), new SinglePointCrossover());
        const stoppingCondition = new OneOfStoppingCondition(new FixedIterationsStoppingCondition(iterations));
        properties.setStoppingCondition(stoppingCondition);
        const fitnessFunctions = new Map<number, FitnessFunction<BitstringChromosome>>();
        for (let i = 0; i < chromosomeLength; i++) {
            fitnessFunctions.set(i, new SingleBitFitnessFunction(chromosomeLength, i));
        }
        const selectionOp = new RankSelection();

        const builder = new SearchAlgorithmBuilderDev(SearchAlgorithmType.MOSA);
        builder.addProperties(properties);
        expect(builder["_properties"]).toBe(properties);

        builder.addChromosomeGenerator(chromosomeGenerator);
        expect(builder["_chromosomeGenerator"]).toBe(chromosomeGenerator);

        builder.initializeFitnessFunction(FitnessFunctionType.ONE_MAX, chromosomeLength);
        expect(builder["_fitnessFunctions"].size).toBe(chromosomeLength);
        expect(builder["_fitnessFunction"]).not.toBeNull();

        builder.initializeFitnessFunction(FitnessFunctionType.SINGLE_BIT, chromosomeLength);
        expect(builder["_fitnessFunctions"].size).toBe(chromosomeLength);
        expect(builder["_fitnessFunction"]).not.toBeNull();

        builder.initializeFitnessFunction(FitnessFunctionType.STATEMENT, chromosomeLength);
        expect(builder["_fitnessFunctions"].size).toBe(chromosomeLength);
        expect(builder["_fitnessFunction"]).not.toBeNull();

        builder.addSelectionOperator(selectionOp);
        expect(builder["_selectionOperator"]).toBe(selectionOp);
    });

});
