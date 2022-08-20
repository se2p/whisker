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
import {ScratchBlocks, ScratchEventExtractor} from "./ScratchEventExtractor";
import {KeyPressEvent} from "./events/KeyPressEvent";
import {MouseMoveEvent} from "./events/MouseMoveEvent";
import {Randomness} from "../utils/Randomness";
import {DragSpriteEvent} from "./events/DragSpriteEvent";
import {MouseDownEvent} from "./events/MouseDownEvent";
import {ClickSpriteEvent} from "./events/ClickSpriteEvent";
import {ClickStageEvent} from "./events/ClickStageEvent";
import {SoundEvent} from "./events/SoundEvent";
import Arrays from "../utils/Arrays";
import {Container} from "../utils/Container";
import {TypeNumberEvent} from "./events/TypeNumberEvent";

export class StaticScratchEventExtractor extends ScratchEventExtractor {

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

    public extractEvents(vm: VirtualMachine): ScratchEvent[] {
        const eventList: ScratchEvent[] = [];

        // Get all hat blocks and set up the procedureMap which maps the name of a procedure to the encountered events
        // of the procedure definition script.
        for (const target of vm.runtime.targets) {
            for (const scriptId of target.sprite.blocks.getScripts()) {
                const hatBlock = target.blocks.getBlock(scriptId);
                eventList.push(...this._extractEventsFromBlock(target, target.blocks.getBlock(scriptId)));
                this.traverseBlocks(target, hatBlock, eventList);
            }
        }

        eventList.push(new WaitEvent());

        const equalityFunction = (a: ScratchEvent, b: ScratchEvent) => a.stringIdentifier() === b.stringIdentifier();
        return Arrays.distinctByComparator(eventList, equalityFunction);
    }

    /**
     * Extract events for which corresponding event handler exist. The parameter of the selected events are chosen
     * randomly.
     * @param target the sprite wrapped in a RenderedTarget
     * @param block the given block from which events might get extracted.
     * @returns List<ScratchEvent> containing all extracted events.
     */
    protected override _extractEventsFromBlock(target, block: ScratchBlocks): ScratchEvent[] {
        const eventList: ScratchEvent[] = [];
        if (typeof block.opcode === 'undefined') {
            return eventList;
        }

        switch (target.blocks.getOpcode(block)) {
            case 'event_whenkeypressed': {  // Key press in HatBlocks
                const fields = target.blocks.getFields(block);
                eventList.push(new KeyPressEvent(fields.KEY_OPTION.value));
                // one event per concrete key for which there is a hat block
                break;
            }
            case 'sensing_keypressed': { // Key press in SensingBlocks
                const keyOptionsBlock = target.blocks.getBlock(block.inputs.KEY_OPTION.block);
                const fields = target.blocks.getFields(keyOptionsBlock);
                if ("KEY_OPTION" in fields) {
                    eventList.push(new KeyPressEvent(fields.KEY_OPTION.value));
                } else {
                    // TODO: The key is dynamically computed
                }
                break;
            }
            case 'sensing_mousex':
            case 'sensing_mousey':
            case 'pen_penDown': {
                // Mouse move
                eventList.push(new MouseMoveEvent());
                break;
            }

            case 'motion_goto': {
                // GoTo MousePointer block
                const goToMenu = target.blocks.getBlock(block.inputs.TO.block);
                if (goToMenu.fields.TO && goToMenu.fields.TO.value === '_mouse_') {
                    eventList.push(new MouseMoveEvent());
                }
                break;
            }

            case 'sensing_touchingobject': {
                const touchingMenuBlock = target.blocks.getBlock(block.inputs.TOUCHINGOBJECTMENU.block);
                const field = target.blocks.getFields(touchingMenuBlock);
                const value = field.VARIABLE ? field.VARIABLE.value : field.TOUCHINGOBJECTMENU.value;

                // Target senses Mouse
                if (value == "_mouse_") {
                    eventList.push(new MouseMoveEvent());
                }

                // Target senses edge
                else if (value === "_edge_") {
                    const random = Randomness.getInstance();
                    let x: number;
                    let y: number;
                    const stageWidth = Container.vmWrapper.getStageSize().width / 2;
                    const stageHeight = Container.vmWrapper.getStageSize().height / 2;
                    if (random.randomBoolean()) {
                        // Snap to the left or right edge and randomly select the y-coordinate
                        x = random.pick([-stageWidth, stageWidth]);
                        y = random.nextInt(-stageHeight, stageHeight);
                    } else {
                        // Snap to upper or lower edge and randomly select the x-coordinate
                        x = random.nextInt(-stageWidth, stageWidth);
                        y = random.pick([-stageHeight, stageHeight]);
                    }
                    eventList.push(new DragSpriteEvent(target, x, y));
                } else {
                    eventList.push(new DragSpriteEvent(target));
                }
                break;
            }

            case 'sensing_touchingcolor' :
            case 'sensing_coloristouchingcolor': {
                eventList.push(new DragSpriteEvent(target));
                break;
            }

            case 'sensing_distanceto': {
                const distanceMenuBlock = target.blocks.getBlock(block.inputs.DISTANCETOMENU.block);
                const field = target.blocks.getFields(distanceMenuBlock);
                const value = field['DISTANCETOMENU'].value;
                if (value == "_mouse_") {
                    eventList.push(new MouseMoveEvent());
                }
                break;
            }
            case 'motion_pointtowards': {
                const towards = target.blocks.getBlock(block.inputs.TOWARDS.block);
                if (towards.fields.TOWARDS && towards.fields.TOWARDS.value === '_mouse_')
                    eventList.push(new MouseMoveEvent());
                break;
            }
            case 'sensing_mousedown': {
                // Mouse down
                eventList.push(new MouseDownEvent(true));
                eventList.push(new MouseDownEvent(false));
                break;
            }
            case 'sensing_askandwait':
                // Type text
                eventList.push(...this._getTypeTextEvents());
                if (this.potentiallyComparesNumbers) {
                    eventList.push(new TypeNumberEvent());
                }
                break;
            case 'event_whenthisspriteclicked':
                // Click sprite
                eventList.push(new ClickSpriteEvent(target));
                break;
            case 'event_whenstageclicked':
                // Click stage
                eventList.push(new ClickStageEvent());
                break;
            case 'event_whengreaterthan': {
                if (block.fields.WHENGREATERTHANMENU.value == "loudness") {
                    // Sound
                    const soundParameterBlock = target.blocks.getBlock(block.inputs.VALUE.block);
                    if ('NUM' in soundParameterBlock.fields) {
                        const soundValue = Number.parseFloat(soundParameterBlock.fields.NUM.value) + 1;
                        eventList.push(new SoundEvent(soundValue));
                    } else {
                        // TODO: Handle case where volume is dynamically derived
                        eventList.push(new SoundEvent(0));
                        eventList.push(new SoundEvent(10));
                    }
                } else {
                    // TODO: Handle timer?
                }
                break;
            }
            case 'sensing_loudness': {
                try {
                    const operatorBlock = target.blocks.getBlock(block.parent);
                    // Find out on which side of the operator the value which is compared against the volume is placed.
                    let compareValueOperatorBlock: ScratchBlocks;
                    let compareValueIsFirstOperand: boolean;

                    if (operatorBlock.inputs.OPERAND1.block !== block.id) {
                        compareValueOperatorBlock = target.blocks.getBlock(operatorBlock.inputs.OPERAND1.block);
                        compareValueIsFirstOperand = true;
                    } else {
                        compareValueOperatorBlock = target.blocks.getBlock(operatorBlock.inputs.OPERAND2.block);
                        compareValueIsFirstOperand = false;
                    }

                    // Now that we know where to find the value which is compared against the current volume value, we
                    // can set the volume appropriately.
                    let volumeValue = Number.parseFloat(compareValueOperatorBlock.fields.TEXT.value);
                    // Greater than
                    if (operatorBlock.opcode === 'operator_gt') {
                        compareValueIsFirstOperand ? volumeValue -= 1 : volumeValue += 1;
                    }
                    // Lower than
                    else if (operatorBlock.opcode === 'operator_lt') {
                        compareValueIsFirstOperand ? volumeValue += 1 : volumeValue -= 1;
                    }
                    eventList.push(new SoundEvent(volumeValue));
                }
                    // If we cannot infer the correct volume, simply set the volume to the highest possible value.
                catch (e) {
                    eventList.push(new SoundEvent(100));
                }
            }
        }
        return eventList;
    }
}
