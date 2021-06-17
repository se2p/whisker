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

import {Container} from "../../utils/Container";
import {ScratchEvent} from "./ScratchEvent";


export class DragSpriteEvent extends ScratchEvent {

    private readonly _x: number;
    private readonly _y: number;
    private readonly _spriteName: string;

    constructor(spriteName: string, x = 0, y = 0) {
        super();
        this._x = Math.trunc(x);
        this._y = Math.trunc(y);
        this._spriteName = spriteName;
    }

    async apply(): Promise<void> {
        for (const target of Container.vm.runtime.targets) {
            if (target.sprite.name === this._spriteName) {
                target.setXY(this._x, this._y, true);
                break;
            }
        }
    }

    public toJavaScript(): string {
        return `for(const target of t.vm.runtime.targets){
    if(target.sprite.name === '${this._spriteName}'){
        target.setXY(${this._x}, ${this._y}, true);
        break;
    }
  }`;
    }

    public toString(): string {
        return `DragSprite ${this._spriteName} to  ${Math.trunc(this._x)}/${Math.trunc(this._y)}`;
    }

    getNumParameters(): number {
        return 0;
    }

    getParameter(): (number | string)[] {
        return [this._x, this._y, this._spriteName];
    }

    setParameter(): void {
        return;
    }
}
