import {ScratchEventExtractor} from "./ScratchEventExtractor";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {ScratchEvent} from "./events/ScratchEvent";
import {List} from "../utils/List";
import {DragSpriteEvent} from "./events/DragSpriteEvent";
import {DynamicScratchEventExtractor} from "./DynamicScratchEventExtractor";

export class NeuroevolutionScratchEventExtractor extends ScratchEventExtractor {

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * Extracts Events for the Neuroevolution algorithms. Neuroevolution does not include DragSpriteEvents
     * @param vm the state of the Scratch-Project, we are extracting events from
     */
    public extractEvents(vm:VirtualMachine): List<ScratchEvent> {
        const scratchEvents = new DynamicScratchEventExtractor(vm).extractEvents(vm);
        return scratchEvents.filter((event) => !(event instanceof DragSpriteEvent));
    }
}
