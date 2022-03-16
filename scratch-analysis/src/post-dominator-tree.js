import {Graph, GraphNode, reverseGraph} from './graph-utils';
import {EventFilter} from './block-filter';
import {ControlFlowGraph, EventNode} from './control-flow-graph';

class PostDominatorTree extends Graph {
}

/**
 * Checks whether the first given set contains all elements of the second set.
 *
 * @param {Set<any>} firstSet - the first set.
 * @param {Set<any>} secondSet - the second set.
 * @returns {boolean} - true when all elements of the second set are in the first set, false otherwise.
 * @private
 */
const _containsAll = (firstSet, secondSet) => {
    for (const value of secondSet) {
        if (!firstSet.has(value)) {
            return false;
        }
    }
    return true;
};

/**
 * Computes and returns a mapping of nodes to their dominating nodes.
 *
 * @param {ControlFlowGraph} cfg - the control flow graph.
 * @returns {Map<string, Set<GraphNode>>} - mapping from node-ids to dominating nodes.
 * @private
 */
const _getDominators = cfg => {
    const entry = cfg.entry();
    const allNodes = new Set(cfg.getAllNodes());
    const dominanceMap = new Map();

    dominanceMap.set(entry.id, new Set([entry]));

    const nodesWithoutEntry = new Set(cfg.getAllNodes());
    nodesWithoutEntry.delete(entry);

    for (const node of nodesWithoutEntry) {
        dominanceMap.set(node.id, new Set(allNodes));
    }
    let changed = true;
    while (changed) {
        changed = false;
        for (const node of nodesWithoutEntry) {
            const currentDominators = dominanceMap.get(node.id);

            const newDominators = new Set();
            newDominators.add(node);

            const predecessors = new Set(cfg.predecessors(node.id));
            if (!predecessors.size) {
                continue;
            }

            // Special handling of broadcasts, so broadcast send events are NOT a control
            // dependency of their "natural" successors, but only their receiving statements.
            if (node.block && EventFilter.eventSend(node.block)) {
                for (const pred of predecessors) {
                    if (pred instanceof EventNode) {
                        predecessors.delete(pred);
                    }
                }
            }

            const firstPred = Array.from(predecessors)[0];
            const predDominators = new Set(dominanceMap.get(firstPred.id));
            predecessors.delete(firstPred);
            for (const predecessor of predecessors) {
                const currentPredDominators = dominanceMap.get(predecessor.id);
                // predDominators.intersect(currentPredDominators);
                for (const predDom of predDominators) {
                    if (!currentPredDominators.has(predDom)) {
                        predDominators.delete(predDom);
                    }
                }
            }

            for (const predDom of predDominators) {
                newDominators.add(predDom);
            }

            if (!_containsAll(currentDominators, newDominators) || !_containsAll(newDominators, currentDominators)) {
                dominanceMap.set(node.id, newDominators);
                changed = true;
            }
        }
    }
    return dominanceMap;

};

/**
 * Constructs a dominance tree for a given CFG and map of dominating nodes.
 *
 * @param {ControlFlowGraph} cfg - the control flow graph.
 * @param {Map<string, Set<GraphNode>>} dominanceMap - the mapping from node-id to dominating nodes.
 * @returns {PostDominatorTree} - the constructed dominance tree.
 * @private
 */
const _buildDominanceTree = (cfg, dominanceMap) => {
    const dominanceTree = new PostDominatorTree(cfg.entry());
    const allNodes = new Set(cfg.getAllNodes());

    const q = [];
    q.push(cfg.entry());
    for (const node of allNodes) {
        dominanceTree.addNode(node);

        dominanceMap.get(node.id).delete(node);
    }

    while (q.length) {
        const m = q.shift();
        for (const node of allNodes) {
            const dominators = dominanceMap.get(node.id);
            if (dominators.size && dominators.has(m)) {
                dominators.delete(m);
                if (!dominators.size) {
                    dominanceTree.addEdge(m, node);
                    q.push(node);
                }
            }
        }
    }
    return dominanceTree;
};

/**
 * Generates and returns a Post Dominated Tree (CDG) for
 * a given Control Flow Graph (CFG).
 *
 * @param {ControlFlowGraph} cfg - the control flow graph the PDT is generated from.
 * @returns {PostDominatorTree} - the generated post dominated tree.
 */
const computePostDominatedTree = cfg => {
    const reversedCFG = reverseGraph(cfg);
    const dominanceMap = _getDominators(reversedCFG);
    const dominanceTree = _buildDominanceTree(reversedCFG, dominanceMap);

    const start = new GraphNode('start');
    dominanceTree.addNode(start);
    dominanceTree.addEdge(dominanceTree.entry(), start);
    return dominanceTree;
};

export {
    PostDominatorTree,
    computePostDominatedTree
};
