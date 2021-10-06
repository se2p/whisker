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
import {Container} from "../../utils/Container";
import {ParameterType} from "./ParameterType";
import {Randomness} from "../../utils/Randomness";


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
        return `t.dragSprite('${this._target.sprite.name}', ${this._x}, ${this._y});`;
    }

    public toJSON(): Record<string, any> {
        const event = {}
        event[`type`] = `DragSpriteEvent`;
        event[`args`] = {"x": this._x, "y": this._y, "target": this._target.sprite.name}
        return event;
    }

    public toString(): string {
        return `DragSprite ${this._target.sprite.name} to  ${Math.trunc(this._x)}/${Math.trunc(this._y)}`;
    }

    getParameter(): (number | string)[] {
        return [this._x, this._y, this.angle, this._target.sprite.name];
    }

    setParameter(args: number[], argType: ParameterType): void {
        switch (argType) {
            case ParameterType.RANDOM: {
                const random = Randomness.getInstance();
                const stageBounds = Container.vmWrapper.getStageSize();
                const signedWidth = stageBounds.width / 2;
                const signedHeight = stageBounds.height / 2;
                this._x = random.nextInt(-signedWidth, signedWidth + 1);
                this._y = random.nextInt(-signedHeight, signedHeight + 1);
                break;
            }
            // When using codons, we sometimes want to slightly disturb the position wo which the target should
            // be dragged to since the position could have some with unintended side effects. Hence, we disturb the
            // given position with a power equal to the target's size. The direction of the disturbance is determined
            // through a codon. If we have a codon value above 360, the position is not disturbed at all.
            case ParameterType.CODON:
                this.angle = args[0];
                // We only disturb the target point if we have an angle smaller than 360 degrees.
                if (this.angle < 360) {
                    // Convert to Radians and fetch the sprite's horizontal and vertical size.
                    const radians = this.angle / 180 * Math.PI;
                    const bounds = this._target.getBounds();
                    const horizontalSize = Math.abs(bounds.right - bounds.left);
                    const verticalSize = Math.abs(bounds.top - bounds.bottom);

                    // Calculate the distorted position.
                    const stageWidth = Container.vmWrapper.getStageSize().width / 2;
                    const stageHeight = Container.vmWrapper.getStageSize().height / 2;
                    this._x += horizontalSize * Math.cos(radians);
                    this._y += verticalSize * Math.sin(radians);

                    // Clamp the new position within the stage size
                    this._x = Math.max(-stageWidth, Math.min(this._x, stageWidth));
                    this._y = Math.max(-stageHeight, Math.min(this._y, stageHeight));
                }
                break;
        }
    }

    numSearchParameter(): number {
        return 1;
    }

    getSearchParameterNames(): string[] {
        return [];
    }

    stringIdentifier(): string {
        return `DragSpriteEvent-${this._target}-${this._x}-${this._y}`;
    }
}
