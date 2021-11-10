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
import {EventFilter} from "scratch-analysis/src/block-filter";
import {TypeTextEvent} from "./events/TypeTextEvent";
import Arrays from "../utils/Arrays";


export class DynamicScratchEventExtractor extends ScratchEventExtractor {

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    public extractEvents(vm: VirtualMachine): ScratchEvent[] {
        let eventList: ScratchEvent[] = [];
        const executingScripts: string[] = [];

        // Check all blocks within scripts currently executing
        for (const t of vm.runtime.threads) {
            const target = t.target;
            let block = target.blocks.getBlock(t.topBlock);
            // For the reason of not adding hatEvents of already active scripts, skip hatEvents and defer the handling
            // of hatEvents to the following loop where we know which scripts are indeed currently already active.
            if (block && EventFilter.hatEvent(block)) {
                block = target.blocks.getBlock(block.next);
            }
            // Sometimes we encounter undefined blocks here?
            if (block) {
                executingScripts.push(target.blocks.getTopLevelScript(t.topBlock));
                this.traverseBlocks(target, block, eventList);
            }
        }

        // Get all hat blocks and set up the procedureMap which maps the name of a procedure to the encountered events
        // of the procedure definition script.
        for (const target of vm.runtime.targets) {
            for (const scriptId of target.sprite.blocks.getScripts()) {
                if (!executingScripts.includes(scriptId)) {
                    eventList.push(...this._extractEventsFromBlock(target, target.blocks.getBlock(scriptId)));
                }
            }
        }

        if(eventList.some(event => event instanceof TypeTextEvent)){
            eventList = eventList.filter(event => event instanceof TypeTextEvent);
        }

        // We always need a WaitEvent otherwise, ExtensionLocalSearch if applied will produce codons having values of -1
        eventList.push(new WaitEvent())
        return Arrays.distinctObjects(eventList);
    }
}
