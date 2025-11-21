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
import {CoverageTrace, EventAndParameters, ExecutionTrace} from "./ExecutionTrace";
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
import {DragSpriteEvent} from "./events/DragSpriteEvent";
import logger = require('../../util/logger');


export class TestExecutor {

    private readonly _vm: VirtualMachine;
    private _vmWrapper: VMWrapper
    private _eventExtractor: ScratchEventExtractor;
    private readonly _eventSelector: EventSelector;
    private _eventObservers: EventObserver[] = [];
    private _projectRunning: boolean;
    private readonly _initialState = {};


    constructor(vmWrapper: VMWrapper, eventExtractor: ScratchEventExtractor, eventSelector: EventSelector) {
        this._vmWrapper = vmWrapper;
        this._vm = vmWrapper.vm;
        this._eventExtractor = eventExtractor;
        this._eventSelector = eventSelector;
        this._initialState = this._vmWrapper._recordInitialState();
    }

    /**
     * Executes a chromosome by selecting events according to the chromosome's defined genes.
     * @param testChromosome the testChromosome that should be executed.
     */
    async execute(testChromosome: TestChromosome): Promise<ExecutionTrace> {
        const events: EventAndParameters[] = [];

        Randomness.seedScratch(this._vm);
        const _onRunStop = this.projectStopped.bind(this);
        this._vm.on(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this._projectRunning = true;
        await this._vmWrapper.start();
        let availableEvents = this._eventExtractor.extractEvents(this._vm);

        let numCodon = 0;
        const codons = testChromosome.getGenes();
        let fitnessValues: number[];
        let targetFitness = Number.MAX_SAFE_INTEGER;

        const startTime = Date.now();
        while (numCodon < codons.length && (this._projectRunning || this.hasActionEvents(this._eventExtractor.extractEvents(this._vm)))) {
            availableEvents = this._eventExtractor.extractEvents(this._vm);
            if (availableEvents.length === 0) {
                logger.warn("No events available for project.");
                break;
            }

            // Select and send the next Event to the VM & calculate the new fitness values.
            numCodon = await this.selectAndSendEvent(codons, numCodon, availableEvents, events);

            // Set the trace and coverage for the current state of the VM to properly calculate the fitnessValues.
            const coverageTrace: CoverageTrace = this._vm.getTraces();
            testChromosome.trace = new ExecutionTrace(coverageTrace.branchDistances, events);
            testChromosome.coverage = coverageTrace.blockCoverage;
            testChromosome.branchCoverage = coverageTrace.branchCoverage;

            // Check if we came closer to cover a specific block.
            // This only makes sense when using a SingleObjective focused Algorithm like MIO.
            if (testChromosome.targetObjective) {
                // Enforce the recalculation of the fitness value by deleting the cached value.
                testChromosome.deleteCacheEntry(testChromosome.targetObjective);
                const currentFitness = await testChromosome.getFitness(testChromosome.targetObjective);
                if (testChromosome.targetObjective.compare(currentFitness, targetFitness) > 0) {
                    targetFitness = currentFitness;
                    testChromosome.lastImprovedCodon = numCodon;
                }
            }

            // Determine the last improved codon and trace if we require it for further mutation/localSearch operations.
            if (TestExecutor.doRequireLastImprovedCodon(testChromosome)) {
                // If this was the first executed event, we have to set up the reference fitnessValues first.
                if (!fitnessValues) {
                    fitnessValues = await TestExecutor.calculateUncoveredFitnessValues(testChromosome);
                }
                const newFitnessValues = await TestExecutor.calculateUncoveredFitnessValues(testChromosome);


                // Check if the latest execution of the given event has improved overall fitness.
                if (TestExecutor.hasFitnessOfUncoveredObjectivesImproved(fitnessValues, newFitnessValues)) {
                    testChromosome.lastImprovedCodon = numCodon;
                    testChromosome.lastImprovedTrace = new ExecutionTrace(this._vm.getTraces().branchDistances, [...events]);
                }
                fitnessValues = newFitnessValues;
            }
        }
        const endTime = Date.now() - startTime;

        // Check if the last event had to use a codon from the start of the codon list.
        // Extend the codon list by the required number of codons by duplicating the first few codons.
        if (numCodon > codons.length) {
            const codonsToDuplicate = numCodon - codons.length;
            codons.push(...codons.slice(0, codonsToDuplicate));
        }

        // Set attributes of the testChromosome after executing its genes.
        const coverageTrace: CoverageTrace = this._vm.getTraces();
        testChromosome.trace = new ExecutionTrace(coverageTrace.branchDistances, events);
        testChromosome.coverage = coverageTrace.blockCoverage;
        testChromosome.branchCoverage = coverageTrace.branchCoverage;

        this._vmWrapper.end();
        this._vm.removeListener(Runtime.PROJECT_RUN_STOP, _onRunStop);
        await this._vmWrapper.resetProject(this._initialState);

        await this.updateStatistics(endTime, testChromosome);

        return testChromosome.trace;
    }

    /**
     * Executes a saved event trace.
     * @param chromosome the chromosome hosting the event trace.
     * @returns executed trace.
     */
    async executeEventTrace(chromosome: TestChromosome): Promise<ExecutionTrace> {
        Randomness.seedScratch(this._vm);
        const _onRunStop = this.projectStopped.bind(this);
        this._vm.on(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this._projectRunning = true;
        await this._vmWrapper.start();
        const eventAndParams = chromosome.trace.events;
        for (const eventParam of eventAndParams) {
            if (!this._projectRunning) {
                break;
            }
            const nextEvent = eventParam.event;
            const parameters = eventParam.parameters;
            this.notify(nextEvent, parameters);
            await nextEvent.apply();
            this.notifyAfter(nextEvent, parameters);
        }

        // Set attributes of the testChromosome after executing its genes.
        const coverageTrace: CoverageTrace = this._vm.getTraces();
        chromosome.trace = new ExecutionTrace(coverageTrace.branchDistances, chromosome.trace.events);
        chromosome.coverage = coverageTrace.blockCoverage;
        chromosome.branchCoverage = coverageTrace.branchCoverage;

        this._vmWrapper.end();
        await this._vmWrapper.resetProject(this._initialState);
        this._vm.removeListener(Runtime.PROJECT_RUN_STOP, _onRunStop);

        return chromosome.trace;
    }

    /**
     * Randomly executes events selected from the available event Set.
     * @param randomEventChromosome the chromosome in which the executed trace will be saved in.
     * @param numberOfEvents the number of events that should be executed.
     */
    async executeRandomEvents(randomEventChromosome: TestChromosome, numberOfEvents: number): Promise<ExecutionTrace> {
        Randomness.seedScratch(this._vm);
        const _onRunStop = this.projectStopped.bind(this);
        this._vm.on(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this._projectRunning = true;
        await this._vmWrapper.start();
        let availableEvents = this._eventExtractor.extractEvents(this._vm);
        let eventCount = 0;
        const random = Randomness.getInstance();
        const events: EventAndParameters[] = [];

        const startTime = Date.now();
        while (eventCount < numberOfEvents && (this._projectRunning || this.hasActionEvents(this._eventExtractor.extractEvents(this._vm)))) {
            availableEvents = this._eventExtractor.extractEvents(this._vm);
            if (availableEvents.length === 0) {
                logger.warn("No events available for project.");
                break;
            }

            // Disallow DragSpriteEvents as first events since they modify the attributes of sprites directly and thus
            // will change the sprite behaviour before the first blocks have been executed.
            // This may make DragSpriteEvents sent as first events obsolete since initialisation code in green flag
            // scripts will reset the changed sprite position.
            if (eventCount === 0) {
                availableEvents = availableEvents.filter(event => !(event instanceof DragSpriteEvent));
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

        // Set attributes of the testChromosome after executing its genes.
        const coverageTrace: CoverageTrace = this._vm.getTraces();
        randomEventChromosome.trace = new ExecutionTrace(coverageTrace.branchDistances, events);
        randomEventChromosome.coverage = coverageTrace.blockCoverage;
        randomEventChromosome.branchCoverage = coverageTrace.branchCoverage;

        this._vmWrapper.end();
        this._vm.removeListener(Runtime.PROJECT_RUN_STOP, _onRunStop);
        await this._vmWrapper.resetProject(this._initialState);

        await this.updateStatistics(endTime, randomEventChromosome);

        return randomEventChromosome.trace;
    }

    /**
     * Updates the search algorithm statistics at the end of a test execution.
     * @param executionTime The test execution time.
     * @param chromosome The executed test chromosome.
     */
    private async updateStatistics(executionTime: number, chromosome: TestChromosome): Promise<void> {
        StatisticsCollector.getInstance().incrementExecutedTests();
        StatisticsCollector.getInstance().evaluations++;
        StatisticsCollector.getInstance().updateAverageTestExecutionTime(executionTime);
        await StatisticsCollector.getInstance().updateStatementCoverage(chromosome);
        await StatisticsCollector.getInstance().updateBranchCoverage(chromosome);
        StatisticsCollector.getInstance().computeStatementCoverage();
        StatisticsCollector.getInstance().computeBranchCoverage();
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
        // Disallow DragSpriteEvents as first events since they modify the attributes of sprites directly and thus
        // will change the sprite behaviour before the first blocks have been executed.
        // This may make DragSpriteEvents sent as first events obsolete since initialisation code in green flag
        // scripts will reset the changed sprite position.
        if (numCodon === 0) {
            availableEvents = availableEvents.filter(e => !(e instanceof DragSpriteEvent));
        }

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

        this.notifyAfter(nextEvent, parameters);

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

    private notify(event: ScratchEvent, args: number[]): void {
        for (const observer of this._eventObservers) {
            observer.update(event, args);
        }
    }

    private notifyAfter(event: ScratchEvent, args: number[]): void {
        for (const observer of this._eventObservers) {
            observer.updateAfter(event, args);
        }
    }

    /**
     * Event listener checking if the project is still running.
     */
    private projectStopped() {
        return this._projectRunning = false;
    }

    /**
     * Checks if the given event list contains actionEvents, i.e. events other than WaitEvents.
     * @param events the event list to check.
     */
    private hasActionEvents(events: ScratchEvent[]) {
        return events.filter(event => !(event instanceof WaitEvent)).length > 0;
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
    public static async calculateUncoveredFitnessValues(chromosome: TestChromosome): Promise<number[]> {
        // Flush fitnessCache to enforce a recalculation of the fitness values.
        chromosome.flushFitnessCache();
        const fitnessValues: number[] = [];
        for (const fitnessFunction of Container.coverageObjectives) {
            // Only look at fitnessValues originating from uncovered blocks.
            const fitness = await chromosome.getFitness(fitnessFunction);
            if (!await fitnessFunction.isOptimal(fitness)) {
                fitnessValues.push(await chromosome.getFitness(fitnessFunction));
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
    public static hasFitnessOfUncoveredObjectivesImproved(oldFitnessValues: number[], newFitnessValues: number[]): boolean {
        return newFitnessValues.length < oldFitnessValues.length ||
            newFitnessValues.some((value, index) => value < oldFitnessValues[index]);
    }

    get initialState(): Record<string, unknown> {
        return this._initialState;
    }
}
