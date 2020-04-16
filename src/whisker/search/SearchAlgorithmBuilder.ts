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

import {ChromosomeGenerator} from "./ChromosomeGenerator";
import {Chromosome} from "./Chromosome";
import {FitnessFunction} from "./FitnessFunction";
import {StoppingCondition} from "./StoppingCondition";
import {SearchAlgorithm} from "./SearchAlgorithm";
import {SearchAlgorithmProperties} from "./SearchAlgorithmProperties";

/**
 * Interface for a builder to set necessary properties of a search algorithm.
 *
 * @param <C> the type of the chromosomes handled by the search algorithm.
 * @author Sophia Geserer
 */
export interface SearchAlgorithmBuilder<C extends Chromosome>{

    /**
     * Builds a new search algorithm with the corresponding properties (e.g. fitness function).
     */
    buildSearchAlgorithm(): SearchAlgorithm<C>;

    /**
     * Adds the generator used to generate chromosomes.
     */
    addChromosomeGenerator(generator: ChromosomeGenerator<C>): SearchAlgorithmBuilder<C>;

    /**
     * Adds the fitness function used by the search algorithm.
     */
    addFitnessFunction(fitnessFunction: FitnessFunction<C>): SearchAlgorithmBuilder<C>;

    /**
     * Adds the stopping condition used by the search algorithm.
     */
    addStoppingCondition(stoppingCondition: StoppingCondition<C>): SearchAlgorithmBuilder<C>;

    /**
     * Adds the properties needed by the search algorithm.
     */
    addProperties(properties: SearchAlgorithmProperties<C>): SearchAlgorithmBuilder<C>;

}
