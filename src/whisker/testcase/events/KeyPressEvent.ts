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

import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchEvent} from "../ScratchEvent";
import {NotYetImplementedException} from "../../core/exceptions/NotYetImplementedException";
import {WaitEvent} from "./WaitEvent";

export class KeyPressEvent implements ScratchEvent {

    private readonly _keyOption: string;

    constructor(keyOption: string) {
        this._keyOption = keyOption;
    }

    apply(vm: VirtualMachine) {
        vm.runtime.startHats('event_whenkeypressed', {KEY_OPTION: this._keyOption}, null);
    }

    public toJavaScript(args: number[]): string {
        // TODO: How long?
        return "t.inputImmediate({\n" +
            "        device: 'keyboard',\n" +
            "        key: '" + this._keyOption + "',\n" +
            "        isDown: true,\n" +
            "        duration: " + WaitEvent.timeout + "\n" +
            "    });";
    }

    public toString(args: number[]): string {
        return "KeyPress " + this._keyOption;
    }

    getNumParameters(): number {
        return 0;
    }
}
