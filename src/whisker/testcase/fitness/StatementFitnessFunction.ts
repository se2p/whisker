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
import {TestExecutor} from '../TestExecutor';
import {ExecutionTrace} from "../ExecutionTrace";
import {GraphNode, UserEventNode, ControlDependenceGraph} from 'scratch-analysis'
import {Container} from "../../utils/Container";
import {List} from "../../utils/List";

export class StatementCoverageFitness implements FitnessFunction<TestChromosome> {

    // TODO: Constructor needs CDG and target node
    private _targetNode: GraphNode;
    private _cdg: ControlDependenceGraph;
    private _approachLevels: Record<string, number>
    private _userEventMapping: Record<string, string>

    constructor(targetNode: GraphNode, cdg: ControlDependenceGraph) {
        this._targetNode = targetNode;
        this._cdg = cdg;
        this._userEventMapping = {};
        this._approachLevels = this._calculateApproachLevels(targetNode, cdg);

    }

    private _calculateApproachLevels(targetNode: GraphNode, cdg: ControlDependenceGraph) {
        const approachLevels: Record<string, number> = {};
        const workList: List<[GraphNode, number]> = new List();
        const visited: List<GraphNode> = new List();

        workList.add([targetNode, -1]); // the target node starts with approach level -1
        for (const elem of workList) {
            workList.remove(elem);
            const node = elem[0];
            const level = elem[1];

            if (visited.contains(node)) {
                continue;
            }

            visited.add(node);
            const pred: [GraphNode] = cdg.predecessors(node.id);
            const currentLevel = level + 1
            for (const n of Array.from(pred.values())) { //we need to convert the pred set to an array, typescript does not know sets

                if (n.hasOwnProperty("userEvent")) {
                    this._userEventMapping[node.id] = n.id
                }

                if (n.id in approachLevels) {
                    if (approachLevels[n.id] > currentLevel) {
                        approachLevels[n.id] = currentLevel
                    }
                } else {
                    approachLevels[n.id] = currentLevel
                }

                workList.add([n, currentLevel])
            }
        }

        return approachLevels;
    }

    getFitness(chromosome: TestChromosome): number {
        let executionTrace;

        if (chromosome.trace == null) {
            const executor = new TestExecutor(Container.vm);
            executionTrace = executor.execute(chromosome);
            chromosome.trace = executionTrace
        } else {
            executionTrace = chromosome.trace;
        }

        const approachLevel = this._getApproachLevel(executionTrace);
        const branchDistance = this._getBranchDistance(executionTrace);
        console.log("Approach Level for Target", this._targetNode.id, " is ", approachLevel)
        console.log("Branch Distance for Target", this._targetNode.id, " is ", branchDistance)
        return approachLevel + this._normalize(branchDistance)
    }

    compare(value1: number, value2: number): number {
        // Smaller fitness values are better
        return value1 - value2;
    }

    isOptimal(fitnessValue: number): boolean {
        // Covered if distance is 0
        return fitnessValue === 0.0;
    }

    isCovered(chromosome: TestChromosome): boolean {
        return this.isOptimal(this.getFitness(chromosome));
    }


    private _getApproachLevel(trace: ExecutionTrace) {
        let min: number = Number.MAX_VALUE

        for (const blockTrace of trace.blockTraces) {

            if (this._approachLevels[blockTrace.id] < min) {
                min = this._approachLevels[blockTrace.id]
            }

            if (blockTrace.id in this._userEventMapping) {
                const userEventNode = this._userEventMapping[blockTrace.id]
                if (this._approachLevels[userEventNode] < min) {
                    min = this._approachLevels[userEventNode]
                }
            }
        }

        // TODO: Store target node as field
        // TODO: Measure distance between target node and execution trace in CDG
        return min;
    }

    private _getBranchDistance(trace: ExecutionTrace) {
        // TODO: Determine control dependency where execution branched erroneously
        // TODO: Calculate branch distance for node where diverged

        let minBranchApproachLevel: number = Number.MAX_VALUE
        let branchDistance = 0;
        for (const blockTrace of trace.blockTraces) {
            if (this._approachLevels[blockTrace.id] <= minBranchApproachLevel) {
                if (blockTrace.opcode.startsWith("control")) {
                    const controlNode = this._cdg.getNode(blockTrace.id);
                    const requiredCondition =  this._checkControlBlock(this._targetNode, controlNode);
                    minBranchApproachLevel = this._approachLevels[blockTrace.id]

                    // blockTrace distances contains a list of all measured distances in a condition
                    // (unless it is "and" or "or" there should only be one element.
                    // The first is the true distance, the second the false distance
                    if (requiredCondition) {
                        branchDistance = blockTrace.distances[0][0]
                    } else {
                        branchDistance = blockTrace.distances[0][1]
                    }
                }
            }
        }

        return branchDistance;
    }

    private _normalize(x: number): number {
        return x / (x + 1.0);
    }

    _checkControlBlock(statement, controlNode) {
        let requiredCondition;
        switch (controlNode.block.opcode) {
            case 'control_repeat':
            case 'control_forever': { // Todo not sure about forever
                const ifBlock = controlNode.block.inputs.SUBSTACK.block;
                if (this._matchesBranchStart(statement, controlNode, ifBlock)) {
                    requiredCondition = true;
                }
                break;
            }
            case 'control_repeat_until': {
                requiredCondition = false;
                const ifBlock = controlNode.block.inputs.SUBSTACK.block;
                if (this._matchesBranchStart(statement, controlNode, ifBlock)) {
                    requiredCondition = true;
                }
                break;
            }
            case 'control_if': {
                requiredCondition = true;
                const ifBlock = controlNode.block.inputs.SUBSTACK.block;
                if (this._matchesBranchStart(statement, controlNode, ifBlock)) {
                    requiredCondition = true;
                }
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

    _matchesBranchStart(statement, controlNode, branchStartId) {
        let cur = statement;
        while (cur.id !== controlNode.id) {
            if (cur.id === branchStartId) {
                return true;
            }
            cur = this._cdg.predecessors(cur.id)
                .values()
                .next()
                .value;
        }
        return false;
    };
}
