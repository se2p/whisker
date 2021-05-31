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
import {ParameterTypes} from "./ParameterTypes";
import {NeuroevolutionUtil} from "../../whiskerNet/NeuroevolutionUtil";

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
            isDown: true
        });

        // Keep the key pressed for this._steps steps.
        await new WaitEvent(this._steps).apply();

        // Release the key
        Container.testDriver.inputImmediate({
            device: 'keyboard',
            key: this._keyOption,
            isDown: false
        });
    }

    public toJavaScript(): string {
        return '' +
`t.inputImmediate({
    device: 'keyboard',
    key: '${this._keyOption}',
    isDown: 'true'
});`+ `\n`+
new WaitEvent(this._steps).toJavaScript() + `\n` +
`t.inputImmediate({
    device: 'keyboard',
    key: '${this._keyOption}',
    isDown: 'false'
});`
    }

    public toString(): string {
        return "KeyPress " + this._keyOption + ": " + this._steps;
    }

    getNumVariableParameters(): number {
        return 1;
    }

    getParameter(): (string | number)[] {
        return [this._keyOption, this._steps];
    }

    getVariableParameterNames(): string[] {
        return ["Steps"];
    }

    setParameter(args:number[], testExecutor:ParameterTypes): void {
        switch (testExecutor){
            case ParameterTypes.CODON:
                this._steps = args[0];
                break;
            case ParameterTypes.REGRESSION:
                this._steps = Math.round(NeuroevolutionUtil.relu(args[0]));
                break;
        }
        this._steps %= Container.config.getPressDurationUpperBound();
    }

    stringIdentifier(): string {
        return "KeyPressEvent-" + this._keyOption;
    }
}
