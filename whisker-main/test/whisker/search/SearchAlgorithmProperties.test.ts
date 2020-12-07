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

import {SearchAlgorithmProperties} from "../../../src/whisker/search/SearchAlgorithmProperties";
import {FixedIterationsStoppingCondition} from "../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {StoppingCondition} from "../../../src/whisker/search/StoppingCondition";

describe('Search algorithm properties', () => {

    let searchAlgorithmProperties;

    beforeEach(() => {
       searchAlgorithmProperties = new SearchAlgorithmProperties(0, 0);
    });

    test('Getter/Setter: Chromosome length and population size', () => {
        const populationSize = 20;
        const chromosomeLength = 15;

        searchAlgorithmProperties.setPopulationSize(populationSize);
        expect(searchAlgorithmProperties.getPopulationSize()).toBe(populationSize);

        searchAlgorithmProperties.setChromosomeLength(chromosomeLength);
        expect(searchAlgorithmProperties.getChromosomeLength()).toBe(chromosomeLength);
    });

    test('Getter/Setter: Crossover and mutation probabilities and counter', () => {
        let probability = 0.3;

        searchAlgorithmProperties.setCrossoverProbability(probability);
        expect(searchAlgorithmProperties.getCrossoverProbability()).toBe(probability);

        probability = 0.6;
        searchAlgorithmProperties.setMutationProbablity(probability);
        expect(searchAlgorithmProperties.getMutationProbablity()).toBe(probability);

        const maxMutCountStart = 4;
        const maxMutCountFocus = 8;
        searchAlgorithmProperties.setMaxMutationCounter(maxMutCountStart, maxMutCountFocus);
        expect(searchAlgorithmProperties.getMaxMutationCountStart()).toBe(maxMutCountStart);
        expect(searchAlgorithmProperties.getMaxMutationCountFocusedPhase()).toBe(maxMutCountFocus);
    });

    test('Getter/Setter: Stopping condition', () => {
        const stoppingCond: StoppingCondition<any> = new FixedIterationsStoppingCondition(8);
        searchAlgorithmProperties.setStoppingCondition(stoppingCond);
        expect(searchAlgorithmProperties.getStoppingCondition()).toBe(stoppingCond);
    });

    test('Getter/Setter: Selection probabilities', () => {
        const selectProbStart = 0.1;
        const selectProbFocus = 0.9;
        searchAlgorithmProperties.setSelectionProbabilities(selectProbStart, selectProbFocus);
        expect(searchAlgorithmProperties.getSelectionProbabilityStart()).toBe(selectProbStart);
        expect(searchAlgorithmProperties.getSelectionProbabilityFocusedPhase()).toBe(selectProbFocus);
    });

    test('Getter/Setter: Max archive size', () => {
        const maxArchiveSizeStart = 0.1;
        const maxArchiveSizeFocus = 0.9;
        searchAlgorithmProperties.setMaxArchiveSizes(maxArchiveSizeStart, maxArchiveSizeFocus);
        expect(searchAlgorithmProperties.getMaxArchiveSizeStart()).toBe(maxArchiveSizeStart);
        expect(searchAlgorithmProperties.getMaxArchiveSizeFocusedPhase()).toBe(maxArchiveSizeFocus);
    });

    test('Getter/Setter: Start of focused phase', () => {
        const startFocus = 0.9;
        searchAlgorithmProperties.setStartOfFocusedPhase(startFocus);
        expect(searchAlgorithmProperties.getStartOfFocusedPhase()).toBe(startFocus);
    });

    test('Getter/Setter: Min/Max range', () => {
        const min = 0;
        const max = 160;
        searchAlgorithmProperties.setIntRange(min, max);
        expect(searchAlgorithmProperties.getMinIntRange()).toBe(min);
        expect(searchAlgorithmProperties.getMaxIntRange()).toBe(max);
    });
});
