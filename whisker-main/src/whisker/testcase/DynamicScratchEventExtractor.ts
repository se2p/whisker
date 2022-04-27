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
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";


export class DynamicScratchEventExtractor extends ScratchEventExtractor {

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    public extractEvents(vm: VirtualMachine): ScratchEvent[] {
        let eventList: ScratchEvent[] = [];
        const lastStepCoveredBlocks: Set<string> = vm.runtime.traceInfo.tracer.lastStepCoverage;

        for (const target of vm.runtime.targets) {
            for (const scriptId of target.blocks.getScripts()) {
                const activeScript = vm.runtime.threads.some(script => script.topBlock === scriptId) ||
                    DynamicScratchEventExtractor.hatBlockTriggeredByScratchBlock(target, scriptId, lastStepCoveredBlocks);
                const hat = target.blocks.getBlock(scriptId);

                // If the script is currently active we skip the hat-block and traverse downwards in the search for an
                // event handler.
                if (activeScript) {
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
        const equalityFunction = (a: ScratchEvent, b: ScratchEvent) => a.stringIdentifier() === b.stringIdentifier();
        return Arrays.distinctByComparator(eventList, equalityFunction);
    }

    /**
     * Determines whether a hat block that may be triggered from another Scratch block (when broadcast receive | when
     * backdrop switches to | when start as clone) has been triggered in the previous step. If this is the case we
     * treat the corresponding script as active for the current step.
     * @param target the target holding the questionable hat block.
     * @param scriptId the script ID of the current block.
     * @param lastCovered the set of blocks that have been covered in the previous step.
     * @returns boolean indicating whether this script is active.
     */
    private static hatBlockTriggeredByScratchBlock(target: RenderedTarget, scriptId: string, lastCovered: Set<string>): boolean {
        const threadHats: string[] = target.sprite.blocks._scripts;
        const hatBlock = target.blocks.getBlock(scriptId);

        // We are only interested in hat blocks that may be triggered from other scratch blocks.
        if (hatBlock['opcode'] !== 'event_whenbroadcastreceived' &&
            hatBlock['opcode'] !== 'event_whenbackdropswitchesto' &&
            hatBlock['opcode'] !== 'control_start_as_clone') {
            return false;
        }

        for (const threadScript of threadHats) {
            for (const covered of lastCovered) {
                if (covered.includes(threadScript) && covered.includes(scriptId)) {
                    return true;
                }
            }
        }
        return false;
    }
}
