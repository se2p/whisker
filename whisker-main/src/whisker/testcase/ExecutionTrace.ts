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

import { Trace } from "scratch-vm/src/engine/tracing.js";
import { ScratchEvent } from "./events/ScratchEvent";
import { List } from "../utils/List";

export class EventAndParameters {
    constructor(
        private readonly _event: ScratchEvent,
        private readonly _parameters: number[]
    ) { }

    get event(): ScratchEvent {
        return this._event;
    }

    get parameters(): number[] {
        return this._parameters;
    }

    getCodonCount(): number {
        return 1 + this._parameters.length;
    }
}

/**
 * TODO
 */
export class ExecutionTrace {
    private readonly _blockTraces: Trace[];

    private readonly _events: List<EventAndParameters>;

    constructor(traces: Trace[], events: List<EventAndParameters>) {
        this._blockTraces = traces;
        this._events = events;
    }

    clone(): ExecutionTrace {
        return new ExecutionTrace(this.blockTraces, this.events.clone());
    }

    get blockTraces(): Trace[] {
        return this._blockTraces;
    }

    get events(): List<EventAndParameters> {
        return this._events;
    }
}
