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

import {FitnessFunction} from '../search/FitnessFunction';
import {TestChromosome} from './TestChromosome';
import {TestExecutor} from './TestExecutor';
import {ExecutionTrace} from "./ExecutionTrace";

export class StatementCoverageFitness implements FitnessFunction<TestChromosome> {

    // TODO: Constructor needs CDG and target node

    getFitness (chromosome: TestChromosome): number {
        const executor = new TestExecutor(null); // TODO: where do we get the vm?
        const executionTrace = executor.execute(chromosome);

        const approachLevel = this._getApproachLevel(executionTrace);
        const branchDistance = this._getBranchDistance(executionTrace);

        return approachLevel + this._normalize(branchDistance)
    }

    compare (value1: number, value2: number): number {
        // Smaller fitness values are better
        return value1 - value2;
    }

    isOptimal (fitnessValue: number): boolean {
        // Covered if distance is 0
        return fitnessValue === 0.0;
    }

    isCovered(chromosome: TestChromosome): boolean {
        return this.isOptimal(this.getFitness(chromosome));
    }


    private _getApproachLevel(trace: ExecutionTrace) {
        // TODO: Store target node as field
        // TODO: Measure distance between target node and execution trace in CDG
        return 0;
    }

    private _getBranchDistance(trace: ExecutionTrace) {
        // TODO: Determine control dependency where execution branched erroneously
        // TODO: Calculate branch distance for node where diverged
        return 0.0;
    }

    private _normalize(x: number): number {
        return x/(x+1.0);
    }
}
