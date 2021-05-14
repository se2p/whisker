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

import {List} from '../utils/List';

import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchEvent} from "./ScratchEvent";
import {WaitEvent} from "./events/WaitEvent";
import {ScratchEventExtractor} from "./ScratchEventExtractor";

export class DynamicScratchEventExtractor extends ScratchEventExtractor {

    constructor (vm: VirtualMachine) {
        super(vm);
    }

    public extractEvents(vm: VirtualMachine): List<ScratchEvent> {
        const eventList = new List<ScratchEvent>();

        // Get all hat blocks and set up the procedureMap which maps the name of a procedure to the encountered events
        // of the procedure definition script.
        for (const target of vm.runtime.targets) {
            for (const scriptId of target.sprite.blocks.getScripts()) {
                const hatBlock = target.blocks.getBlock(scriptId);
                eventList.addList(this._extractEventsFromBlock(target, target.blocks.getBlock(scriptId)));
            }
        }

        // Check all blocks within scripts currently executing
        for (const t of vm.runtime.threads) {
            const target = t.target;
            const block = target.blocks.getBlock(t.topBlock);
            // Sometimes we encounter undefined blocks here?
            if (block)
                this.traverseBlocks(target, block, eventList);
        }

        // TODO: In some programs without event handlers no waits are chosen
        //       maybe because the execution of the greenflag scripts
        //       is too quick? A nicer solution would be good.
        if (eventList.isEmpty() && !this.availableWaitDurations.isEmpty()) {
            for (const duration of this.availableWaitDurations) {
                eventList.add(new WaitEvent(duration));
            }
        }

        return eventList.distinctObjects();
    }
}
