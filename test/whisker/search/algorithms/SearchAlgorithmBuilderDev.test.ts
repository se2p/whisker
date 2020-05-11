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

        const populationSize = 50;
        const chromosomeLength = 10;
        const crossoverProbability = 1;
        const mutationProbability = 1;
        const maxIterations = 100;

        const properties = new SearchAlgorithmProperties(populationSize, chromosomeLength);
        properties.setMutationProbablity(mutationProbability);
        properties.setCrossoverProbability(crossoverProbability);
        properties.setStoppingCondition(new OneOfStoppingCondition(new FixedIterationsStoppingCondition(maxIterations)));

        builder
            .addProperties(properties)
            .addChromosomeGenerator(new BitstringChromosomeGenerator(this._properties,
                new BitflipMutation(), new SinglePointCrossover()))
            .addSelectionOperator(new RankSelection())
            .initializeFitnessFunction(FitnessFunctionType.SINGLE_BIT, chromosomeLength);

        const searchAlgorithm = builder.buildSearchAlgorithm();

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

    test('Build MIO', () => {
        const builder: SearchAlgorithmBuilderDev<BitstringChromosome> = new SearchAlgorithmBuilderDev(SearchAlgorithmType.MIO);

        const chromosomeLength = 10;
        const iterations = 1000;
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

        builder
            .addChromosomeGenerator(new BitstringChromosomeGenerator(this._properties,
                new BitflipMutation(), new SinglePointCrossover()))
            .initializeFitnessFunction(FitnessFunctionType.SINGLE_BIT, chromosomeLength);

        const searchAlgorithm = builder.buildSearchAlgorithm();

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

    test('Build Random', () => {
        const builder: SearchAlgorithmBuilderDev<BitstringChromosome> = new SearchAlgorithmBuilderDev(SearchAlgorithmType.RANDOM);

        const populationSize = 1;
        const chromosomeLength = 2;
        const crossoverProbability = 1;
        const mutationProbability = 1;
        const maxIterations = 100;
        const fitnessFunction = new OneMaxFitnessFunction(chromosomeLength);

        const properties = new SearchAlgorithmProperties(populationSize, chromosomeLength);
        properties.setCrossoverProbability(crossoverProbability);
        properties.setMutationProbablity(mutationProbability);
        properties.setStoppingCondition(new OneOfStoppingCondition(
            new FixedIterationsStoppingCondition(maxIterations),
            new OptimalSolutionStoppingCondition(fitnessFunction)
        ));

        builder
            .addChromosomeGenerator(new BitstringChromosomeGenerator(this._properties,
                new BitflipMutation(), new SinglePointCrossover()))
            .initializeFitnessFunction(FitnessFunctionType.ONE_MAX, chromosomeLength);

        const randomSearch = builder.buildSearchAlgorithm();
        const solutions = randomSearch.findSolution();
        const firstSolution = solutions.get(0);

        expect(firstSolution.getFitness(fitnessFunction)).toBe(chromosomeLength);
    });

    test('Build OnePlusOne', () => {
        const builder: SearchAlgorithmBuilderDev<BitstringChromosome> = new SearchAlgorithmBuilderDev(SearchAlgorithmType.ONE_PLUS_ONE);

        const populationSize = 1;
        const chromosomeLength = 10;
        const maxIterations = 100;

        const properties = new SearchAlgorithmProperties(populationSize, chromosomeLength);
        const fitnessFunction = new OneMaxFitnessFunction(chromosomeLength);
        properties.setStoppingCondition(new OneOfStoppingCondition(
            new FixedIterationsStoppingCondition(maxIterations),
            new OptimalSolutionStoppingCondition(fitnessFunction)));

        builder
            .addProperties(properties)
            .addChromosomeGenerator(new BitstringChromosomeGenerator(properties, new BitflipMutation(), new SinglePointCrossover()))
            .initializeFitnessFunction(FitnessFunctionType.ONE_MAX, chromosomeLength);

        const search = builder.buildSearchAlgorithm();
        const solutions = search.findSolution();
        const firstSolution = solutions.get(0);

        expect(firstSolution.getFitness(fitnessFunction)).toBe(chromosomeLength);
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

        builder.addSelectionOperator(selectionOp);
        expect(builder["_selectionOperator"]).toBe(selectionOp);
    });

});
