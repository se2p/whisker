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
import {KeyPressEvent} from "./events/KeyPressEvent";
import {Container} from "../utils/Container";
import {MouseMoveEvent} from "./events/MouseMoveEvent";
import {MouseMoveToEvent} from "./events/MouseMoveToEvent";
import {MouseDownEvent} from "./events/MouseDownEvent";
import {ClickSpriteEvent} from "./events/ClickSpriteEvent";
import {ClickStageEvent} from "./events/ClickStageEvent";
import {SoundEvent} from "./events/SoundEvent";
import {TypeTextEvent} from "./events/TypeTextEvent";
import {Randomness} from "../utils/Randomness";
import {DragSpriteEvent} from "./events/DragSpriteEvent";
import {RenderedTarget} from 'scratch-vm/src/sprites/rendered-target';
import {Scratch3ControlBlocks} from 'scratch-vm/src/blocks/scratch3_control';
import {Scratch3DataBlocks} from 'scratch-vm/src/blocks/scratch3_data';
import {Scratch3EventBlocks} from 'scratch-vm/src/blocks/scratch3_event';
import {Scratch3LooksBlocks} from 'scratch-vm/src/blocks/scratch3_looks';
import {Scratch3MotionBlocks} from 'scratch-vm/src/blocks/scratch3_motion';
import {Scratch3OperatorsBlocks} from 'scratch-vm/src/blocks/scratch3_operators';
import {Scratch3ProcedureBlocks} from 'scratch-vm/src/blocks/scratch3_procedures';
import {Scratch3SensingBlocks} from 'scratch-vm/src/blocks/scratch3_sensing';
import {Scratch3SoundBlocks} from 'scratch-vm/src/blocks/scratch3_sound';
import Cast from "scratch-vm/src/util/cast";
import {TypeNumberEvent} from "./events/TypeNumberEvent";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const twgl = require('twgl.js');

export type ScratchBlocks =
    | Scratch3ControlBlocks
    | Scratch3DataBlocks
    | Scratch3EventBlocks
    | Scratch3LooksBlocks
    | Scratch3MotionBlocks
    | Scratch3OperatorsBlocks
    | Scratch3ProcedureBlocks
    | Scratch3SensingBlocks
    | Scratch3SoundBlocks


export abstract class ScratchEventExtractor {

    private readonly _knownColors = new Map<ColorStr, Point>();

    protected availableTextSnippets: string[] = [];
    protected potentiallyComparesNumbers: boolean;
    protected proceduresMap = new Map<string, ScratchEvent[]>();
    protected static _fixedStrings = ["0", "10", "Hello", this._randomText(3)];

    protected constructor(vm: VirtualMachine) {
        this.potentiallyComparesNumbers = ScratchEventExtractor._comparesVariableOrAnswer(vm);
        this.extractAvailableTextSnippets(vm);
        this.extractProcedures(vm);
    }

    /**
     * Returns all applicable events
     * @param vm the Scratch-VM of the project
     * @return a list of applicable events
     */
    public abstract extractEvents(vm: VirtualMachine): ScratchEvent[];

    /**
     * Traverse downwards the block hierarchy and collect all encountered events.
     * @param target the rendered target of the vm
     * @param block the current block which will be checked for events
     * @param foundEvents collects the encountered Events
     */
    protected traverseBlocks(target: RenderedTarget, block: ScratchBlocks, foundEvents: ScratchEvent[]): void {

        while (block) {
            foundEvents.push(...this._extractEventsFromBlock(target, block));
            // first branch (if, forever, repeat, ...)
            if (block.inputs.SUBSTACK) {
                const branchBlock = target.blocks.getBlock(block.inputs.SUBSTACK.block);
                this.traverseBlocks(target, branchBlock, foundEvents);
            }
            // else branch
            if (block.inputs.SUBSTACK2) {
                const branchBlock = target.blocks.getBlock(block.inputs.SUBSTACK2.block);
                this.traverseBlocks(target, branchBlock, foundEvents);
            }

            // look at the block(s) inside a conditional statement
            if (block.inputs.CONDITION) {
                const condition = target.blocks.getBlock(block.inputs.CONDITION.block);
                // Check if there is indeed a condition. Some programs may have included a conditional statement
                // but did not insert a condition.
                if (condition) {
                    // Handle conditional statements with two condition blocks
                    if (condition.inputs.OPERAND1) {
                        this.traverseBlocks(target, target.blocks.getBlock(condition.inputs.OPERAND1.block), foundEvents);
                    }
                    if (condition.inputs.OPERAND2) {
                        this.traverseBlocks(target, target.blocks.getBlock(condition.inputs.OPERAND2.block), foundEvents);
                    }
                    foundEvents.push(...this._extractEventsFromBlock(target, target.blocks.getBlock(block.inputs.CONDITION.block)));
                }
            }

            // Other block types that take blocks as input such as "set x to mouse x".
            else if(block.inputs){
                for(const input of Object.values(block.inputs)){
                    this.traverseBlocks(target, target.blocks.getBlock(input['block']), foundEvents);
                }
            }

            // handle procedure calls by mapping the call to its corresponding procedure_definition
            if (target.blocks.getOpcode(block) === 'procedures_call') {
                if (this.proceduresMap.has(block.mutation.proccode)) {
                    foundEvents.push(...this.proceduresMap.get(block.mutation.proccode));
                }
            }
            block = target.blocks.getBlock(block.next);
        }
    }

    private static _getColorFromBlock(target: RenderedTarget, block: ScratchBlocks, key: "COLOR" | "COLOR2"): Color {
        const str = target.blocks.getBlock(block.inputs[key].block).fields.COLOUR.value;
        const arr = Cast.toRgbColorList(str);
        return {str, arr};
    }

    private _handleTouchingColor(target: RenderedTarget, block: ScratchBlocks, events: ScratchEvent[]): void {
        const color = ScratchEventExtractor._getColorFromBlock(target, block, "COLOR");
        // Check if the sprite that will be dragged is not already touching the sensed color.
        if (!target.isTouchingColor(color.arr)) {
            const result = this._findColorOnCanvas(target, color);
            // Only push the event if we actually found the color on the canvas.
            if (result.colorFound) {
                const {x, y} = result.coordinates;
                events.push(new DragSpriteEvent(target, x, y));
            }
        }
    }

    private _handleColorTouchingColor(target: RenderedTarget, block: ScratchBlocks, events: ScratchEvent[]): void {
        /*
         * https://en.scratch-wiki.info/wiki/Color_()_is_Touching_()%3F_(block)
         * The block takes two colors. The first color ("own color") must be present in the current costume of
         * this sprite. The second color ("target color") is the color to touch.
         */
        const ownColor = ScratchEventExtractor._getColorFromBlock(target, block, "COLOR");
        const targetColor = ScratchEventExtractor._getColorFromBlock(target, block, "COLOR2");

        // We check if the sprite still needs to be dragged towards the target color, and drag it if necessary.
        if (!target.colorIsTouchingColor(ownColor.arr, targetColor.arr)) {

            // Next, we check if the costume even contains the own color. If it does, we will drag the sprite.
            const ownColorQuery = this._findColorOnSprite(target, ownColor);
            if (ownColorQuery.colorFound) {

                // The coordinates of the pixel containing "own color".
                const {x: ownColorX, y: ownColorY} = ownColorQuery.coordinates;

                // We try to find a pixel located somewhere else that has the "target color" so that we can
                // drag the sprite there.
                const targetColorQuery = this._findColorOnCanvas(target, targetColor);
                if (targetColorQuery.colorFound) {

                    // The coordinates of the "target color" and the center of the current sprite.
                    const {x: targetX, y: targetY} = targetColorQuery.coordinates;
                    const {x: centerX, y: centerY} = target;

                    /*
                     * We want to move the sprite such that the coordinates of the pixel with "own color" equal
                     * the coordinates of the pixel with "target color". However, moving a sprite is done with
                     * respect to its center. So we have to compute the vector from the pixel with "own color"
                     * to the center of the sprite, and add this vector as an offset to the dragging motion.
                     */
                    const offsetX = centerX - ownColorX;
                    const offsetY = centerY - ownColorY;
                    events.push(new DragSpriteEvent(target, targetX + offsetX, targetY + offsetY));
                }
            } else {
                // TODO: We could try to select/force a different costume. It might contain the target color.
            }
        }
    }

    protected _extractEventsFromBlock(target: RenderedTarget, block: ScratchBlocks): ScratchEvent[] {
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
                    const currentMousePosition = Container.vmWrapper.inputs.getMousePos();
                    // Only add a MouseMoveTo event if the mouse is currently not located at the targeted position.
                    if (currentMousePosition.x !== target.x || currentMousePosition.y !== target.y) {
                        eventList.push(new MouseMoveToEvent(target.x, target.y));
                    }
                    eventList.push(new MouseMoveEvent());
                }

                // Target senses edge
                else if (value === "_edge_" && !target.isTouchingEdge()) {
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
                }

                // Target senses another sprite
                else {
                    let sensedRenderedTarget = Container.vmWrapper.getTargetBySpriteName(value);

                    // Check if the sensedTarget is present in the given project and if the sprite we are about to
                    // drag is already touching the sensed target. If either one equals to true there is no need to
                    // add a DragSpriteEvent.
                    if (!sensedRenderedTarget || target.isTouchingSprite(sensedRenderedTarget.sprite.name)) {
                        break;
                    }

                    // If the renderedTarget is not visible. Check if we have clones that might be.
                    if (!sensedRenderedTarget.visible) {
                        for (const clone of sensedRenderedTarget.sprite.clones) {
                            if (clone.visible) {
                                sensedRenderedTarget = clone;
                                break;
                            }
                        }
                    }
                    // We only create a DragEvent if we found the sensed sprite, if both sprites are visible and if
                    // the sprite we are about to drag is not already touching the target sprite.
                    if (target.visible &&
                        sensedRenderedTarget.sprite &&
                        sensedRenderedTarget.visible) {
                        eventList.push(new DragSpriteEvent(target, sensedRenderedTarget.x, sensedRenderedTarget.y));
                    }
                }
                break;
            }
            case "sensing_touchingcolor": {
                this._handleTouchingColor(target, block, eventList);
                break;
            }
            case 'sensing_coloristouchingcolor': {
                this._handleColorTouchingColor(target, block, eventList);
                break;
            }
            case 'sensing_distanceto': {
                const distanceMenuBlock = target.blocks.getBlock(block.inputs.DISTANCETOMENU.block);
                const field = target.blocks.getFields(distanceMenuBlock);
                const value = field.DISTANCETOMENU.value;
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
                const isMouseDown = Container.testDriver.isMouseDown();
                eventList.push(new MouseDownEvent(!isMouseDown));
                break;
            }
            case 'sensing_askandwait':
                // Type text
                if (Container.vmWrapper.isQuestionAsked()) {
                    if (this.potentiallyComparesNumbers) {
                        eventList.push(new TypeNumberEvent());
                    }
                    eventList.push(...this._getTypeTextEvents());
                }
                break;
            case 'event_whenthisspriteclicked':
                // Click sprite
                if (target.visible === true) {
                    eventList.push(new ClickSpriteEvent(target));
                }
                break;
            case 'event_whenstageclicked':
                // Click stage
                eventList.push(new ClickStageEvent());
                break;
            case 'event_whengreaterthan': {
                if (block.fields.WHENGREATERTHANMENU.value === 'LOUDNESS') {
                    // Fetch the sound value for the sound block. We add 1 since the block tests using greater than.
                    const soundParameterBlock = target.blocks.getBlock(block.inputs.VALUE.block);
                    const soundValue = Number.parseFloat(soundParameterBlock.fields.NUM.value) + 1;
                    eventList.push(new SoundEvent(soundValue));
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

    /**
     * Collects all available text snippets that can be used for generating answers.
     */
    public extractAvailableTextSnippets(vm: VirtualMachine): void {
        this.availableTextSnippets.push(...ScratchEventExtractor._fixedStrings);

        for (const target of vm.runtime.targets) {
            if ('blocks' in target) {
                for (const blockId of Object.keys(target.blocks._blocks)) {
                    const snippet = ScratchEventExtractor._extractAvailableTextSnippets(target, target.blocks.getBlock(blockId));
                    if (snippet != '' && !this.availableTextSnippets.includes(snippet)) {
                        this.availableTextSnippets.push(snippet);
                    }
                }
            }
        }
    }

    /**
     * Get all hat blocks and set up the procedureMap which maps the name of a procedure
     * to the encountered events of the procedure definition script.
     */
    public extractProcedures(vm: VirtualMachine): void {
        for (const target of vm.runtime.targets) {
            for (const scriptId of target.sprite.blocks.getScripts()) {
                const hatBlock = target.blocks.getBlock(scriptId);

                if (target.blocks.getOpcode(hatBlock) === 'procedures_definition') {
                    const proccode = target.blocks.getBlock(hatBlock.inputs.custom_block.block).mutation.proccode;
                    if (!this.proceduresMap.has(proccode)) {
                        const procedureEvents: ScratchEvent[] = [];
                        this.traverseBlocks(target, hatBlock, procedureEvents);
                        this.proceduresMap.set(proccode, procedureEvents);
                    }
                }
            }
        }
    }

    protected static _comparesVariableOrAnswer(vm: VirtualMachine): boolean {
        for (const target of vm.runtime.targets) {
            if ('blocks' in target) {
                for (const blockId of Object.keys(target.blocks._blocks)) {
                    const block = target.blocks.getBlock(blockId);
                    const opCode = target.blocks.getOpcode(block);
                    switch (opCode) {
                        case 'operator_gt':
                        case 'operator_lt':
                        case 'operator_equals': {
                            const inputs = target.blocks.getInputs(block);

                            const op1 = target.blocks.getBlock(inputs.OPERAND1.block);
                            const op2 = target.blocks.getBlock(inputs.OPERAND2.block);

                            if (target.blocks.getOpcode(op1) === 'sensing_answer' ||
                                target.blocks.getOpcode(op2) === 'sensing_answer' ||
                                target.blocks.getOpcode(op1) === 'data_variable' ||
                                target.blocks.getOpcode(op2) === 'data_variable') {
                                return true;
                            }
                            break;
                        }
                        case 'operator_add':
                        case 'operator_subtract':
                        case 'operator_multiply':
                        case 'operator_divide':
                        case 'operator_mod':
                        {
                            const inputs = target.blocks.getInputs(block);

                            const op1 = target.blocks.getBlock(inputs.NUM1.block);
                            const op2 = target.blocks.getBlock(inputs.NUM2.block);

                            if (target.blocks.getOpcode(op1) === 'sensing_answer' ||
                                target.blocks.getOpcode(op2) === 'sensing_answer') {
                                return true;
                            }
                            break;
                        }

                        case 'operator_round':
                        case 'operator_mathop':
                        {
                            const inputs = target.blocks.getInputs(block);

                            const op = target.blocks.getBlock(inputs.NUM.block);

                            if (target.blocks.getOpcode(op) === 'sensing_answer') {
                                return true;
                            }
                            break;
                        }
                    }
                }
            }
        }
        return false;
    }

    protected static _randomText(length: number): string {
        let answer = '';
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < length; i++) {
            answer += chars.charAt(Randomness.getInstance().nextInt(0, chars.length - 1));
        }

        return answer;
    }

    private static _extractAvailableTextSnippets(target: RenderedTarget, block: ScratchBlocks): string {
        let availableTextSnippet = '';
        if (target.blocks.getOpcode(block) == 'operator_equals') {
            const inputs = target.blocks.getInputs(block);
            const op1 = target.blocks.getBlock(inputs.OPERAND1.block);
            const op2 = target.blocks.getBlock(inputs.OPERAND2.block);

            if ((target.blocks.getOpcode(op2) === 'sensing_answer' ||
                 target.blocks.getOpcode(op2) === 'data_variable') && target.blocks.getOpcode(op1) === 'text') {
                availableTextSnippet = target.blocks.getFields(op1).TEXT.value;
            } else if ((target.blocks.getOpcode(op1) === 'sensing_answer' ||
                target.blocks.getOpcode(op1) === 'data_variable') && target.blocks.getOpcode(op2) === 'text') {
                availableTextSnippet = target.blocks.getFields(op2).TEXT.value;
            }
        }
        return availableTextSnippet;
    }

    protected _getTypeTextEvents(): TypeTextEvent[] {
        const typeTextEventList: TypeTextEvent[] = [];
        const length = this.availableTextSnippets.length;
        for (let i = 0; i < length; i++) {
            typeTextEventList.push(new TypeTextEvent(this.availableTextSnippets[i]));
        }
        return typeTextEventList;
    }

    /**
     * Checks if the Scratch project has a mouseMove event
     * @param vm the Scratch-VM of the project
     * @return true if the project has a mouseMove event
     */
    public hasMouseEvent(vm: VirtualMachine): boolean {
        for (const target of vm.runtime.targets) {
            if ('blocks' in target) {
                for (const blockId of Object.keys(target.blocks._blocks)) {
                    if (ScratchEventExtractor._searchForMouseEvent(target, target.blocks.getBlock(blockId)))
                        return true;
                }
            }
        }
        return false;
    }

    /**
     * Checks if the block has a mouseMove event handler
     */
    // TODO: Search through the fields if they have the 'mouse' value
    private static _searchForMouseEvent(target: RenderedTarget, block: ScratchBlocks): boolean {
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

    /**
     * Checks if the Scratch project has any events
     * @param vm the Scratch-VM of the project
     * @return true if the project has any events
     */
    public static hasEvents(vm: VirtualMachine): boolean {
        for (const target of vm.runtime.targets) {
            if ('blocks' in target) {
                for (const blockId of Object.keys(target.blocks._blocks)) {
                    if (this._hasEvents(target, target.blocks.getBlock(blockId))) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private static _hasEvents(target: RenderedTarget, block: ScratchBlocks): boolean {
        if (typeof block.opcode === 'undefined') {
            return false;
        }

        switch (target.blocks.getOpcode(block)) {
            case 'event_whenflagclicked':
            case 'event_whenkeypressed':
            case 'sensing_keyoptions':
            case 'sensing_mousex':
            case 'sensing_mousey':
            case 'sensing_mousedown':
            case 'sensing_askandwait':
            case 'event_whenthisspriteclicked':
            case 'event_whenstageclicked':
            case 'event_whengreaterthan':
            case 'event_whenlessthan':
                return true;
            case 'sensing_touchingobject': {
                const touchingMenuBlock = target.blocks.getBlock(block.inputs.TOUCHINGOBJECTMENU.block);
                const field = target.blocks.getFields(touchingMenuBlock);
                const value = field.TOUCHINGOBJECTMENU.value;
                if (value == "_mouse_") {
                    return true;
                }
                break;
            }
            case 'sensing_distanceto': {
                const distanceMenuBlock = target.blocks.getBlock(block.inputs.DISTANCETOMENU.block);
                const field = target.blocks.getFields(distanceMenuBlock);
                const value = field.DISTANCETOMENU.value;
                if (value == "_mouse_") {
                    return true;
                }
                break;
            }
        }
        return false;
    }

    /**
     * Tries to find a color on the canvas via scanning the surrounding of the source sprite using an ever increasing
     * radius. The returned object contains the coordinates of the pixel containing the desired color iff the search
     * was successful.
     *
     * @param sprite the source sprite (will be excluded from the search)
     * @param color the color we are searching for
     * @return the color query result
     */
    private _findColorOnCanvas(sprite: RenderedTarget, color: Color): ColorQueryResult {
        // Collect all touchable objects which might carry the sensed color
        const renderer = sprite.runtime.renderer;
        const touchableObjects = [];
        for (let index = renderer._visibleDrawList.length - 1; index >= 0; index--) {
            const id = renderer._visibleDrawList[index];
            if (id !== sprite.drawableID) {
                const drawable = renderer._allDrawables[id];
                touchableObjects.push({id, drawable});
            }
        }

        const stageBounds = {
            right: renderer._xRight,
            left: renderer._xLeft,
            top: renderer._yTop,
            bottom: renderer._yBottom
        };

        return this._fuzzyFindColor(sprite, touchableObjects, color, stageBounds, renderer);
    }

    /**
     * Tries to locate the given color on the given sprite. The returned object contains the coordinates of the pixel
     * containing the desired color iff the search was successful.
     *
     * @param sprite the sprite to look in
     * @param color the color to look for
     * @return the color query result
     */
    private _findColorOnSprite(sprite: RenderedTarget, color: Color): ColorQueryResult {
        const renderer = sprite.runtime.renderer;

        const id = sprite.drawableID;
        const drawable = renderer._allDrawables[id];
        drawable.updateCPURenderAttributes();
        const thisSprite = [{id, drawable}];

        const bounds = sprite.getBounds();

        return this._fuzzyFindColor(sprite, thisSprite, color, bounds, renderer);
    }

    private _fuzzyFindColor(start: Point | RenderedTarget, touchables: Touchable[], {arr, str}: Color, bounds: Bounds, renderer): ColorQueryResult {
        function isColorMatching(other: ColorArr): boolean {
            return (arr[0] & 0b11111000) === (other[0] & 0b11111000) &&
                (arr[1] & 0b11111000) === (other[1] & 0b11111000) &&
                (arr[2] & 0b11110000) === (other[2] & 0b11110000);
        }

        // Check if we have seen this color before, and directly inspect the corresponding pixel if we can.
        if (this._knownColors.has(str)) {
            const {x, y} = this._knownColors.get(str);
            const point = twgl.v3.create(x, y);
            const currentColor = renderer.constructor.sampleColor3b(point, touchables);

            if (isColorMatching(currentColor)) {
                return {
                    colorFound: true,
                    coordinates: {x, y}
                };
            }

            // It seems the color is no longer there (maybe the sprite moved, or the backdrop changed).
            this._knownColors.delete(str);
        }

        const {right, left, top, bottom} = bounds;
        const width = Math.ceil(right - left);
        const height = Math.ceil(top - bottom);
        const area = width * height;

        const maxSamples = 48 * 36; // Arbitrary, but based on the stage dimensions of 480 × 360
        const dynamicSpace = Math.trunc(Math.sqrt(area / maxSamples));
        const space = Math.max(1, dynamicSpace);

        for (const {x, y} of ScratchEventExtractor._points(start, bounds, space)) {
            const point = twgl.v3.create(x, y);
            const currentColor = renderer.constructor.sampleColor3b(point, touchables);

            if (isColorMatching(currentColor)) {
                this._knownColors.set(str, {x, y});

                return {
                    colorFound: true,
                    coordinates: {x, y}
                };
            }
        }

        return {
            colorFound: false
        };
    }

    private static* _points({x: startX, y: startY}: Point, bounds: Bounds, space = 10): IterableIterator<Point> {
        const {left, right, top, bottom} = bounds;

        /**
         * Tells whether the given x-coordinate is within the bounds.
         *
         * @param {number} x the coordinate
         * @return {boolean} true iff within bounds
         */
        function isWithinHorizontalBounds(x: number): boolean {
            return left <= x && x <= right;
        }

        /**
         * Tells whether the given y-coordinate is within the bounds.
         *
         * @param {number} y the coordinate
         * @return {boolean} true iff within bounds
         */
        function isWithinVerticalBounds(y: number): boolean {
            return bottom <= y && y <= top;
        }

        // Set of already visited points on the grid.
        const visited = new PointQueueSet(bounds);

        /**
         * Returns all yet unvisited neighbors of the point with the given coordinates. The returned points are
         * within the boundaries of the grid, and will also be marked as visited.
         *
         * @param {number} x the x-coordinate of the point
         * @param {number} y the y-coordinate of the point
         * @return {[number, number][]} unvisited neighbors of the point
         */
        function unvisitedNeighbors({x, y}: Point): Point[] {
            const neighborsX = [x - space, x, x + space].filter(_x => isWithinHorizontalBounds(_x));
            const neighborsY = [y - space, y, y + space].filter(_y => isWithinVerticalBounds(_y));
            const neighbors = [];

            for (const _x of neighborsX) {
                for (const _y of neighborsY) {
                    const neighbor = {x: _x, y: _y};
                    if (!visited.has(neighbor)) {
                        visited.push(neighbor);
                        neighbors.push(neighbor);
                    }
                }
            }

            return neighbors;
        }

        // The queue of points yet to be visited.
        const pending = new PointQueueSet(bounds);

        // Initialize the queue with the start point. For the workings of the algorithm it is important to consider
        // whole numbers only.
        const startPoint = {x: Math.trunc(startX), y: Math.trunc(startY)};
        pending.push(startPoint);
        visited.push(startPoint);

        // As long as there are still unvisited points, yield these points, mark them as visited and mark their
        // unvisited neighbors as pending.
        for (const next of pending) {
            pending.push(...unvisitedNeighbors(next));
            yield next;
        }
    }
}

type ColorQueryResult = ColorQuerySuccess | ColorQueryFailure

interface ColorQuerySuccess {
    colorFound: true,
    coordinates: Point
}

interface ColorQueryFailure {
    colorFound: false;
}

type ColorStr = `#${string}`;
type ColorArr = Uint8ClampedArray;

interface Color {
    arr: ColorArr
    str: ColorStr
}

interface Point {
    x: number,
    y: number
}

interface Bounds {
    left: number,
    right: number,
    top: number,
    bottom: number
}

interface Touchable {
    id: number,
    drawable: Drawable
}

type Drawable = unknown;

/**
 * Specialization of sets intended for managing `Point`s on a two-dimensional integer grid. Duplicate elimination is
 * performed by checking structural equality rather than referential equality. This means, two points `p1` and `p2`
 * are considered equal iff `p1.x === p2.x` and `p1.y === p2.y` rather than checking if the references point to the same
 * object in memory (`p1 === p2`).
 */
class PointQueueSet {

    // The width of the integer grid.
    private readonly _width: number;

    // Offsets used for (de)serialization of `Point`s.
    private readonly _offsetX: number;
    private readonly _offsetY: number;

    // Internal backing set that maintains a `Point` serialized as integer.
    private readonly _workingSet: Set<number>;

    /**
     * Constructs a new set. It manages points on an a two-dimensional integer grid with the given boundaries.
     *
     * @param {{left: number, right: number, top: number, bottom: number}} boundaries boundaries of the grid
     */
    constructor(boundaries: Bounds) {
        const left = Math.trunc(boundaries.left);
        const right = Math.trunc(boundaries.right);
        this._width = right - left;
        this._offsetX = left;
        this._offsetY = Math.trunc(boundaries.bottom);
        this._workingSet = new Set();
    }

    _serialize({x, y}: Point): number {
        // JavaScript Sets use reference equality for objects, and value equality for primitive types. We want to manage
        // pairs of whole numbers in terms of value equality, so we have to define a canonical enumeration for pairs of
        // numbers, and identify a pair by its unique number in the enumeration.
        return ((x - this._offsetX) * this._width) + (y - this._offsetY);
    }

    _deserialize(n: number): Point {
        const x = Math.trunc(n / this._width) + this._offsetX;
        const y = (n % this._width) + this._offsetY;
        return {x, y};
    }

    /**
     * Adds the given points to the end of the queue, unless a point is already present in the queue.
     *
     * @param {{x, y}[]} points the points to add
     */
    push(...points: Point[]): void {
        for (const point of points) {
            this._workingSet.add(this._serialize(point));
        }
    }

    /**
     * Tells whether the given point is contained in the set.
     *
     * @param {{x, y}} point the point to check
     * @return {boolean} `true` iff the `point` is contained in the set
     */
    has(point: Point): boolean {
        return this._workingSet.has(this._serialize(point));
    }

    [Symbol.iterator]() {
        const iter = this._workingSet[Symbol.iterator]();
        return {
            next: () => {
                const {done, value} = iter.next();
                return done ? {done} : {done, value: this._deserialize(value)};
            }
        };
    }
}
