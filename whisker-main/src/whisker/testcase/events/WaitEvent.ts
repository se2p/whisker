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
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";

export class WaitEvent extends ScratchEvent {

    constructor(private _steps = 1) {
        super();
    }

    async apply(): Promise<void> {
        await Container.testDriver.runForSteps(this._steps);
    }

    public toJavaScript(): string {
        return `await t.runForSteps(${this._steps});`;
    }

    public toScratchBlocks(): ScratchScriptSnippet {
        const yieldMultipleBlockId = uid();
        const yieldCountBlockId = uid();

        const yieldMultipleBlock: SubVMBlock =
            {
                "id": yieldMultipleBlockId,
                "opcode": "bbt_yieldMultipleTimes",
                "inputs": {
                    "COUNT": {
                        "name": "COUNT",
                        "block": yieldCountBlockId,
                        "shadow": yieldCountBlockId
                    }
                },
                "fields": {},
                "next": null,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        const yieldCountBlock: SubVMBlock =
            {
                "id": yieldCountBlockId,
                "opcode": "math_number",
                "inputs": {},
                "fields": {
                    "NUM": {
                        "name": "NUM",
                        "value": this._steps.toString()
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": yieldMultipleBlockId,
                "shadow": true,
                "breakpoint": false
            };

        return {blocks: [yieldMultipleBlock, yieldCountBlock], first: yieldMultipleBlock, last: yieldMultipleBlock};
    }

    public toJSON(): Record<string, unknown> {
        const event = {};
        event[`type`] = `WaitEvent`;
        event[`args`] = {"steps": this._steps};
        return event;
    }

    public toString(): string {
        return "Wait for " + this._steps + " steps";
    }

    numSearchParameter(): number {
        return 1;
    }

    getParameters(): [number] {
        return [this._steps];
    }

    getSearchParameterNames(): [string] {
        return ["Duration"];
    }

    setParameter(args: number[], testExecutor: ParameterType): [number] {
        switch (testExecutor) {
            case "random":
                this._steps = Randomness.getInstance().nextInt(0, Container.config.getWaitStepUpperBound() + 1);
                break;
            case "codon":
                this._steps = args[0];
                break;
            case "activation":
                this._steps = Container.config.getSkipFrame();
                break;
        }

        // Only enforce the UpperBound range if we do not use Neuroevolution and if the codon value is likely to not
        // stem from ExtensionLocalSearch as otherwise the local search operator would only reach wait dependent
        // statements once.
        if (!Container.isNeuroevolution &&
            this._steps % Container.config.getWaitStepUpperBound() !== 0 &&
            this._steps !== Container.config.searchAlgorithmProperties['integerRange'].max) {
            this._steps %= Container.config.getWaitStepUpperBound();
        }
        return [this._steps];
    }

    stringIdentifier(): string {
        return "WaitEvent";
    }
}
