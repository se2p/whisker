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

export class KeyDownEvent implements ScratchEvent {

    private readonly _keyOption: string;

    constructor(keyOption: string) {
        this._keyOption = keyOption;
    }

    static scratchKeyToKeyString (scratchKey) {
        switch (scratchKey) {
            case 'space':
                return ' ';
            case 'left arrow':
                return 'Left';
            case 'up arrow':
                return 'Up';
            case 'right arrow':
                return 'Right';
            case 'down arrow':
                return 'Down';
            default:
                return scratchKey;
        }
    }

    apply(vm: VirtualMachine) {
        vm.postIOData("keyboard", {
            device: 'keyboard',
            key: KeyDownEvent.scratchKeyToKeyString(this._keyOption),
            isDown: !this.isKeyDown(this._keyOption, vm),
            duration: WaitEvent.timeout // TODO: How long?
        });
    }

    toJavaScript(): string {
        throw new NotYetImplementedException();
    }

    public toString = () : string => {
        return "KeyDown " + this._keyOption;
    }

    getNumParameters(): number {
        return 0;
    }

    /**
     * @param {string} key .
     * @returns {boolean} .
     */
    isKeyDown (key, vm: VirtualMachine) {
        const keyString = KeyDownEvent.scratchKeyToKeyString(key);
        const scratchKey = vm.runtime.ioDevices.keyboard._keyStringToScratchKey(keyString);
        return vm.runtime.ioDevices.keyboard.getKeyIsDown(scratchKey);
    }
}
