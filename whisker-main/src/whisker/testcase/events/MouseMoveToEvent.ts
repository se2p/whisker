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
import {ScratchPosition} from "../../scratch/ScratchPosition";
import {ScratchInterface} from "../../scratch/ScratchInterface";
import uid from "scratch-vm/src/util/uid";
import {SubVMBlock} from "../../../types/ScratchVMBlock";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";
import {Container} from "../../utils/Container";

export class MouseMoveToEvent extends ScratchEvent {


    private _x: number;
    private _y: number;
    private readonly _sprite: string;

    constructor(x: number, y: number, sprite: string) {
        super();
        this._x = x;
        this._y = y;
        this._sprite = sprite;
    }

    async apply(): Promise<void> {
        ScratchInterface.setMousePosition(new ScratchPosition(this._x, this._y));
    }

    public toJavaScript(): string {
        return `t.mouseMove(${Math.trunc(this._x)}, ${Math.trunc(this._y)});`;
    }

    public toScratchBlocks(): ScratchScriptSnippet {
        // The MouseMoveEvent and the MouseMoveToEvent seem to have the same effect (same apply() logic).

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
        event[`type`] = `MouseMoveToEvent`;
        event[`args`] = {"x": this._x, "y": this._y};
        return event;
    }

    public toString(): string {
        return "MouseMoveToEvent " + Math.trunc(this._x) + "/" + Math.trunc(this._y);
    }

    numSearchParameter(): number {
        return 0;
    }

    getParameters(): [number, number] {
        return [this._x, this._y];
    }

    getSearchParameterNames(): [] {
        return [];
    }

    setParameter(): [] {
        return [];
    }

    stringIdentifier(): string {
        return `MouseMoveToEvent-${this.sprite}`;
    }

    get sprite(): string {
        return this._sprite;
    }

    set x(value: number) {
        this._x = value;
    }

    set y(value: number) {
        this._y = value;
    }
}
