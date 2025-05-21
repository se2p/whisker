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

export class TypeNumberEvent extends ScratchEvent {

    constructor(private _num = 0) {
        super();
    }

    async apply(): Promise<void> {
        Container.testDriver.typeText(this._num);
    }

    public toJavaScript(): string {
        return `t.typeText('${this._num}');`;
    }

    public toScratchBlocks(): ScratchScriptSnippet {
        const simulateAnswerBlockId = uid();
        const answerInputBlockId = uid();

        const simulateAnswerBlock: SubVMBlock =
            {
                "id": simulateAnswerBlockId,
                "opcode": "bbt_simulateAnswerInput",
                "inputs": {
                    "ANSWER": {
                        "name": "ANSWER",
                        "block": answerInputBlockId,
                        "shadow": answerInputBlockId
                    }
                },
                "fields": {},
                "next": null,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        const answerInputBlock: SubVMBlock =
            {
                "id": answerInputBlockId,
                "opcode": "text",
                "inputs": {},
                "fields": {
                    "TEXT": {
                        "name": "TEXT",
                        "value": this._num.toString()
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": simulateAnswerBlockId,
                "shadow": true,
                "breakpoint": false
            };

        return {blocks: [simulateAnswerBlock, answerInputBlock], first: simulateAnswerBlock, last: simulateAnswerBlock};
    }

    public toJSON(): Record<string, unknown> {
        const event = {};
        event[`type`] = `TypeNumberEvent`;
        event[`args`] = {"text": this._num};
        return event;
    }

    public toString(): string {
        return `TypeNumber '${this._num}'`;
    }

    getParameters(): [number] {
        return [this._num];
    }

    getSearchParameterNames(): [string] {
        return ["Number"];
    }

    numSearchParameter(): number {
        return 1;
    }

    setParameter(args: number[], testExecutor: ParameterType): [number] {
        switch (testExecutor) {
            case "random":
                this._num = Randomness.getInstance().nextInt(0, Container.config.getWaitStepUpperBound() + 1);
                break;
            case "codon": {
                const range = Container.config.searchAlgorithmProperties['integerRange']['max'] - Container.config.searchAlgorithmProperties['integerRange']['min'];
                this._num = args[0] - range / 2;
                break;
            }
            case "activation": {
                const magnitude = Container.config.getTypeNumberMagnitude();
                this._num = Math.round(this._scaleSigmoidToMagnitude(args[0], magnitude));
                break;
            }
        }
        return [this._num];
    }

    stringIdentifier(): string {
        return `TypeNumberEvent`;
    }
}
