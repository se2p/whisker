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
import {ParameterType} from "./ParameterType";
import {Randomness} from "../../utils/Randomness";


export class MouseMoveEvent extends ScratchEvent {

    private _x: number;
    private _y: number;

    constructor(x = 0, y = 0) {
        super();
        this._x = x;
        this._y = y;
    }

    async apply(): Promise<void> {
        Container.testDriver.mouseMove(this._x, this._y);
    }

    public toJavaScript(): string {
        return `t.mouseMove(${Math.trunc(this._x)}, ${Math.trunc(this._y)});`;
    }

    public toJSON(): Record<string, any> {
        const event = {};
        event[`type`] = `MouseMoveEvent`;
        event[`args`] = {"x": this._x, "y": this._y};
        return event;
    }

    public toString(): string {
        return "MouseMove " + Math.trunc(this._x) + "/" + Math.trunc(this._y);
    }

    numSearchParameter(): number {
        return 2; // x and y?
    }

    getParameters(): [number, number] {
        return [this._x, this._y];
    }

    getSearchParameterNames(): [string, string] {
        return ["X", "Y"];
    }

    setParameter(args: number[], argType: ParameterType): [number, number] {
        switch (argType) {
            case "random": {
                const random = Randomness.getInstance();
                const stageBounds = Container.vmWrapper.getStageSize();
                const signedWidth = stageBounds.width / 2;
                const signedHeight = stageBounds.height / 2;
                this._x = random.nextInt(-signedWidth, signedWidth + 1);
                this._y = random.nextInt(-signedHeight, signedHeight + 1);
                break;
            }
            case "codon": {
                const {x, y} = this.fitCoordinates({x: args[0], y: args[1]});
                this._x = x;
                this._y = y;
                break;
            }
            case "activation": {
                // Clamp into coordinates.
                this._x = args[0] * 240;
                this._y = args[1] * 180;
                break;
            }
        }
        return [this._x, this._y];
    }

    stringIdentifier(): string {
        return "MouseMoveEvent";
    }
}
