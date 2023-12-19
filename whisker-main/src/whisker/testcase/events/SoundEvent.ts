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

export class SoundEvent extends ScratchEvent {

    /**
     * Constructor for SoundEvents
     * @param _volume the initialVolume; we use 10 since Scratch registers a volume of 10 as "loud".
     * @param _steps defines how long the volume should be sent to the Scratch-VM
     */
    constructor(private readonly _volume = 10, private readonly _steps = 1) {
        super();
        this._volume = _volume;
        this._steps = Container.config.getSoundDuration();
    }

    async apply(): Promise<void> {
        Container.testDriver.sendSound(this._volume, this._steps);
    }

    public toJavaScript(): string {
        return `t.sendSound(${this._volume}, ${this._steps});`;
    }

    public toJSON(): Record<string, any> {
        const event = {};
        event[`type`] = `SoundEvent`;
        event[`args`] = {"volume": this._volume};
        return event;
    }

    public toString(): string {
        return `SoundEvent ${this._volume} for ${this._steps} steps`;
    }

    numSearchParameter(): number {
        return 0;
    }

    getParameters(): [number, number] {
        return [this._volume, this._steps];
    }

    getSearchParameterNames(): [] {
        return [];
    }

    setParameter(): [] {
        return [];
    }

    stringIdentifier(): string {
        return `SoundEvent-${this._volume}`;
    }
}
