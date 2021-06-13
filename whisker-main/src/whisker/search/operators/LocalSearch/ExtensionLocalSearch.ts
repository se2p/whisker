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
import {StatisticsCollector} from "../../../utils/StatisticsCollector";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {ScratchEventExtractor} from "../../../testcase/ScratchEventExtractor";
import VMWrapper = require("../../../../vm/vm-wrapper.js")
import {Container} from "../../../utils/Container";
import {ExecutionTrace} from "../../../testcase/ExecutionTrace";
import {ScratchEvent} from "../../../testcase/events/ScratchEvent";
import {generateCFG} from 'scratch-analysis'
import {LocalSearch} from "./LocalSearch";
import {FitnessFunction} from "../../FitnessFunction";


export class ExtensionLocalSearch implements LocalSearch<TestChromosome> {

    /**
     * Lower bound for integer values
     */
    private readonly _min: number;

    /**
     * Upper bound for integer values
     */
    private readonly _max: number;

    /**
     * Upper bound for IntegerList size.
     */
    private readonly _length: number;

    /**
     * The relative amount of depleted resources, determining at which point in time local search should be applied.
     */
    private readonly _depletedResourcesThreshold: number

    private readonly _cfg: ControlFlowGraph;
    private readonly _vm: VirtualMachine;
    private _vmWrapper: VMWrapper;
    private readonly _eventExtractor: ScratchEventExtractor;

    constructor(vmWrapper: VMWrapper, eventExtractor: ScratchEventExtractor, depletedResourcesThreshold: number) {
        this._vmWrapper = vmWrapper;
        this._vm = vmWrapper.vm;
        this._eventExtractor = eventExtractor;
        this._depletedResourcesThreshold = depletedResourcesThreshold;
        this._cfg = generateCFG(this._vm);
        this._min = Container.config.getSearchAlgorithmProperties().getMinIntRange();
        this._max = Container.config.getSearchAlgorithmProperties().getMinIntRange();
        this._length = Container.config.getSearchAlgorithmProperties().getChromosomeLength();
    }

    isApplicable(chromosome: TestChromosome, depletedResources:number): boolean {
        console.log("Depleted Resources: ", depletedResources);
        if(this._depletedResourcesThreshold > depletedResources)
            return false;
        return this._hasReachableSuccessors(chromosome.coverage);
    }

    async apply(chromosome: TestChromosome): Promise<TestChromosome> {
        const newCodons = new List<number>();
        newCodons.addList(chromosome.getGenes());

        seedScratch(String(Randomness.getInitialSeed()));
        this._vmWrapper.start();
        await this._executeGenes(newCodons);
        await this._extendGenes(newCodons);
        this._vmWrapper.end();

        //console.log("Original chromosome had " + chromosome.getLength() + " codons, extended to " + newCodons.size());
        const newChromosome = chromosome.cloneWith(newCodons);

        // FIXME: Collect actual events
        const events = new List<[ScratchEvent, number[]]>();
        newChromosome.trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, events);
        newChromosome.coverage = this._vm.runtime.traceInfo.tracer.coverage as Set<string>;

        // FIXME: State is not reset after execution

        return newChromosome;
    }

    private async _extendGenes(codons: List<number>): Promise<void> {

        //console.log("Starting extension");

        let done = false;

        while (codons.size() < this._length && !done) {
            const availableEvents = this._eventExtractor.extractEvents(this._vm);
            if (availableEvents.isEmpty()) {
                console.log("Whisker-Main: No events available for project.");
                break;
            }
            let numEvent = 0;
            //console.log("Current length: " + codons.size());

            // FIXME: This assumes there's always a wait event somewhere in there
            // FIXME: It always picks the first one.
            for (const nextEvent of availableEvents) {
                if (nextEvent instanceof WaitEvent) {
                    codons.add(numEvent);
                    //console.log("Adding wait of num " + numEvent);
                    // Wait events don't use arguments in this branch yet
                    await nextEvent.apply();

                    const waitEvent = new WaitEvent();
                    await waitEvent.apply();
                }
                numEvent++;
            }
            // Did coverage increase?
            // Are there reachable uncovered blocks in the executing scripts?
            if (!this._hasReachableSuccessors(this._vm.runtime.traceInfo.tracer.coverage as Set<string>)) {
                //console.log("No more reachable coverable states");
                done = true;
            }
        }
    }

    private async _executeGenes(codons: List<number>): Promise<void> {
        let numCodon = 0;
        while (numCodon < codons.size()) {
            const availableEvents = this._eventExtractor.extractEvents(this._vm);

            if (availableEvents.isEmpty()) {
                //console.log("Whisker-Main: No events available for project.");
                break;
            }

            const nextEvent = availableEvents.get(codons.get(numCodon) % availableEvents.size())

            const args = this._getArgs(nextEvent, codons, numCodon);
            numCodon += nextEvent.getNumParameters() + 1;

            await nextEvent.apply();
            StatisticsCollector.getInstance().incrementEventsCount()

            const waitEvent = new WaitEvent();
            await waitEvent.apply();
        }
    }

    private _getArgs(event: ScratchEvent, codons: List<number>, codonPosition: number): number[] {
        const args = [];
        for (let i = 0; i < event.getNumParameters(); i++) {
            // Get next codon, but wrap around if length exceeded
            const codon = codons.get(++codonPosition % codons.size());
            args.push(codon)
        }
        return args;
    }

    private _getRandomArgs(event: ScratchEvent, codons: List<number>): number[] {
        const args = [];
        for (let i = 0; i < event.getNumParameters(); i++) {
            // Get next codon, but wrap around if length exceeded
            const codon = Randomness.getInstance().nextInt(this._min, this._max);
            codons.add(codon);
            args.push(codon)
        }
        return args;
    }

    private _hasReachableSuccessors(coverage): boolean {
        return this._getReachableSuccessors(coverage).size > 0;
    }

    private _getReachableSuccessors(coverage): Set<string> {
        const visited = new Set<string>();
        const successors = new Set<string>();

        for (const nodeId of coverage) {
            //console.log("Checking covered node: " + nodeId);
            const succNode = this._cfg.getNode(nodeId);
            if (!succNode) {
                //console.log("Found no node for " + nodeId);
            } else {
                for (const succ of this._getDefiniteSuccessors(succNode, visited)) {
                    if (!coverage.has(succ)) {
                        //console.log("Successor " + succ + " is not covered");
                        successors.add(succ);
                    } else {
                        //console.log("Successor " + succ + " is already covered");
                    }
                }
            }
        }
        //console.log("Reachable, uncovered successors: " + successors.size);
        for (const succ of successors) {
            //console.log("Reachable uncovered: " + succ);
        }

        return successors;
    }

    private _getDefiniteSuccessors(node: GraphNode, visited: Set<string>): Set<string> {
        const successors = new Set<string>();
        //console.log("Current node: " + node);

        // Opcode is only known if this corresponds to a block
        // CFG nodes might be pseudo nodes without block
        let opcode = "undefined";
        if (node.block) {
            opcode = node.block.opcode;
        }

        switch (opcode) {
            case 'control_repeat_until':
            case 'control_wait_until':
            case 'control_if':
            case 'control_if_else':
                // Do not follow successors
                break;

            default: {
                // Default: add all successors
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

    hasImproved(originalChromosome: TestChromosome, modifiedChromosome: TestChromosome,
                fitnessFunction: FitnessFunction<TestChromosome>): boolean {
        const fitnessOriginal = originalChromosome.getFitness(fitnessFunction);
        const fitnessModified = modifiedChromosome.getFitness(fitnessFunction)
        return fitnessFunction.compare(fitnessOriginal, fitnessModified) > 0;
    }
}
