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


import {Trace} from 'scratch-vm/src/engine/tracing.js'
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {TestChromosome} from "./TestChromosome";
import {ScratchEventExtractor} from "./ScratchEventExtractor";
import {ExecutionTrace} from "./ExecutionTrace";
import {List} from "../utils/List";
import {ScratchEvent} from "./ScratchEvent";
import {WaitEvent} from "./events/WaitEvent";
import {StatisticsCollector} from "../utils/StatisticsCollector";
import {EventObserver} from "./EventObserver";
import {seedScratch} from "../../util/random";
import {Randomness} from "../utils/Randomness";

export class TestExecutor {

    private _vm: VirtualMachine;
    private availableEvents: List<ScratchEvent>;
    private eventObservers: EventObserver[] = [];

    constructor(vm: VirtualMachine) {
        this._vm = vm;
    }

    execute(testChromosome: TestChromosome): Trace {
        this._vm.stopAll();
        seedScratch(Randomness.getInitialSeed());
        this._vm.greenFlag();

        this.availableEvents = ScratchEventExtractor.extractEvents(this._vm);
        let numCodon = 0;
        const codons = testChromosome.getGenes();
        while (numCodon < codons.size()) {

            if (this.availableEvents.isEmpty()) {
                console.log("Whisker-Main: No events available for project.");
                continue;
            }

            const nextEvent: ScratchEvent = this.availableEvents.get(codons.get(numCodon) % this.availableEvents.size())

            const args = this._getArgs(nextEvent, codons, numCodon);
            numCodon += nextEvent.getNumParameters() + 1;
            this.notify(nextEvent);

            nextEvent.apply(this._vm, args);
            StatisticsCollector.getInstance().incrementEventsCount()

            new WaitEvent().apply(this._vm);
        }

        new WaitEvent().apply(this._vm);
        new WaitEvent().apply(this._vm);
        new WaitEvent().apply(this._vm);
        new WaitEvent().apply(this._vm);
        new WaitEvent().apply(this._vm);
        return new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces)
    }

    private _getArgs(event: ScratchEvent, codons: List<number>, codonPosition: number): number[] {
        let args = [];
        for (let i = 0; i < event.getNumParameters(); i++) {
            // Get next codon, but wrap around if length exceeded
            const codon = codons.get(++codonPosition % codons.size());

            // TODO: How to map from codon to parameter value?
            // TODO: Make this responsibility of event?
            args.push(codon)
        }
        return args;
    }

    public attach(observer: EventObserver): void {
        const isExist = this.eventObservers.includes(observer);
        if (!isExist) {
            this.eventObservers.push(observer);
        }
    }

    public detach(observer: EventObserver): void {
        const observerIndex = this.eventObservers.indexOf(observer);
        if (observerIndex !== -1) {
            this.eventObservers.splice(observerIndex, 1);
        }
    }

    private notify(event: ScratchEvent): void {
        for (const observer of this.eventObservers) {
            observer.update(event);
        }
    }
}
