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

import {SearchAlgorithm} from "../../../../src/whisker/search/SearchAlgorithm";
import {Chromosome} from "../../../../src/whisker/search/Chromosome";
import {BitstringChromosomeGenerator} from "../../../../src/whisker/bitstring/BitstringChromosomeGenerator";
import {SearchAlgorithmProperties} from "../../../../src/whisker/search/SearchAlgorithmProperties";
import {BitstringChromosome} from "../../../../src/whisker/bitstring/BitstringChromosome";
import {FitnessFunction} from "../../../../src/whisker/search/FitnessFunction";
import {StoppingCondition} from "../../../../src/whisker/search/StoppingCondition";
import {OneOfStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OneOfStoppingCondition";
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {OnePlusOneEABuilder} from "../../../../src/whisker/search/algorithms/OnePlusOneEABuilder";
import {OneMaxFitnessFunction} from "../../../../src/whisker/bitstring/OneMaxFitnessFunction";

describe('OnePlusOneEABuilder', () => {

    test('Constructor and build', () => {
        const builder: OnePlusOneEABuilder = new OnePlusOneEABuilder();
        const onePlusOneEA: SearchAlgorithm<Chromosome> = builder.buildSearchAlgorithm();
        expect(onePlusOneEA).not.toBeNull();

        const populationSize = 50;
        const chromosomeLength = 10;
        const crossoverProbability = 1;
        const mutationProbability = 1;

        const properties = onePlusOneEA["_properties"];
        expect(properties.getPopulationSize()).toBe(populationSize);
        expect(properties.getChromosomeLength()).toBe(chromosomeLength);
        expect(properties.getCrossoverProbability()).toBe(crossoverProbability);
        expect(properties.getMutationProbablity()).toBe(mutationProbability);

        expect(onePlusOneEA["_chromosomeGenerator"]).not.toBeNull();
        expect(onePlusOneEA["_stoppingCondition"]).not.toBeNull();
        expect(onePlusOneEA["_fitnessFunction"].size).not.toBeNull();
    });

    test("Add generator", () => {
        const builder: OnePlusOneEABuilder = new OnePlusOneEABuilder();
        const newGenerator: BitstringChromosomeGenerator = new BitstringChromosomeGenerator(
            new SearchAlgorithmProperties<BitstringChromosome>(0, 5, 0, 0));

        builder.addChromosomeGenerator(newGenerator);

        expect(builder["_chromosomeGenerator"]).toBe(newGenerator);
    });

    test("Add fitness function", () => {
        const builder: OnePlusOneEABuilder = new OnePlusOneEABuilder();
        const fitnessFunction: FitnessFunction<BitstringChromosome> = new OneMaxFitnessFunction(10);

        builder.addFitnessFunction(fitnessFunction);

        expect(builder["_fitnessFunction"]).toBe(fitnessFunction);
    });

    test("Add properties", () => {
        const builder: OnePlusOneEABuilder = new OnePlusOneEABuilder();
        const populationSize = 14;
        const chromosomeLength = 27;
        const crossoverProbability = 0.42;
        const mutationProbability = 1.13;
        const properties = new SearchAlgorithmProperties<BitstringChromosome>(populationSize, chromosomeLength,
            crossoverProbability, mutationProbability);

        builder.addProperties(properties);

        expect(builder["_properties"].getPopulationSize()).toBe(populationSize);
        expect(builder["_properties"].getChromosomeLength()).toBe(chromosomeLength);
        expect(builder["_properties"].getCrossoverProbability()).toBe(crossoverProbability);
        expect(builder["_properties"].getMutationProbablity()).toBe(mutationProbability);
    });

    test("Add selection operator", () => {
        const builder: OnePlusOneEABuilder = new OnePlusOneEABuilder();

        expect(function() {
            builder.addSelectionOperator(null);
        }).toThrow();
    })

});
