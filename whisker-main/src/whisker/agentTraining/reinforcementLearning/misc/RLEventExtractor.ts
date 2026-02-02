import {NeuroevolutionScratchEventExtractor} from "../../../testcase/NeuroevolutionScratchEventExtractor";
import VirtualMachine from "scratch-vm";
import {ScratchEvent} from "../../../testcase/events/ScratchEvent";
import {MouseMoveFixedDirection} from "../../../testcase/events/MouseMoveFixedDirection";

export class RLEventExtractor extends NeuroevolutionScratchEventExtractor {

    private readonly _eventOrder: string[] = [];

    constructor(vm: VirtualMachine) {
        super(vm, 'multiClass');
    }

    /**
     * Extracts events from the current state of the VM. Sorts the extracted events based on the {@link _eventOrder}
     * array. If some events are missing, we pad the respective index with a {@link null} value.
     *
     * @param vm The current state of the Scratch VM from which the current set of active events will be extracted.
     * @returns the padded and sorted array of Scratch events.
     */
    public override extractEvents(vm: VirtualMachine): ScratchEvent[] {
        const extracted = super.extractEvents(vm);
        this._updateEventOrder(extracted);

        const paddedEvents: ScratchEvent[] = [];
        for (const eventId of this._eventOrder) {
            const matchingEvent = extracted.find(event => event.stringIdentifier() === eventId);
            if (matchingEvent) {
                paddedEvents.push(matchingEvent);
            } else {
                paddedEvents.push(null);
            }
        }
        return paddedEvents;
    }

    /**
     * Updates the {@link _eventOrder} array if new events were discovered.
     *
     * @param events The events to update the order array with.
     */
    private _updateEventOrder(events: ScratchEvent[]): void {
        const currentIds = events.map(event => event.stringIdentifier());
        for (const id of currentIds) {
            if (!this._eventOrder.includes(id)) {
                this._eventOrder.push(id);
            }
        }
    }

    /**
     * Adds discretized mouse move events to the event list.
     *
     * @param eventList The list of currently active scratch events.
     */
    protected override _addMouseMoveEvents(eventList: ScratchEvent[]): void {
        eventList.push(new MouseMoveFixedDirection("UP"));
        eventList.push(new MouseMoveFixedDirection("DOWN"));
        eventList.push(new MouseMoveFixedDirection("LEFT"));
        eventList.push(new MouseMoveFixedDirection("RIGHT"));
    }
}
