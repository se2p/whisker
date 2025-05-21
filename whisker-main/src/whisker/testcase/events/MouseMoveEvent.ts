/*
 * Copyright (C) 2024 Whisker contributors
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
import {ScratchInterface} from "../../scratch/ScratchInterface";
import {ScratchPosition} from "../../scratch/ScratchPosition";
import uid from "scratch-vm/src/util/uid";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";
import {SubVMBlock} from "../../../types/ScratchVMBlock";

export class MouseMoveEvent extends ScratchEvent {

    protected _x: number;
    protected _y: number;

    constructor(x = 0, y = 0) {
        super();
        this._x = x;
        this._y = y;
    }

    async apply(): Promise<void> {
        ScratchInterface.setMousePosition(new ScratchPosition(this._x, this._y));
    }

    public toJavaScript(): string {
        return `t.mouseMove(${Math.trunc(this._x)}, ${Math.trunc(this._y)});`;
    }

    public toScratchBlocks(): ScratchScriptSnippet {
        const mainBlockId = uid();
        const xInputBlockId = uid();
        const yInputBlockId = uid();

        const stageBounds = Container.vmWrapper.getStageSize();

        const mainBlock: SubVMBlock =
            {
                "id": mainBlockId,
                "opcode": "bbt_placeMousePointer",
                "inputs": {
                    "X": {
                        "name": "X",
                        "block": xInputBlockId,
                        "shadow": xInputBlockId
                    },
                    "Y": {
                        "name": "Y",
                        "block": yInputBlockId,
                        "shadow": yInputBlockId
                    }
                },
                "fields": {},
                "next": null,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        const xInputBlock: SubVMBlock =
            {
                "id": xInputBlockId,
                "opcode": "math_number",
                "inputs": {},
                "fields": {
                    "NUM": {
                        "name": "NUM",
                        "value": (this._x - (stageBounds.width / 2)).toString()
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": mainBlockId,
                "shadow": true,
                "breakpoint": false
            };

        const yInputBlock: SubVMBlock =
            {
                "id": yInputBlockId,
                "opcode": "math_number",
                "inputs": {},
                "fields": {
                    "NUM": {
                        "name": "NUM",
                        "value": ((stageBounds.height / 2) - this._y).toString()
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": mainBlockId,
                "shadow": true,
                "breakpoint": false
            };

        return {blocks: [mainBlock, xInputBlock, yInputBlock], first: mainBlock, last: mainBlock};
    }

    public toJSON(): Record<string, unknown> {
        const event = {};
        event[`type`] = `MouseMoveEvent`;
        event[`args`] = {"x": this._x, "y": this._y};
        return event;
    }

    public toString(): string {
        return "MouseMove " + Math.trunc(this._x) + "/" + Math.trunc(this._y);
    }

    numSearchParameter(): number {
        return 2; // x and y
    }

    getParameters(): [number, number] {
        return [this._x, this._y];
    }

    getSearchParameterNames(): string[] {
        return ["X", "Y"];
    }

    setParameter(args: number[], argType: ParameterType): [number, number] {

        const stageBounds = Container.vmWrapper.getStageSize();
        const signedWidth = stageBounds.width / 2;
        const signedHeight = stageBounds.height / 2;

        switch (argType) {
            case "random": {
                const random = Randomness.getInstance();
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
                this._x = args[0] * signedWidth;
                this._y = args[1] * signedHeight;
                break;
            }
        }
        return [this._x, this._y];
    }

    stringIdentifier(): string {
        return "MouseMoveEvent";
    }
}
