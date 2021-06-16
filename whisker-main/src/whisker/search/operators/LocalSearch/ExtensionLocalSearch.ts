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

import {List} from '../../../utils/List';
import {Randomness} from '../../../utils/Randomness';
import {TestChromosome} from "../../../testcase/TestChromosome";
import {seedScratch} from "../../../../util/random";
import {WaitEvent} from "../../../testcase/events/WaitEvent";
import {ScratchEventExtractor} from "../../../testcase/ScratchEventExtractor";
import VMWrapper = require("../../../../vm/vm-wrapper.js")
import {Container} from "../../../utils/Container";
import {ExecutionTrace} from "../../../testcase/ExecutionTrace";
import {ScratchEvent} from "../../../testcase/events/ScratchEvent";
import {LocalSearch} from "./LocalSearch";
import {TestExecutor} from "../../../testcase/TestExecutor";
import {SearchAlgorithm} from "../../SearchAlgorithm";
import Runtime from "scratch-vm/src/engine/runtime";


export class ExtensionLocalSearch implements LocalSearch<TestChromosome> {

    /**
     * The vmWrapper wrapped around the Scratch-VM.
     */
    private _vmWrapper: VMWrapper;

    /**
     * The ScratchEventExtractor used to obtain the currently available Events.
     */
    private readonly _eventExtractor: ScratchEventExtractor;

    /**
     * The TestExecutor responsible for executing codons and resetting the state of the VM.
     */
    private readonly _testExecutor: TestExecutor;

    /**
     * The relative amount of depleted resources, determining at which point in time local search should be applied.
     */
    private readonly _depletedResourcesThreshold: number

    /**
     * Defines, in terms of generations, how often the operator is used.
     * @private
     */
    private readonly _generationInterval: number

    /**
     * The chromosome's upper bound of the gene size.
     */
    private readonly _upperLengthBound: number;

    /**
     * Collects the chromosomes, the extension local search has already been applied upon. This helps us to prevent
     * wasting time on applying the local search on the same chromosome twice.
     */
    private readonly _modifiedChromosomes: TestChromosome[] = [];

    /**
     * Collects the chromosomes, the extension local search has already been applied upon. This helps us to prevent
     * wasting time on applying the local search on the same chromosome twice.
     */
    private readonly _targetedChromosomes = new List<TestChromosome>();

    /**
     * The algorithm calling the extension search operator.
     */
    private _algorithm: SearchAlgorithm<TestChromosome>;

    /**
     * Observes if the the Scratch-VM is still running
     */
    private _projectRunning: boolean;

    /**
     * Constructs a new ExtensionLocalSearch object.
     * @param vmWrapper the vmWrapper containing the Scratch-VM.
     * @param eventExtractor the eventExtractor used to obtain the currently available set of events.
     * @param depletedResourcesThreshold the relative amount of depleted resources after which
     * this local search operator gets used.
     * @param generationInterval defines, in terms of generations, how often the operator is used.
     */
    constructor(vmWrapper: VMWrapper, eventExtractor: ScratchEventExtractor, depletedResourcesThreshold: number,
                generationInterval: number) {
        this._vmWrapper = vmWrapper;
        this._eventExtractor = eventExtractor;
        this._testExecutor = new TestExecutor(vmWrapper, eventExtractor);
        this._depletedResourcesThreshold = depletedResourcesThreshold;
        this._generationInterval = generationInterval;
        this._upperLengthBound = Container.config.getSearchAlgorithmProperties().getChromosomeLength();
    }

    /**
     * Determines whether local search can be applied to this chromosome. This is the case if we have depleted the
     * specified resource budget and if the chromosome can increase its coverage simply by waiting.
     * @param chromosome the chromosome local search should be applied to
     * @param depletedResources determines the amount of depleted resources after which local search will be applied
     * @return boolean whether the local search operator can be applied to the given chromosome.
     */
    isApplicable(chromosome: TestChromosome, depletedResources: number): boolean {
        return this._depletedResourcesThreshold < depletedResources &&
            depletedResources < 1 &&
            this._algorithm.getNumberOfIterations() % this._generationInterval === 0 &&
            !this._targetedChromosomes.contains(chromosome) &&
            this.calculateFitnessValues(chromosome).length > 0;
    }

    /**
     * Applies the Extension local search operator which extends the chromosome's gene with WaitEvents,
     * in order to cover blocks reachable by waiting.
     * @param chromosome the chromosome that should be modified by the Extension local search operator.
     * @returns the modified chromosome wrapped in a Promise.
     */
    async apply(chromosome: TestChromosome): Promise<TestChromosome> {
        this._targetedChromosomes.add(chromosome);
        console.log("Start Extension Local Search");

        // Save the initial trace and coverage of the chromosome to recover them later.
        const trace = chromosome.trace;
        const coverage = chromosome.coverage;

        // Apply extension local search.
        const newCodons = new List<number>();
        const events = new List<[ScratchEvent, number[]]>();
        newCodons.addList(chromosome.getGenes());
        seedScratch(String(Randomness.getInitialSeed()));
        this._vmWrapper.start();

        // Execute the original codons to obtain the state of the VM after executing the original chromosome.
        await this._executeGenes(newCodons, events);

        // Now extend the codons of the original chromosome to increase coverage.
        await this._extendGenes(newCodons, events, chromosome);
        this._vmWrapper.end();
        this._testExecutor.resetState();

        // Create the chromosome resulting from local search.
        const newChromosome = chromosome.cloneWith(newCodons);
        newChromosome.trace = new ExecutionTrace(this._vmWrapper.vm.runtime.traceInfo.tracer.traces, events);
        newChromosome.coverage = this._vmWrapper.vm.runtime.traceInfo.tracer.coverage as Set<string>;
        this._modifiedChromosomes.push(newChromosome);

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
    private async _executeGenes(codons: List<number>, events: List<[ScratchEvent, number[]]>): Promise<void> {
        let numCodon = 0;
        while (numCodon < codons.size()) {
            const availableEvents = this._eventExtractor.extractEvents(this._vmWrapper.vm);
            if (availableEvents.isEmpty()) {
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
    private async _extendGenes(codons: List<number>, events: List<[ScratchEvent, number[]]>,
                               chromosome: TestChromosome): Promise<void> {
        let fitnessValues = this.calculateFitnessValues(chromosome);
        let fitnessValuesUnchanged = 0;
        const cfgMarker = 0.5;
        let done = false;
        const _onRunStop = this.projectStopped.bind(this);
        this._vmWrapper.vm.on(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this._projectRunning = true;
        while (codons.size() < this._upperLengthBound && this._projectRunning && !done) {
            const availableEvents = this._eventExtractor.extractEvents(this._vmWrapper.vm);
            if (availableEvents.isEmpty()) {
                console.log("Whisker-Main: No events available for project.");
                break;
            }
            // Find the integer representing a WaitEvent in the availableEvents list and add it to the list of codons.
            const waitEventCodon = availableEvents.findIndex(event => event instanceof WaitEvent);
            codons.add(waitEventCodon);
            // Select a waitDuration randomly and add it to the list of codons.
            const waitDurationCodon = Container.config.getWaitStepUpperBound();
            codons.add(waitDurationCodon);

            // Send the waitEvent with the specified stepDuration to the VM
            const waitEvent = new WaitEvent(waitDurationCodon);
            events.add([waitEvent, [waitDurationCodon]]);
            await waitEvent.apply();

            // Set the trace for the current state of the VM to properly calculate the fitnessValues.
            chromosome.trace = new ExecutionTrace(this._vmWrapper.vm.runtime.traceInfo.tracer.traces, events);
            chromosome.coverage = this._vmWrapper.vm.runtime.traceInfo.tracer.coverage as Set<string>;
            const newFitnessValues = this.calculateFitnessValues(chromosome);

            // If we obtained smaller fitnessValues or have blocks reachable without branches in between
            // reset the counter.
            if (newFitnessValues.some(((value, index) => value < fitnessValues[index])) ||
                newFitnessValues.includes(cfgMarker)) {
                fitnessValuesUnchanged = 0;
            }
            // Otherwise increase the counter.
            else {
                fitnessValuesUnchanged++;
            }

            // If we see no improvements after adding five Waits or if we have covered all blocks we stop.
            if (fitnessValuesUnchanged >= 3 || newFitnessValues.length === 0) {
                done = true;
            }
            fitnessValues = newFitnessValues;
        }
    }

    /**
     * Gathers the fitness value for each uncovered block. This helps us deciding if it makes sense adding
     * additional waits.
     * @param chromosome the chromosome carrying the block trace used to calculate the fitness value
     * @return Returns an array of discovered fitness values.
     */
    private calculateFitnessValues(chromosome: TestChromosome): number[] {
        const fitnessValues: number[] = []
        for (const fitnessFunction of this._algorithm.getFitnessFunctions()) {
            // Only look at fitnessValues originating from uncovered blocks AND
            // not already covered by previous chromosomes
            const fitness = fitnessFunction.getFitness(chromosome);
            if (!fitnessFunction.isOptimal(fitness) &&
                !this._modifiedChromosomes.some(value => fitnessFunction.isOptimal(fitnessFunction.getFitness(value)))) {
                fitnessValues.push(fitnessFunction.getFitness(chromosome));
            }
        }
        return fitnessValues;
    }

    /**
     * Determines whether the Extension local search operator improved the original chromosome.
     * If this is the case, the modified chromosome should replace the original chromosome.
     * @param originalChromosome the chromosome Extension local search has been applied to.
     * @param modifiedChromosome the resulting chromosome after Extension local search has been applied to the original.
     * @return boolean whether the local search operator improved the original chromosome.
     */
    hasImproved(originalChromosome: TestChromosome, modifiedChromosome: TestChromosome): boolean {
        return originalChromosome.coverage.size < modifiedChromosome.coverage.size;
    }

    /**
     * Sets the algorithm, the Extension local search operator will be called from.
     * @param algorithm the searchAlgorithm calling the Extension local search operator.
     */
    setAlgorithm(algorithm: SearchAlgorithm<TestChromosome>): void {
        this._algorithm = algorithm;
    }

    /**
     * Event listener checking if the project is still running.
     */
    private projectStopped() {
        return this._projectRunning = false;
    }
}
