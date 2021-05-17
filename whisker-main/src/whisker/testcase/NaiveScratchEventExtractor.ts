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
import {ScratchEvent} from "./ScratchEvent";
import {WaitEvent} from "./events/WaitEvent";
import {ScratchEventExtractor} from "./ScratchEventExtractor";
import {MouseDownEvent} from "./events/MouseDownEvent";
import {MouseMoveEvent} from "./events/MouseMoveEvent";
import {KeyPressEvent} from "./events/KeyPressEvent";
import {SoundEvent} from "./events/SoundEvent";
import {KeyDownEvent} from "./events/KeyDownEvent";
import {TypeTextEvent} from "./events/TypeTextEvent";

export class NaiveScratchEventExtractor extends ScratchEventExtractor {

    private readonly KEYS = ['space', 'left arrow', 'up arrow', 'right arrow', 'down arrow', 'enter'];

    private readonly _text;

    constructor (vm: VirtualMachine) {
        super(vm);
        this._text = this._randomText(3);
    }

    public extractEvents(vm: VirtualMachine): List<ScratchEvent> {
        const eventList = new List<ScratchEvent>();

        eventList.add(new WaitEvent());
        eventList.add(new TypeTextEvent(this._text));
        eventList.addList(this._getTypeTextEvents()); // Just one random string
        eventList.add(new MouseDownEvent(true));
        eventList.add(new MouseDownEvent(false));
        eventList.add(new MouseMoveEvent());
        // eventList.add(new SoundEvent()); // Not implemented yet

        for (const key of this.KEYS) {
            eventList.add(new KeyDownEvent(key, false));
            eventList.add(new KeyDownEvent(key, true));
            eventList.add(new KeyPressEvent(key));
        }
        return eventList.distinctObjects();
    }
}
