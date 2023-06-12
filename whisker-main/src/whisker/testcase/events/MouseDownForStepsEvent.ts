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
import {NeuroevolutionUtil} from "../../whiskerNet/Misc/NeuroevolutionUtil";

//TODO: This way of using the mouse down event turns out to work better for NE, maybe also worth a try for SB-Algorithms
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

    public toJSON(): Record<string, any> {
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
        // 0 returns False in JS/TS
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
                this._steps = args[0];
                break;
            case "activation":
                this._steps = Math.round(args[0] * Container.config.getClickDuration());
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
