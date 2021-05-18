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
import {List} from "../../utils/List";


export class DragEvent extends ScratchEvent {

    private _x: number;
    private _y: number;
    private readonly _spriteName: string;

    constructor(spriteName: string, x = 0, y = 0) {
        super();
        this._spriteName = spriteName;
        this._x = x;
        this._y = y;
    }

    async applyWithCoordinates(args: number[]): Promise<void> {
        Container.testDriver.inputImmediate({
            device: 'drag',
            sprite: this._spriteName,
            x: Math.trunc(args[0]),
            y: Math.trunc(args[1])
        });
    }

    async apply(): Promise<void> {
        const fittedCoordinates = this.fitCoordinates(this._x, this._y)
        this._x =fittedCoordinates.x
        this._y = fittedCoordinates.y
        await this.applyWithCoordinates([this._x, this._y])
    }

    public toJavaScript(args: number[]): string {
        return '' +
            `t.inputImmediate({
    device: 'drag',
    x: ${Math.trunc(args[0])},
    y: ${Math.trunc(args[1])}
});`
    }

    public toString(args: number[]): string {
        return "Drag " + Math.trunc(args[0]) + "/" + Math.trunc(args[1]);
    }

    getNumParameters(): number {
        return 2;
    }

    getParameter(): number[] {
        return [this._x, this._y];
    }

    setParameter(codons: List<number>, codonPosition: number): void {
        this._x = codons.get(codonPosition % codons.size());
        codonPosition++;
        this._y = codons.get(codonPosition % codons.size());
    }
}
