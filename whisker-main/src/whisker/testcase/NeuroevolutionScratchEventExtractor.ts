import {ScratchEventExtractor} from "./ScratchEventExtractor";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {ScratchEvent} from "./events/ScratchEvent";
import {List} from "../utils/List";
import {StaticScratchEventExtractor} from "./StaticScratchEventExtractor";
import {DragSpriteEvent} from "./events/DragSpriteEvent";
import {DynamicScratchEventExtractor} from "./DynamicScratchEventExtractor";

export class NeuroevolutionScratchEventExtractor extends ScratchEventExtractor {

    private readonly _dynamic: boolean

    constructor(vm: VirtualMachine, dynamic = false) {
        super(vm);
        this._dynamic = dynamic;
    }

    /**
     * Extracts Events for the Neuroevolution algorithms. Neuroevolution does not include DragSpriteEvents
     * @param vm the state of the Scratch-Project, we are extracting events from
     */
    public extractEvents(vm:VirtualMachine): List<ScratchEvent> {
        let scratchEvents: List<ScratchEvent>
        if(this._dynamic){
            scratchEvents = new DynamicScratchEventExtractor(vm).extractEvents(vm);
        }
        else{
            scratchEvents = new StaticScratchEventExtractor(vm).extractEvents(vm);
        }
        return scratchEvents.filter((event) => !(event instanceof DragSpriteEvent));
    }
}
