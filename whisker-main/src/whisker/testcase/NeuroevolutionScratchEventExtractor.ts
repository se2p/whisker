import {ScratchBlocks} from "./ScratchEventExtractor";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {ScratchEvent} from "./events/ScratchEvent";
import {DragSpriteEvent} from "./events/DragSpriteEvent";
import {StaticScratchEventExtractor} from "./StaticScratchEventExtractor";
import {KeyPressEvent} from "./events/KeyPressEvent";
import {MouseMoveEvent} from "./events/MouseMoveEvent";
import {Container} from "../utils/Container";
import {MouseMoveToEvent} from "./events/MouseMoveToEvent";
import {MouseDownEvent} from "./events/MouseDownEvent";
import {ClickSpriteEvent} from "./events/ClickSpriteEvent";
import {ClickStageEvent} from "./events/ClickStageEvent";
import {SoundEvent} from "./events/SoundEvent";
import {RenderedTarget} from 'scratch-vm/src/sprites/rendered-target';
import {DynamicScratchEventExtractor} from "./DynamicScratchEventExtractor";

export class NeuroevolutionScratchEventExtractor extends DynamicScratchEventExtractor {

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * Used for extracting events when loading a network from a saved json file. We exclude DragSpriteEvents in
     * Neuroevolution algorithms.
     * @param vm the state of the Scratch-Project from which events will be extracted.
     */
    public extractStaticEvents(vm: VirtualMachine): ScratchEvent[] {
        const scratchEvents = new StaticScratchEventExtractor(vm).extractEvents(vm);
        return scratchEvents.filter((event) => !(event instanceof DragSpriteEvent));
    }

    /**
     * Extracts input events from Scratch-Blocks. Neuroevolution does not include DragSpriteEvents since these
     * events do not reflect how a game is meant to be played. By not using DragSpriteEvents, we can omit costly
     * colorDistance calculations.
     * @param target the target whose block is analysed.
     * @param block the block which will be analysed for potential input events.
     * @returns a list of extracted scratch events.
     */
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
                const value = field.VARIABLE ? field.Variable.value : field.TOUCHINGOBJECTMENU.value;

                // Target senses Mouse
                if (value == "_mouse_") {
                    const currentMousePosition = Container.vmWrapper.inputs.getMousePos();
                    // Only add a MouseMoveTo event if the mouse is currently not located at the targeted position.
                    if (currentMousePosition.x !== target.x || currentMousePosition.y !== target.y) {
                        eventList.push(new MouseMoveToEvent(target.x, target.y));
                    }
                    eventList.push(new MouseMoveEvent());
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
                // Only add the event if the mouse is currently not pressed
                if(!isMouseDown) {
                    eventList.push(new MouseDownEvent());
                }
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
