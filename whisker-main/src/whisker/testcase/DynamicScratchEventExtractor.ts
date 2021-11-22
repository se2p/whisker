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
import {ScratchEventExtractor} from "./ScratchEventExtractor";
import {TypeTextEvent} from "./events/TypeTextEvent";
import Arrays from "../utils/Arrays";


export class DynamicScratchEventExtractor extends ScratchEventExtractor {

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    public extractEvents(vm: VirtualMachine): ScratchEvent[] {
        let eventList: ScratchEvent[] = [];

        for (const target of vm.runtime.targets) {
            for (const scriptId of target.blocks.getScripts()) {
                const activeScript = vm.runtime.threads.find(script => script.topBlock === scriptId);
                const hat = target.blocks.getBlock(scriptId);

                // If the script is currently active we skip the hat-block and traverse downwards in the search for an
                // event handler.
                if (activeScript !== undefined) {
                    this.traverseBlocks(target, target.blocks.getBlock(hat.next), eventList);
                }
                // Otherwise, we add the hat block to the set of events.
                else {
                    eventList.push(...this._extractEventsFromBlock(target, target.blocks.getBlock(scriptId)));
                }
            }
        }

        if (eventList.some(event => event instanceof TypeTextEvent)) {
            eventList = eventList.filter(event => event instanceof TypeTextEvent);
        }

        // We always need a WaitEvent otherwise, ExtensionLocalSearch if applied will produce codons having values
        // of -1.
        eventList.push(new WaitEvent());
        return Arrays.distinctObjects(eventList);
    }
}
