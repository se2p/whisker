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
import {RenderedTarget} from'scratch-vm/src/sprites/rendered-target';

export class ClickSpriteEvent extends ScratchEvent {

    private readonly _target: RenderedTarget;
    private readonly _steps: number;

    constructor(target: RenderedTarget) {
        super()
        this._target = target;
        this._steps = Container.config.getClickDuration();
    }

    async apply(): Promise<void> {
        if (this._target.isOriginal) {
            // Click on sprite
            Container.testDriver.inputImmediate({
                device: 'mouse',
                sprite: Container.testDriver.getSprite(this._target.sprite.name),
                isDown: true,
                steps: this._steps
            });
        } else {
            // Click on clone
            Container.testDriver.inputImmediate({
                device: 'mouse',
                x: this._target.x,
                y: this._target.y,
                isDown: true,
                steps: this._steps
            });
        }
    }

    public toJavaScript(): string {
        if (this._target.isOriginal) {
            return `t.inputImmediate({
    device: 'mouse',
    sprite: t.getSprite('${this._target.sprite.name}'),
    isDown: true,
    steps: ${Container.config.getClickDuration()}
  });`;
        } else {
            return `t.inputImmediate({
    device: 'mouse',
    x: ${this._target.x},
    y: ${this._target.y},
    isDown: true,
    steps: ${Container.config.getClickDuration()}
  });`;
        }
    }

    public toString(): string {
        if (this._target.isOriginal) {
            return "ClickSprite " + this._target.sprite.name;
        } else {
            return "ClickClone " + this._target.sprite.name + " at " + this._target.x + "/" + this._target.y;
        }
    }

    getNumParameters(): number {
        return 0;
    }

    setParameter(): void {
        return;
    }

    getParameter(): (number | RenderedTarget)[] {
        return [this._target, this._steps];
    }
}
