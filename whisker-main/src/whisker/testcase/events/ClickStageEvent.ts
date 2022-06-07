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

export class ClickStageEvent extends ScratchEvent {

    async apply(): Promise<void> {
        // TODO: Is there a better solution than simply activating the hats?
        // TODO: Find an empty spot to click on to click the stage?
        Container.testDriver.clickStage();
    }

    public toJavaScript(): string {
        return 't.clickStage();';
    }

    public toJSON(): Record<string, any> {
        const event = {};
        event[`Type`] = `ClickStageEvent`;
        return event;
    }

    public toString(): string {
        return "ClickStage";
    }

    numSearchParameter(): number {
        return 0;
    }

    setParameter(): [] {
        return [];
    }

    getParameters(): [] {
        return [];
    }

    getSearchParameterNames(): [] {
        return [];
    }

    stringIdentifier(): string {
        return "ClickStageEvent";
    }


}
