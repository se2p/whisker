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
import {KeyPressEvent} from "./events/KeyPressEvent";
import {MouseMoveEvent} from "./events/MouseMoveEvent";
import {Randomness} from "../utils/Randomness";
import {DragSpriteEvent} from "./events/DragSpriteEvent";
import {MouseDownEvent} from "./events/MouseDownEvent";
import {ClickSpriteEvent} from "./events/ClickSpriteEvent";
import {ClickStageEvent} from "./events/ClickStageEvent";
import {SoundEvent} from "./events/SoundEvent";
import {TypeTextEvent} from "./events/TypeTextEvent";

export class StaticScratchEventExtractor extends ScratchEventExtractor {

    // TODO: Additional keys?
    private readonly _keys = ['space', 'left arrow', 'up arrow', 'right arrow', 'down arrow', 'enter'];

    private readonly _random: Randomness;

    /**
     * StaticScratchEventExtractor only adds event for which corresponding event handler exist. However, as opposed
     * to the DynamicScratchEventExtractor, the parameters are chosen randomly and not inferred from the VM whenever
     * possible.
     * @param vm the Scratch-VM
     */
    constructor(vm: VirtualMachine) {
        super(vm);
        this._random = Randomness.getInstance();
    }

    public extractEvents(vm: VirtualMachine): List<ScratchEvent> {
        const eventList = new List<ScratchEvent>();

        // Get all hat blocks and set up the procedureMap which maps the name of a procedure to the encountered events
        // of the procedure definition script.
        for (const target of vm.runtime.targets) {
            for (const scriptId of target.sprite.blocks.getScripts()) {
                const hatBlock = target.blocks.getBlock(scriptId);
                eventList.addList(this._extractEventsFromBlock(target, target.blocks.getBlock(scriptId)));
                this.traverseBlocks(target, hatBlock, eventList);
            }
        }

        eventList.add(new WaitEvent())

        return eventList.distinctObjects();
    }

    /**
     * Extract events for which corresponding event handler exist. The parameter of the selected events are chosen
     * randomly.
     * @param target the sprite wrapped in a RenderedTarget
     * @param block the given block from which events might get extracted.
     * @returns List<ScratchEvent> containing all extracted events.
     */
    protected _extractEventsFromBlock(target, block): List<ScratchEvent> {
        const eventList = new List<ScratchEvent>();
        if (typeof block.opcode === 'undefined') {
            return eventList;
        }

        switch (target.blocks.getOpcode(block)) {
            case 'event_whenkeypressed':
            case 'sensing_keypressed': {
                // Only add if we have not yet found any keyPress-Events. No need to add all keys several times
                if (!eventList.getElements().some(event => event instanceof KeyPressEvent)) {
                    for (const key of this._keys) {
                        eventList.add(new KeyPressEvent(key));
                    }
                }
                break;
            }
            case 'sensing_mousex':
            case 'sensing_mousey':
            case 'pen_penDown': {
                // Mouse move
                eventList.add(new MouseMoveEvent());
                break;
            }
            case 'sensing_touchingobject':
            case 'sensing_touchingcolor' : {
                eventList.add(new DragSpriteEvent(target));
                break;
            }
            case 'sensing_distanceto': {
                const distanceMenuBlock = target.blocks.getBlock(block.inputs.DISTANCETOMENU.block);
                const field = target.blocks.getFields(distanceMenuBlock);
                const value = field.DISTANCETOMENU.value;
                if (value == "_mouse_") {
                    eventList.add(new MouseMoveEvent());
                }
                break;
            }
            case 'motion_pointtowards': {
                const towards = target.blocks.getBlock(block.inputs.TOWARDS.block)
                if (towards.fields.TOWARDS.value === '_mouse_')
                    eventList.add(new MouseMoveEvent());
                break;
            }
            case 'sensing_mousedown': {
                // Mouse down
                eventList.add(new MouseDownEvent(true));
                eventList.add(new MouseDownEvent(false));
                break;
            }
            case 'sensing_askandwait':
                // Type text
                eventList.add(new TypeTextEvent(this._randomText(3)));
                break;
            case 'event_whenthisspriteclicked':
                // Click sprite
                eventList.add(new ClickSpriteEvent(target));
                break;
            case 'event_whenstageclicked':
                // Click stage
                eventList.add(new ClickStageEvent());
                break;
            case 'event_whengreaterthan':
                // Sound
                eventList.add(new SoundEvent());
                break;
        }
        return eventList;
    }
}
