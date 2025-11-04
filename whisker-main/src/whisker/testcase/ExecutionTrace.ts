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

import {ScratchEvent} from "./events/ScratchEvent";
import BranchDistanceTrace from "scratch-vm/src/tracing/branchCoverageTracer";

export class EventAndParameters {
    constructor(
        private readonly _event: ScratchEvent,
        private readonly _parameters: number[]
    ) {
    }

    get event(): ScratchEvent {
        return this._event;
    }

    get parameters(): number[] {
        return this._parameters;
    }

    getCodonCount(): number {
        // invariant: this._event.numSearchParameter() === this._parameters.length
        return 1 + this._event.numSearchParameter();
    }

    toString(): string {
        return `Event ${this._event} with parameter(s) ${this.parameters}`;
    }
}

/**
 * TODO
 */
export class ExecutionTrace {
    private readonly _blockTraces: CoverageTrace;

    private _events: EventAndParameters[];

    private readonly _positionTrace: SpriteTrace | null;

    constructor(traces: CoverageTrace, events: EventAndParameters[], trace: SpriteTrace | null = null) {
        this._blockTraces = traces;
        this._events = events;
        this._positionTrace = trace;
    }


    clone(): ExecutionTrace {
        return new ExecutionTrace(this.blockTraces, [...this.events], {
            ...this._positionTrace ? {...this._positionTrace, positions: [...this._positionTrace.positions]}
                : null
        });
    }

    get blockTraces(): CoverageTrace {
        return this._blockTraces;
    }

    get events(): EventAndParameters[] {
        return this._events;
    }

    set events(value: EventAndParameters[]) {
        this._events = value;
    }

    get positionTrace(): SpriteTrace | null {
        return this._positionTrace;
    }
}

export interface SpriteTrace {
    pass: boolean;
    positions: number[][];
}

export interface CoverageTrace {
    blockCoverage: Set<string>,
    lastStepCoveredBlocks: Set<string>,
    branchCoverage: Set<string>,
    branchDistances: BranchDistanceTrace
}
