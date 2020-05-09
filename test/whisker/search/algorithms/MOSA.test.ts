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
import {MOSABuilder} from "../../../../src/whisker/search/algorithms/MOSABuilder";
import {RankSelection} from "../../../../src/whisker/search/operators/RankSelection";

describe('MOSA', () => {

    test('BitstringChromosome with SingleBitFitnessFunction', () => {
        const searchAlgorithm = new MOSABuilder().buildSearchAlgorithm();

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
        let searchAlgorithm = new MOSABuilder().buildSearchAlgorithm();
        const maxIterations = 100;

        expect(searchAlgorithm.getCurrentSolution()).toEqual(new List<BitstringChromosome>());
        const solutions = searchAlgorithm.findSolution() as List<BitstringChromosome>;
        expect(searchAlgorithm.getCurrentSolution()).toEqual(solutions);

        searchAlgorithm = new MOSABuilder().buildSearchAlgorithm();
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

        const properties = new SearchAlgorithmProperties(populationSize, chromosomeLength, crossoverProbability, mutationProbability);
        const chromosomeGenerator = new BitstringChromosomeGenerator(properties);
        const stoppingCondition = new OneOfStoppingCondition(new FixedIterationsStoppingCondition(iterations));
        properties.setStoppingCondition(stoppingCondition);
        const fitnessFunctions = new Map<number, FitnessFunction<BitstringChromosome>>();
        for (let i = 0; i < chromosomeLength; i++) {
            fitnessFunctions.set(i, new SingleBitFitnessFunction(chromosomeLength, i));
        }
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
