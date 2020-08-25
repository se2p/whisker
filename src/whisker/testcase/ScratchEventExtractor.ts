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
import {Randomness} from "../utils/Randomness";

export class ScratchEventExtractor {

    private static availableTextSnippets = new List<string>();

    static extractEvents(vm: VirtualMachine): List<ScratchEvent> {
        const eventList = new List<ScratchEvent>();
        for (const target of vm.runtime.targets) {
            if (target.hasOwnProperty('blocks')) {
                for (const blockId of Object.keys(target.blocks._blocks)) {
                    const event: ScratchEvent = this._extractEventsFromBlock(target, target.blocks.getBlock(blockId));
                    if (event != null) {
                        eventList.add(event);
                    }
                }
            }
        }

        // TODO: Default actions -- wait?

        return eventList;
    }

    /**
     * Collects all available text snippets that can be used for generating answers.
     */
    static extractAvailableTextSnippets(vm: VirtualMachine): void {
        this.availableTextSnippets = new List<string>();
        for (const target of vm.runtime.targets) {
            if (target.hasOwnProperty('blocks')) {
                for (const blockId of Object.keys(target.blocks._blocks)) {
                    const snippet = this._extractAvailableTextSnippets(target, target.blocks.getBlock(blockId));
                    if (snippet != '' && !this.availableTextSnippets.contains(snippet))
                        this.availableTextSnippets.add(snippet);
                }
            }
        }
    }

    // TODO: How to handle event parameters?
    static _extractEventsFromBlock(target, block): ScratchEvent {
        const fields = target.blocks.getFields(block);
        if (typeof block.opcode === 'undefined') {
            return null;
        }

        switch (target.blocks.getOpcode(block)) {
            case 'event_whenkeypressed': // Key press
                return new KeyPressEvent(fields.KEY_OPTION.value);
            // one event per concrete key for which there is a hat block
            case 'sensing_keyoptions': // Key down
                return new KeyDownEvent(fields.KEY_OPTION.value);
            case 'sensing_mousex':
            case 'sensing_mousey':
            case 'touching-mousepointer': // TODO fix block name
                // Mouse move
                return new MouseMoveEvent(); // TODO: Any hints on position?
            case 'sensing_mousedown':
                // Mouse down
                return new MouseDownEvent(); // TODO: Any hints on position?
            case 'sensing_askandwait':
                // Type text
                // TODO: Only if actually asking
                // TODO: Text length with random length?
                const probability = Randomness.getInstance().nextInt(0, 100);
                if (probability < 30) {
                    return new TypeTextEvent(this._randomText(3)); // TODO: Any hints on text?
                }
                const randTextIndex = Randomness.getInstance().nextInt(0, this.availableTextSnippets.size());
                return new TypeTextEvent(this.availableTextSnippets.get(randTextIndex));
            case 'event_whenthisspriteclicked':
                // Click sprite
                return new ClickSpriteEvent(target); // TODO: Store which sprite
            // TODO: Add one event for each clone of this sprite --- each target is a clone
            case 'event_whenstageclicked':
                // Click stage
                return new ClickStageEvent(target); // TODO: Do we need a position for this?
            case 'event_whengreaterthan':
                // Sound
                return new SoundEvent(); // TODO: Volume as parameter
            case 'event_whenlessthan':
                // Wait duration
                return new WaitEvent(); // TODO: Duration as parameter
        }
        return null;
    }

    private static _randomText(length: number): string {
        let answer = '';
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < length; i++) {
            answer += chars.charAt(Randomness.getInstance().nextInt(0, chars.length - 1));
        }

        return answer;
    }

    static _extractAvailableTextSnippets(target, block): string {
        let availableTextSnippet = '';
        if (target.blocks.getOpcode(block) == 'operator_equals') {
            const inputs = target.blocks.getInputs(block);
            const op1 = target.blocks.getBlock(inputs.OPERAND1.block);
            const op2 = target.blocks.getBlock(inputs.OPERAND2.block);

            if (target.blocks.getOpcode(op2) === 'sensing_answer' && target.blocks.getOpcode(op1) === 'text') {
                availableTextSnippet = target.blocks.getFields(op1).TEXT.value;
            } else if (target.blocks.getOpcode(op1) === 'sensing_answer' && target.blocks.getOpcode(op2) === 'text') {
                availableTextSnippet = target.blocks.getFields(op2).TEXT.value;
            }
        }
        return availableTextSnippet;
    }
}
