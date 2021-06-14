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
import {GraphNode, ControlFlowGraph} from 'scratch-analysis'
import {WaitEvent} from "../../../testcase/events/WaitEvent";
import {ScratchEventExtractor} from "../../../testcase/ScratchEventExtractor";
import VMWrapper = require("../../../../vm/vm-wrapper.js")
import {Container} from "../../../utils/Container";
import {ExecutionTrace} from "../../../testcase/ExecutionTrace";
import {ScratchEvent} from "../../../testcase/events/ScratchEvent";
import {generateCFG} from 'scratch-analysis'
import {LocalSearch} from "./LocalSearch";
import {TestExecutor} from "../../../testcase/TestExecutor";


export class ExtensionLocalSearch implements LocalSearch<TestChromosome> {

    /**
     * The vmWrapper wrapped around the Scratch-VM.
     */
    private _vmWrapper: VMWrapper;

    /**
     * The control flow graph of the given Scratch project.
     */
    private readonly _cfg: ControlFlowGraph;

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
     * Set collecting the covered nodes. This helps us not wasting time on discovering already covered blocks by
     * other chromosomes.
     */
    private readonly _discoveredBlocks: Set<string>;

    /**
     * Random number generator
     */
    private readonly _random: Randomness;

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
        this._cfg = generateCFG(this._vmWrapper.vm);
        this._eventExtractor = eventExtractor;
        this._testExecutor = new TestExecutor(vmWrapper, eventExtractor);
        this._depletedResourcesThreshold = depletedResourcesThreshold;
        this._generationInterval = generationInterval;
        this._upperLengthBound = Container.config.getSearchAlgorithmProperties().getChromosomeLength();
        this._discoveredBlocks = new Set<string>();
        this._random = Randomness.getInstance();
    }

    /**
     * Determines whether local search can be applied to this chromosome. This is the case if we have depleted the
     * specified resource budget and if the chromosome can increase its coverage simply by waiting.
     * @param chromosome the chromosome local search should be applied to
     * @param depletedResources determines the amount of depleted resources after which local search will be applied
     * @param generation the current generation of the search algorithm
     * @return boolean whether the local search operator can be applied to the given chromosome.
     */
    isApplicable(chromosome: TestChromosome, depletedResources: number, generation: number): boolean {
        if (this._depletedResourcesThreshold > depletedResources || depletedResources >= 1 ||
            generation % this._generationInterval != 0)
            return false;
        return this._hasReachableSuccessors(chromosome.coverage);
    }

    /**
     * Applies the Extension local search operator which extends the chromosome's gene with WaitEvents,
     * in order to cover blocks reachable by waiting.
     * @param chromosome the chromosome that should be modified by the Extension local search operator.
     * @returns the modified chromosome wrapped in a Promise.
     */
    async apply(chromosome: TestChromosome): Promise<TestChromosome> {
        console.log("ExtensionLocalSearch on: ", chromosome);
        const newCodons = new List<number>();
        const events = new List<[ScratchEvent, number[]]>();
        newCodons.addList(chromosome.getGenes());
        seedScratch(String(Randomness.getInitialSeed()));
        this._vmWrapper.start();
        // Execute the original codons to obtain the state of the VM after executing the original chromosome.
        await this._executeGenes(newCodons, events);
        // Now extend the codons of the original chromosome to increase coverage.
        await this._extendGenes(newCodons, events);
        const newChromosome = chromosome.cloneWith(newCodons);

        newChromosome.trace = new ExecutionTrace(this._vmWrapper.vm.runtime.traceInfo.tracer.traces, events);
        newChromosome.coverage = this._vmWrapper.vm.runtime.traceInfo.tracer.coverage as Set<string>;
        this._vmWrapper.end();
        this._testExecutor.resetState();

        // If we found an improved version of the original chromosome, update the discovered blocks set
        if (this.hasImproved(chromosome, newChromosome)) {
            new Set([...newChromosome.coverage].filter(block => !chromosome.coverage.has(block))).forEach(
                this._discoveredBlocks.add, this._discoveredBlocks
            );
        }
        console.log("ExtensionLocalSearch Result: ", newChromosome);
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
     */
    private async _extendGenes(codons: List<number>, events: List<[ScratchEvent, number[]]>): Promise<void> {
        let done = false;
        while (codons.size() < this._upperLengthBound && !done) {
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

            // Are there reachable successors left? If so keep on adding waits!
            if (!this._hasReachableSuccessors(this._vmWrapper.vm.runtime.traceInfo.tracer.coverage as Set<string>)) {
                done = true;
            }
        }
    }

    /**
     * Determines whether there are blocks reachable by adding WaitEvents only.
     * @param coverage the blocks covered so far.
     * @return boolean determining if there are blocks reachable by adding WaitEvents.
     */
    private _hasReachableSuccessors(coverage): boolean {
        return this._getReachableSuccessors(coverage).size > 0;
    }

    /**
     * Gathers the set of blocks, reachable by adding WaitEvents only.
     * @param coverage coverage the blocks covered so far.
     * @return Set of block id's, reachable by adding WaitEvents only.
     */
    private _getReachableSuccessors(coverage): Set<string> {
        const visited = new Set<string>();
        const successors = new Set<string>();
        // Go through each covered block and check if it has nodes that are reachable by waiting.
        for (const nodeId of coverage) {
            const succNode = this._cfg.getNode(nodeId);
            // Check if we have an existing block. (There are pseudo nodes in the CFG).
            if (succNode) {
                for (const succ of this._getDefiniteSuccessors(succNode, visited)) {
                    //console.log("Succ: ", succ)
                    if (!coverage.has(succ) && !this._discoveredBlocks.has(succ)) {
                        //console.log("Added: ", succ)
                        successors.add(succ);
                    }
                }
            }
        }
        return successors;
    }

    /**
     * Extracts not yet covered successor blocks of a given node, reachable by waiting.
     * @param node the starting node from which on we search for valid successor blocks.
     * @param visited collects the visited nodes to avoid traversing the same nodes multiple times.
     * @return the set of successor blocks reachable by adding WaitEvents.
     */
    private _getDefiniteSuccessors(node: GraphNode, visited: Set<string>): Set<string> {
        const successors = new Set<string>();

        // Opcode is only known if this corresponds to a block
        // CFG nodes might be pseudo nodes without block
        if (!node.block) {
            return successors;
        }
        const opcode = node.block.opcode;

        switch (opcode) {
            // Stop if we hit branches.
            case 'control_repeat_until':
            case 'control_wait_until':
            case 'control_if':
            case 'control_if_else':
                break;

            // Otherwise collect successor nodes reachable by waiting.
            default: {
                for (const succ of this._cfg.successors(node.id)) {
                    if (!visited.has(succ.id) && succ !== this._cfg.exit()) {
                        visited.add(succ.id);
                        successors.add(succ.id);
                        for (const succ2 of this._getDefiniteSuccessors(succ, visited)) {
                            visited.add(succ2);
                            successors.add(succ2);
                        }
                    }
                }
            }
        }
        return successors;
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
}
