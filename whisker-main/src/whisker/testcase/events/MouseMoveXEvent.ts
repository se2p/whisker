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

export class MouseMoveXEvent extends ScratchEvent {

    private _x: number;

    constructor(x = 0) {
        super();
        this._x = x;
    }

    async apply(): Promise<void> {
        Container.testDriver.inputImmediate({
            device: 'mouse',
            x: Math.trunc(this._x),
            y: 0
        });
        ScratchInterface.setMousePosition(new ScratchPosition(this._x, 0))
    }

    public toJavaScript(): string {
        return `t.inputImmediate({
    device: 'mouse',
    x: ${Math.trunc(this._x)},
    y: 0
  });`;
    }

    public toString(): string {
        return "MouseMoveX " + Math.trunc(this._x);
    }

    getNumVariableParameters(): number {
        return 1;
    }

    getParameter(): number[] {
        return [this._x];
    }

    getVariableParameterNames(): string[] {
        return ["X"]
    }

    setParameter(args: number[], argType: ParameterTypes): void {
        switch (argType) {
            case ParameterTypes.CODON: {
                const fittedCoordinates = this.fitCoordinates(args[0], 0)
                this._x = fittedCoordinates.x;
                break;
            }
            case ParameterTypes.REGRESSION: {
                this._x = Math.tanh(args[0] * 0.5) * 240;
                break;
            }
        }
    }

    stringIdentifier(): string {
        return "MouseMoveXEvent";
    }
}
