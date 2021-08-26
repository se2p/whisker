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
import {ParameterType} from "./ParameterType";
import {NeuroevolutionUtil} from "../../whiskerNet/NeuroevolutionUtil";
import {Randomness} from "../../utils/Randomness";

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

    public toJSON(): Record<string, any> {
        const event = {}
        event[`type`] = `KeyPressEvent`;
        event[`args`] = {"key": this._keyOption, "steps": this._steps}
        return event;
    }

    public toString(): string {
        return "KeyPress " + this._keyOption + ": " + this._steps;
    }

    numSearchParameter(): number {
        return 1;
    }

    getParameter(): (string | number)[] {
        return [this._keyOption, this._steps];
    }

    getSearchParameterNames(): string[] {
        return ["Steps"];
    }

    setParameter(args:number[], testExecutor:ParameterType): void {
        switch (testExecutor){
            case ParameterType.RANDOM:
                this._steps = Randomness.getInstance().nextInt(1, Container.config.getPressDurationUpperBound() + 1);
                break;
            case ParameterType.CODON:
                this._steps = args[0];
                break;
            case ParameterType.REGRESSION:
                this._steps = Math.round(NeuroevolutionUtil.relu(args[0]));
                break;
        }
        this._steps %= Container.config.getPressDurationUpperBound();

        // If the event has been selected execute if for at least one step.
        if(this._steps < 1){
            this._steps = 1;
        }
    }

    stringIdentifier(): string {
        return "KeyPressEvent-" + this._keyOption;
    }
}
