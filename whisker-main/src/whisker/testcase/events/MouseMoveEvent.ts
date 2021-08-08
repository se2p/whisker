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
import {ScratchHelperFunctions} from "../../scratch/ScratchHelperFunctions";
import {ScratchPosition} from "../../scratch/ScratchPosition";

export class MouseMoveEvent extends ScratchEvent {

    private _x: number;
    private _y: number;

    constructor(x = 0, y = 0) {
        super();
        this._x = x;
        this._y = y;
    }

    async apply(): Promise<void> {
        Container.testDriver.inputImmediate({
            device: 'mouse',
            x: Math.trunc(this._x),
            y: Math.trunc(this._y)
        });
        ScratchHelperFunctions.setMousePosition(new ScratchPosition(this._x, this._y))
    }

    public toJavaScript(): string {
        return `t.inputImmediate({
    device: 'mouse',
    x: ${Math.trunc(this._x)},
    y: ${Math.trunc(this._y)}
  });`;
    }

    public toString(): string {
        return "MouseMove " + Math.trunc(this._x) + "/" + Math.trunc(this._y);
    }

    getNumVariableParameters(): number {
        return 2; // x and y?
    }

    getParameter(): number[] {
        return [this._x, this._y];
    }

    getVariableParameterNames(): string[] {
        return ["X", "Y"]
    }

    setParameter(args: number[], argType: ParameterTypes): void {
        switch (argType) {
            case ParameterTypes.CODON: {
                const fittedCoordinates = this.fitCoordinates(args[0], args[1])
                this._x = fittedCoordinates.x;
                this._y = fittedCoordinates.y;
                break;
            }
            case ParameterTypes.REGRESSION: {
                this._x = Math.tanh(args[0]) * 240;
                this._y = Math.tanh(args[1]) * 180;
                break;
            }
        }
    }

    stringIdentifier(): string {
        return "MouseMoveEvent";
    }
}
