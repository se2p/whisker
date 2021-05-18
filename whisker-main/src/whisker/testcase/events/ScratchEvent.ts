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

import {List} from "../../utils/List";

export abstract class ScratchEvent {

    private static readonly STAGE_WIDTH = 420;
    private static readonly STAGE_HEIGHT = 360;

    public abstract apply(vm, args: number[]) : Promise<void>;

    public abstract toJavaScript(args: number[]) : string;

    public abstract toString(args: number[]) : string;

    public abstract getNumParameters(): number;

    public abstract setParameter(codons: List<number>, codonPosition: number): void;

    public abstract getParameter(): number[];

    protected fitCoordinates(x: number, y: number): { x:number, y: number }{
        x = (x % ScratchEvent.STAGE_WIDTH) - (ScratchEvent.STAGE_WIDTH / 2);
        y = (y % ScratchEvent.STAGE_HEIGHT) - (ScratchEvent.STAGE_HEIGHT / 2);
        return {x,y}
    }

}
