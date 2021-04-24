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
import {Container} from "../utils/Container";

export class ScratchEventExtractor {

    private static availableWaitDurations = new List<number>();
    private static availableTextSnippets = new List<string>();
    private static proceduresMap = new Map<string, List<ScratchEvent>>();

    static hasEvents(vm: VirtualMachine): boolean {
        for (const target of vm.runtime.targets) {
            if (target.hasOwnProperty('blocks')) {
                for (const blockId of Object.keys(target.blocks._blocks)) {
                    if (this._hasEvents(target, target.blocks.getBlock(blockId))) {
                        return true;
                    }
                }
            }
        }

        return !this.availableWaitDurations.isEmpty();
    }

    /**
     * Checks if the Scratch project has a mouseMove event
     * @param vm the Scratch-VM of the project
     * @return true if the project has a mouseMove event
     */
    static hasMouseEvent(vm: VirtualMachine): boolean {
        for (const target of vm.runtime.targets) {
            if (target.hasOwnProperty('blocks')) {
                for (const blockId of Object.keys(target.blocks._blocks)) {
                    if (this._searchForMouseEvent(target, target.blocks.getBlock(blockId)))
                        return true;
                }
            }
        }
        return false;
    }

    static extractEvents(vm: VirtualMachine): List<ScratchEvent> {
        const eventList = new List<ScratchEvent>();

        // Get all hat blocks and set up the procedureMap which maps the name of a procedure to the encountered events
        // of the procedure definition script.
        for (const target of vm.runtime.targets) {
            for (const scriptId of target.sprite.blocks.getScripts()) {
                const hatBlock = target.blocks.getBlock(scriptId);
                eventList.addList(this._extractEventsFromBlock(target, target.blocks.getBlock(scriptId)));
                if (target.blocks.getOpcode(hatBlock) === 'procedures_definition') {
                    const procedureEvents = new List<ScratchEvent>();
                    this.traverseBlocks(target, hatBlock, procedureEvents);
                    const prototype = target.blocks.getBlock(hatBlock.inputs.custom_block.block);
                    this.proceduresMap.set(prototype.mutation.proccode, procedureEvents)
                }
            }
        }

        // Check all blocks within scripts currently executing
        for (const t of vm.runtime.threads) {
            const target = t.target;
            const block = target.blocks.getBlock(t.topBlock);
            // Sometimes we encounter undefined blocks here?
            if (block)
                this.traverseBlocks(target, block, eventList);
        }

        // TODO: In some programs without event handlers no waits are chosen
        //       maybe because the execution of the greenflag scripts
        //       is too quick? A nicer solution would be good.
        if (eventList.isEmpty() && !this.availableWaitDurations.isEmpty()) {
            for (const duration of this.availableWaitDurations) {
                eventList.add(new WaitEvent(duration));
            }
        }

        return eventList.distinctObjects();
    }

    /**
     * Traverse downwards the block hierarchy and collect all encountered events.
     * @param target the rendered target of the vm
     * @param block the current block which will be checked for events
     * @param foundEvents collects the encountered Events
     */
    private static traverseBlocks(target, block, foundEvents: List<ScratchEvent>) {
        do {
            foundEvents.addList(this._extractEventsFromBlock(target, block))
            // first branch (if, forever, repeat, ...)
            if (block.inputs.SUBSTACK) {
                const branchBlock = target.blocks.getBlock(block.inputs.SUBSTACK.block)
                this.traverseBlocks(target, branchBlock, foundEvents);
            }
            // else branch
            if (block.inputs.SUBSTACK2) {
                const branchBlock = target.blocks.getBlock(block.inputs.SUBSTACK2.block)
                this.traverseBlocks(target, branchBlock, foundEvents);
            }

            // look inside a conditional statement
            if (block.inputs.CONDITION) {
                const condition = target.blocks.getBlock(block.inputs.CONDITION.block)
                // Handle conditional statements with two conditions
                if(condition.inputs.OPERAND1){
                    this.traverseBlocks(target, target.blocks.getBlock(condition.inputs.OPERAND1.block), foundEvents);
                }
                if(condition.inputs.OPERAND1){
                    this.traverseBlocks(target, target.blocks.getBlock(condition.inputs.OPERAND2.block), foundEvents);
                }
                foundEvents.addList(this._extractEventsFromBlock(target, target.blocks.getBlock(block.inputs.CONDITION.block)))
            }

            // handle procedure calls by mapping the call to its corresponding procedure_definition
            if (target.blocks.getOpcode(block) === 'procedures_call') {
                if (this.proceduresMap.has(block.mutation.proccode)) {
                    foundEvents.addList(this.proceduresMap.get(block.mutation.proccode))
                }
            }

            // WaitEvents
            const duration = this._extractWaitDurations(target, block);
            if (duration > 0) {
                foundEvents.add(new WaitEvent(duration));
            }
            block = target.blocks.getBlock(block.next)
        } while (block)
    }

    /**
     * Collects all available text snippets that can be used for generating answers.
     */
    static extractAvailableTextSnippets(vm: VirtualMachine): void {
        this.availableTextSnippets = new List<string>();
        // TODO: Text length with random length?
        this.availableTextSnippets.add(this._randomText(3)); // TODO: Any hints on text?

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


    /**
     * Collects all available durations that can be used for wait events
     */
    static extractAvailableDurations(vm: VirtualMachine): void {
        this.availableWaitDurations = new List<number>();

        for (const target of vm.runtime.targets) {
            if (target.hasOwnProperty('blocks')) {
                for (const blockId of Object.keys(target.blocks._blocks)) {
                    const duration = this._extractWaitDurations(target, target.blocks.getBlock(blockId));
                    if (duration > 0 && !this.availableWaitDurations.contains(duration))
                        this.availableWaitDurations.add(duration);
                }
            }
        }
    }


    // TODO: How to handle event parameters?
    static _extractEventsFromBlock(target, block): List<ScratchEvent> {
        const eventList = new List<ScratchEvent>();
        if (typeof block.opcode === 'undefined') {
            return eventList;
        }

        switch (target.blocks.getOpcode(block)) {
            case 'event_whenkeypressed': {  // Key press
                const fields = target.blocks.getFields(block);
                eventList.add(new KeyPressEvent(fields.KEY_OPTION.value));
                // one event per concrete key for which there is a hat block
                break;
            }
            case 'sensing_keypressed': {
                const keyOptionsBlock = target.blocks.getBlock(block.inputs.KEY_OPTION.block);
                const fields = target.blocks.getFields(keyOptionsBlock);
                const isKeyDown = Container.testDriver.isKeyDown(fields.KEY_OPTION.value);
                eventList.add(new KeyDownEvent(fields, !isKeyDown));
                break;
            }
            case 'sensing_mousex':
            case 'sensing_mousey':
            case 'touching-mousepointer': // TODO fix block name
                // Mouse move
                eventList.add(new MouseMoveEvent()); // TODO: Any hints on position?
                break;
            case 'motion_pointtowards':
                const towards = target.blocks.getBlock(block.inputs.TOWARDS.block)
                if (towards.fields.TOWARDS.value === '_mouse_')
                    eventList.add(new MouseMoveEvent());
                break;
            case 'sensing_mousedown':
                // Mouse down
                const isMouseDown = Container.testDriver.isMouseDown();
                eventList.add(new MouseDownEvent(!isMouseDown)); // TODO: Any hints on position?
                break;
            case 'sensing_askandwait':
                // Type text
                eventList.addList(this._getTypeTextEvents());
                break;
            case 'event_whenthisspriteclicked':
                // Click sprite
                if (target.visible === true) {
                    eventList.add(new ClickSpriteEvent(target));
                }
                break;
            case 'event_whenstageclicked':
                // Click stage
                eventList.add(new ClickStageEvent(target));
                break;
            case 'event_whengreaterthan':
                // Sound
                eventList.add(new SoundEvent()); // TODO: Volume as parameter
                break;
            case 'event_whenlessthan':
                // Wait duration
                eventList.add(new WaitEvent()); // TODO: Duration as parameter
                break;
        }
        return eventList;
    }

    /**
     * Checks if the block has a mouseMove event handler
     */
    // TODO: Search through the fields if they have the 'mouse' value
    private static _searchForMouseEvent(target, block): boolean {
        if (typeof block.opcode === 'undefined') {
            return false;
        }

        switch (target.blocks.getOpcode(block)) {
            case 'motion_pointtowards_menu':
            case 'motion_pointtowards':
                return true;
            default:
                return false;
        }
    }


    static _hasEvents(target, block): boolean {
        const fields = target.blocks.getFields(block);
        if (typeof block.opcode === 'undefined') {
            return false;
        }

        switch (target.blocks.getOpcode(block)) {
            case 'event_whenkeypressed':
            case 'sensing_keyoptions':
            case 'sensing_mousex':
            case 'sensing_mousey':
            case 'touching-mousepointer':
            case 'sensing_mousedown':
            case 'sensing_askandwait':
            case 'event_whenthisspriteclicked':
            case 'event_whenstageclicked':
            case 'event_whengreaterthan':
            case 'event_whenlessthan':
                return true;
        }
        return false;
    }


    private static _randomText(length: number): string {
        let answer = '';
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < length; i++) {
            answer += chars.charAt(Randomness.getInstance().nextInt(0, chars.length - 1));
        }

        return answer;
    }

    static _extractWaitDurations(target, block): number {
        const inputs = target.blocks.getInputs(block);
        if (target.blocks.getOpcode(block) == 'control_wait') {
            const op = target.blocks.getBlock(inputs.DURATION.block);
            const field = target.blocks.getFields(op).NUM;
            if (!field) {
                return -1;
            }
            return 1000 * parseFloat(field.value);
        } else if (target.blocks.getOpcode(block) == 'looks_sayforsecs' ||
            target.blocks.getOpcode(block) == 'looks_thinkforsecs' ||
            target.blocks.getOpcode(block) == 'motion_glideto' ||
            target.blocks.getOpcode(block) == 'motion_glidesecstoxy') {
            const op = target.blocks.getBlock(inputs.SECS.block);
            const field = target.blocks.getFields(op).NUM;
            if (!field) {
                return -1;
            }
            return 1000 * parseFloat(field.value);
        }
        return -1;
    }

    private static _getTypeTextEvents(): List<TypeTextEvent> {
        const typeTextEventList = new List<TypeTextEvent>();
        let length = this.availableTextSnippets.size();
        for (let i = 0; i < length; i++) {
            typeTextEventList.add(new TypeTextEvent(this.availableTextSnippets.get(i)))
        }
        return typeTextEventList;
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
