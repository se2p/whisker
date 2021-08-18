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

import {List} from '../utils/List';

import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchEvent} from "./events/ScratchEvent";
import {WaitEvent} from "./events/WaitEvent";
import {ScratchEventExtractor} from "./ScratchEventExtractor";
import {MouseDownEvent} from "./events/MouseDownEvent";
import {MouseMoveEvent} from "./events/MouseMoveEvent";
import {KeyPressEvent} from "./events/KeyPressEvent";
import {TypeTextEvent} from "./events/TypeTextEvent";
import {DragSpriteEvent} from "./events/DragSpriteEvent";
import {ClickSpriteEvent} from "./events/ClickSpriteEvent";
import {ClickStageEvent} from "./events/ClickStageEvent";
import {Randomness} from "../utils/Randomness";
import {SoundEvent} from "./events/SoundEvent";

export class NaiveScratchEventExtractor extends ScratchEventExtractor {

    // TODO: Additional keys?
    private readonly KEYS = ['space', 'left arrow', 'up arrow', 'right arrow', 'down arrow', 'enter'];

    private readonly _random: Randomness;

    /**
     * NaiveScratchEventExtractor adds every type of supported Whisker-Event to the set of avilalbe events.
     * Whenever a parameter is required, it is randomly selected.
     * @param vm the Scratch-VM
     */
    constructor(vm: VirtualMachine) {
        super(vm);
        this._random = Randomness.getInstance();
    }

    public extractEvents(vm: VirtualMachine): List<ScratchEvent> {
        const eventList = new List<ScratchEvent>();

        eventList.add(new ClickStageEvent());
        eventList.add(new WaitEvent());
        eventList.add(new TypeTextEvent(this._randomText(3)));
        eventList.add(new MouseDownEvent(true));
        eventList.add(new MouseDownEvent(false));
        eventList.add(new MouseMoveEvent());

        // eventList.add(new SoundEvent()) not implemented yet

        // Add specified keys.
        for (const key of this.KEYS) {
            eventList.add(new KeyPressEvent(key));
        }

        // Add events requiring a targets as parameters.
        for (const target of vm.runtime.targets) {
            const x = this._random.nextInt(-240, 241);
            const y = this._random.nextInt(-180, 181);
            eventList.add(new DragSpriteEvent(target, x, y));
            eventList.add(new ClickSpriteEvent(target));
        }
        return eventList.distinctObjects();
    }
}
