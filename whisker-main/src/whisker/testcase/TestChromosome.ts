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

import {FitnessFunction} from "../search/FitnessFunction";
import {IntegerListChromosome} from "../integerlist/IntegerListChromosome";
import {Mutation} from "../search/Mutation";
import {Crossover} from "../search/Crossover";
import {ExecutionTrace} from "./ExecutionTrace";
import {TestExecutor} from "./TestExecutor";
import {Container} from "../utils/Container";
import assert from "assert";

export class TestChromosome extends IntegerListChromosome {

    /**
     * The execution trace including the blockTraces and the sent events and their parameters after executing the whole
     * chromosome.
     */
    private _trace: ExecutionTrace;

    /**
     * The execution trace including the blockTraces and the sent events and their parameters after executing the
     * chromosome up to that point after which no more blocks have been covered.
     */
    private _lastImprovedTrace: ExecutionTrace;

    /**
     * The covered blocks represented by their id.
     */
    private _coverage = new Set<string>();

    /**
     * The position in the codons list after which no additional improvement in fitness could be observed.
     */
    private _lastImprovedCodon: number;

    constructor(codons: number[], mutationOp: Mutation<IntegerListChromosome>, crossoverOp: Crossover<IntegerListChromosome>) {
        super(codons, mutationOp, crossoverOp);
        this._trace = null;
    }

    /**
     * Determines whether codons or a saved execution trace should be exectued.
     * @param executeCodons if true the saved codons will be exectued instead of the execution code originating from
     * a previous test execution.
     */
    override async evaluate(executeCodons:boolean): Promise<void> {
        const executor = new TestExecutor(Container.vmWrapper, Container.config.getEventExtractor(),
            Container.config.getEventSelector());
        if(executeCodons) {
            await executor.execute(this);
        }
        else{
            await executor.executeEventTrace(this);
        }
        assert(this.trace != null);
    }

    override async getFitness(fitnessFunction: FitnessFunction<this>): Promise<number> {
        if (this._fitnessCache.has(fitnessFunction)) {
            return this._fitnessCache.get(fitnessFunction);
        } else {
            const fitness = await fitnessFunction.getFitness(this);
            this._fitnessCache.set(fitnessFunction, fitness);
            return fitness;
        }
    }

    get trace(): ExecutionTrace {
        return this._trace;
    }

    set trace(value: ExecutionTrace) {
        this._trace = value;
    }

    get coverage(): Set<string> {
        return this._coverage;
    }

    set coverage(value: Set<string>) {
        this._coverage = value;
    }

    get lastImprovedCodon(): number {
        return this._lastImprovedCodon;
    }

    set lastImprovedCodon(value: number) {
        this._lastImprovedCodon = value;
    }

    get lastImprovedTrace(): ExecutionTrace {
        return this._lastImprovedTrace;
    }

    set lastImprovedTrace(value: ExecutionTrace) {
        this._lastImprovedTrace = value;
    }

    override clone(): TestChromosome {
        const clone = new TestChromosome(this.getGenes(), this.getMutationOperator(), this.getCrossoverOperator());
        clone.trace = this._trace;
        clone.lastImprovedCodon = this.lastImprovedCodon;
        clone.lastImprovedTrace = this.lastImprovedTrace;
        return clone;
    }

    override cloneWith(newGenes: number[]): TestChromosome {
        return new TestChromosome(newGenes, this.getMutationOperator(), this.getCrossoverOperator());
    }

    public getNumEvents(): number {
        assert(this._trace != null);
        return this._trace.events.length;
    }

    public override toString = (): string => {
        assert(this._trace != null);
        let text = "";
        for (const {event} of this._trace.events) {
            text += event.toString() + "\n";
        }

        return text;
    }
}
