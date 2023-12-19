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
import {ExecutionTrace} from "../testcase/ExecutionTrace";
import Arrays from "../utils/Arrays";

export class TestMinimizer {

    private readonly _fitnessFunction: FitnessFunction<TestChromosome>;

    private readonly _reservedCodons: number;

    constructor(fitnessFunction: FitnessFunction<TestChromosome>, reservedCodons: number) {
        this._fitnessFunction = fitnessFunction;
        this._reservedCodons = reservedCodons;
    }

    public async minimize(test: TestChromosome, timeBudget: number): Promise<TestChromosome> {

        let changed = true;
        let oldFitness = await this._fitnessFunction.getFitness(test);

        let newTest = test.cloneWith(test.getGenes());
        newTest.trace = test.trace;
        newTest.coverage = new Set<string>(test.coverage);
        newTest.lastImprovedCodon = test.lastImprovedCodon;
        const nEventsPreMinimization = test.getLength();
        const startTime = Date.now();
        Container.debugLog(`Starting minimization for ${nEventsPreMinimization} events and a time-limit of ${timeBudget}`);

        while (changed && Date.now() - startTime < timeBudget) {
            changed = false;
            const eventChunks = Arrays.chunk(newTest.trace.events, 2);
            const codonChunks = Arrays.chunk(newTest.getGenes(), this._reservedCodons);

            for (let i = eventChunks.length - 1; i >= 1; i--) {
                const newEvents = eventChunks.slice(0, i).concat(eventChunks.slice(i + 1)).flat();
                const newCodons = codonChunks.slice(0, i).concat(codonChunks.slice(i + 1)).flat();

                const newChromosome = newTest.cloneWith(newCodons);
                newChromosome.trace = new ExecutionTrace([], newEvents);
                await newChromosome.evaluate(false);

                const fitness = await this._fitnessFunction.getFitness(newChromosome);
                if (this._fitnessFunction.compare(fitness, oldFitness) >= 0) {
                    changed = true;
                    newTest = newChromosome;
                    oldFitness = fitness;
                    break;
                }
            }
        }

        StatisticsCollector.getInstance().addMinimizedEvents(nEventsPreMinimization - newTest.getLength());
        Container.debugLog(`Test minimization finished with ${nEventsPreMinimization - newTest.getLength()} fewer events and a duration of ${Date.now() - startTime} ms`);
        return newTest;
    }
}
