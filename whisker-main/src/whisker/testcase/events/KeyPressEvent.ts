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
import {WaitEvent} from "./WaitEvent";

export class KeyPressEvent extends ScratchEvent {

    private readonly _keyOption: string;
    private _steps: number;

    constructor(keyOption: string, steps = 1) {
        super();
        this._keyOption = keyOption;
        this._steps = steps;
    }

    async apply(): Promise<void> {
        // Press the specified key
        Container.testDriver.inputImmediate({
            device: 'keyboard',
            key: this._keyOption,
            isDown: true,
            steps: this._steps
        });
        // Wait for the key to be released again.
        await new WaitEvent(this._steps).apply();
    }

    public toJavaScript(): string {
        return `t.inputImmediate({
    device: 'keyboard',
    key: '${this._keyOption}',
    isDown: 'true',
    steps: ${this._steps}
});`+ `\n`+
new WaitEvent(this._steps).toJavaScript()
    }

    public toString(): string {
        return "KeyPress " + this._keyOption + ": " + this._steps;
    }

    getNumParameters(): number {
        return 1;
    }

    getParameter(): number[] {
        return [this._steps];
    }

    setParameter(args: number[]): void {
        this._steps = args[0] % Container.config.getPressDurationUpperBound();
    }
}
