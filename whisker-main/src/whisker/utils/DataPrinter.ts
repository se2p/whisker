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

import { List } from "./List";
import { Chromosome } from "../search/Chromosome";
import { NotYetImplementedException } from "../core/exceptions/NotYetImplementedException";

/**
 * A printer to retrieve the data about each run of the search algorithm.
 *
 * @param <C> the type of the chromosomes of the population that need to be printed out
 * @author Sophia Geserer
 */
export class DataPrinter<C extends Chromosome> {

    /**
     * Returns the achieved coverage of the given population.
     * @param population the population that coverage is needed
     * @returns the achieved coverage of the population
     */
    achievedCoverage(population: List<C>): number {
        throw new NotYetImplementedException();
    }

    /**
     * Returns the number of results.
     * @param population the population that size one is interested in
     * @returns the number of results
     */
    resultSize(population: List<C>): number {
        throw new NotYetImplementedException();
    }

    /**
     * Prints out the retrieved data.
     */
    print(): void {
        throw new NotYetImplementedException();
    }
}
