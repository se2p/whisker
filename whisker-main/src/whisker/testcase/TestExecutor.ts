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
import {EventAndParameters, ExecutionTrace} from "./ExecutionTrace";
import {List} from "../utils/List";
import {ScratchEvent} from "./events/ScratchEvent";
import {WaitEvent} from "./events/WaitEvent";
import {StatisticsCollector} from "../utils/StatisticsCollector";
import {EventObserver} from "./EventObserver";
import {Randomness} from "../utils/Randomness";
import {ScratchEventExtractor} from "./ScratchEventExtractor";
import Runtime from "scratch-vm/src/engine/runtime";
import {EventSelector} from "./EventSelector";
import VMWrapper = require("../../vm/vm-wrapper.js");


export class TestExecutor {

    private readonly _vm: VirtualMachine;
    private _vmWrapper: VMWrapper
    private _eventExtractor: ScratchEventExtractor;
    private readonly _eventSelector: EventSelector;
    private _eventObservers: EventObserver[] = [];
    private _initialState = {};
    private _projectRunning: boolean;

    constructor(vmWrapper: VMWrapper, eventExtractor: ScratchEventExtractor, eventSelector: EventSelector) {
        this._vmWrapper = vmWrapper;
        this._vm = vmWrapper.vm;
        this._eventExtractor = eventExtractor;
        this._eventSelector = eventSelector;
        this.recordInitialState();
    }

    async executeTests(tests: List<TestChromosome>): Promise<void> {
        for (const testChromosome of tests) {
            if (testChromosome.trace == null) {
                await this.execute(testChromosome);
            }
        }
    }

    /**
     * Executes a chromosome by selecting events according to the chromosome's defined genes.
     * @param testChromosome the testChromosome that should be executed.
     */
    async execute(testChromosome: TestChromosome): Promise<ExecutionTrace> {
        const events = new List<EventAndParameters>();

        Randomness.seedScratch();
        const _onRunStop = this.projectStopped.bind(this);
        this._vm.on(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this._projectRunning = true;
        this._vmWrapper.start();
        let availableEvents = this._eventExtractor.extractEvents(this._vm);

        let numCodon = 0;
        const codons = testChromosome.getGenes();
        let totalCoverageSize = 0;
        let codonLastImproved = 0;
        let lastImprovedTrace: ExecutionTrace;
        let targetFitness = Number.MAX_SAFE_INTEGER;

        while (numCodon < codons.size() && (this._projectRunning || this.hasActionEvents(availableEvents))) {
            availableEvents = this._eventExtractor.extractEvents(this._vm);
            if (availableEvents.isEmpty()) {
                console.log("Whisker-Main: No events available for project.");
                break;
            }

            // Select and send the next Event to the VM.
            numCodon = await this.selectAndSendEvent(codons, numCodon, availableEvents, events);

            // Check if the sent event increased the block coverage. If so save the state up to this point in time.
            const currentCoverage = this._vmWrapper.vm.runtime.traceInfo.tracer.coverage as Set<string>;
            if (currentCoverage.size > totalCoverageSize) {
                codonLastImproved = numCodon;
                totalCoverageSize = currentCoverage.size;
                lastImprovedTrace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, events.clone());
            }

            // Check if we came closer to cover a specific block. This is only makes sense when using a SingleObjective
            // focused Algorithm like MIO.
            if (testChromosome.targetFitness) {
                testChromosome.trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, events.clone());
                testChromosome.coverage = currentCoverage;
                const currentFitness = testChromosome.getFitness(testChromosome.targetFitness);
                if (testChromosome.targetFitness.compare(currentFitness, targetFitness) > 0) {
                    targetFitness = currentFitness;
                    testChromosome.lastImprovedFitnessCodon = numCodon;
                }
            }
        }

        // Check if the last event had to use a codon from the start of the codon list.
        // Extend the codon list by the required amount of codons by duplicating the first few codons.
        if (numCodon > codons.size()) {
            const codonsToDuplicate = numCodon - codons.size();
            codons.addList(codons.subList(0, codonsToDuplicate));
        }

        // Set attributes of the testChromosome after executing its genes.
        testChromosome.trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, events);
        testChromosome.coverage = this._vm.runtime.traceInfo.tracer.coverage as Set<string>;
        testChromosome.lastImprovedCoverageCodon = codonLastImproved;
        testChromosome.lastImprovedTrace = lastImprovedTrace;


        this._vmWrapper.end();
        this.resetState();
        StatisticsCollector.getInstance().numberFitnessEvaluations++;
        return testChromosome.trace;
    }

    /**
     * Randomly executes events selected from the available event Set.
     * @param randomEventChromosome the chromosome in which the executed trace will be saved in.
     * @param numberOfEvents the number of events that should be executed.
     */
    async executeRandomEvents(randomEventChromosome: TestChromosome, numberOfEvents: number): Promise<ExecutionTrace> {
        Randomness.seedScratch();
        const _onRunStop = this.projectStopped.bind(this);
        this._vm.on(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this._projectRunning = true;
        this._vmWrapper.start();
        let availableEvents = this._eventExtractor.extractEvents(this._vm);
        let eventCount = 0;
        const random = Randomness.getInstance();
        const events = new List<EventAndParameters>();

        while (eventCount < numberOfEvents && (this._projectRunning || this.hasActionEvents(availableEvents))) {
            availableEvents = this._eventExtractor.extractEvents(this._vm);
            if (availableEvents.isEmpty()) {
                console.log("Whisker-Main: No events available for project.");
                break;
            }

            // Randomly select an event and increase the event count.
            const eventIndex = random.nextInt(0, availableEvents.size());
            randomEventChromosome.getGenes().add(eventIndex);
            const event = availableEvents.get(eventIndex);
            eventCount++;

            // If the selected event requires additional parameters; select them randomly as well.
            if (event.numSearchParameter() > 0) {
                // args are set in the event itself since the event knows which range of random values makes sense.
                event.setParameter(null, "random");
            }
            events.add(new EventAndParameters(event, event.getParameters()));
            await event.apply();
            StatisticsCollector.getInstance().incrementEventsCount()

            // Send a WaitEvent to the VM
            const waitEvent = new WaitEvent(1);
            events.add(new EventAndParameters(waitEvent, []));
            await waitEvent.apply();

        }
        const trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, events);
        randomEventChromosome.coverage = this._vm.runtime.traceInfo.tracer.coverage as Set<string>;
        randomEventChromosome.trace = trace;
        this._vmWrapper.end();
        this.resetState();
        StatisticsCollector.getInstance().numberFitnessEvaluations++;
        return trace;
    }

    /**
     * Selects and sends the next Event to the VM
     * @param codons the list of codons deciding which event and parameters to take
     * @param numCodon the current position in the codon list
     * @param availableEvents the set of available events to choose from
     * @param events collects the chosen events including its parameters
     * @returns the new position in the codon list after selecting an event and its parameters.
     */
    public async selectAndSendEvent(codons: List<number>, numCodon: number, availableEvents: List<ScratchEvent>,
                                    events: List<EventAndParameters>): Promise<number> {
        // Select the next event and set its parameter
        const nextEvent: ScratchEvent = this._eventSelector.selectEvent(codons, numCodon, availableEvents);
        numCodon++;
        const parameters = TestExecutor.getArgs(nextEvent, codons, numCodon);
        nextEvent.setParameter(parameters, "codon");
        events.add(new EventAndParameters(nextEvent, parameters));
        numCodon += nextEvent.numSearchParameter();
        this.notify(nextEvent, parameters);
        // Send the chosen Event including its parameters to the VM
        await nextEvent.apply();
        StatisticsCollector.getInstance().incrementEventsCount()

        // Send a WaitEvent to the VM
        const waitEvent = new WaitEvent(1);
        events.add(new EventAndParameters(waitEvent, []));
        await waitEvent.apply();
        return numCodon;
    }

    /**
     * Collects the required parameters for a given event from the list of codons.
     * @param event the event for which parameters should be collected
     * @param codons the list of codons
     * @param codonPosition the starting position from which on codons should be collected as parameters
     */
    private static getArgs(event: ScratchEvent, codons: List<number>, codonPosition: number): number[] {
        const args = [];
        for (let i = 0; i < event.numSearchParameter(); i++) {
            args.push(codons.get(codonPosition++ % codons.size()));
        }
        return args;
    }

    public attach(observer: EventObserver): void {
        const isExist = this._eventObservers.includes(observer);
        if (!isExist) {
            this._eventObservers.push(observer);
        }
    }

    public detach(observer: EventObserver): void {
        const observerIndex = this._eventObservers.indexOf(observer);
        if (observerIndex !== -1) {
            this._eventObservers.splice(observerIndex, 1);
        }
    }

    private notify(event: ScratchEvent, args: number[]): void {
        for (const observer of this._eventObservers) {
            observer.update(event, args);
        }
    }

    /**
     * Event listener checking if the project is still running.
     */
    private projectStopped() {
        return this._projectRunning = false;
    }

    /**
     * Checks if the given event list contains actionEvents, i.e events other than WaitEvents.
     * @param events the event list to check.
     */
    private hasActionEvents(events: List<ScratchEvent>) {
        return events.filter(event => !(event instanceof WaitEvent)).size() > 0;
    }

    public resetState(): void {
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
            const x = this._initialState[targetsKey]["x"];
            const y = this._initialState[targetsKey]["y"];
            this._vm.runtime.targets[targetsKey].setXY(x, y, true, true);
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
