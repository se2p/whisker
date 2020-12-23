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

import {VirtualMachine} from 'scratch-vm/src/virtual-machine.js';
import {ScratchEvent} from "../ScratchEvent";
import {Container} from "../../utils/Container";

export class WaitEvent implements ScratchEvent {

    private readonly timeout: number;

    constructor(duration = Container.config.getWaitDuration() ) {
        this.timeout = duration;
    }

    async apply(vm: VirtualMachine): Promise<void> {
        await Container.testDriver.runForTime(this.timeout / Container.acceleration);
    }

    public toJavaScript(args: number[]): string {
        return `await t.runForTime(${this.timeout});`;
    }

    public toString(args: number[]): string {
        return "Wait " + this.timeout + " ms";
    }

    getNumParameters(): number {
        return 0;
    }
}
