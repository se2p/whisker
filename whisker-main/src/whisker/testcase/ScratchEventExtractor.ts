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
import {Scratch3ControlBlocks} from 'scratch-vm/src/blocks/scratch3_control'
import {Scratch3DataBlocks} from 'scratch-vm/src/blocks/scratch3_data'
import {Scratch3EventBlocks} from 'scratch-vm/src/blocks/scratch3_event'
import {Scratch3LooksBlocks} from 'scratch-vm/src/blocks/scratch3_looks'
import {Scratch3MotionBlocks} from 'scratch-vm/src/blocks/scratch3_motion'
import {Scratch3OperatorsBlocks} from 'scratch-vm/src/blocks/scratch3_operators'
import {Scratch3ProcedureBlocks} from 'scratch-vm/src/blocks/scratch3_procedures'
import {Scratch3SensingBlocks} from 'scratch-vm/src/blocks/scratch3_sensing'
import {Scratch3SoundBlocks} from 'scratch-vm/src/blocks/scratch3_sound'
import Cast from "scratch-vm/src/util/cast";

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

    protected availableTextSnippets: string[] = [];
    protected proceduresMap = new Map<string, ScratchEvent[]>();
    protected static _fixedStrings = ["0", "10", "Hello", this._randomText(3)];

    protected constructor(vm: VirtualMachine) {
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
            foundEvents.push(...this._extractEventsFromBlock(target, block))
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

            // look at the block(s) inside a conditional statement
            if (block.inputs.CONDITION) {
                const condition = target.blocks.getBlock(block.inputs.CONDITION.block)
                // Check if there is indeed a condition. Some programs may have included a conditional statement
                // but did not insert a condition.
                if (condition) {
                    // Handle conditional statements with two condition blocks
                    if (condition.inputs.OPERAND1) {
                        this.traverseBlocks(target, target.blocks.getBlock(condition.inputs.OPERAND1.block), foundEvents);
                    }
                    if (condition.inputs.OPERAND1) {
                        this.traverseBlocks(target, target.blocks.getBlock(condition.inputs.OPERAND2.block), foundEvents);
                    }
                    foundEvents.push(...this._extractEventsFromBlock(target, target.blocks.getBlock(block.inputs.CONDITION.block)))
                }
            }

            // handle procedure calls by mapping the call to its corresponding procedure_definition
            if (target.blocks.getOpcode(block) === 'procedures_call') {
                if (this.proceduresMap.has(block.mutation.proccode)) {
                    foundEvents.push(...this.proceduresMap.get(block.mutation.proccode))
                }
            }
            block = target.blocks.getBlock(block.next);
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
                if (fields.hasOwnProperty("KEY_OPTION")) {
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
                if (goToMenu.fields.TO.value === '_mouse_') {
                    eventList.push(new MouseMoveEvent());
                }
                break;
            }
            case 'sensing_touchingobject': {
                const touchingMenuBlock = target.blocks.getBlock(block.inputs.TOUCHINGOBJECTMENU.block);
                const field = target.blocks.getFields(touchingMenuBlock);
                const value = field.VARIABLE ? field.Variable.value : field.TOUCHINGOBJECTMENU.value

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
                        y = random.pick([-stageHeight, stageHeight])
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
                const sensedColor = target.blocks.getBlock(block.inputs.COLOR.block).fields.COLOUR.value;
                const rgbColor = Cast.toRgbColorList(sensedColor);
                // Check if the sprite that will be dragged is not already touching the sensed color.
                if (!target.isTouchingColor(rgbColor)) {
                    const result = ScratchEventExtractor.findColorOnCanvas(target, rgbColor);
                    // Only push the event if we actually found the color on the canvas.
                    if (result.colorFound) {
                        const {x, y} = result.coordinates;
                        eventList.push(new DragSpriteEvent(target, x, y))
                    }
                }
                break;
            }
            case 'sensing_coloristouchingcolor': {
                const getColorFromBlock = (color) =>
                    target.blocks.getBlock(block.inputs[color].block).fields.COLOUR.value;

                /*
                 * https://en.scratch-wiki.info/wiki/Color_()_is_Touching_()%3F_(block)
                 * The block takes two colors. The first color ("own color") must be present in the current costume of
                 * this sprite. The second color ("target color") is the color to touch.
                 */
                const ownColor = Cast.toRgbColorList(getColorFromBlock("COLOR"));
                const targetColor = Cast.toRgbColorList(getColorFromBlock("COLOR2"));

                // We check if the sprite still needs to be dragged towards the target color, and drag it if necessary.
                if (!target.colorIsTouchingColor(ownColor, targetColor)) {

                    // Next, we check if the costume even contains the own color. If it does, we will drag the sprite.
                    const ownColorQuery = ScratchEventExtractor.findColorOnSprite(target, ownColor);
                    if (ownColorQuery.colorFound) {

                        // The coordinates of the pixel containing "own color".
                        const {x: ownColorX, y: ownColorY} = ownColorQuery.coordinates;

                        // We try to find a pixel located somewhere else that has the "target color" so that we can
                        // drag the sprite there.
                        const targetColorQuery = ScratchEventExtractor.findColorOnCanvas(target, targetColor);
                        if (targetColorQuery.colorFound) {

                            // The coordinates of the "target color"
                            const targetX = targetColorQuery.coordinates.x;
                            const targetY = targetColorQuery.coordinates.y;

                            // The coordinates of the center of the current sprite.
                            const centerX = target.x;
                            const centerY = target.y;

                            /*
                             * We want to move the sprite such that the coordinates of the pixel with "own color" equal
                             * the coordinates of the pixel with "target color". However, moving a sprite is done with
                             * respect to its center. So we have to compute the vector from the pixel with "own color"
                             * to the center of the sprite, and add this vector as an offset to the dragging motion.
                             */
                            const offsetX = centerX - ownColorX;
                            const offsetY = centerY - ownColorY;
                            eventList.push(new DragSpriteEvent(target, targetX + offsetX, targetY + offsetY));
                        }
                    } else {
                        // TODO: We could try to select/force a different costume. It might contain the target color.
                    }
                }

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
                    let compareValueOperatorBlock: ScratchBlocks
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
                    let volumeValue = Number.parseFloat(compareValueOperatorBlock.fields.TEXT.value)
                    // Greater than
                    if (operatorBlock.opcode === 'operator_gt') {
                        compareValueIsFirstOperand ? volumeValue -= 1 : volumeValue += 1;
                    }
                    // Lower than
                    else if (operatorBlock.opcode === 'operator_lt') {
                        compareValueIsFirstOperand ? volumeValue += 1 : volumeValue -= 1;
                    }
                    eventList.push(new SoundEvent(volumeValue))
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
            if (target.hasOwnProperty('blocks')) {
                for (const blockId of Object.keys(target.blocks._blocks)) {
                    const snippet = this._extractAvailableTextSnippets(target, target.blocks.getBlock(blockId));
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
                        this.proceduresMap.set(proccode, procedureEvents)
                    }
                }
            }
        }
    }

    protected static _randomText(length: number): string {
        let answer = '';
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < length; i++) {
            answer += chars.charAt(Randomness.getInstance().nextInt(0, chars.length - 1));
        }

        return answer;
    }

    private static _extractWaitDurations(target: RenderedTarget, block: ScratchBlocks): number {
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

    private _extractAvailableTextSnippets(target: RenderedTarget, block: ScratchBlocks): string {
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

    protected _getTypeTextEvents(): TypeTextEvent[] {
        const typeTextEventList: TypeTextEvent[] = [];
        const length = this.availableTextSnippets.length;
        for (let i = 0; i < length; i++) {
            typeTextEventList.push(new TypeTextEvent(this.availableTextSnippets[i]))
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
            if (target.hasOwnProperty('blocks')) {
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
            if (target.hasOwnProperty('blocks')) {
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
     * @param rgbColor the color we are searching for in [r,g,b] representation
     * @return the color query result
     */
    private static findColorOnCanvas(sprite: RenderedTarget, rgbColor: RgbColor): ColorQueryResult {
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

        const width = renderer._xRight - renderer._xLeft;
        const height = renderer._yTop - renderer._yBottom;
        const maxRadius = Math.hypot(width, height);
        const offset = this.getRadiusOfMinimumBoundingCircle(sprite, renderer);

        return this.fuzzyFindColor(sprite.x, sprite.y, offset, maxRadius, touchableObjects, rgbColor, renderer);
    }

    /**
     * Tries to locate the given color on the given sprite. The returned object contains the coordinates of the pixel
     * containing the desired color iff the search was successful.
     *
     * @param sprite the sprite to look in
     * @param color the color to look for
     * @return the color query result
     */
    private static findColorOnSprite(sprite: RenderedTarget, color: RgbColor): ColorQueryResult {
        const renderer = sprite.runtime.renderer;

        const id = sprite.drawableID;
        const searchRadius = this.getRadiusOfMinimumBoundingCircle(sprite, renderer);

        const drawable = renderer._allDrawables[id];
        drawable.updateCPURenderAttributes();
        const thisSprite = [{id, drawable}];

        const centerX = sprite.x;
        const centerY = sprite.y;

        return this.fuzzyFindColor(centerX, centerY, 0, searchRadius, thisSprite, color, renderer);
    }

    /**
     * Returns the radius of the minimum bounding circle for the given sprite.
     *
     * @param sprite the sprite for which to compute the radius of
     * @param renderer the renderer of the sprite
     * @return the radius
     */
    private static getRadiusOfMinimumBoundingCircle(sprite, renderer) {
        const id = sprite.drawableID;
        const [costumeSizeX, costumeSizeY] = renderer.getCurrentSkinSize(id);
        const scalingFactor = sprite.size / 100;
        return Math.max(costumeSizeX, costumeSizeY) * scalingFactor / 2;
    }

    /**
     * Tries to locate a given color in a given search area. This area is defined by a circle. Its center point has the
     * coordinates centerX and centerY. The radius is given by maxRadius. In addition, one can choose to exclude a
     * smaller inner circle with radius "offset" from the search. Only the given list of touchable objects are
     * considered when searching for the color. The returned object contains the coordinates of the pixel containing the
     * desired color iff the search was successful.
     *
     * @param centerX x-coordinate of the search circle
     * @param centerY y-coordinate of the search circle
     * @param offset radius of the circle to exclude from the search
     * @param maxRadius the radius of the search circle
     * @param touchableObjects the objects within the search area to consider
     * @param color3b the color to search for
     * @param renderer
     * @return the search result
     */
    private static fuzzyFindColor(
        centerX: number,
        centerY: number,
        offset: number,
        maxRadius: number,
        touchableObjects: RenderedTarget[],
        color3b: Uint8ClampedArray,
        renderer
    ): ColorQueryResult {
        // Scan an ever increasing radius around the source sprite and check if we found an object carrying the
        // sensed color. We stop if the radius is greater than maxRadius.
        const point = twgl.v3.create();
        const color = new Uint8ClampedArray(4);
        let r = 1 + offset;
        let rPrev = 1;
        let rIncrease = 1;
        while (r < maxRadius) {
            const coordinates = [];
            for (const x of [-r, r]) {
                for (let y = -r; y <= r; y++) {
                    coordinates.push([x, y]);
                }
            }
            for (const y of [-r, r]) {
                for (let x = -r; x <= r; x++) {
                    coordinates.push([x, y]);
                }
            }
            for (const c of coordinates) {
                const x = c[0];
                const y = c[1];
                point[0] = centerX + x;
                point[1] = centerY + y;
                renderer.constructor.sampleColor3b(point, touchableObjects, color);

                // Check if we found an object carrying the correct color.
                if (ScratchEventExtractor.isColorMatching(color, color3b)) {
                    return {
                        colorFound: true,
                        coordinates: {x: point[0], y: point[1]}
                    };
                }
            }
            // Increase the scan radius in a recursive fashion.
            rIncrease += rPrev;
            rPrev = (rIncrease / 5);
            r += (rIncrease / 2);
        }
        // At this point we scanned the whole canvas but didn't find the color.
        return {
            colorFound: false
        };
    }

    /**
     * Check if color1 matches color2.
     * @param color1 the first color
     * @param color2 the second color
     */
    private static isColorMatching(color1: RgbColor, color2: RgbColor): boolean {
        return (color1[0] & 0b11111000) === (color2[0] & 0b11111000) &&
            (color1[1] & 0b11111000) === (color2[1] & 0b11111000) &&
            (color1[2] & 0b11110000) === (color2[2] & 0b11110000);
    }
}

type ColorQueryResult = ColorQuerySuccess | ColorQueryFailure

interface ColorQuerySuccess {
    colorFound: true,
    coordinates: { x: number, y: number }
}

interface ColorQueryFailure {
    colorFound: false
}

type RgbColor = Uint8ClampedArray;
