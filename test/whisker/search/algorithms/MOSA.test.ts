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

import {RandomSearch} from "../../../../src/whisker/search/algorithms/RandomSearch";
import {BitstringChromosomeGenerator} from "../../../../src/whisker/bitstring/BitstringChromosomeGenerator";
import {SearchAlgorithmProperties} from "../../../../src/whisker/search/SearchAlgorithmProperties";
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {OneMaxFitnessFunction} from "../../../../src/whisker/bitstring/OneMaxFitnessFunction";
import {OneOfStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OneOfStoppingCondition";
import {OptimalSolutionStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OptimalSolutionStoppingCondition";
import { MOSA } from "src/whisker/search/algorithms/MOSA";
import { FitnessFunction } from "src/whisker/search/FitnessFunction";
import { BitstringChromosome } from "src/whisker/bitstring/BitstringChromosome";
import { PositionFitnessFunction } from "src/whisker/bitstring/PositionFitnessFunction";

describe('MOSA', () => {

    test('Trivial bitstring with OneMax', () => {

        const n = 2;
        const properties = new SearchAlgorithmProperties(1, 0, 0);
        properties.setChromosomeLength(n);

        const fitnessFunctions = new Map<number, FitnessFunction<BitstringChromosome>>();
        fitnessFunctions.set(0, new PositionFitnessFunction(n, 0)); 
        fitnessFunctions.set(1, new PositionFitnessFunction(n, 1)); 
        const chromosomeGenerator = new BitstringChromosomeGenerator(properties);
        const stoppingCondition = new OneOfStoppingCondition(
            new FixedIterationsStoppingCondition(100)
        );
        const mosa = new MOSA();
        mosa.setFitnessFunctions(fitnessFunctions);
        mosa.setChromosomeGenerator(chromosomeGenerator);
        mosa.setStoppingCondition(stoppingCondition);

        const solutions = mosa.findSolution();

        //expect(firstSolution.getFitness(fitnessFunction)).toBe(n);
    });

});
