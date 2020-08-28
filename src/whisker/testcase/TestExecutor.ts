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
import {VMWrapper} from "../../vm/vm-wrapper.js"

export class TestExecutor {

    private readonly _vm: VirtualMachine;
    private _vmWrapper: VMWrapper
    private availableEvents: List<ScratchEvent>;
    private eventObservers: EventObserver[] = [];
    private _initialState = {};

    constructor(vmWrapper: VMWrapper) {
        this._vmWrapper = vmWrapper;
        this._vm = vmWrapper.vm;
        this.recordInitialState();
    }

    execute(testChromosome: TestChromosome): Trace {

        this._vmWrapper.end();
        seedScratch(Randomness.getInitialSeed());
        this._vmWrapper.start();

        let numCodon = 0;
        const codons = testChromosome.getGenes();

        // extracts all available text snippets
        ScratchEventExtractor.extractAvailableParameter(this._vm);

        while (numCodon < codons.size()) {
            this.availableEvents = ScratchEventExtractor.extractEvents(this._vm);

            if (this.availableEvents.isEmpty()) {
                console.log("Whisker-Main: No events available for project.");
                continue;
            }

            const nextEvent: ScratchEvent = this.availableEvents.get(codons.get(numCodon) % this.availableEvents.size())

            const args = this._getArgs(nextEvent, codons, numCodon);
            numCodon += nextEvent.getNumParameters() + 1;
            this.notify(nextEvent, args);

            nextEvent.apply(this._vm, args);
            StatisticsCollector.getInstance().incrementEventsCount()

            new WaitEvent().apply(this._vm);
        }

        new WaitEvent().apply(this._vm);
        new WaitEvent().apply(this._vm);
        new WaitEvent().apply(this._vm);
        new WaitEvent().apply(this._vm);
        new WaitEvent().apply(this._vm);
        this.resetState();
        return new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces)
    }

    private _getArgs(event: ScratchEvent, codons: List<number>, codonPosition: number): number[] {
        const args = [];
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

    private notify(event: ScratchEvent, args: number[]): void {
        for (const observer of this.eventObservers) {
            observer.update(event, args);
        }
    }

    private resetState() {
        for (const targetsKey in this._vm.runtime.targets) {
            if (this._initialState.hasOwnProperty(targetsKey)) {
                this._vm.runtime.targets[targetsKey]["direction"] = this._initialState[targetsKey]["direction"];
                this._vm.runtime.targets[targetsKey]["currentCostume"] = this._initialState[targetsKey]["currentCostume"];
                this._vm.runtime.targets[targetsKey]["draggable"] = this._initialState[targetsKey]["draggable"];
                this._vm.runtime.targets[targetsKey]["dragging"] = this._initialState[targetsKey]["dragging"];
                this._vm.runtime.targets[targetsKey]["effects"] = Object.assign({}, this._initialState[targetsKey]["effects"]);
                this._vm.runtime.targets[targetsKey]["videoState"] = this._initialState[targetsKey]["videoState"];
                this._vm.runtime.targets[targetsKey]["videoTransparency"] = this._initialState[targetsKey]["videoTransparency"];
                this._vm.runtime.targets[targetsKey]["visible"] = this._initialState[targetsKey]["visible"];
                this._vm.runtime.targets[targetsKey]["volume"] = this._initialState[targetsKey]["volume"];
                this._vm.runtime.targets[targetsKey]["x"] = this._initialState[targetsKey]["x"];
                this._vm.runtime.targets[targetsKey]["y"] = this._initialState[targetsKey]["y"];
            } else {
                this._vm.runtime.disposeTarget(this._vm.runtime.targets[targetsKey])
            }
        }
    }

    private recordInitialState() {
        for (const targetsKey in this._vm.runtime.targets) {
            this._initialState[targetsKey] = {
                direction: this._vm.runtime.targets[targetsKey]["direction"],
                currentCostume: this._vm.runtime.targets[targetsKey]["currentCostume"],
                draggable: this._vm.runtime.targets[targetsKey]["draggable"],
                dragging: this._vm.runtime.targets[targetsKey]["dragging"],
                effects: Object.assign({}, this._vm.runtime.targets[targetsKey]["effects"]),
                videoState: this._vm.runtime.targets[targetsKey]["videoState"],
                videoTransparency: this._vm.runtime.targets[targetsKey]["videoTransparency"],
                visible: this._vm.runtime.targets[targetsKey]["visible"],
                volume: this._vm.runtime.targets[targetsKey]["volume"],
                x: this._vm.runtime.targets[targetsKey]["x"],
                y: this._vm.runtime.targets[targetsKey]["y"],
            }
        }
    }
}
