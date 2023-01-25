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
import {ControlDependenceGraph, ControlFlowGraph, GraphNode, EventNode, UserEventNode, Graph} from 'scratch-analysis';
import {ControlFilter, CustomFilter} from 'scratch-analysis/src/block-filter';
import {Trace} from "scratch-vm/src/engine/tracing.js";
import {Container} from "../../utils/Container";

export class StatementFitnessFunction implements FitnessFunction<TestChromosome> {

    private static _EXECUTION_HALTING_OPCODES = ['control_wait', 'looks_thinkforsecs', 'looks_sayforsecs',
        'motion_glideto', 'motion_glidesecstoxy', 'sound_playuntildone', 'text2speech_speakAndWait'];

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
        const visited = [];

        workList.push([targetNode, -1]); // the target node starts with approach level -1
        while (workList.length > 0) {
            const elem = workList.shift();
            const node = elem[0];
            const level = elem[1];

            if (visited.includes(node)) {
                continue;
            }

            visited.push(node);
            const pred: [GraphNode] = cdg.predecessors(node.id);
            const currentLevel = level + 1;
            for (const n of Array.from(pred.values())) { //we need to convert the pred set to an array, typescript does not know sets

                if ("userEvent" in n || "event" in n) {
                    this._eventMapping[node.id] = n.id;
                    const succs: [GraphNode] = cdg.successors(n.id);
                    for (const s of Array.from(succs.values())) {
                        this._eventMapping[s.id] = n.id;
                    }
                }

                if (n.id in approachLevels) {
                    if (approachLevels[n.id] > currentLevel) {
                        approachLevels[n.id] = currentLevel;
                    }
                } else {
                    approachLevels[n.id] = currentLevel;
                }

                workList.push([n, currentLevel]);
            }
        }

        return approachLevels;
    }

    async getFitness(chromosome: TestChromosome): Promise<number> {
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
        if (branchDistance === 0 && approachLevel < Number.MAX_SAFE_INTEGER) {
            cfgDistanceNormalized = StatementFitnessFunction._normalize(this.getCFGDistance(chromosome, approachLevel > 0));
        } else {
            cfgDistanceNormalized = 1;
        }
        return 2 * approachLevel + StatementFitnessFunction._normalize(branchDistance) + cfgDistanceNormalized;
    }

    compare(value1: number, value2: number): number {
        // Smaller fitness values are better
        // -> Sort by decreasing fitness value
        return value2 - value1;
    }

    async isOptimal(fitnessValue: number): Promise<boolean> {
        // Covered if distance is 0
        return fitnessValue === 0.0;
    }

    async isCovered(chromosome: TestChromosome): Promise<boolean> {
        return this.isOptimal(await this.getFitness(chromosome));
    }

    getCDGDepth(): number {
        return Math.max(...Object.values(this._approachLevels));
    }

    getApproachLevel(chromosome: TestChromosome): number {
        const trace = chromosome.trace;
        let min = Number.MAX_SAFE_INTEGER;

        for (const blockTrace of Object.values(trace.blockTraces)) {
            const newMin = this._approachLevelByTrace(blockTrace, min);
            if (newMin <= min) {
                min = newMin;
            }
        }

        return min;
    }

    private _approachLevelByTrace(blockTrace, currentMin: number) {
        let min = Number.MAX_SAFE_INTEGER;
        if (this._approachLevels[blockTrace.id] <= currentMin) {
            min = this._approachLevels[blockTrace.id];
        }

        if (blockTrace.id in this._eventMapping) {
            const userEventNode = this._eventMapping[blockTrace.id];
            const userEventMin = this._approachLevels[userEventNode];
            if (userEventMin <= currentMin && userEventMin <= min) {
                min = this._approachLevels[userEventNode];
            }
        }
        return min;
    }

    getBranchDistance(chromosome: TestChromosome): number {
        const trace = chromosome.trace;
        let minBranchApproachLevel: number = Number.MAX_SAFE_INTEGER;
        let branchDistance = Number.MAX_SAFE_INTEGER;
        for (const blockTrace of Object.values(trace.blockTraces)) {
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
                if (this._canComputeControlDistance(blockTrace)) {

                    const controlNode = this._cdg.getNode(blockTrace.id);
                    if (controlNode === undefined) {
                        console.warn("Traced block not found in CDG: " + blockTrace.id);
                        continue;
                    }
                    const requiredCondition = this._checkControlBlock(this._targetNode, controlNode);

                    // blockTrace distances contains a list of all measured distances in a condition
                    // (unless it is "and" or "or" there should only be one element.
                    // The first is the true distance, the second the false distance
                    let newDistance;
                    if (requiredCondition) {
                        newDistance = blockTrace.distances[0][0];
                    } else {
                        newDistance = blockTrace.distances[0][1];
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
                        minBranchApproachLevel = traceMin;
                        branchDistance = newDistance;
                    }
                }
            }
        }

        return branchDistance;
    }

    getCFG(): ControlFlowGraph {
        return this._cfg;
    }

    getCDG(): ControlDependenceGraph {
        return this._cdg;
    }

    public getTargetNode(): GraphNode {
        return this._targetNode;
    }

    getCFGDistance(chromosome: TestChromosome, hasUnexecutedCdgPredecessor: boolean): number {
        /*
            function bfs: go through blocks from the targetNode, all uncovered blocks are visited ones. However, to avoid
            situations where there's more than one path from the targetNode to the last item in the block trace(e.g., in a if condition),
            we need to still record levels, and use a queue to save nodes for BFS.
        */
        function bfs(graph: Graph, targetNodeQueue: GraphNode[], coveredBlocks: Set<string>): number {
            const queue = targetNodeQueue;
            const visited = new Set(targetNodeQueue);
            let node;
            let step = -1;
            while (queue.length > 0) {
                const qSize = queue.length;
                step += 1;
                for (let i = 0; i < qSize; i++) {
                    node = queue.shift();
                    if (coveredBlocks.has(node.id)) {
                        return step;
                    }
                    visited.add(node);
                    for (const pred of graph.predecessors(node.id)) {
                        if (!visited.has(pred)) {
                            queue.push(pred);
                        }
                    }
                }
            }
            /*
            the only possibility that none of the targetNode's predecessors is included in blockTrace, is that
            the targetNode is events, userEvents, or starting ones, e.g., Entry, start, keypressed:space. In those cases,
            because branch distance is already 0, these blocks must be executed anyway, so
            return 0.
             */
            return 0;
        }

        /* function bfsPredecessors:
         inside the CDG, find a list of <un-executed predecessor>, that
         1. has the shortest distance to <targetNode>
         2. is the direct successor of an <executed predecessor>
         <exit> <----------- <targetNode> <------------------- <un-executed predecessor><executed predecessor>
                                           (^shortest)              (^two adjacent nodes) */
        function bfsPredecessors(graph: Graph, targetNode: GraphNode, coveredBlocks: Set<string>): GraphNode[] {
            const queue = [targetNode];
            const visited = new Set([targetNode]);
            let node;
            const res = new Set();
            while (queue.length > 0) {
                const qSize = queue.length;
                for (let i = 0; i < qSize; i++) {
                    node = queue.shift();
                    for (const pred of graph.predecessors(node.id)) {
                        if (!visited.has(pred)) {
                            if (coveredBlocks.has(pred.id) || graph.predecessors(pred.id).size === 0) {
                                //  graph.predecessors(pred.id).size === 0 means the program looks like this:
                                // <exit> <----------- <targetNode> <------------------- <un-executed predecessor><Entry/Events>
                                // here, the  <un-executed predecessor> is node, <Entry/Event> is pred
                                res.add(node);
                            }
                            visited.add(pred);
                            queue.push(pred);
                        }
                    }
                }
                if (res.size > 0) {
                    return [...res];
                }
            }
            //the only possibility for the loop to execute to here is that targetNode == unexecutedPredecessor == Event/Entry.
            //this is not possible, because in those case, either branch distance == approach level == 0; or branch distance != 0
            console.warn('Cannot find closest (un-executed predecessor)(executed predecessor) node pair for targetNode: '
                + targetNode.block.opcode + " with id " + targetNode.block.id);
            return [];
        }

        let targetNodeQueue: GraphNode[];
        if (hasUnexecutedCdgPredecessor) {
            targetNodeQueue = bfsPredecessors(this._cdg, this._targetNode, chromosome.coverage);
            if (targetNodeQueue.length === 0) {
                // If no predecessor was found, something is wrong, e.g. nothing was covered.
                // By returning max, the effect is essentially that the CFG distance is not used.
                return Number.MAX_SAFE_INTEGER;
            }
        } else {
            targetNodeQueue = [this._targetNode];
        }
        return bfs(this._cfg, targetNodeQueue, chromosome.coverage);
    }


    private static _normalize(x: number): number {
        return x / (x + 1.0);
    }

    /**
     * Checks if our target node represents a control node that contains a blockTrace which we can evaluate for
     * determining the branch distance.
     * @param blockTrace the blockTrace from which we can determine the branch distance.
     * @returns boolean determining if we extract the branchDistance from the given blockTrace.
     */
    private _canComputeControlDistance(blockTrace: Trace): boolean {
        return !this._targetNode.block.opcode.startsWith("event_when") &&
            this._targetNode.block.opcode !== 'control_start_as_clone' &&
            (blockTrace.opcode.startsWith("control") ||
                StatementFitnessFunction._EXECUTION_HALTING_OPCODES.includes(blockTrace.opcode));
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
                if (controlNode.block.inputs.SUBSTACK !== undefined) {
                    const repeatBlock = controlNode.block.inputs.SUBSTACK.block;
                    if (this._matchesBranchStart(statement, controlNode, repeatBlock)) {
                        requiredCondition = true;
                    }
                }
                break;
            }
            case 'control_repeat_until': {
                requiredCondition = true;
                if (controlNode.block.inputs.SUBSTACK !== undefined) {
                    const repeatBlock = controlNode.block.inputs.SUBSTACK.block;
                    if (this._matchesBranchStart(statement, controlNode, repeatBlock)) {
                        requiredCondition = false;
                    }
                }
                break;
            }
            case 'control_if': {
                requiredCondition = false;
                let ifBlock: string;
                if (controlNode.block.inputs.SUBSTACK !== undefined) {
                    ifBlock = controlNode.block.inputs.SUBSTACK.block;
                } else if (controlNode.block.inputs.CONDITION !== undefined) {
                    ifBlock = controlNode.block.inputs.CONDITION.block;
                }
                if (ifBlock !== undefined && this._matchesBranchStart(statement, controlNode, ifBlock)) {
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
                let ifBlock: string;
                if (controlNode.block.inputs.SUBSTACK !== undefined) {
                    ifBlock = controlNode.block.inputs.SUBSTACK.block;
                } else if (controlNode.block.inputs.CONDITION !== undefined) {
                    ifBlock = controlNode.block.inputs.CONDITION.block;
                }
                if (this._matchesBranchStart(statement, controlNode, ifBlock)) {
                    requiredCondition = true;
                    break;
                }
                if (controlNode.block.inputs.SUBSTACK2 !== undefined) {
                    const elseBlock = controlNode.block.inputs.SUBSTACK2.block;
                    if (this._matchesBranchStart(statement, controlNode, elseBlock)) {
                        requiredCondition = false;
                    }
                } else {
                    // If there is no else branch, we need to look at the true branch?
                    requiredCondition = true;
                }
                break;
            }

            // Time-dependent execution halting blocks.
            case 'control_wait':
            case 'looks_thinkforsecs':
            case 'looks_sayforsecs':
            case 'motion_glidesecstoxy':
            case 'motion_glideto':
            case 'sound_playuntildone':
            case 'text2speech_speakAndWait': {
                requiredCondition = true;
                break;
            }
        }
        return requiredCondition;
    }

    _matchesBranchStart(statement: GraphNode, controlNode: GraphNode, branchStartId: string): boolean {
        let cur = statement;
        const traversed = [];
        while (cur && cur.id !== controlNode.id && !traversed.includes(cur)) {
            traversed.push(cur);
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
     *  - the child of an execution halting block
     *  - the last block inside a branching statement
     *  - the last block inside a block of statements being dependent on a hatBlock
     *  We call the blocks of independent fitnessFunctions mergeBlocks since all blocks contained in the same branch
     *  or block of hat related statements can be merged into them without loosing any information needed to achieve
     *  full coverage during search.
     * @param fitnessFunctions the fitnessFunctions  which will be filtered to contain only independent functions.
     * @returns Map mapping hatBlocks or branchingBlocks to their last independent Block
     */
    public static getMergeNodeMap(fitnessFunctions: StatementFitnessFunction[]): Map<StatementFitnessFunction, StatementFitnessFunction[]> {
        const mergeNodeMap = new Map<GraphNode, GraphNode[]>();
        for (const fitnessFunction of fitnessFunctions) {

            // Handling of an execution halting block.
            if (ControlFilter.executionHaltingBlock(fitnessFunction._targetNode.block)) {
                const childNode = this.getChildOfNode(fitnessFunction._targetNode, fitnessFunction._cdg);
                if (childNode !== undefined) {
                    mergeNodeMap.set(fitnessFunction._targetNode, [childNode]);
                }
            }

            // Handling of branching blocks
            if (ControlFilter.branch(fitnessFunction._targetNode.block)) {
                // Get all nodes being dependent on the branching block.
                let mergeNodes = [...fitnessFunction._cdg._successors.get(fitnessFunction._targetNode.id).values()];

                // Now we have to find the last block in the branch. This can be either
                // 1) a block without a child
                const lastBlock = mergeNodes.filter(node => node.block !== undefined && !node.block.next);

                // 2) or a block whose child is a branch --> nested branches
                const filterNestedBranches = (node) => {
                    if (node.block.next == undefined) {
                        return false;
                    }
                    const childOfNode = StatementFitnessFunction.getChildOfNode(node, fitnessFunction._cdg);
                    if (childOfNode == undefined) {
                        return false;
                    }
                    return ControlFilter.branch(childOfNode.block);
                };
                const nestedBranches = mergeNodes.filter(node => node.block !== undefined && filterNestedBranches(node));

                // Now we combine both possibilities.
                mergeNodes = [...lastBlock, ...nestedBranches];

                // Filter single branch blocks, they are contained within their own mergeMap key.
                mergeNodes = mergeNodes.filter(node => !ControlFilter.singleBranch(node.block));

                // Add the branching block if it isn't present
                if (!mergeNodes.includes(fitnessFunction._targetNode)) {
                    mergeNodes.push(fitnessFunction._targetNode);
                }

                // In case of nested branches we have blocks which can be merged, namely the block in front of the nested
                // branching block and the actual last block of the branch. We remove the block located in front of the
                // nested branch since it is already covered by the true last block.
                // SingleControlDependenceBlocks should only contain two nodes: themselves and their last block
                // DoubleControlDependenceBlocks should only contain three nodes: themselves, last if block and last else block
                if ((ControlFilter.singleBranch(fitnessFunction._targetNode.block) && mergeNodes.length > 2)
                    || (ControlFilter.doubleBranch(fitnessFunction._targetNode.block) && mergeNodes.length > 3)) {
                    mergeNodes = this.findLastDescendants(mergeNodes, fitnessFunction);
                }

                mergeNodeMap.set(fitnessFunction._targetNode, mergeNodes);
            }
                // When dealing with hatBlocks we always include the hatBlock itself
            // and the last statement of the given block of statements depending on the given hatBlock.
            else if (ControlFilter.hatBlock(fitnessFunction._targetNode.block) ||
                CustomFilter.defineBlock(fitnessFunction._targetNode.block)) {
                const mergeNodes: GraphNode[] = [];
                const hatNode = fitnessFunction._targetNode;
                // Add hatBlock.
                mergeNodes.push(hatNode);
                // Find and add the last statement in the block of statements being dependent on the hatBlock.
                let childNode = StatementFitnessFunction.getChildOfNode(hatNode, fitnessFunction._cdg);
                while (childNode) {
                    if (!childNode.block.next) {
                        mergeNodes.push(childNode);
                        break;
                    }
                    childNode = StatementFitnessFunction.getChildOfNode(childNode, fitnessFunction._cdg);
                }
                mergeNodeMap.set(fitnessFunction._targetNode, mergeNodes);
            }
        }
        // Map the independent Nodes to the corresponding StatementCoverageFitness-Functions.
        const statementMap = new Map<StatementFitnessFunction, StatementFitnessFunction[]>();
        mergeNodeMap.forEach(((value, key) => {
            const keyStatement = fitnessFunctions[fitnessFunctions.findIndex(fitnessFunction => fitnessFunction._targetNode === key)];
            const valueStatements = fitnessFunctions.filter(fitnessFunction => value.includes(fitnessFunction._targetNode));
            statementMap.set(keyStatement, valueStatements);
        }));
        return statementMap;
    }

    /**
     * Extracts statements from the CDG that are immediate children of already covered statements.
     * @param allStatements of the Scratch program.
     * @param uncoveredStatements uncovered subset of allStatements.
     * @returns uncovered immediate children of already covered statements.
     */
    public static getNearestUncoveredStatements(allStatements: StatementFitnessFunction[], uncoveredStatements: StatementFitnessFunction[]): Set<StatementFitnessFunction> {
        const nearestUncoveredStatements = new Set<StatementFitnessFunction>();
        const cdg = uncoveredStatements[0]._cdg;
        const uncoveredKeys = uncoveredStatements.map(node => node.getTargetNode().id);
        Container.debugLog(`CDG:\n${cdg.toCoverageDot(uncoveredKeys)}`);
        for (const statement of uncoveredStatements) {
            const parents = StatementFitnessFunction.getCDGParent(statement._targetNode, cdg);
            if (!parents) {
                throw (`Undefined parent of ${statement._targetNode.id}; cdg: ${cdg.toCoverageDot(uncoveredKeys)}`);
            }
            for (const parent of parents) {
                const parentStatement = StatementFitnessFunction.mapNodeToStatement(parent, allStatements);
                if (!uncoveredStatements.includes(parentStatement) || parentStatement._targetNode.id === statement._targetNode.id) {
                    nearestUncoveredStatements.add(statement);
                }
            }
        }
        return nearestUncoveredStatements;
    }

    /**
     * Maps a node in the CDG to the corresponding Scratch Statement.
     * @param node the CDG node.
     * @param allStatements all Scratch statements.
     * @returns Scratch Statement matching to the given CDG node.
     */
    public static mapNodeToStatement(node: GraphNode, allStatements: StatementFitnessFunction[]): StatementFitnessFunction {
        for (const statement of allStatements) {
            if (statement.getTargetNode().id === node.id) {
                return statement;
            }
        }
        return undefined;
    }

    /**
     * Fetches the direct node parent of the given node.
     * @param node the node whose parent should be fetched
     * @param cdg the control dependence graph which contains all blocks and hence the parent of node
     * @returns parent of node
     */
    private static getParentOfNode(node: GraphNode, cdg: ControlDependenceGraph): GraphNode {
        if (node.block.parent) {
            return cdg._nodes[node.block.parent];
        } else {
            return undefined;
        }
    }

    /**
     * Extracts the direct CDG parent of a given node.
     * @param node the node whose parent should be found.
     * @param cdg the control dependence graph based on which a direct ancestor should be found.
     * @return parent node of the given child node.
     */
    public static getCDGParent(node: GraphNode, cdg: ControlDependenceGraph): GraphNode[] {
        const predecessors = Array.from(cdg.predecessors(node.id)) as GraphNode[];
        const flagClickedParent = predecessors.find(node => node.id === 'flagclicked');

        // If we have direct successors of the flagClicked event, use this as a CDG parent since this parent will
        // always be reached. (Should only evaluate to true when selecting the first statement).
        if (flagClickedParent !== undefined) {
            return [flagClickedParent];
        }

        // Parents could be EventNodes, for example when having a block that depends on a clone being created.
        if (predecessors.some(pred => pred instanceof EventNode)) {
            const eventNodes = predecessors.filter(pred => pred instanceof EventNode && pred.id != node.id);
            const eventPredecessors = [];
            // Fetch the parent of every EventNode parent...
            for (const eventNode of eventNodes) {
                eventPredecessors.push(StatementFitnessFunction.getCDGParent(eventNode, cdg));
            }
            return eventPredecessors.flat();
        }

        // For user event blocks like key press just return the hat block.
        else if (predecessors.length === 1 && predecessors[0] instanceof UserEventNode) {
            return [node];
        }

        // Statements with a self reference
        else if (predecessors.length > 1) {
            const filtered = predecessors.filter(node => node.block !== undefined);
            if (filtered.length === 1 && filtered[0].id === node.id) {
                return [node];
            }
        }

        // Otherwise, make sure to filter for StatementBlocks and duplicates as in repeat blocks.
        return predecessors.filter(pred => pred.block !== undefined && pred.id !== node.id);
    }

    /**
     * Fetches the child of the given node.
     * @param node the node whose child should be fetched
     * @param cdg the control dependence graph which contains all blocks and hence the child of node
     * @returns child of node
     */
    private static getChildOfNode(node: GraphNode, cdg: ControlDependenceGraph): GraphNode {
        if (node.block.next) {
            return cdg._nodes[node.block.next];
        } else {
            return undefined;
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
    private static findLastDescendants(nodes: GraphNode[], controlFitness: StatementFitnessFunction): GraphNode[] {
        const controlNode = controlFitness._targetNode;
        const nodesToRemove: GraphNode[] = [];
        for (const node of nodes) {
            if (node === controlNode) {
                continue;
            }
            let parent = StatementFitnessFunction.getParentOfNode(node, controlFitness._cdg);
            // Traverse the block hierarchy upwards until we reach the given control node or a Hat-Block
            while (parent !== undefined && parent.id !== controlNode.id) {
                // We found another potential lastDescendant so the found one cannot be the last one.
                if (nodes.includes(parent)) {
                    nodesToRemove.push(parent);
                }
                parent = StatementFitnessFunction.getParentOfNode(parent, controlFitness._cdg);
            }
        }
        return nodes.filter(node => !nodesToRemove.includes(node));
    }

    public toString = (): string => {
        return `${this._targetNode.id} of type ${this._targetNode.block.opcode}`;
    }

    public getNodeId():string {
        return `${this._targetNode.id}`;
    }
}
