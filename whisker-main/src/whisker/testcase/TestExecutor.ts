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
import VMWrapper = require("../../vm/vm-wrapper.js")
import {Container} from "../utils/Container";

export class TestExecutor {

    private readonly _vm: VirtualMachine;
    private _vmWrapper: VMWrapper
    private eventMap: Map<string, List<ScratchEvent>>;
    private eventObservers: EventObserver[] = [];
    private _initialState = {};

    constructor(vmWrapper: VMWrapper) {
        this._vmWrapper = vmWrapper;
        this._vm = vmWrapper.vm;
        this.eventMap = new Map<string, List<ScratchEvent>>();
        this.recordInitialState();
    }

    async executeTests(tests: List<TestChromosome>): Promise<void> {
        for (const testChromosome of tests) {
            if (testChromosome.trace == null) {
                await this.execute(testChromosome);
            }
        }
    }

    async execute(testChromosome: TestChromosome): Promise<ExecutionTrace> {
        const events = new List<[ScratchEvent, number[]]>();

        seedScratch(String(Randomness.getInitialSeed()));
        this._vmWrapper.start();

        let numCodon = 0;
        const codons = testChromosome.getGenes();

        while (numCodon < codons.size()) {
            // Fetch the currently available events and save them in the EventMap
            this.createEventMap(ScratchEventExtractor.extractEvents(this._vm));
            const eventTypes = new List<string>(Array.from(this.eventMap.keys()));

            if (eventTypes.isEmpty()) {
                console.log("Whisker-Main: No events available for project.");
                continue;
            }
            // Select the next Type of Event
            const nextEventType: string = eventTypes.get(codons.get(numCodon) % eventTypes.size())
            numCodon++;
            // Select the concrete Event from the available Events.
            // Only use an additional codon if theres actually a selection to make
            const concreteEvents = this.eventMap.get(nextEventType);
            let nextEvent: ScratchEvent;
            if (concreteEvents.size() == 1) {
                nextEvent = concreteEvents.get(0);
            } else {
                nextEvent = concreteEvents.get(codons.get(numCodon % codons.size()) % concreteEvents.size());
                numCodon++;
            }
            const args = this._getArgs(nextEvent, codons, numCodon);
            events.add([nextEvent, args]);
            numCodon += nextEvent.getNumParameters() + 1;
            this.notify(nextEvent, args);

            // Send the chosen Event including its parameters to the VM
            await nextEvent.apply(this._vm, args);
            StatisticsCollector.getInstance().incrementEventsCount()

            // Send a WaitEvent to the VM
            const waitEvent = new WaitEvent();
            events.add([waitEvent, []]);
            await waitEvent.apply(this._vm);
        }

        await new WaitEvent(Container.config.getWaitDurationAfterExecution()).apply(this._vm);

        testChromosome.trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, events);
        testChromosome.coverage = this._vm.runtime.traceInfo.tracer.coverage as Set<string>;
        this._vmWrapper.end();
        this.resetState();
        StatisticsCollector.getInstance().numberFitnessEvaluations++;
        return testChromosome.trace;
    }

    /**
     * Creates a map mapping EventTypes to concrete Events which can be executed by the stepper.
     * @param events the List of concrete Events which should be sorted according to their types.
     */
    private createEventMap(events: List<ScratchEvent>): void {
        // Clear the map from a previous VM-State and refill it with the events of the current State
        this.eventMap.clear();
        for (const event of events) {
            if (!this.eventMap.has(event.constructor.name)) {
                this.eventMap.set(event.constructor.name, new List<ScratchEvent>([event]));
            } else {
                const eventList = this.eventMap.get(event.constructor.name);
                eventList.add(event);
                this.eventMap.set(event.constructor.name, eventList);
            }
        }
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
        // Delete clones
        const clones = [];
        for (const targetsKey in this._vm.runtime.targets) {
            if (!this._vm.runtime.targets[targetsKey].isOriginal) {
                clones.push(this._vm.runtime.targets[targetsKey]);
            }
        }

        for (const target of clones) {
            this._vm.runtime.stopForTarget(target);
            this._vm.runtime.disposeTarget(target);
        }

        // Restore state of all others
        for (const targetsKey in this._vm.runtime.targets) {
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
