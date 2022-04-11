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
import {ScratchEvent} from "./events/ScratchEvent";
import {WaitEvent} from "./events/WaitEvent";
import {StatisticsCollector} from "../utils/StatisticsCollector";
import {EventObserver} from "./EventObserver";
import {Randomness} from "../utils/Randomness";
import {ScratchEventExtractor} from "./ScratchEventExtractor";
import Runtime from "scratch-vm/src/engine/runtime";
import {EventSelector} from "./EventSelector";
import VMWrapper = require("../../vm/vm-wrapper.js");
import {Container} from "../utils/Container";
import {VariableLengthConstrainedChromosomeMutation} from "../integerlist/VariableLengthConstrainedChromosomeMutation";
import {ReductionLocalSearch} from "../search/operators/LocalSearch/ReductionLocalSearch";
import cloneDeep from "lodash.clonedeep";


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

    async executeTests(tests: TestChromosome[]): Promise<void> {
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
        const events: EventAndParameters[] = [];

        Randomness.seedScratch();
        const _onRunStop = this.projectStopped.bind(this);
        this._vm.on(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this._projectRunning = true;
        this._vmWrapper.start();
        let availableEvents = this._eventExtractor.extractEvents(this._vm);

        let numCodon = 0;
        const codons = testChromosome.getGenes();
        let fitnessValues: number[];
        let targetFitness = Number.MAX_SAFE_INTEGER;

        const startTime = Date.now();
        while (numCodon < codons.length && (this._projectRunning || this.hasActionEvents(availableEvents))) {
            availableEvents = this._eventExtractor.extractEvents(this._vm);
            if (availableEvents.length === 0) {
                console.log("Whisker-Main: No events available for project.");
                break;
            }

            // Select and send the next Event to the VM & calculate the new fitness values.
            numCodon = await this.selectAndSendEvent(codons, numCodon, availableEvents, events);

            // Set the trace and coverage for the current state of the VM to properly calculate the fitnessValues.
            testChromosome.trace = new ExecutionTrace(this._vmWrapper.vm.runtime.traceInfo.tracer.traces, events);
            testChromosome.coverage = this._vmWrapper.vm.runtime.traceInfo.tracer.coverage as Set<string>;

            // Check if we came closer to cover a specific block. This is only makes sense when using a SingleObjective
            // focused Algorithm like MIO.
            if (testChromosome.targetFitness) {
                // Enforce the recalculation of the fitness value by deleting the cached value.
                testChromosome.deleteCacheEntry(testChromosome.targetFitness);
                const currentFitness = testChromosome.getFitness(testChromosome.targetFitness);
                if (testChromosome.targetFitness.compare(currentFitness, targetFitness) > 0) {
                    targetFitness = currentFitness;
                    testChromosome.lastImprovedFitnessCodon = numCodon;
                }
            }

            // Determine the last improved codon and trace if we require it for further mutation/localSearch operations.
            if (TestExecutor.doRequireLastImprovedCodon(testChromosome)) {
                // If this was the first executed event we have to set up the reference fitnessValues first.
                if (!fitnessValues) {
                    fitnessValues = TestExecutor.calculateUncoveredFitnessValues(testChromosome);
                }
                const newFitnessValues = TestExecutor.calculateUncoveredFitnessValues(testChromosome);


                // Check if the latest execution of the given event has improved overall fitness.
                if (TestExecutor.hasFitnessOfUncoveredStatementsImproved(fitnessValues, newFitnessValues)) {
                    testChromosome.lastImprovedCodon = numCodon;
                    testChromosome.lastImprovedTrace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, [...events]);
                }
                fitnessValues = newFitnessValues;
            }
        }
        const endTime = Date.now() - startTime;

        // Check if the last event had to use a codon from the start of the codon list.
        // Extend the codon list by the required amount of codons by duplicating the first few codons.
        if (numCodon > codons.length) {
            const codonsToDuplicate = numCodon - codons.length;
            codons.push(...codons.slice(0, codonsToDuplicate));
        }

        // Set attributes of the testChromosome after executing its genes.
        testChromosome.trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, events);
        testChromosome.coverage = this._vm.runtime.traceInfo.tracer.coverage as Set<string>;

        this._vmWrapper.end();
        this.resetState();

        StatisticsCollector.getInstance().incrementExecutedTests();
        StatisticsCollector.getInstance().numberFitnessEvaluations++;
        StatisticsCollector.getInstance().updateAverageTestExecutionTime(endTime);

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
        const events: EventAndParameters[] = [];

        const startTime = Date.now();
        while (eventCount < numberOfEvents && (this._projectRunning || this.hasActionEvents(availableEvents))) {
            availableEvents = this._eventExtractor.extractEvents(this._vm);
            if (availableEvents.length === 0) {
                console.log("Whisker-Main: No events available for project.");
                break;
            }

            // Randomly select an event and increase the event count.
            const eventIndex = random.nextInt(0, availableEvents.length);
            randomEventChromosome.getGenes().push(eventIndex);
            const event = availableEvents[eventIndex];
            eventCount++;

            // If the selected event requires additional parameters; select them randomly as well.
            if (event.numSearchParameter() > 0) {
                // args are set in the event itself since the event knows which range of random values makes sense.
                event.setParameter(null, "random");
            }
            events.push(new EventAndParameters(event, event.getParameters()));
            await event.apply();
            StatisticsCollector.getInstance().incrementEventsCount();

            // Send a WaitEvent to the VM
            const waitEvent = new WaitEvent(1);
            events.push(new EventAndParameters(waitEvent, []));
            await waitEvent.apply();

        }
        const endTime = Date.now() - startTime;
        const trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, events);
        randomEventChromosome.coverage = this._vm.runtime.traceInfo.tracer.coverage as Set<string>;
        randomEventChromosome.trace = trace;

        this._vmWrapper.end();
        this.resetState();

        StatisticsCollector.getInstance().incrementExecutedTests();
        StatisticsCollector.getInstance().numberFitnessEvaluations++;
        StatisticsCollector.getInstance().updateAverageTestExecutionTime(endTime);

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
    public async selectAndSendEvent(codons: number[], numCodon: number, availableEvents: ScratchEvent[],
                                    events: EventAndParameters[]): Promise<number> {
        const nextEvent: ScratchEvent = this._eventSelector.selectEvent(codons, numCodon, availableEvents);
        numCodon++;
        const parameters = TestExecutor.getArgs(nextEvent, codons, numCodon);
        nextEvent.setParameter(parameters, "codon");
        events.push(new EventAndParameters(nextEvent, parameters));
        // We subtract 1 since we already consumed the event-codon.
        numCodon += (Container.config.searchAlgorithmProperties['reservedCodons'] - 1);
        this.notify(nextEvent, parameters);
        // Send the chosen Event including its parameters to the VM
        await nextEvent.apply();
        StatisticsCollector.getInstance().incrementEventsCount();

        // Send a WaitEvent to the VM
        const waitEvent = new WaitEvent(1);
        events.push(new EventAndParameters(waitEvent, []));
        await waitEvent.apply();
        return numCodon;
    }

    /**
     * Collects the required parameters for a given event from the list of codons.
     * @param event the event for which parameters should be collected
     * @param codons the list of codons
     * @param codonPosition the starting position from which on codons should be collected as parameters
     */
    private static getArgs(event: ScratchEvent, codons: number[], codonPosition: number): number[] {
        const args = [];
        for (let i = 0; i < event.numSearchParameter(); i++) {
            args.push(codons[codonPosition++ % codons.length]);
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
    private hasActionEvents(events: ScratchEvent[]) {
        return events.filter(event => !(event instanceof WaitEvent)).length > 0;
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
            this._vm.runtime.targets[targetsKey]["drawableID"] = this._initialState[targetsKey]["drawableID"];
            this._vm.runtime.targets[targetsKey]["effects"] = Object.assign({}, this._initialState[targetsKey]["effects"]);
            this._vm.runtime.targets[targetsKey]["videoState"] = this._initialState[targetsKey]["videoState"];
            this._vm.runtime.targets[targetsKey]["videoTransparency"] = this._initialState[targetsKey]["videoTransparency"];
            this._vm.runtime.targets[targetsKey]["visible"] = this._initialState[targetsKey]["visible"];
            this._vm.runtime.targets[targetsKey]["volume"] = this._initialState[targetsKey]["volume"];
            const x = this._initialState[targetsKey]["x"];
            const y = this._initialState[targetsKey]["y"];
            this._vm.runtime.targets[targetsKey].setXY(x, y, true, true);
            this._vm.runtime.targets[targetsKey]["variables"] = this._initialState[targetsKey]["variables"];
        }

        this._vmWrapper.inputs.resetMouse();
        this._vmWrapper.inputs.resetKeyboard();
    }

    private recordInitialState() {
        for (const targetsKey in this._vm.runtime.targets) {
            this._initialState[targetsKey] = {
                name: this._vm.runtime.targets[targetsKey].sprite['name'],
                direction: this._vm.runtime.targets[targetsKey]["direction"],
                currentCostume: this._vm.runtime.targets[targetsKey]["currentCostume"],
                draggable: this._vm.runtime.targets[targetsKey]["draggable"],
                dragging: this._vm.runtime.targets[targetsKey]["dragging"],
                drawableID: this._vm.runtime.targets[targetsKey]['drawableID'],
                effects: Object.assign({}, this._vm.runtime.targets[targetsKey]["effects"]),
                videoState: this._vm.runtime.targets[targetsKey]["videoState"],
                videoTransparency: this._vm.runtime.targets[targetsKey]["videoTransparency"],
                visible: this._vm.runtime.targets[targetsKey]["visible"],
                volume: this._vm.runtime.targets[targetsKey]["volume"],
                x: this._vm.runtime.targets[targetsKey]["x"],
                y: this._vm.runtime.targets[targetsKey]["y"],
                variables: cloneDeep(this._vm.runtime.targets[targetsKey]["variables"])
            };
        }
    }

    /**
     * Determined whether we have to save the last improved codon.
     * @param chromosome the chromosome holding its mutation operator.
     * @returns boolean determining whether we have to determine the last improved codon.
     */
    public static doRequireLastImprovedCodon(chromosome: TestChromosome): boolean {
        return chromosome.getMutationOperator() instanceof VariableLengthConstrainedChromosomeMutation ||
            Container.config.getLocalSearchOperators().some(operator => operator instanceof ReductionLocalSearch);
    }

    /**
     * Gathers the fitness value for each uncovered block. This can be used to trace the execution back up to which
     * point no further improvement has been seen.
     * @param chromosome the chromosome carrying the block trace used to calculate the fitness values.
     * @return number[] representing the array of fitness values for uncovered blocks only.
     */
    public static calculateUncoveredFitnessValues(chromosome: TestChromosome): number[] {
        // Flush fitnessCache to enforce a recalculation of the fitness values.
        chromosome.flushFitnessCache();
        const fitnessValues: number[] = [];
        for (const fitnessFunction of Container.statementFitnessFunctions) {
            // Only look at fitnessValues originating from uncovered blocks.
            const fitness = chromosome.getFitness(fitnessFunction);
            if (!fitnessFunction.isOptimal(fitness)) {
                fitnessValues.push(chromosome.getFitness(fitnessFunction));
            }
        }
        return fitnessValues;
    }

    /**
     * Compares fitness values between oldFitnessValues and newFitnessValues and determined whether we see any
     * improvement within the newFitnessValues.
     * @param oldFitnessValues the old fitness values used as a reference point
     * @param newFitnessValues new fitness values which might show some improvements.
     */
    public static hasFitnessOfUncoveredStatementsImproved(oldFitnessValues: number[], newFitnessValues: number[]): boolean {
        return newFitnessValues.length < oldFitnessValues.length ||
            newFitnessValues.some((value, index) => value < oldFitnessValues[index]);
    }
}
