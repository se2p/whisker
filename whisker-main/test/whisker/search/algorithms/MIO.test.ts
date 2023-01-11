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
import {FitnessFunction} from "../../../../src/whisker/search/FitnessFunction";
import {BitstringChromosome} from "../../../../src/whisker/bitstring/BitstringChromosome";
import {SingleBitFitnessFunction} from "../../../../src/whisker/bitstring/SingleBitFitnessFunction";
import {MIO} from "../../../../src/whisker/search/algorithms/MIO";
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {BitflipMutation} from "../../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointCrossover} from "../../../../src/whisker/search/operators/SinglePointCrossover";
import {SearchAlgorithmBuilder} from "../../../../src/whisker/search/SearchAlgorithmBuilder";
import {FitnessFunctionType} from "../../../../src/whisker/search/FitnessFunctionType";
import {VMWrapperMock} from "../../utils/VMWrapperMock";
import {Container} from "../../../../src/whisker/utils/Container";
import {OneOfStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OneOfStoppingCondition";
import {OptimalSolutionStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OptimalSolutionStoppingCondition";
import Arrays from "../../../../src/whisker/utils/Arrays";
import {SearchAlgorithm} from "../../../../src/whisker/search/SearchAlgorithm";

describe('MIO', () => {

    let searchAlgorithm: SearchAlgorithm<BitstringChromosome>;
    const iterations = 10000;

    beforeEach(() => {
        const mock = new VMWrapperMock();
        mock.init();
        // @ts-ignore
        Container.vmWrapper = mock;

        Container.debugLog = () => { /* suppress output */
        };

        const builder: SearchAlgorithmBuilder<BitstringChromosome> = new SearchAlgorithmBuilder('mio');

        const properties = {
            populationSize: null,
            chromosomeLength: 10,
            selectionProbability: {start: 0.5, focusedPhase: 0},
            maxArchiveSize: {start: 10, focusedPhase: 1},
            maxMutationCount: {start: 0, focusedPhase: 10},
            stoppingCondition: new OneOfStoppingCondition(new FixedIterationsStoppingCondition(iterations),
                new OptimalSolutionStoppingCondition()),
            startOfFocusedPhase: 0.5,
            mutationProbability: undefined,
            crossoverProbability: undefined,
            testGenerator: undefined,
            integerRange: undefined,
            reservedCodons: undefined
        };

        searchAlgorithm = builder
            .addProperties(properties)
            .addChromosomeGenerator(new BitstringChromosomeGenerator(properties,
                new BitflipMutation(), new SinglePointCrossover()))
            .initializeFitnessFunction(FitnessFunctionType.SINGLE_BIT, properties.chromosomeLength, [])
            .buildSearchAlgorithm();
    });

    test('Find optimal solution', async () => {
        const archive = await searchAlgorithm.findSolution();
        const solutions = Arrays.distinct(archive.values());

        const fitnessFunctions: Array<FitnessFunction<BitstringChromosome>> = searchAlgorithm["_fitnessFunctions"];
        for (const fitnessFunction of fitnessFunctions.values()) {
            let optimal = false;
            for (const solution of solutions) {
                if (await fitnessFunction.isOptimal(await fitnessFunction.getFitness(solution))) {
                    optimal = true;
                    break;
                }
            }
            expect(optimal).toBeTruthy();
        }
    });

    test('Get current solution', async () => {
        expect(searchAlgorithm.getCurrentSolution().length).toBe(0);
        const archive = await searchAlgorithm.findSolution();
        const solutions = Arrays.distinct(archive.values());
        expect(searchAlgorithm.getCurrentSolution()).toEqual(solutions);
    });

    test('Get number of iterations', async () => {
        expect(searchAlgorithm.getNumberOfIterations()).toBe(0);
        await searchAlgorithm.findSolution();
        expect(searchAlgorithm.getNumberOfIterations()).toBeGreaterThan(0);
        expect(searchAlgorithm.getNumberOfIterations()).toBeLessThanOrEqual(iterations);
    });

    test('Setter', () => {
        const start = 0.4;
        const focusedPhase = 0.1;
        const chromosomeLength = 10;
        const stoppingCondition = new FixedIterationsStoppingCondition(100);

        const properties = {
            populationSize: 50,
            chromosomeLength,
            crossoverProbability: 1,
            mutationProbability: 1,
            startOfFocusedPhase: start,
            selectionProbability: {start, focusedPhase},
            maxArchiveSize: {start, focusedPhase},
            maxMutationCount: {start, focusedPhase},
            stoppingCondition,
            testGenerator: undefined,
            integerRange: undefined,
            reservedCodons: undefined
        };

        const chromosomeGenerator = new BitstringChromosomeGenerator(properties, new BitflipMutation(), new SinglePointCrossover());
        const fitnessFunctions = new Map<number, FitnessFunction<BitstringChromosome>>();
        const heuristicFunctions = new Map<number, (number) => number>();
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
