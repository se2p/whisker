/*
 * Copyright (C) 2022 Whisker contributors
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

import {TestChromosome} from "../testcase/TestChromosome";
import {FitnessFunction} from "../search/FitnessFunction";
import {Container} from "../utils/Container";
import {StatisticsCollector} from "../utils/StatisticsCollector";
import {start} from "repl";

export class TestMinimizer {

    private readonly _fitnessFunction: FitnessFunction<TestChromosome>;

    private readonly _reservedCodons: number;

    private readonly _timeBudget: number;

    constructor (fitnessFunction: FitnessFunction<TestChromosome>, reservedCodons: number, timeBudget: number) {
        this._fitnessFunction = fitnessFunction;
        this._reservedCodons  = reservedCodons;

        // time budget for minimization, 0 means unlimited budget.
        this._timeBudget = timeBudget === 0 ? Number.POSITIVE_INFINITY : timeBudget;
    }

    public async minimize(test: TestChromosome): Promise<TestChromosome> {

        let changed = true;
        let oldFitness = this._fitnessFunction.getFitness(test);

        let newTest = test.cloneWith(test.getGenes());
        newTest.trace = test.trace;
        newTest.coverage = new Set<string>(test.coverage);
        newTest.lastImprovedCodon = test.lastImprovedCodon;
        const nEventsPreMinimization = test.getLength();
        Container.debugLog("Minimizing test of length: " + nEventsPreMinimization);

        const startTime = Date.now();

        Container.debugLog(`Minimization start time: ${startTime}`);

        while (changed && Date.now() - startTime < this._timeBudget) {
            changed = false;

            for (let i = newTest.getGenes().length - 1; i >= this._reservedCodons; i -= this._reservedCodons) {
                const newCodons = newTest.getGenes().slice(0, i - this._reservedCodons).concat(newTest.getGenes().slice(i + 1, newTest.getGenes().length));
                const newChromosome = newTest.cloneWith(newCodons);
                await newChromosome.evaluate();

                const fitness = this._fitnessFunction.getFitness(newChromosome);
                if (this._fitnessFunction.compare(fitness, oldFitness) >= 0) {
                    changed = true;
                    newTest = newChromosome;
                    oldFitness = fitness;
                    break;
                }
            }
        }

        Container.debugLog(`Minimization duration: ${Date.now() - startTime} / ${this._timeBudget} ms`);

        StatisticsCollector.getInstance().addMinimizedEvents(nEventsPreMinimization - newTest.getLength());
        Container.debugLog("Final length: " + newTest.getLength());
        return newTest;
    }
}
