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
import {MOSA} from "../../../../src/whisker/search/algorithms/MOSA";
import {FitnessFunction} from "../../../../src/whisker/search/FitnessFunction";
import {BitstringChromosome} from "../../../../src/whisker/bitstring/BitstringChromosome";
import {SingleBitFitnessFunction} from "../../../../src/whisker/bitstring/SingleBitFitnessFunction";
import {List} from "../../../../src/whisker/utils/List";
import {RankSelection} from "../../../../src/whisker/search/operators/RankSelection";
import {BitflipMutation} from "../../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointCrossover} from "../../../../src/whisker/search/operators/SinglePointCrossover";
import {SearchAlgorithmBuilderDev} from "../../../../src/whisker/search/SearchAlgorithmBuilderDev";
import {SearchAlgorithmType} from "../../../../src/whisker/search/algorithms/SearchAlgorithmType";

describe('MOSA', () => {

    test('BitstringChromosome with SingleBitFitnessFunction', () => {
        const searchAlgorithm = new SearchAlgorithmBuilderDev(SearchAlgorithmType.MOSA).buildSearchAlgorithm();

        const solutions = searchAlgorithm.findSolution() as List<BitstringChromosome>;
        expect(solutions === searchAlgorithm.getCurrentSolution()).toBeTruthy();

        const fitnessFunctions = searchAlgorithm["_fitnessFunctions"];
        for (const fitnessFunction of fitnessFunctions.values()) {
            let optimal = false;
            for (const solution of solutions) {
                if (fitnessFunction.isOptimal(fitnessFunction.getFitness(solution))) {
                    optimal = true;
                    break;
                }
            }
            expect(optimal).toBeTruthy();
        }
    });

    test('Getter', () => {
        let searchAlgorithm = new SearchAlgorithmBuilderDev(SearchAlgorithmType.MOSA).buildSearchAlgorithm();
        const maxIterations = 100;

        expect(searchAlgorithm.getCurrentSolution()).toEqual(new List<BitstringChromosome>());
        const solutions = searchAlgorithm.findSolution() as List<BitstringChromosome>;
        expect(searchAlgorithm.getCurrentSolution()).toEqual(solutions);

        searchAlgorithm = new SearchAlgorithmBuilderDev(SearchAlgorithmType.MOSA).buildSearchAlgorithm();
        expect(searchAlgorithm.getNumberOfIterations()).toEqual(0);
        searchAlgorithm.findSolution();
        expect(searchAlgorithm.getNumberOfIterations()).toBe(maxIterations);
    });

    test('Setter', () => {
        const chromosomeLength = 10;
        const populationSize = 50;
        const iterations = 100;
        const crossoverProbability = 1;
        const mutationProbability = 1;

        const properties = new SearchAlgorithmProperties(populationSize, chromosomeLength);
        properties.setCrossoverProbability(crossoverProbability);
        properties.setMutationProbablity(mutationProbability);
        const stoppingCondition = new OneOfStoppingCondition(new FixedIterationsStoppingCondition(iterations));
        properties.setStoppingCondition(stoppingCondition);

        const fitnessFunctions = new Map<number, FitnessFunction<BitstringChromosome>>();
        for (let i = 0; i < chromosomeLength; i++) {
            fitnessFunctions.set(i, new SingleBitFitnessFunction(chromosomeLength, i));
        }
        const chromosomeGenerator = new BitstringChromosomeGenerator(properties, new BitflipMutation(), new SinglePointCrossover());
        const selectionOp = new RankSelection();

        const searchAlgorithm = new MOSA();
        searchAlgorithm.setProperties(properties);
        expect(searchAlgorithm["_properties"]).toBe(properties);
        expect(searchAlgorithm["_stoppingCondition"]).toBe(stoppingCondition);

        searchAlgorithm.setChromosomeGenerator(chromosomeGenerator);
        expect(searchAlgorithm["_chromosomeGenerator"]).toBe(chromosomeGenerator);

        searchAlgorithm.setFitnessFunctions(fitnessFunctions);
        expect(searchAlgorithm["_fitnessFunctions"]).toBe(fitnessFunctions);

        searchAlgorithm.setSelectionOperator(selectionOp);
        expect(searchAlgorithm["_selectionOperator"]).toBe(selectionOp);
    });

    test("Not supported setter", () => {
        const searchAlgorithm: MOSA<BitstringChromosome> = new MOSA();
        expect(function() {
            searchAlgorithm.setFitnessFunction(null);
        }).toThrow();
    });
});
