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
import {ParameterTypes} from "./ParameterTypes";
import {ScratchInterface} from "../../scratch/ScratchInterface";
import {ScratchPosition} from "../../scratch/ScratchPosition";

export class MouseMoveYEvent extends ScratchEvent {

    private _y: number;

    constructor(y = 0) {
        super();
        this._y = y;
    }

    async apply(): Promise<void> {
        Container.testDriver.inputImmediate({
            device: 'mouse',
            x: 0,
            y: Math.trunc(this._y)
        });
        ScratchInterface.setMousePosition(new ScratchPosition(0, this._y))
    }

    public toJavaScript(): string {
        return `t.inputImmediate({
    device: 'mouse',
    x: 0,
    y: ${Math.trunc(this._y)}
  });`;
    }

    public toString(): string {
        return "MouseMove " + Math.trunc(this._y);
    }

    getNumVariableParameters(): number {
        return 1;
    }

    getParameter(): number[] {
        return [this._y];
    }

    getVariableParameterNames(): string[] {
        return ["Y"]
    }

    setParameter(args: number[], argType: ParameterTypes): void {
        switch (argType) {
            case ParameterTypes.CODON: {
                const fittedCoordinates = this.fitCoordinates(0, args[0])
                this._y = fittedCoordinates.y;
                break;
            }
            case ParameterTypes.REGRESSION: {
                this._y = Math.tanh(args[1] * 0.5) * 180;
                break;
            }
        }
    }

    stringIdentifier(): string {
        return "MouseMoveYEvent";
    }
}
