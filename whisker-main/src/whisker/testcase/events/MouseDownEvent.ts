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
import uid from "scratch-vm/src/util/uid";
import {SubVMBlock} from "../../../types/ScratchVMBlock";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";

export class MouseDownEvent extends ScratchEvent {

    private readonly _value: boolean;

    constructor(value: boolean) {
        super();
        this._value = value;
    }

    async apply(): Promise<void> {
        Container.testDriver.mouseDown(this._value);
    }

    public toJavaScript(): string {
        return `t.mouseDown(${this._value});`;
    }

    public toScratchBlocks(): ScratchScriptSnippet {
        const mainBlockId = uid();

        const mainBlock: SubVMBlock =
            {
                "id": mainBlockId,
                "opcode": "bbt_clickCurrentCursorLocation",
                "inputs": {},
                "fields": {},
                "next": null,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        return {blocks: [mainBlock], first: mainBlock, last: mainBlock};
    }

    public toJSON(): Record<string, unknown> {
        const event = {};
        event[`type`] = `MouseDownEvent`;
        event[`args`] = {"value": this._value};
        return event;
    }

    public toString = (): string => {
        return "MouseDown " + this._value;
    }

    numSearchParameter(): number {
        return 0;
    }

    getParameters(): [number] {
        // 0 returns False in JS/TS
        return [this._value ? 1 : 0];
    }

    getSearchParameterNames(): [] {
        return [];
    }

    setParameter(): [] {
        return [];
    }

    stringIdentifier(): string {
        return "MouseDownEvent";
    }
}
