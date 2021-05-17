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
import {NotYetImplementedException} from "../../core/exceptions/NotYetImplementedException";
import {List} from "../../utils/List";

export class SoundEvent implements ScratchEvent {

    private _volume:number;

    async apply(vm: VirtualMachine): Promise<void> {
        throw new NotYetImplementedException();
    }

    public toJavaScript(args: number[]): string {
        throw new NotYetImplementedException();
    }

    public toString(args: number[]): string {
        throw new NotYetImplementedException();
    }

    getNumParameters(): number {
        return 1;
    }

    getParameter(): number[] {
        return [this._volume];
    }

    setParameter(codons: List<number>, codonPosition: number): void {
        this._volume = codons.get(codonPosition % codons.size());
    }
}
