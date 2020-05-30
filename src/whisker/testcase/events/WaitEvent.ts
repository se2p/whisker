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

    static timeout: number = -1; // timeout in ms
   // static accelerationFactor: number = -1;

    runStartTime: number;

    constructor() {
        if (WaitEvent.timeout == -1) {
            if (Container.config.getWaitDuration()) {
                WaitEvent.timeout = Container.config.getWaitDuration()
            } else {
                WaitEvent.timeout = 10;
            }
        }
    }


    apply(vm: VirtualMachine) {
        this.runStartTime = Date.now();

        // Wait x milliseconds
        while (this.getRunTimeElapsed() < WaitEvent.timeout) {
            vm.runtime._step();
        }
    }

    getRunTimeElapsed (): number {
        return (Date.now() - this.runStartTime);//* WaitEvent.accelerationFactor;
    }

    getNumParameters(): number {
        return 0;
    }
}
