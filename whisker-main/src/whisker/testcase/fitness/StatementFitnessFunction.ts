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
import {ControlDependenceGraph, ControlFlowGraph, GraphNode} from 'scratch-analysis'
import {ControlFilter, CustomFilter} from 'scratch-analysis/src/block-filter'
import {List} from "../../utils/List";

export class StatementFitnessFunction implements FitnessFunction<TestChromosome> {

    private readonly _targetNode: GraphNode;
    private readonly _cdg: ControlDependenceGraph;
    private readonly _cfg: ControlFlowGraph;
    private readonly _approachLevels: Record<string, number>
    private readonly _eventMapping: Record<string, string>

    constructor(targetNode: GraphNode, cdg: ControlDependenceGraph, cfg: ControlFlowGraph) {
        this._targetNode = targetNode;
        this._cdg = cdg;
        this._cfg = cfg;
        this._eventMapping = {};
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
                    this._eventMapping[node.id] = n.id;
                    const succs: [GraphNode] = cdg.successors(n.id);
                    for (const s of Array.from(succs.values())) {
                        this._eventMapping[s.id] = n.id;
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
            cfgDistanceNormalized = StatementFitnessFunction._normalize(this.getCFGDistance(chromosome));
        } else {
            cfgDistanceNormalized = 1;
        }
        return approachLevel + StatementFitnessFunction._normalize(branchDistance) + cfgDistanceNormalized;
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

    getApproachLevel(chromosome: TestChromosome): number {
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

        if (blockTrace.id in this._eventMapping) {
            const userEventNode = this._eventMapping[blockTrace.id];
            const userEventMin = this._approachLevels[userEventNode];
            if (userEventMin <= currentMin && userEventMin <= min) {
                min = this._approachLevels[userEventNode]
            }
        }
        return min
    }

    getBranchDistance(chromosome: TestChromosome): number {
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
                if (!this._targetNode.block.opcode.startsWith("event_when") &&
                    this._targetNode.block.opcode !== 'control_start_as_clone' &&
                    blockTrace.opcode.startsWith("control") &&
                    !(blockTrace.opcode === "control_wait") &&
                    (blockTrace.distances[0] !== undefined)) {

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
                } else if (blockTrace.opcode.startsWith("event_when") || blockTrace.opcode === 'control_start_as_clone') {

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

    getCFGDistance(chromosome: TestChromosome): number {

        /*
            function bfs: go through blocks from the targetNode, all uncovered blocks are visited ones. However, to avoid
            situations where there's more than one path from the targetNode to the last item in the block trace(e.g., in a if condition),
            we need to still record levels, and use a queue to save nodes for BFS.
        */
        function bfs(cfg, targetNode, coveredBlocks) {
            const queue = [targetNode];
            const visited = new Set([targetNode]);
            let node;
            let level = -1;
            while (queue.length > 0) {
                const qSize = queue.length;
                level += 1;
                for (let i = 0; i < qSize; i++) {
                    node = queue.shift();
                    if (coveredBlocks.has(node.id)) {
                        // If we stop at an execution halting block we use its relative remaining halting
                        // duration as the CFG distance instead of simply incrementing the CFG. Since at this point
                        // we have already incremented it by one we first have to decrement it again.
                        if (ControlFilter.executionHaltingBlock(node.block)) {
                            level = (level - 1) + chromosome.trace.blockTraces[node.id].remainingScaledHaltingDuration;
                        }
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
        return bfs(this._cfg, this._targetNode, coveredBlocks);

    }


    private static _normalize(x: number): number {
        return x / (x + 1.0);
    }

    private _checkControlBlock(statement: GraphNode, controlNode: GraphNode): boolean {
        let requiredCondition;
        switch (controlNode.block.opcode) {
            case 'control_forever': { // Todo not sure about forever
                requiredCondition = true;
                break;
            }
            case 'control_wait_until': {
                requiredCondition = true;
                break;
            }
            case 'control_repeat': {
                requiredCondition = false;
                const repeatBlock = controlNode.block.inputs.SUBSTACK.block;
                if (this._matchesBranchStart(statement, controlNode, repeatBlock)) {
                    requiredCondition = true;
                }
                break;
            }
            case 'control_repeat_until': {
                requiredCondition = true;
                const repeatBlock = controlNode.block.inputs.SUBSTACK.block;
                if (this._matchesBranchStart(statement, controlNode, repeatBlock)) {
                    requiredCondition = false;
                }
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

    _matchesBranchStart(statement: GraphNode, controlNode: GraphNode, branchStartId: string): boolean {
        let cur = statement;
        const traversed = []
        while (cur && cur.id !== controlNode.id && !traversed.includes(cur)) {
            traversed.push(cur)
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

    /**
     * Traverse through all fitnessFunctions and extract the independent ones. A fitnessFunction is defined to be
     * independent if it is
     *  - the child of a execution halting block
     *  - the last block inside a branching statement
     *  - the last block inside a block of statements being dependent on a hatBlock
     *  We call the blocks of independent fitnessFunctions mergeBlocks since all blocks contained in the same branch
     *  or block of hat related statements can be merged into them without loosing any information needed to achieve
     *  full coverage during search.
     * @param fitnessFunctions the fitnessFunctions  which will be filtered to contain only independent functions.
     * @returns Map mapping hatBlocks or branchingBlocks to their last independent Block
     */
    public static getMergeNodeMap(fitnessFunctions: List<StatementFitnessFunction>): Map<StatementFitnessFunction, List<StatementFitnessFunction>> {
        const mergeNodeMap = new Map<GraphNode, List<GraphNode>>();
        for (const fitnessFunction of fitnessFunctions) {

            // We add nodes right after execution halting blocks in order to be able to optimise for the scaled
            // CFG-distance which incorporates the remaining duration until the respective thread is allowed to
            // resume its execution.
            if (ControlFilter.executionHaltingBlock(fitnessFunction._targetNode.block)) {
                const childNode = this.getChildOfNode(fitnessFunction._targetNode, fitnessFunction._cdg);
                if (childNode !== undefined) {
                    mergeNodeMap.set(fitnessFunction._targetNode, new List<GraphNode>([childNode]));
                }
            }

            // Handling of branching blocks
            if (ControlFilter.branch(fitnessFunction._targetNode.block)) {
                // Get all nodes being dependent on the branching block.
                let mergeNodes = new List<GraphNode>([...fitnessFunction._cdg._successors.get(fitnessFunction._targetNode.id).values()]);

                // Find the last Block which either
                // has no child and is not another branch block -> end of branch
                // or has another branch block as child -> nested branches
                mergeNodes = mergeNodes.filter(node => (node.block !== undefined) && (!node.block.next ||
                    ControlFilter.branch(StatementFitnessFunction.getChildOfNode(node, fitnessFunction._cdg).block)));

                // Filter other branch blocks, they are contained within their own mergeMap key.
                mergeNodes = mergeNodes.filter(node => !ControlFilter.singleBranch(node.block));

                // Add the branching block if it isn't present
                if (!mergeNodes.contains(fitnessFunction._targetNode)) {
                    mergeNodes.add(fitnessFunction._targetNode);
                }

                // In case of nested branches we have blocks which can be merged, namely the block in front of the nested
                // branching block and the actual last block of the branch. We remove the block located in front of the
                // nested branch since it is already covered by the true last block.
                // SingleControlDependenceBlocks should only contain two nodes: themselves and their last block
                // DoubleControlDependenceBlocks should only contain three nodes: themselves, last if block and last else block
                if ((ControlFilter.singleBranch(fitnessFunction._targetNode.block) && mergeNodes.size() > 2)
                    || (ControlFilter.doubleBranch(fitnessFunction._targetNode.block) && mergeNodes.size() > 3)) {
                    mergeNodes = this.findLastDescendants(mergeNodes, fitnessFunction);
                }

                mergeNodeMap.set(fitnessFunction._targetNode, mergeNodes);
            }
                // When dealing with hatBlocks we always include the hatBlock itself
            // and the last statement of the given block of statements depending on the given hatBlock.
            else if (ControlFilter.hatBlock(fitnessFunction._targetNode.block) ||
                CustomFilter.defineBlock(fitnessFunction._targetNode.block)) {
                const mergeNodes = new List<GraphNode>();
                const hatNode = fitnessFunction._targetNode;
                // Add hatBlock.
                mergeNodes.add(hatNode);
                // Find and add the last statement in the block of statements being dependent on the hatBlock.
                let childNode = StatementFitnessFunction.getChildOfNode(hatNode, fitnessFunction._cdg);
                while (childNode) {
                    if (!childNode.block.next) {
                        mergeNodes.add(childNode);
                        break;
                    }
                    childNode = StatementFitnessFunction.getChildOfNode(childNode, fitnessFunction._cdg);
                }
                mergeNodeMap.set(fitnessFunction._targetNode, mergeNodes);
            }
        }
        // Map the independent Nodes to the corresponding StatementCoverageFitness-Functions.
        const statementMap = new Map<StatementFitnessFunction, List<StatementFitnessFunction>>();
        mergeNodeMap.forEach(((value, key) => {
            const keyStatement = fitnessFunctions.get(fitnessFunctions.findIndex(fitnessFunction => fitnessFunction._targetNode === key));
            const valueStatements = fitnessFunctions.filter(fitnessFunction => value.contains(fitnessFunction._targetNode));
            statementMap.set(keyStatement, valueStatements);
        }))
        return statementMap;
    }

    /**
     * Fetches the parent of the given node.
     * @param node the node whose parent should be fetched
     * @param cdg the control dependence graph which contains all blocks and hence the parent of node
     * @returns parent of node
     */
    private static getParentOfNode(node: GraphNode, cdg: ControlDependenceGraph): GraphNode {
        return cdg._nodes[node.block.parent];
    }

    /**
     * Fetches the child of the given node.
     * @param node the node whose child should be fetched
     * @param cdg the control dependence graph which contains all blocks and hence the child of node
     * @returns child of node
     */
    private static getChildOfNode(node: GraphNode, cdg: ControlDependenceGraph): GraphNode {
        if (node.block.next !== undefined) {
            return cdg._nodes[node.block.next];
        }
    }

    /**
     * When dealing with nested branches we might end up with multiple potential mergeNodes. This function finds
     * the true mergeNode(s) by traversing from each potential node upwards. If we encounter another potential
     * mergeNode we can remove the encountered mergeNode since it is covered by the current potential mergeNode.
     * @param nodes contains all potential mergeNodes
     * @param controlFitness the branching fitnessFunction all potential mergeNodes depend on.
     * @returns List of true mergeNodes.
     */
    private static findLastDescendants(nodes: List<GraphNode>, controlFitness: StatementFitnessFunction): List<GraphNode> {
        const controlNode = controlFitness._targetNode;
        const nodesToRemove = new List<GraphNode>();
        for (const node of nodes) {
            if (node === controlNode) {
                continue;
            }
            let parent = StatementFitnessFunction.getParentOfNode(node, controlFitness._cdg);
            // Traverse the block hierarchy upwards until we reach the given control node or a Hat-Block
            while (parent !== undefined && parent.id !== controlNode.id) {
                // We found another potential lastDescendant so the found one cannot be the last one.
                if (nodes.contains(parent)) {
                    nodesToRemove.add(parent);
                }
                parent = StatementFitnessFunction.getParentOfNode(parent, controlFitness._cdg);
            }
        }
        return nodes.filter(node => !nodesToRemove.contains(node));
    }

    public toString = (): string => {
        return `${this._targetNode.id} of type ${this._targetNode.block.opcode}`;
    }

}
