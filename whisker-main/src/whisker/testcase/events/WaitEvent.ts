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
import {NeuroevolutionUtil} from "../../whiskerNet/NeuroevolutionUtil";
import {Randomness} from "../../utils/Randomness";

export class WaitEvent extends ScratchEvent {

    private steps: number;

    constructor(steps = 1) {
        super();
        this.steps = steps;
    }

    async apply(): Promise<void> {
        await Container.testDriver.wait(this.steps);
    }

    public toJavaScript(): string {
        return `t.wait(${this.steps});`;
    }

    public toString(): string {
        return "Wait for " + this.steps + " steps";
    }

    numSearchParameter(): number {
        return 1;
    }

    getParameter(): number[] {
        return [this.steps];
    }

    getSearchParameterNames(): string[] {
        return ["Duration"];
    }

    setParameter(args: number[], testExecutor: ParameterType): void {
        switch (testExecutor) {
            case ParameterType.RANDOM:
                this.steps = Randomness.getInstance().nextInt(0, Container.config.getWaitStepUpperBound() + 1);
                break;
            case ParameterType.CODON:
                this.steps = args[0];
                break;
            case ParameterType.REGRESSION:
                this.steps = Math.round(NeuroevolutionUtil.relu(args[0]));
                break;
        }
        this.steps %= Container.config.getWaitStepUpperBound();
    }

    stringIdentifier(): string {
        return "WaitEvent";
    }
}
