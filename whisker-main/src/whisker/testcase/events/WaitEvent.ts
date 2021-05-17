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
import {List} from "../../utils/List";

export class WaitEvent implements ScratchEvent {

    private steps: number;

    constructor(steps = 1) {
        this.steps = steps;
    }

    async apply(vm: VirtualMachine): Promise<void> {
        await Container.testDriver.runForSteps(this.steps);
    }

    public toJavaScript(args: number[]): string {
        return `await t.runForSteps(${this.steps});`;
    }

    public toString(args: number[]): string {
        return "Wait for " + this.steps + " steps";
    }

    getNumParameters(): number {
        return 1;
    }

    getParameter(): number[] {
        return [this.steps];
    }

    setParameter(codons: List<number>, codonPosition: number): void {
        // Waits of 0 seconds/steps leads to endless loop.
        this.steps = codons.get(codonPosition % codons.size()) % Container.config.getWaitStepUpperBound() + 1;
    }
}
