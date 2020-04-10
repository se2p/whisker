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
 * along with Whisker.
 * If not, see http://www.gnu.org/licenses/.
 *
 */

import { SearchAlgorithm } from "./SearchAlgorithm";
import { Chromosome } from "./Chromosome";
import { SearchAlgorithmProperties } from "./SearchAlgorithmProperties";
import { NotYetImplementedException } from "../core/exceptions/NotYetImplementedException";

/**
 * This factory is used to instantiate and configure the search algorithm.
 *
 * // TODO: not sure about this class
 *
 * @param <C> the type of chromosomes the factory handles
 * @author Sophia Geserer
 */
export class SearchAlgorithmFactory<C extends Chromosome> {

    /**
     * The search algorithm to be configured.
     */
    private _searchAlgorithm: SearchAlgorithm<C>;

    /**
     * Instantiates the search algorithm.
     */
    instantiateSearchAlgorithm(): void {
        throw new NotYetImplementedException();
    }

    /**
     * Sets the properties for the search algorithm.
     */
    configureSearchAlgorithm(properties: SearchAlgorithmProperties<C>): void {
        throw new NotYetImplementedException();
    }
}
