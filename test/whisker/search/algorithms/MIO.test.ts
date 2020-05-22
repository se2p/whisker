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
import {BitflipMutation} from "../../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointCrossover} from "../../../../src/whisker/search/operators/SinglePointCrossover";
import {SearchAlgorithmBuilder} from "../../../../src/whisker/search/SearchAlgorithmBuilder";
import {SearchAlgorithmType} from "../../../../src/whisker/search/algorithms/SearchAlgorithmType";
import {FitnessFunctionType} from "../../../../src/whisker/search/FitnessFunctionType";

describe('MIO', () => {

    let searchAlgorithm;
    const iterations = 10000;

    beforeEach(() => {
        const builder: SearchAlgorithmBuilder<BitstringChromosome> = new SearchAlgorithmBuilder(SearchAlgorithmType.MIO);

        const chromosomeLength = 10;
        const populationSize = null;

        const startFocusedPhase = 0.5;
        const randomSelectionProbabilityStart = 0.5;
        const randomSelectionProbabilityFocusedPhase = 0;
        const maxArchiveSizeStart = 10;
        const maxArchiveSizeFocusedPhase = 1;
        const maxMutationCountStart = 0;
        const maxMutationCountFocusedPhase = 10;

        const properties = new SearchAlgorithmProperties(populationSize, chromosomeLength);
        properties.setSelectionProbabilities(randomSelectionProbabilityStart, randomSelectionProbabilityFocusedPhase);
        properties.setMaxArchiveSizes(maxArchiveSizeStart, maxArchiveSizeFocusedPhase);
        properties.setMaxMutationCounter(maxMutationCountStart, maxMutationCountFocusedPhase);
        properties.setStoppingCondition(new FixedIterationsStoppingCondition(iterations));
        properties.setStartOfFocusedPhase(startFocusedPhase);

        searchAlgorithm = builder
            .addProperties(properties)
            .addChromosomeGenerator(new BitstringChromosomeGenerator(properties,
                new BitflipMutation(), new SinglePointCrossover()))
            .initializeFitnessFunction(FitnessFunctionType.SINGLE_BIT, chromosomeLength, new List())
            .buildSearchAlgorithm();
    });

    test('Find optimal solution', () => {
        const solutions = searchAlgorithm.findSolution() as List<BitstringChromosome>;

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

    test('Setter', () => {
        const chromosomeLength = 10;
        const populationSize = 50;
        const iterations = 100;
        const crossoverProbability = 1;
        const mutationProbability = 1;
        const startOfFocusPhase = 0.4;
        const start = 0.4;
        const focusedPhase = 0.1;

        const properties = new SearchAlgorithmProperties(populationSize, chromosomeLength);
        properties.setCrossoverProbability(crossoverProbability);
        properties.setMutationProbablity(mutationProbability);
        properties.setStartOfFocusedPhase(startOfFocusPhase);
        properties.setSelectionProbabilities(start, focusedPhase);
        properties.setMaxArchiveSizes(start, focusedPhase);
        properties.setMaxMutationCounter(start, focusedPhase);
        const stoppingCondition = new FixedIterationsStoppingCondition(iterations);
        properties.setStoppingCondition(stoppingCondition);

        const chromosomeGenerator = new BitstringChromosomeGenerator(properties, new BitflipMutation(), new SinglePointCrossover());
        const fitnessFunctions = new Map<number, FitnessFunction<BitstringChromosome>>();
        const heuristicFunctions = new Map<number, Function>();
        for (let i = 0; i < chromosomeLength; i++) {
            fitnessFunctions.set(i, new SingleBitFitnessFunction(chromosomeLength, i));
            heuristicFunctions.set(i, v => v / chromosomeLength);
        }

        const searchAlgo = new MIO();
        searchAlgo.setProperties(properties);
        expect(searchAlgo["_properties"]).toBe(properties);
        expect(searchAlgo["_randomSelectionProbabilityStart"]).toBe(start);
        expect(searchAlgo["_randomSelectionProbabilityFocusedPhase"]).toBe(focusedPhase);
        expect(searchAlgo["_maxArchiveSizeStart"]).toBe(start);
        expect(searchAlgo["_maxArchiveSizeFocusedPhase"]).toBe(focusedPhase);
        expect(searchAlgo["_maxMutationCountStart"]).toBe(start);
        expect(searchAlgo["_maxMutationCountFocusedPhase"]).toBe(focusedPhase);
        expect(searchAlgo["_stoppingCondition"]).toBe(stoppingCondition);

        searchAlgo.setChromosomeGenerator(chromosomeGenerator);
        expect(searchAlgo["_chromosomeGenerator"]).toBe(chromosomeGenerator);

        searchAlgo.setFitnessFunctions(fitnessFunctions);
        expect(searchAlgo["_fitnessFunctions"]).toBe(fitnessFunctions);

        searchAlgo.setHeuristicFunctions(heuristicFunctions);
        expect(searchAlgo["_heuristicFunctions"]).toBe(heuristicFunctions);
    });

});
