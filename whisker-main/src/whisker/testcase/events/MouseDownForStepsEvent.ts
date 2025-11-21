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
import uid from "scratch-vm/src/util/uid";
import {SubVMBlock} from "../../../types/ScratchVMBlock";
import VMWrapper from "../../../vm/vm-wrapper";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";

//TODO: This way of using the mouse down event turns out to work better for NE, maybe also worth a try for SB-algorithms
export class MouseDownForStepsEvent extends ScratchEvent {

    private _steps: number;

    constructor(value = 1) {
        super();
        this._steps = value;
    }

    async apply(): Promise<void> {
        Container.testDriver.mouseDownForSteps(this._steps);
    }

    public toJavaScript(): string {
        return `t.mouseDownForSteps(${this._steps});`;
    }

    public toScratchBlocks(): ScratchScriptSnippet {
        const clickBlockId = uid();

        const clickBlock: SubVMBlock =
            {
                "id": clickBlockId,
                "opcode": "bbt_clickCurrentCursorLocation",
                "inputs": {},
                "fields": {},
                "next": null,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        if (this._steps === 1) {
            return {blocks: [clickBlock], first: clickBlock, last: clickBlock};
        }

        const waitBlockId = uid();
        const durationBlockId = uid();

        clickBlock.parent = waitBlockId;

        const waitBlock: SubVMBlock =
            {
                "id": waitBlockId,
                "opcode": "control_wait",
                "inputs": {
                    "DURATION": {
                        "name": "DURATION",
                        "block": durationBlockId,
                        "shadow": durationBlockId
                    }
                },
                "fields": {},
                "next": clickBlockId,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        const durationBlock: SubVMBlock =
            {
                "id": durationBlockId,
                "opcode": "math_positive_number",
                "inputs": {},
                "fields": {
                    "NUM": {
                        "name": "NUM",
                        "value": (VMWrapper.convertFromStepsToTime(this._steps) / 1000).toString()
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": waitBlockId,
                "shadow": true,
                "breakpoint": false
            };

        return {blocks: [waitBlock, durationBlock, clickBlock], first: waitBlock, last: clickBlock};
    }

    public toJSON(): Record<string, unknown> {
        const event = {};
        event[`type`] = `MouseDownForStepsEvent`;
        event[`args`] = {"value": this._steps};
        return event;
    }

    public toString = (): string => {
        return "MouseDownForSteps " + this._steps;
    }

    numSearchParameter(): number {
        return 1;
    }

    getParameters(): [number] {
        return [this._steps];
    }

    getSearchParameterNames(): [string] {
        return ["Steps"];
    }

    setParameter(args: number[], testExecutor: ParameterType): [number] {
        switch (testExecutor) {
            case "random":
                this._steps = Randomness.getInstance().nextInt(1, Container.config.getClickDuration() + 1);
                break;
            case "codon":
            case "activation":
                this._steps = args[0];
                break;
        }
        if (!Container.isNeuroevolution) {
            this._steps %= Container.config.getClickDuration();
        }
        // If the event has been selected ensure that it is executed for at least one step.
        if (this._steps < 1) {
            this._steps = 1;
        }
        return [this._steps];
    }

    stringIdentifier(): string {
        return "MouseDownForStepsEvent";
    }
}
