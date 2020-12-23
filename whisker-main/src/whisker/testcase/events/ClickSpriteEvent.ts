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

import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchEvent} from "../ScratchEvent";
import {Container} from "../../utils/Container";

export class ClickSpriteEvent implements ScratchEvent {

    private readonly _target;

    private readonly _timeout: number;

    constructor(target) {
        this._target = target
        this._timeout = Container.config.getClickDuration() / Container.acceleration;
    }

    async apply(vm: VirtualMachine): Promise<void> {
        if (this._target.isOriginal) {
            // Click on sprite
            Container.testDriver.inputImmediate({
                device: 'mouse',
                sprite: Container.testDriver.getSprite(this._target.sprite.name),
                isDown: true,
                duration: this._timeout
            });
        } else {
            // Click on clone
            Container.testDriver.inputImmediate({
                device: 'mouse',
                x: this._target.x,
                y: this._target.y,
                isDown: true,
                duration: this._timeout
            });
        }
    }

    public toJavaScript(args: number[]): string {
        if (this._target.isOriginal) {
            return '' +
                `t.inputImmediate({
    device: 'mouse',
    sprite: t.getSprite('${this._target.sprite.name}'),
    isDown: true,
    duration: ${Container.config.getClickDuration()}
  });`;
        } else {
            return '' +
                `t.inputImmediate({
    device: 'mouse',
    x: ${this._target.x},
    y: ${this._target.y},
    isDown: true,
    duration: ${Container.config.getClickDuration()}
  });`;
        }
    }

    public toString(args: number[]): string {
        if (this._target.isOriginal) {
            return "ClickSprite " + this._target.sprite.name;
        } else {
            return "ClickClone " + this._target.sprite.name +" at "+this._target.x +"/" + this._target.y;
        }
    }

    getNumParameters(): number {
        return 0;
    }
}
