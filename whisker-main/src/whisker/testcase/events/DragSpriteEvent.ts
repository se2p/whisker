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
import {RenderedTarget} from 'scratch-vm/src/sprites/rendered-target';


export class DragSpriteEvent extends ScratchEvent {

    private _x: number;
    private _y: number;
    private readonly _target: RenderedTarget;
    private angle: number;

    constructor(target: RenderedTarget, x = 0, y = 0, angle = 0) {
        super();
        this._x = Math.trunc(x);
        this._y = Math.trunc(y);
        this._target = target;
        this.angle = angle;
    }

    async apply(): Promise<void> {
        this._target.setXY(this._x, this._y, true);
    }


    public toJavaScript(): string {
        // When writing Whisker-Tests we first have to find the corresponding target by searching for its name.
        return `for(const target of t.vm.runtime.targets){
    if(target.sprite.name === '${this._target.sprite.name}'){
        target.setXY(${this._x}, ${this._y}, true);
        break;
    }
  }`;
    }

    public toString(): string {
        return `DragSprite ${this._target.sprite.name} to  ${Math.trunc(this._x)}/${Math.trunc(this._y)}`;
    }

    getNumParameters(): number {
        return 1;
    }

    getParameter(): (number | string)[] {
        return [this._x, this._y, this.angle, this._target.sprite.name];
    }

    setParameter(args: number[]): void {
        this.angle = args[0];

        // We only disturb the target point if we have an angle bigger than 360 degrees.
        if (this.angle < 360) {
            // Convert to Radians and fetch the sprite's horizontal and vertical size.
            const radians = this.angle / 180 * Math.PI;
            const bounds = this._target.getBounds();
            const verticalSize = Math.abs(bounds.top - bounds.bottom);
            const horizontalSize = Math.abs(bounds.right - bounds.left);

            // Calculate the distorted distances and clamp it in the range of the stage size.
            const stageWidth = this._target.renderer._nativeSize[0] / 2.;
            const stageHeight = this._target.renderer._nativeSize[1] / 2.;
            this._x += Math.max(-stageWidth, Math.min(verticalSize * Math.cos(radians), stageWidth));
            this._y += Math.max(-stageHeight, Math.min(horizontalSize * Math.sin(radians), stageHeight));
        }
    }
}
