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
import Arrays from "../utils/Arrays";
import {TypeNumberEvent} from "./events/TypeNumberEvent";

export class NaiveScratchEventExtractor extends ScratchEventExtractor {

    // TODO: Additional keys?
    private readonly KEYS = ['space', 'left arrow', 'up arrow', 'right arrow', 'down arrow', 'enter'];

    private readonly _random: Randomness;

    /**
     * NaiveScratchEventExtractor adds every type of supported Whisker-Event to the set of available events.
     * Whenever a parameter is required, it is randomly selected.
     * @param vm the Scratch-VM
     */
    constructor(vm: VirtualMachine) {
        super(vm);
        this._random = Randomness.getInstance();
    }

    public extractEvents(vm: VirtualMachine): ScratchEvent[] {
        const eventList = [];

        eventList.push(new ClickStageEvent());
        eventList.push(new WaitEvent());
        eventList.push(new TypeTextEvent(ScratchEventExtractor._randomText(3)));
        eventList.push(new TypeNumberEvent());
        eventList.push(new MouseDownEvent(true));
        eventList.push(new MouseDownEvent(false));
        eventList.push(new MouseMoveEvent());

        // eventList.add(new SoundEvent()) not implemented yet

        // Add specified keys.
        for (const key of this.KEYS) {
            eventList.push(new KeyPressEvent(key));
        }

        // Add events requiring a targets as parameters.
        for (const target of vm.runtime.targets) {
            if(!target.isStage) {
                eventList.push(new DragSpriteEvent(target));
                eventList.push(new ClickSpriteEvent(target));
            }
        }
        const equalityFunction = (a: ScratchEvent, b:ScratchEvent) => a.stringIdentifier() === b.stringIdentifier();
        return Arrays.distinctByComparator(eventList, equalityFunction);
    }
}
