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
import {FitnessFunction} from "../../../../src/whisker/search/FitnessFunction";
import {BitstringChromosome} from "../../../../src/whisker/bitstring/BitstringChromosome";
import {SingleBitFitnessFunction} from "../../../../src/whisker/bitstring/SingleBitFitnessFunction";
import {List} from "../../../../src/whisker/utils/List";
import {MIO} from "../../../../src/whisker/search/algorithms/MIO";
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";

describe('MIO', () => {

    let searchAlgorithm;
    let fitnessFunctions;
    const chromosomeLength = 10;
    const iterations = 1000;
    const populationSize = null;
    const crossoverProbability = null;
    const mutationProbability = null;
    const startFocusedPhase = 0.5;
    const randomSelectionProbabilityStart = 0.5;
    const randomSelectionProbabilityFocusedPhase = 0;
    const maxArchiveSizeStart = 10;
    const maxArchiveSizeFocusedPhase = 1;
    const maxMutationCountStart = 0;
    const maxMutationCountFocusedPhase = 10;

    beforeEach(() => {
        const properties = new SearchAlgorithmProperties(populationSize, chromosomeLength, crossoverProbability, mutationProbability);
        const chromosomeGenerator = new BitstringChromosomeGenerator(properties);
        const stoppingCondition = new FixedIterationsStoppingCondition(iterations);

        fitnessFunctions = new Map<number, FitnessFunction<BitstringChromosome>>();
        const heuristicFunctions = new Map<number, Function>();
        for (let i = 0; i < chromosomeLength; i++) {
            fitnessFunctions.set(i, new SingleBitFitnessFunction(chromosomeLength, i));
            heuristicFunctions.set(i, v => v / chromosomeLength);
        }

        searchAlgorithm = new MIO(fitnessFunctions, heuristicFunctions, stoppingCondition, startFocusedPhase,
            randomSelectionProbabilityStart, randomSelectionProbabilityFocusedPhase,
            maxArchiveSizeStart, maxArchiveSizeFocusedPhase,
            maxMutationCountStart, maxMutationCountFocusedPhase);
        searchAlgorithm.setProperties(properties);
        searchAlgorithm.setChromosomeGenerator(chromosomeGenerator);
    });

    test('Find optimal solution', () => {
        const solutions = searchAlgorithm.findSolution() as List<BitstringChromosome>;
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

    test('Get current solution', () => {
        expect(searchAlgorithm.getCurrentSolution()).toBeUndefined();
        const solutions = searchAlgorithm.findSolution() as List<BitstringChromosome>;
        expect(searchAlgorithm.getCurrentSolution()).toEqual(solutions);
    });

    test('Get number of iterations', () => {
        expect(searchAlgorithm.getNumberOfIterations()).toBeUndefined();
        searchAlgorithm.findSolution();
        expect(searchAlgorithm.getNumberOfIterations()).toBe(iterations);
    });
});
