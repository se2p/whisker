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

import {MOSABuilder} from "../../../../src/whisker/search/algorithms/MOSABuilder";
import {Chromosome} from "../../../../src/whisker/search/Chromosome";
import {SearchAlgorithm} from "../../../../src/whisker/search/SearchAlgorithm";
import {BitstringChromosomeGenerator} from "../../../../src/whisker/bitstring/BitstringChromosomeGenerator";
import {SearchAlgorithmProperties} from "../../../../src/whisker/search/SearchAlgorithmProperties";
import {BitstringChromosome} from "../../../../src/whisker/bitstring/BitstringChromosome";
import {OneOfStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OneOfStoppingCondition";
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {StoppingCondition} from "../../../../src/whisker/search/StoppingCondition";
import {FitnessFunction} from "../../../../src/whisker/search/FitnessFunction";
import {SingleBitFitnessFunction} from "../../../../src/whisker/bitstring/SingleBitFitnessFunction";
import {RankSelection} from "../../../../src/whisker/search/operators/RankSelection";
import {Selection} from "../../../../src/whisker/search/Selection";

describe('MOSABuilder', () => {

    test('Constructor and build', () => {
        const builder: MOSABuilder = new MOSABuilder();
        const mosa: SearchAlgorithm<Chromosome> = builder.buildSearchAlgorithm();
        expect(mosa).not.toBeNull();

        const properties = mosa["_properties"];
        expect(properties.getPopulationSize()).toBe(50);
        expect(properties.getChromosomeLength()).toBe(10);
        expect(properties.getCrossoverProbability()).toBe(1);
        expect(properties.getMutationProbablity()).toBe(1);

        expect(mosa["_chromosomeGenerator"]).not.toBeNull();
        expect(mosa["_stoppingCondition"]).not.toBeNull();
        expect(mosa["_fitnessFunctions"].size).toBe(10);
        expect(mosa["_selectionOperator"]).not.toBeNull();
    });

    test("Add generator", () => {
        const builder: MOSABuilder = new MOSABuilder();
        const newGenerator: BitstringChromosomeGenerator = new BitstringChromosomeGenerator(
            new SearchAlgorithmProperties<BitstringChromosome>(0, 5, 0, 0));
        builder.addChromosomeGenerator(newGenerator);
        expect(builder["_chromosomeGenerator"]).toBe(newGenerator);
    });

    test("Add fitness function", () => {
        const builder: MOSABuilder = new MOSABuilder();
        expect(function() {
            builder.addFitnessFunction(null);
        }).toThrow();
    });

    test("Add fitness functions", () => {
        const builder: MOSABuilder = new MOSABuilder();
        const chromosomeLength = 27;
        const fitnessFunctions: Map<number, FitnessFunction<BitstringChromosome>> = new Map<number, FitnessFunction<BitstringChromosome>>();
        for (let i = 0; i < chromosomeLength; i++) {
            fitnessFunctions.set(i, new SingleBitFitnessFunction(chromosomeLength, i));
        }

        builder.addFitnessFunctions(fitnessFunctions);
        expect(builder["_fitnessFunctions"].size).toBe(27);
    });

    test("Add properties", () => {
        const builder: MOSABuilder = new MOSABuilder();
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

    test("Add stopping condition", () => {
        const builder: MOSABuilder = new MOSABuilder();
        const maxIterations = 50;
        const stoppingCondition: StoppingCondition<BitstringChromosome> = new OneOfStoppingCondition(new FixedIterationsStoppingCondition(maxIterations));

        builder.addStoppingCondition(stoppingCondition);
        expect(builder["_stoppingCondition"]).toBe(stoppingCondition);
    });

    test("Add selection operator", () => {
        const builder: MOSABuilder = new MOSABuilder();
        const selectionOp: Selection<BitstringChromosome> = new RankSelection<BitstringChromosome>();
        builder.addSelectionOperator(selectionOp);
        expect(builder["_selectionOperator"]).toBe(selectionOp);
    })

});
