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

export class TypeTextEvent extends ScratchEvent {

    private readonly _text: string;

    constructor(text: string) {
        super();
        this._text = text;
    }

    async apply(): Promise<void> {
        Container.testDriver.typeText(this._text);
    }

    public toJavaScript(): string {
        // https://stackoverflow.com/a/15087766
        const escaped = this._text.replace(/'/g, "\\'");
        return `t.typeText('${escaped}');`;
    }

    public toJSON(): Record<string, any> {
        const event = {};
        event[`type`] = `TypeTextEvent`;
        event[`args`] = {"text": this._text};
        return event;
    }

    public toString(): string {
        return `TypeText '${this._text}'`;
    }

    numSearchParameter(): number {
        return 0; // Text
    }

    getParameters(): [string] {
        return [this._text];
    }

    getSearchParameterNames(): [] {
        return [];
    }

    setParameter(): [] {
        return [];
    }

    stringIdentifier(): string {
        return `TypeTextEvent-${this._text}`;
    }
}
