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

export class MouseMoveToEvent extends ScratchEvent {


    private readonly x: number;
    private readonly y: number;

    constructor(x: number, y: number) {
        super();
        this.x = x;
        this.y = y;
    }

    async apply(): Promise<void> {
        Container.testDriver.mouseMove(this.x, this.y);
    }

    public toJavaScript(): string {
        return `t.mouseMove(${Math.trunc(this.x)}, ${Math.trunc(this.y)});`;
    }

    public toJSON(): Record<string, any> {
        const event = {};
        event[`type`] = `MouseMoveToEvent`;
        event[`args`] = {"x": this.x, "y": this.y};
        return event;
    }

    public toString(): string {
        return "MouseMoveToEvent " + Math.trunc(this.x) + "/" + Math.trunc(this.y);
    }

    numSearchParameter(): number {
        return 0;
    }

    getParameters(): [number, number] {
        return [this.x, this.y];
    }

    getSearchParameterNames(): [] {
        return [];
    }

    setParameter(): [] {
        return [];
    }

    stringIdentifier(): string {
        return `MouseMoveToEvent-${this.x}-${this.y}`;
    }
}
