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

import {TestChromosome} from "./TestChromosome";
import {TestExecutor} from "./TestExecutor";
import {EventObserver} from "./EventObserver";
import {ScratchEvent} from "./ScratchEvent";

export class TestEventCounter implements EventObserver {

    private eventCount = 0;

    private executor: TestExecutor;

    constructor(executor: TestExecutor) {
        this.executor = executor;
    }

    getEventCount(test: TestChromosome): number {
        this.executor.attach(this);
        this.executor.execute(test);
        this.executor.detach(this);
        return this.eventCount;
    }

    update(event: ScratchEvent, args: number[]) {
        this.eventCount = this.eventCount+1;
    }
}
