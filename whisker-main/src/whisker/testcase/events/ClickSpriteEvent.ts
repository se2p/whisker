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
import {RenderedTarget} from 'scratch-vm/src/sprites/rendered-target';

export class ClickSpriteEvent extends ScratchEvent {

    private readonly _target: RenderedTarget;
    private readonly _steps: number;

    /**
     * For Neatest we define the event identifier based on the occurrence of the clone.
     */
    private readonly _cloneNumber: number;

    /**
     * For clones the static NE test suites requires a concrete position where to click at since clones might not be
     * at the same position they were before due to randomness.
     */
    private _x: number;
    private _y: number;

    constructor(target: RenderedTarget, steps: number = Container.config.getClickDuration(), cloneNumber?: number) {
        super();
        this._target = target;
        this._steps = steps;
        this._cloneNumber = cloneNumber;

        // In this case a clone changed its position, and we have to set x and y using the setter function!
        if (this._target !== undefined) {
            this._x = this._target.x;
            this._y = this._target.y;
        }
    }

    async apply(): Promise<void> {
        if (this._target !== undefined && this._target.isOriginal) {
            Container.testDriver.clickSprite(this._target.sprite.name, this._steps);
        } else {
            Container.testDriver.clickCloneByCoords(this.x, this.y, this._steps);
        }
    }

    public toJavaScript(): string {
        if (this._target !== undefined && this._target.isOriginal) {
            const spriteName = this._target.sprite.name.replace(/'/g, "\\'");
            return `t.clickSprite('${spriteName}', ${this._steps});`;
        } else {
            return `t.clickCloneByCoords(${this.x}, ${this.y}, ${this._steps});`;
        }
    }

    public toJSON(): Record<string, any> {
        const event = {};
        event[`type`] = `ClickSpriteEvent`;
        if (this._target !== undefined) {
            event[`args`] = {"target": this._target.sprite.name, "steps": this._steps};
        } else {
            event[`args`] = {"x": this.x, "y": this.y, "steps": this._steps};
        }
        return event;
    }

    public toString(): string {
        if (this._target !== undefined && this._target.isOriginal) {
            return "ClickSprite " + this._target.sprite.name;
        } else {
            if (this._target !== undefined) {
                return "ClickClone " + this._target.sprite.name + " at " + this._target.x + "/" + this._target.y;
            } else {
                return "ClickClone at " + this.x + "/" + this.y;
            }
        }
    }

    numSearchParameter(): number {
        return 0;
    }

    setParameter(): [] {
        return [];
    }

    getParameters(): [RenderedTarget, number] {
        return [this._target, this._steps];
    }

    getSearchParameterNames(): [] {
        return [];
    }

    stringIdentifier(): string {
        if (this._target.isOriginal) {
            return `ClickSpriteEvent-${this._target.sprite.name}`;
        } else if (Container.isNeuroevolution) {
            return `ClickClone-${this._cloneNumber}`;
        } else {
            // The stringIdentifier of ClickSpriteEvents having to click at a clone represents a special case
            // since neither are the x and y coordinates of the Clone determined within the EventExtraction, nor are
            // they specified during the search. In the case of having two clones located at exactly the same position,
            // we only include one event for both clones since even if we would add two separate events, the effect
            // of both would be the same, namely clicking at the specified location. Furthermore, as soon as both
            // clones move away from each other, the coordinates change, and we add separate events for both of
            // them.
            return `ClickClone-${this._target.sprite.name}-${this._target.x}-${this._target.y}`;
        }
    }

    get x(): number {
        return this._x;
    }

    set x(value: number) {
        this._x = value;
    }

    get y(): number {
        return this._y;
    }

    set y(value: number) {
        this._y = value;
    }
}
