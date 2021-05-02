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

import {FitnessFunction} from '../../search/FitnessFunction';
import {TestChromosome} from '../TestChromosome';
import {ExecutionTrace} from "../ExecutionTrace";
import {GraphNode, UserEventNode, ControlDependenceGraph, ControlFlowGraph} from 'scratch-analysis'
import {List} from "../../utils/List";

export class StatementCoverageFitness implements FitnessFunction<TestChromosome> {

    // TODO: Constructor needs CDG and target node
    private _targetNode: GraphNode;
    private _cdg: ControlDependenceGraph;
    private _cfg: ControlFlowGraph;
    private _approachLevels: Record<string, number>
    private eventMapping: Record<string, string>

    constructor(targetNode: GraphNode, cdg: ControlDependenceGraph, cfg: ControlFlowGraph) {
        this._targetNode = targetNode;
        this._cdg = cdg;
        this._cfg = cfg;
        this.eventMapping = {};
        this._approachLevels = this._calculateApproachLevels(targetNode, cdg);

    }

    private _calculateApproachLevels(targetNode: GraphNode, cdg: ControlDependenceGraph) {
        const approachLevels: Record<string, number> = {};
        const workList = [];
        const visited: List<GraphNode> = new List();

        workList.push([targetNode, -1]); // the target node starts with approach level -1
        while (workList.length > 0) {
            const elem = workList.shift();
            const node = elem[0];
            const level = elem[1];

            if (visited.contains(node)) {
                continue;
            }

            visited.add(node);
            const pred: [GraphNode] = cdg.predecessors(node.id);
            const currentLevel = level + 1;
            for (const n of Array.from(pred.values())) { //we need to convert the pred set to an array, typescript does not know sets

                if (n.hasOwnProperty("userEvent") || n.hasOwnProperty("event")) {
                    this.eventMapping[node.id] = n.id;
                    const succs: [GraphNode] = cdg.successors(n.id);
                    for (const s of Array.from(succs.values())) {
                        this.eventMapping[s.id] = n.id;
                    }
                }

                if (n.id in approachLevels) {
                    if (approachLevels[n.id] > currentLevel) {
                        approachLevels[n.id] = currentLevel
                    }
                } else {
                    approachLevels[n.id] = currentLevel
                }

                workList.push([n, currentLevel])
            }
        }

        return approachLevels;
    }

    getFitness(chromosome: TestChromosome): number {
        if (chromosome.trace == null) {
            throw Error("Test case not executed");
        }

        if (chromosome.coverage.has(this._targetNode.id)) {
            // Shortcut: If the target is covered, we don't need to spend
            // any time on calculating anything
            return 0;
        }

        const approachLevel = this.getApproachLevel(chromosome);
        const branchDistance = this.getBranchDistance(chromosome);

        let cfgDistanceNormalized;
        if (approachLevel === 0 && branchDistance === 0) {
            cfgDistanceNormalized = this._normalize(this.getCFGDistance(chromosome));
        }
        else {
            cfgDistanceNormalized = 1;
        }
        return approachLevel + this._normalize(branchDistance) + cfgDistanceNormalized;
    }

    compare(value1: number, value2: number): number {
        // Smaller fitness values are better
        // -> Sort by decreasing fitness value
        return value2 - value1;
    }

    isOptimal(fitnessValue: number): boolean {
        // Covered if distance is 0
        return fitnessValue === 0.0;
    }

    isCovered(chromosome: TestChromosome): boolean {
        return this.isOptimal(this.getFitness(chromosome));
    }

    getApproachLevel(chromosome: TestChromosome):number {
        const trace = chromosome.trace;
        let min: number = Number.MAX_VALUE;

        for (const [key, blockTrace] of Object.entries(trace.blockTraces)) {
            const newMin = this._approachLevelByTrace(blockTrace, min);
            if (newMin <= min) {
                min = newMin;
            }
        }

        return min;
    }

    private _approachLevelByTrace(blockTrace, currentMin: number) {
        let min = Number.MAX_VALUE;
        if (this._approachLevels[blockTrace.id] <= currentMin) {
            min = this._approachLevels[blockTrace.id]
        }

        if (blockTrace.id in this.eventMapping) {
            const userEventNode = this.eventMapping[blockTrace.id];
            const userEventMin = this._approachLevels[userEventNode];
            if (userEventMin <= currentMin && userEventMin <= min) {
                min = this._approachLevels[userEventNode]
            }
        }
        return min
    }

    getBranchDistance(chromosome: TestChromosome):number {
        const trace = chromosome.trace;
        let minBranchApproachLevel: number = Number.MAX_VALUE;
        let branchDistance = Number.MAX_VALUE;
        for (const [key, blockTrace] of Object.entries(trace.blockTraces)) {
            let traceMin;
            if (blockTrace.id === this._targetNode.block.id) {
                // if we hit the block in the trace, it must have approach level zero and branch distance 0
                traceMin = 0;
                branchDistance = 0;
                return branchDistance;
            } else {
                traceMin = this._approachLevelByTrace(blockTrace, minBranchApproachLevel);
            }

            if (traceMin <= minBranchApproachLevel) {
                if (!this._targetNode.block.opcode.startsWith("event_") && this._targetNode.block.opcode !== 'control_start_as_clone' && blockTrace.opcode.startsWith("control") && !(blockTrace.opcode === "control_wait")) {

                    const controlNode = this._cdg.getNode(blockTrace.id);
                    const requiredCondition = this._checkControlBlock(this._targetNode, controlNode);

                    // blockTrace distances contains a list of all measured distances in a condition
                    // (unless it is "and" or "or" there should only be one element.
                    // The first is the true distance, the second the false distance
                    let newDistance;
                    if (requiredCondition) {
                        newDistance = blockTrace.distances[0][0]
                    } else {
                        newDistance = blockTrace.distances[0][1]
                    }

                    if (traceMin < minBranchApproachLevel ||
                        (traceMin == minBranchApproachLevel && newDistance < branchDistance)) {
                        minBranchApproachLevel = traceMin;
                        branchDistance = newDistance;
                    }
                } else if (blockTrace.opcode.startsWith("event_") || blockTrace.opcode === 'control_start_as_clone') {

                    // In event blocks we always have the true distance, otherwise we would not be here
                    // An event block in the trace means it was executed
                    const newDistance = blockTrace.distances[0][0];
                    if (traceMin < minBranchApproachLevel ||
                        (traceMin == minBranchApproachLevel && newDistance < branchDistance)) {
                        minBranchApproachLevel = traceMin
                        branchDistance = newDistance;
                    }
                }
            }
        }

        return branchDistance;
    }

    getCFGDistance(chromosome: TestChromosome):number {

        /*
            function bfs: go through blocks from the targetNode, all uncovered blocks are visited ones. However, to avoid
            situations where there's more than one path from the targetNode to the last item in the block trace(e.g., in a if condition),
            we need to still record levels, and use a queue to save nodes for BFS.
        */
        function bfs (cfg, targetNode, coveredBlocks) {
            // console.log('blockTraces: ', blockTraces);
            const queue = [targetNode];
            const visited = new Set([targetNode]);
            let node;
            let level = -1;
            while (queue.length > 0) {
                const qSize = queue.length;
                level += 1;
                for (let i = 0; i < qSize; i ++) {
                    node = queue.shift();
                    if (coveredBlocks.has(node.id)){
                        return level;
                    }
                    visited.add(node);
                    for (const pred of cfg.predecessors(node.id)) {
                        if (!visited.has(pred)) {
                            queue.push(pred);
                        }
                    }
                }
            }
            /*
            the only possibility that none of the targetNode's predecessors is included in blockTrace, is that
            the targetNode is events, userEvents, or starting ones, e.g., Entry, start, keypressed:space. In those cases,
            because approach level and branch distance is already 0, these blocks must be executed anyway, so
            return 0.
             */
            return 0;
        }

        const coveredBlocks = chromosome.coverage;
        const level = bfs(this._cfg, this._targetNode, coveredBlocks);
        return level

    }


    private _normalize(x: number): number {
        return x / (x + 1.0);
    }

    _checkControlBlock(statement, controlNode): boolean {
        let requiredCondition;
        switch (controlNode.block.opcode) {
            case 'control_repeat':
            case 'control_repeat_until':
            case 'control_forever': { // Todo not sure about forever
               requiredCondition = true;
               break;
            }
            case 'control_wait_until': {
                requiredCondition = true;
                break;
            }
            case 'control_if': {
                requiredCondition = false;
                const ifBlock = controlNode.block.inputs.SUBSTACK.block;
                if (this._matchesBranchStart(statement, controlNode, ifBlock)) {
                    requiredCondition = true;
                }
                break;
            }
            case 'control_start_as_clone': {
                requiredCondition = true;
                break;
            }
            case 'control_if_else': {
                requiredCondition = false;
                const ifBlock = controlNode.block.inputs.SUBSTACK.block;
                if (this._matchesBranchStart(statement, controlNode, ifBlock)) {
                    requiredCondition = true;
                    break;
                }
                const elseBlock = controlNode.block.inputs.SUBSTACK2.block;
                if (this._matchesBranchStart(statement, controlNode, elseBlock)) {
                    requiredCondition = false;
                }
            }
        }
        return requiredCondition;
    }

    _matchesBranchStart(statement, controlNode, branchStartId): boolean {
        let cur = statement;
        while (cur && cur.id !== controlNode.id) {
            if (cur.id === branchStartId) {
                return true;
            }
            cur = this._cfg.predecessors(cur.id)
                .values()
                .next()
                .value;
        }
        return false;
    }

    public toString = () : string => {
        return ""+ this._targetNode.id +" of type "+this._targetNode.block.opcode;
    }
}
