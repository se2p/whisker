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

import {ScratchEvent} from "./ScratchEvent";
import {Container} from "../../utils/Container";

export class KeyDownEvent extends ScratchEvent {

    private readonly _keyOption: string;
    private readonly _value: boolean;

    constructor(keyOption: string, value: boolean) {
        super();
        this._keyOption = keyOption;
        this._value = value;
    }

    async apply(): Promise<void> {
        Container.testDriver.inputImmediate({
            device: 'keyboard',
            key: this._keyOption,
            isDown: this._value
        });
    }

    public toJavaScript(): string {
        return '' +
`t.inputImmediate({
    device: 'keyboard',
    key: '${this._keyOption}',
    isDown: ${this._value}
});`;
    }

    public toString(): string {
        return "KeyDown " + this._keyOption + ": " + this._value;
    }

    getNumParameters(): number {
        return 0;
    }

    getParameter(): number[] {
        // 0 returns False in JS/TS
        return [this._value ? 1 : 0];
    }

    setParameter(): void {
        return;
    }
}
