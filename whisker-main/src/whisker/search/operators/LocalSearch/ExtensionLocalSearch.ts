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

import {Randomness} from '../../../utils/Randomness';
import {TestChromosome} from "../../../testcase/TestChromosome";
import {WaitEvent} from "../../../testcase/events/WaitEvent";
import {Container} from "../../../utils/Container";
import {EventAndParameters, ExecutionTrace} from "../../../testcase/ExecutionTrace";
import {LocalSearch} from "./LocalSearch";
import Runtime from "scratch-vm/src/engine/runtime";
import {TypeTextEvent} from "../../../testcase/events/TypeTextEvent";
import {ScratchEvent} from "../../../testcase/events/ScratchEvent";
import {ScratchEventExtractor} from "../../../testcase/ScratchEventExtractor";
import Arrays from "../../../utils/Arrays";
import {EventSelector} from "../../../testcase/EventSelector";
import VMWrapper = require("../../../../vm/vm-wrapper.js");


export class ExtensionLocalSearch extends LocalSearch<TestChromosome> {

    /**
     * Collects the chromosomes, the extension local search has already been applied upon. This helps us to prevent
     * wasting time by not applying the local search on the same chromosome twice.
     */
    private readonly _originalChromosomes: TestChromosome[] = [];

    /**
     * Random number generator.
     */
    private readonly _random = Randomness.getInstance();

    /**
     * Probability of selecting a new Event, if one is encountered, during the ExtensionLocalSearch operation.
     */
    private readonly _newEventProbability: number

    /**
     * Constructs a new LocalSearch object.
     * @param vmWrapper the vmWrapper containing the Scratch-VM.
     * @param eventExtractor obtains the currently available set of events.
     * @param eventSelector determines which event selector is used.
     * @param probability defines the probability of applying the concrete LocalSearch operator.
     * @param newEventProbability determines the probability of selecting a new event during the local search algorithm.
     */
    constructor(vmWrapper: VMWrapper, eventExtractor: ScratchEventExtractor, eventSelector: EventSelector,
                probability: number, newEventProbability: number) {
        super(vmWrapper, eventExtractor, eventSelector, probability);
        this._newEventProbability = newEventProbability;
    }

    /**
     * Determines whether local search can be applied to this chromosome.
     * This is the case if the chromosome can actually discover previously uncovered blocks.
     * @param chromosome the chromosome local search should be applied to
     * @return boolean whether the local search operator can be applied to the given chromosome.
     */
    isApplicable(chromosome: TestChromosome): boolean {
        return chromosome.getGenes().length < Container.config.searchAlgorithmProperties['chromosomeLength'] && // // FIXME: unsafe access
            this._originalChromosomes.indexOf(chromosome) < 0 && this.calculateFitnessValues(chromosome).length > 0;
    }

    /**
     * Applies the Extension local search operator which extends the chromosome's gene with WaitEvents,
     * in order to cover blocks reachable by waiting.
     * @param chromosome the chromosome that should be modified by the Extension local search operator.
     * @returns the modified chromosome wrapped in a Promise.
     */
    async apply(chromosome: TestChromosome): Promise<TestChromosome> {
        this._originalChromosomes.push(chromosome);

        // Save the initial trace and coverage of the chromosome to recover them later.
        const trace = chromosome.trace.clone();
        const coverage = new Set<string>(chromosome.coverage);

        // Apply extension local search.
        const newCodons: number[] = [];
        const events: EventAndParameters[] = [];
        newCodons.push(...chromosome.getGenes());
        Randomness.seedScratch();
        this._vmWrapper.start();

        // Execute the original codons to obtain the state of the VM after executing the original chromosome.
        await this._executeGenes(newCodons, events);

        // Now extend the codons of the original chromosome to increase coverage.
        const lastImprovedResults = await this._extendGenes(newCodons, events, chromosome);
        this._vmWrapper.end();
        this._testExecutor.resetState();

        // Create the chromosome resulting from local search.
        const newChromosome = chromosome.cloneWith(newCodons);
        newChromosome.trace = new ExecutionTrace(this._vmWrapper.vm.runtime.traceInfo.tracer.traces, [...events]);
        newChromosome.coverage = this._vmWrapper.vm.runtime.traceInfo.tracer.coverage as Set<string>;
        newChromosome.lastImprovedCoverageCodon = lastImprovedResults.lastImprovedCodon;
        newChromosome.lastImprovedTrace = lastImprovedResults.lastImprovedTrace;

        // Reset the trace and coverage of the original chromosome
        chromosome.trace = trace;
        chromosome.coverage = coverage;
        return newChromosome;
    }

    /**
     * Executes the given codons and saves the selected events.
     * @param codons the codons to execute.
     * @param events the list of events saving the selected events including its parameters.
     */
    private async _executeGenes(codons: number[], events: EventAndParameters[]): Promise<void> {
        let numCodon = 0;
        while (numCodon < codons.length) {
            const availableEvents = this._eventExtractor.extractEvents(this._vmWrapper.vm);
            if (availableEvents.length === 0) {
                console.log("Whisker-Main: No events available for project.");
                break;
            }
            // Selects and sends the next Event ot the VM.
            numCodon = await this._testExecutor.selectAndSendEvent(codons, numCodon, availableEvents, events);
        }
    }

    /**
     * Extends the chromosome's codon with WaitEvents to increase its block coverage. Waits are appended until either
     * no more blocks can be reached by waiting or until the maximum codon size has been reached.
     * @param codons the codons which should be extended by waits.
     * @param events the list of events saving the selected events including its parameters.
     * @param chromosome the chromosome carrying the trace used to calculate fitness values of uncovered blocks
     */
    private async _extendGenes(codons: number[], events: EventAndParameters[],
                               chromosome: TestChromosome): Promise<{ lastImprovedCodon: number, lastImprovedTrace: ExecutionTrace }> {
        const upperLengthBound = Container.config.searchAlgorithmProperties['chromosomeLength']; // FIXME: unsafe access
        const lowerCodonValueBound = Container.config.searchAlgorithmProperties['integerRange'].min;
        const upperCodonValueBound = Container.config.searchAlgorithmProperties['integerRange'].max;
        let fitnessValues = this.calculateFitnessValues(chromosome);
        let fitnessValuesUnchanged = 0;
        let done = false;
        let totalCoverageSize = chromosome.coverage.size;
        let lastImprovedCodon = chromosome.lastImprovedCoverageCodon;
        let lastImprovedTrace: ExecutionTrace

        // Monitor if the Scratch-VM is still running. If it isn't, stop adding Waits as they have no effect.
        const _onRunStop = this.projectStopped.bind(this);
        this._vmWrapper.vm.on(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this._projectRunning = true;
        let extendWait = false;
        let previousEvents:ScratchEvent[] = [];
        while (codons.length < upperLengthBound && this._projectRunning && !done) {
            const availableEvents = this._eventExtractor.extractEvents(this._vmWrapper.vm);

            // If we have no events available, we can only stop.
            if (availableEvents.length === 0) {
                console.log("Whisker-Main: No events available for project.");
                break;
            }

            // Check the eventLandscape, especially if we found a new event or a typeTextEvent.
            const previousEventIds = previousEvents.map(event => event.stringIdentifier());
            const newEvents = availableEvents.filter(event => !previousEventIds.includes(event.stringIdentifier()));
            const typeTextEvents = availableEvents.filter(event => event instanceof TypeTextEvent);

            // Check if we have a typeTextEvent; if yes apply it!
            if (typeTextEvents.length !== 0) {
                const typeTextEvent = this._random.pick(typeTextEvents);
                const typeEventCodon = Arrays.findElement(availableEvents, typeTextEvent);
                codons.push(typeEventCodon);
                events.push(new EventAndParameters(typeTextEvent, []));
                await typeTextEvent.apply();
                extendWait = false;
            }

            // Check if we found at least one new event compared to the previous iteration, if yes apply it!
            else if (previousEvents.length > 0 && newEvents.length > 0
                && this._random.nextDouble() < this._newEventProbability) {
                // Choose random event amongst the newly found ones and determine its codon value.
                const chosenNewEvent = this._random.pick(newEvents);
                const newEventCodon = Arrays.findElement(availableEvents, chosenNewEvent);
                codons.push(newEventCodon);

                // Check if we have to generate parameters for the chosen event.
                if (chosenNewEvent.numSearchParameter() > 0) {
                    const parameter: number[] = [];
                    for (let i = 0; i < chosenNewEvent.numSearchParameter(); i++) {
                        parameter.push(this._random.nextInt(lowerCodonValueBound, upperCodonValueBound + 1));
                    }
                    chosenNewEvent.setParameter(parameter, "codon");
                    events.push(new EventAndParameters(chosenNewEvent, parameter));
                    codons.push(...parameter);
                } else {
                    events.push(new EventAndParameters(chosenNewEvent, []));
                }
                await chosenNewEvent.apply();
                extendWait = false;
            }

            // In case we neither found a typeTextEvent nor a new event, extend an existing wait or add a new WaitEvent.
            else {
                if (extendWait) {
                    // Fetch the old waitDuration and add the upper bound to it.
                    let newWaitDuration = codons[(codons.length - 1)] + Container.config.getWaitStepUpperBound();

                    // Check if we have reached the maximum codon value. If so force the localSearch operator to
                    // crate a new WaitEvent.
                    if (newWaitDuration > upperCodonValueBound) {
                        newWaitDuration = upperCodonValueBound;
                        extendWait = false;
                    }

                    // Replace the old codonValue with the new duration; Construct the WaitEvent with the new
                    // duration; Replace the old Event in the events list of the chromosome with the new one.
                    codons[codons.length - 1] = newWaitDuration;
                    const waitEvent = new WaitEvent(newWaitDuration);
                    events[events.length -1] = new EventAndParameters(waitEvent, [newWaitDuration]);
                    await waitEvent.apply();
                } else {
                    // Find the integer representing a WaitEvent in the availableEvents list and add it to the list of codons.
                    const waitEventCodon = availableEvents.findIndex(event => event instanceof WaitEvent);
                    codons.push(waitEventCodon);

                    // Set the waitDuration to the specified upper bound.
                    // Always using the same waitDuration ensures determinism within the local search.
                    const waitDurationCodon = Container.config.getWaitStepUpperBound();
                    codons.push(Container.config.getWaitStepUpperBound());

                    // Send the waitEvent with the specified stepDuration to the VM
                    const waitEvent = new WaitEvent(waitDurationCodon);
                    events.push(new EventAndParameters(waitEvent, [waitDurationCodon]));
                    await waitEvent.apply();
                    extendWait = true;
                }
            }

            // Store previous events.
            previousEvents = Arrays.clone(availableEvents);

            // Set the trace and coverage for the current state of the VM to properly calculate the fitnessValues.
            chromosome.trace = new ExecutionTrace(this._vmWrapper.vm.runtime.traceInfo.tracer.traces, events);
            chromosome.coverage = this._vmWrapper.vm.runtime.traceInfo.tracer.coverage as Set<string>;
            const newFitnessValues = this.calculateFitnessValues(chromosome);

            // Reset counter if we obtained smaller fitnessValues, or keep covering more and more blocks
            if (newFitnessValues.length < fitnessValues.length ||
                newFitnessValues.some((value, index) => value < fitnessValues[index])) {
                fitnessValuesUnchanged = 0;
            }
            // Otherwise increase the counter.
            else {
                fitnessValuesUnchanged++;
            }

            // If we see no improvements after adding three Waits, or if we have covered all blocks we stop.
            if (fitnessValuesUnchanged >= 3 || newFitnessValues.length === 0) {
                done = true;
            }

            // Check if the sent event increased the block coverage. If so update the state up to this point in time.
            const currentCoverage = this._vmWrapper.vm.runtime.traceInfo.tracer.coverage as Set<string>;
            if (currentCoverage.size > totalCoverageSize) {
                lastImprovedCodon = codons.length;
                totalCoverageSize = currentCoverage.size;
                lastImprovedTrace = new ExecutionTrace(this._vmWrapper.vm.runtime.traceInfo.tracer.traces, [...events]);
            }
            fitnessValues = newFitnessValues;
        }
        return {lastImprovedCodon, lastImprovedTrace};
    }

    /**
     * Gathers the fitness value for each uncovered block. This helps us in deciding if it makes sense adding
     * additional waits.
     * @param chromosome the chromosome carrying the block trace used to calculate the fitness value
     * @return Returns an array of discovered fitness values for uncovered blocks only.
     */
    private calculateFitnessValues(chromosome: TestChromosome): number[] {
        const fitnessValues: number[] = []
        // Flush fitnessCache to enforce a recalculation of the fitness values.
        chromosome.flushFitnessCache();
        for (const fitnessFunction of this._algorithm.getFitnessFunctions()) {
            // Only look at fitnessValues originating from uncovered blocks AND
            // blocks not already covered by previous chromosomes modified by local search.
            const fitness = chromosome.getFitness(fitnessFunction);
            if (!fitnessFunction.isOptimal(fitness)) {
                fitnessValues.push(chromosome.getFitness(fitnessFunction));
            }
        }
        return fitnessValues;
    }

    /**
     * Determines whether the Extension local search operator improved the original chromosome.
     * @param originalChromosome the chromosome Extension local search has been applied to.
     * @param modifiedChromosome the resulting chromosome after Extension local search has been applied to the original.
     * @return boolean whether the local search operator improved the original chromosome.
     */
    hasImproved(originalChromosome: TestChromosome, modifiedChromosome: TestChromosome): boolean {
        return originalChromosome.coverage.size < modifiedChromosome.coverage.size;
    }
}
