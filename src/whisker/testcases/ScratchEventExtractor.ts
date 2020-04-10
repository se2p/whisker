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

import VirtualMachine = require('scratch-vm');
import {KeyPressEvent} from "./events/KeyPressEvent";
import {ScratchEvent} from "./ScratchEvent";
import {KeyDownEvent} from "./events/KeyDownEvent";
import {MouseMoveEvent} from "./events/MouseMoveEvent";
import {MouseDownEvent} from "./events/MouseDownEvent";
import {TypeTextEvent} from "./events/TypeTextEvent";
import {ClickSpriteEvent} from "./events/ClickSpriteEvent";
import {ClickStageEvent} from "./events/ClickStageEvent";
import {SoundEvent} from "./events/SoundEvent";
import {WaitEvent} from "./events/WaitEvent";

export class ScratchEventExtractor {

    static extractEvents(vm: VirtualMachine) : List<ScratchEvent> {
        const eventList = new List<ScratchEvent>();
        for (const target of vm.runtime.targets) {
            if (target.hasOwnProperty('blocks')) {
                for (const blockId of Object.keys(target.blocks._blocks)) {
                    eventList.addList(this._extractEventsFromBlock(target, target.blocks.getBlock(blockId)));
                }
            }
        }

        // TODO: Default actions -- wait?

        return eventList;
    }

    // TODO: How to handle event parameters?
    static _extractEventsFromBlock (target, block) : List<ScratchEvent> {
        const eventList = new List<ScratchEvent>();

        if (typeof block.opcode === 'undefined') {
            return eventList;
        }

        switch (target.blocks.getOpcode(block)) {
            case 'event_whenkeypressed':
                // Key press
                eventList.add(new KeyPressEvent()); // TODO: Pass actual key as parameter
                // one event per concrete key for which there is a hat block
                break;

            case 'sensing_keyoptions':
                // Key down
                eventList.add(new KeyDownEvent()); // TODO: Pass actual key as parameter
                break;
            case 'sensing_mousex':
            case 'sensing_mousey':
            case 'touching-mousepointer': // TODO fix block name
                // Mouse move
                eventList.add(new MouseMoveEvent()); // TODO: Any hints on position?
                break;
            case 'sensing_mousedown':
                // Mouse down
                eventList.add(new MouseDownEvent()); // TODO: Any hints on position?
                break;
            case 'sensing_askandwait':
                // Type text
                // TODO: Only if actually asking
                eventList.add(new TypeTextEvent()); // TODO: Any hints on text?
                break;
            case 'event_whenthisspriteclicked':
                // Click sprite
                eventList.add(new ClickSpriteEvent()); // TODO: Store which sprite
                // TODO: Add one event for each clone of this sprite
                break;
            case 'event_whenstageclicked':
                // Click stage
                eventList.add(new ClickStageEvent()); // TODO: Do we need a position for this?
                break;
            case 'event_whengreaterthan':
                // Sound
                eventList.add(new SoundEvent()); // TODO: Volume as parameter
                break;
            case 'event_whengreaterthan':
                // Wait duration
                eventList.add(new WaitEvent()); // TODO: Duration as parameter
                break;
        }

        return eventList;
    }
}
