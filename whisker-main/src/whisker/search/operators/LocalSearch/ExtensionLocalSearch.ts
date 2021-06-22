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
import {Container} from "../../../utils/Container";
import {ExecutionTrace} from "../../../testcase/ExecutionTrace";
import {ScratchEvent} from "../../../testcase/events/ScratchEvent";
import {LocalSearch} from "./LocalSearch";
import Runtime from "scratch-vm/src/engine/runtime";


export class ExtensionLocalSearch extends LocalSearch<TestChromosome> {

    /**
     * Collects the chromosomes, the extension local search has already modified. This helps us to prevent
     * wasting time on trying to discover already discovered blocks.
     */
    private readonly _modifiedChromosomes: TestChromosome[] = [];

    /**
     * Collects the chromosomes, the extension local search has already been applied upon. This helps us to prevent
     * wasting time by not applying the local search on the same chromosome twice.
     */
    private readonly _originalChromosomes: TestChromosome[] = [];

    /**
     * Determines whether local search can be applied to this chromosome.
     * This is the case if the chromosome can actually discover previously uncovered blocks.
     * @param chromosome the chromosome local search should be applied to
     * @return boolean whether the local search operator can be applied to the given chromosome.
     */
    isApplicable(chromosome: TestChromosome): boolean {
        return chromosome.getGenes().size() < Container.config.getSearchAlgorithmProperties().getChromosomeLength() &&
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
        const newCodons = new List<number>();
        const events = new List<[ScratchEvent, number[]]>();
        newCodons.addList(chromosome.getGenes());
        seedScratch(String(Randomness.getInitialSeed()));
        this._vmWrapper.start();

        // Execute the original codons to obtain the state of the VM after executing the original chromosome.
        await this._executeGenes(newCodons, events);

        // Now extend the codons of the original chromosome to increase coverage.
        const lastImprovedResults = await this._extendGenes(newCodons, events, chromosome);
        this._vmWrapper.end();
        this._testExecutor.resetState();

        // Create the chromosome resulting from local search.
        const newChromosome = chromosome.cloneWith(newCodons);
        newChromosome.trace = new ExecutionTrace(this._vmWrapper.vm.runtime.traceInfo.tracer.traces, events.clone());
        newChromosome.coverage = this._vmWrapper.vm.runtime.traceInfo.tracer.coverage as Set<string>;
        newChromosome.lastImprovedCodon = lastImprovedResults.lastImprovedCodon;
        newChromosome.lastImprovedTrace = lastImprovedResults.lastImprovedTrace;

        // Save the modified chromosome to fetch its covered blocks in another round of ExtensionLocalSearch.
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
                               chromosome: TestChromosome): Promise<{ lastImprovedCodon: number, lastImprovedTrace: ExecutionTrace }> {
        const upperLengthBound = Container.config.getSearchAlgorithmProperties().getChromosomeLength();
        let fitnessValues = this.calculateFitnessValues(chromosome);
        let fitnessValuesUnchanged = 0;
        let done = false;
        let totalCoverageSize = chromosome.coverage.size;
        let lastImprovedCodon = chromosome.lastImprovedCodon;
        let lastImprovedTrace: ExecutionTrace

        // Uncovered blocks without branches between themselves and already covered blocks have a fitness of 0.5.
        const cfgMarker = 0.5;

        // Monitor if the Scratch-VM is still running. If it isn't stop adding Waits as they have no effect.
        const _onRunStop = this.projectStopped.bind(this);
        this._vmWrapper.vm.on(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this._projectRunning = true;
        while (codons.size() < upperLengthBound && this._projectRunning && !done) {
            const availableEvents = this._eventExtractor.extractEvents(this._vmWrapper.vm);
            if (availableEvents.isEmpty()) {
                console.log("Whisker-Main: No events available for project.");
                break;
            }
            // Find the integer representing a WaitEvent in the availableEvents list and add it to the list of codons.
            const waitEventCodon = availableEvents.findIndex(event => event instanceof WaitEvent);
            codons.add(waitEventCodon);
            // Set the waitDuration to the specified upper bound.
            // Always using the same waitDuration ensures determinism within the local search.
            const waitDurationCodon = Container.config.getWaitStepUpperBound();
            codons.add(Container.config.getWaitStepUpperBound());

            // Send the waitEvent with the specified stepDuration to the VM
            const waitEvent = new WaitEvent(waitDurationCodon);
            events.add([waitEvent, [waitDurationCodon]]);
            await waitEvent.apply();

            // Set the trace and coverage for the current state of the VM to properly calculate the fitnessValues.
            chromosome.trace = new ExecutionTrace(this._vmWrapper.vm.runtime.traceInfo.tracer.traces, events);
            chromosome.coverage = this._vmWrapper.vm.runtime.traceInfo.tracer.coverage as Set<string>;
            const newFitnessValues = this.calculateFitnessValues(chromosome);

            // Reset counter if we obtained smaller fitnessValues, or have blocks reachable without branches.
            if (newFitnessValues.some(((value, index) => value < fitnessValues[index])) ||
                newFitnessValues.includes(cfgMarker)) {
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
                lastImprovedCodon = codons.size();
                totalCoverageSize = currentCoverage.size;
                lastImprovedTrace = new ExecutionTrace(this._vmWrapper.vm.runtime.traceInfo.tracer.traces, events.clone());
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
        for (const fitnessFunction of this._algorithm.getFitnessFunctions()) {
            // Only look at fitnessValues originating from uncovered blocks AND
            // blocks not already covered by previous chromosomes modified by local search.
            const fitness = fitnessFunction.getFitness(chromosome);
            if (!fitnessFunction.isOptimal(fitness) &&
                !this._modifiedChromosomes.some(modifiedChromosome =>
                    fitnessFunction.isOptimal(fitnessFunction.getFitness(modifiedChromosome)))) {
                fitnessValues.push(fitnessFunction.getFitness(chromosome));
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
