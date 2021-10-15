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
import {List} from "../utils/List";
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
     * The position in the codons list after which no additional blocks have been covered,
     * i.e the index of the codon coverage has not increased further.
     */
    private _lastImprovedCoverageCodon: number;

    constructor(codons: List<number>, mutationOp: Mutation<IntegerListChromosome>, crossoverOp: Crossover<IntegerListChromosome>) {
        super(codons, mutationOp, crossoverOp);
        this._trace = null;
    }

    async evaluate(): Promise<void> {
        const executor = new TestExecutor(Container.vmWrapper, Container.config.getEventExtractor(),
            Container.config.getEventSelector());
        await executor.execute(this);
        assert(this.trace != null);
    }

    getFitness(fitnessFunction: FitnessFunction<this>): number {
        if (this._fitnessCache.has(fitnessFunction)) {
            return this._fitnessCache.get(fitnessFunction);
        } else {
            const fitness = fitnessFunction.getFitness(this);
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

    get lastImprovedCoverageCodon(): number {
        return this._lastImprovedCoverageCodon;
    }

    set lastImprovedCoverageCodon(value: number) {
        this._lastImprovedCoverageCodon = value;
    }

    get lastImprovedTrace(): ExecutionTrace {
        return this._lastImprovedTrace;
    }

    set lastImprovedTrace(value: ExecutionTrace) {
        this._lastImprovedTrace = value;
    }

    clone(): TestChromosome {
        const clone = new TestChromosome(this.getGenes(), this.getMutationOperator(), this.getCrossoverOperator());
        clone.trace = this._trace;
        clone.lastImprovedCoverageCodon = this.lastImprovedCoverageCodon;
        clone.lastImprovedTrace = this.lastImprovedTrace;
        return clone;
    }

    cloneWith(newGenes: List<number>): TestChromosome {
        return new TestChromosome(newGenes, this.getMutationOperator(), this.getCrossoverOperator());
    }

    public getNumEvents(): number {
        assert(this._trace != null);
        return this._trace.events.size();
    }

    public toString = (): string => {
        assert(this._trace != null);
        let text = "";
        for (const [scratchEvent, args] of this._trace.events) {
            text += scratchEvent.toString() + "\n";
        }

        return text;
    }
}
