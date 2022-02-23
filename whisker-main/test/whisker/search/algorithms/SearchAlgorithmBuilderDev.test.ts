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
import {OneOfStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OneOfStoppingCondition";
import {FitnessFunction} from "../../../../src/whisker/search/FitnessFunction";
import {BitstringChromosome} from "../../../../src/whisker/bitstring/BitstringChromosome";
import {SingleBitFitnessFunction} from "../../../../src/whisker/bitstring/SingleBitFitnessFunction";
import {RankSelection} from "../../../../src/whisker/search/operators/RankSelection";
import {SearchAlgorithmBuilder} from "../../../../src/whisker/search/SearchAlgorithmBuilder";
import {BitflipMutation} from "../../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointCrossover} from "../../../../src/whisker/search/operators/SinglePointCrossover";
import {FitnessFunctionType} from "../../../../src/whisker/search/FitnessFunctionType";

describe('BuillderBitstringChromosome', () => {

    test('Build MOSA', () => {
        const builder: SearchAlgorithmBuilder<BitstringChromosome> = new SearchAlgorithmBuilder('mosa');
        expect(builder.buildSearchAlgorithm()).not.toBeNull();
    });

    test('Build MIO', () => {
        const builder: SearchAlgorithmBuilder<BitstringChromosome> = new SearchAlgorithmBuilder('mio');
        expect(builder.buildSearchAlgorithm()).not.toBeNull();
    });

    test('Build Random', () => {
        const builder: SearchAlgorithmBuilder<BitstringChromosome> = new SearchAlgorithmBuilder('random');
        expect(builder.buildSearchAlgorithm()).not.toBeNull();
    });

    test('Build OnePlusOne', () => {
        const builder: SearchAlgorithmBuilder<BitstringChromosome> = new SearchAlgorithmBuilder('onePlusOne');
        expect(builder.buildSearchAlgorithm()).not.toBeNull();
    });

    test('Setter', () => {
        const chromosomeLength = 10;
        const populationSize = 50;
        const iterations = 100;
        const stoppingCondition = new OneOfStoppingCondition(new FixedIterationsStoppingCondition(iterations));

        const properties = {
            populationSize,
            chromosomeLength,
            stoppingCondition,
            mutationProbability: undefined,
            crossoverProbability: undefined,
            testGenerator: undefined,
            integerRange: undefined,
            reservedCodons: undefined
        };

        const chromosomeGenerator = new BitstringChromosomeGenerator(properties,
            new BitflipMutation(), new SinglePointCrossover());
        const fitnessFunctions = new Map<number, FitnessFunction<BitstringChromosome>>();
        for (let i = 0; i < chromosomeLength; i++) {
            fitnessFunctions.set(i, new SingleBitFitnessFunction(chromosomeLength, i));
        }
        const selectionOp = new RankSelection();

        const builder = new SearchAlgorithmBuilder('mosa');
        builder.addProperties(properties);
        expect(builder["_properties"]).toBe(properties);

        builder.addChromosomeGenerator(chromosomeGenerator);
        expect(builder["_chromosomeGenerator"]).toBe(chromosomeGenerator);

        builder.initializeFitnessFunction(FitnessFunctionType.ONE_MAX, chromosomeLength, []);
        expect(builder["_fitnessFunctions"].size).toBe(chromosomeLength);
        expect(builder["_fitnessFunction"]).not.toBeNull();

        builder.initializeFitnessFunction(FitnessFunctionType.SINGLE_BIT, chromosomeLength, []);
        expect(builder["_fitnessFunctions"].size).toBe(chromosomeLength);
        expect(builder["_fitnessFunction"]).not.toBeNull();

//        builder.initializeFitnessFunction(FitnessFunctionType.STATEMENT, chromosomeLength);
//        expect(builder["_fitnessFunctions"].size).toBe(chromosomeLength);
//        expect(builder["_fitnessFunction"]).not.toBeNull();

        builder.addSelectionOperator(selectionOp);
        expect(builder["_selectionOperator"]).toBe(selectionOp);
    });

});
