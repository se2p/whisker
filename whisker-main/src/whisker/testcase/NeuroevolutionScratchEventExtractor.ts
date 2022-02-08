import {ScratchEventExtractor} from "./ScratchEventExtractor";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {ScratchEvent} from "./events/ScratchEvent";
import {DragSpriteEvent} from "./events/DragSpriteEvent";
import {DynamicScratchEventExtractor} from "./DynamicScratchEventExtractor";
import {KeyPressEvent} from "./events/KeyPressEvent";
import {Container} from "../utils/Container";

export class NeuroevolutionScratchEventExtractor extends ScratchEventExtractor {

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * Extracts Events for the Neuroevolution algorithms. Neuroevolution does not include DragSpriteEvents
     * @param vm the state of the Scratch-Project, we are extracting events from
     */
    public extractEvents(vm:VirtualMachine): ScratchEvent[] {
        let scratchEvents = new DynamicScratchEventExtractor(vm).extractEvents(vm);
        // Remove KeyPressEvents if the corresponding Key is already pressed.
        scratchEvents = scratchEvents.filter(event => !(event instanceof  KeyPressEvent) || !Container.vmWrapper.inputs.isKeyDown(String(event.getParameters()[0])));
        // Remove DragSpriteEvents.
        return scratchEvents.filter((event) => !(event instanceof DragSpriteEvent));
    }
}
