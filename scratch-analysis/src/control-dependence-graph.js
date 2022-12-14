import {cloneGraph, Edge, Graph, GraphNode, reverseGraph} from './graph-utils';
import {computePostDominatedTree, PostDominatorTree} from './post-dominator-tree'; // eslint-disable-line no-unused-vars
import {ControlFlowGraph} from './control-flow-graph';

class ControlDependenceGraph extends Graph {
}

/**
 * Adds the given start node to the CFG.
 *
 * @param {ControlFlowGraph} cfg - the control flow graph which is augmented.
 * @param {GraphNode} start - the start node which is added to the CFG.
 * @private
 */
const _augmentCFG = (cfg, start) => {
    cfg.addNode(start);
    cfg.addEdge(start, cfg.entry());
    cfg.addEdge(start, cfg.exit());
};

/**
 * "Find S, a set of edges in the CFG such that in the post-dominator tree
 * the edge target is not an ancestor of the target source."
 *
 * @param {ControlFlowGraph} cfg - the control flow graph.
 * @param {PostDominatorTree} reversedPDT - the reversed PDT, to find ancestors easier.
 * @returns {Set<Edge>} - a set of edges.
 * @private
 */
const _findEdgeSetS = (cfg, reversedPDT) => {
    const allNodes = new Set(cfg.getAllNodes());
    const edges = new Set();

    for (const node of allNodes) {
        for (const succ of cfg.successors(node.id)) {
            if (!reversedPDT.getTransitiveSuccessors(node).has(succ)) {
                edges.add(new Edge(node, succ));
            }
        }
    }
    return edges;
};

/**
 * Computes the least common ancestor for each edge from a set of edges and returns a mapping from
 * edge to computed least common ancestor, the controlling dependency of both edge nodes.
 *
 * @param {PostDominatorTree} postDominatedTree - the PDT used to extract the information.
 * @param {Set<Edge>} edges - a set of edges for which the least common ancestor is computed.
 * @returns {Map<Edge, GraphNode>} - a mapping from edges to a single node, the least common ancestor.
 * @private
 */
const _computeLeastCommonAncestors = (postDominatedTree, edges) => {
    const leastCommonAncestors = new Map();

    for (const edge of edges) {
        const leastCommonAncestor = postDominatedTree.getLeastCommonAncestor(edge.from, edge.to);
        leastCommonAncestors.set(edge, leastCommonAncestor);
    }
    return leastCommonAncestors;
};


/**
 * Finds and returns all control dependencies between nodes using the PDT as well as edges and their
 * least common ancestor.
 *
 * @param {PostDominatorTree} postDominatedTree - the PDT used to extract the information.
 * @param {Set<Edge>} edges - a set of edges.
 * @param {Map<Edge, GraphNode>} leastCommonAncestors - a mapping from edges to the least common ancestor,
 *                                                      the control dependency of the edge nodes.
 * @returns {Map<GraphNode, Set<GraphNode>>} - a mapping from nodes to their control dependencies.
 * @private
 */
const _findControlDependencies = (postDominatedTree, edges, leastCommonAncestors) => {
    const controlDependencyMap = new Map();

    for (const edge of edges) {
        const markedNodes = new Set();
        const l = leastCommonAncestors.get(edge);

        if (edge.from === l) {
            markedNodes.add(l);
        }

        let current = edge.to;
        while (current !== undefined && current !== l) {
            markedNodes.add(current);
            const preds = new Set(postDominatedTree.predecessors(current.id));
            // We can just assume preds has size === 1
            current = preds.values().next().value;
        }

        const alreadyMarked = controlDependencyMap.get(edge.from);
        if (alreadyMarked) {
            for (const marked of alreadyMarked) {
                markedNodes.add(marked);
            }
        }
        controlDependencyMap.set(edge.from, markedNodes);
    }
    return controlDependencyMap;
};

/**
 * Computes and returns a Control Dependence Graph (CDG) from a CFG and its corresponding PDT.
 *
 * @param {ControlFlowGraph} cfg - the control flow graph the CDG is generated from.
 * @param {PostDominatorTree} postDominatedTree - the PDT.
 * @param {PostDominatorTree} reversedPDT - the PDT, but reversed.
 * @returns {ControlDependenceGraph} - the resulting Control Dependence Graph (CDG).
 * @private
 */
const _computeControlDependenceGraph = (cfg, postDominatedTree, reversedPDT) => {
    const start = new GraphNode('start');
    const controlDependenceGraph = new ControlDependenceGraph(start);

    _augmentCFG(cfg, start);

    const allNodes = new Set(cfg.getAllNodes());
    for (const node of allNodes) {
        controlDependenceGraph.addNode(node);
    }

    // Find S, a set of edges in the CFG such that in the post-dominator tree
    // the edge target is not an ancestor of the target source.
    const edges = _findEdgeSetS(cfg, reversedPDT);

    // For each edge in S, find L, the least common ancestor in PDT
    const leastCommonAncestors = _computeLeastCommonAncestors(postDominatedTree, edges);

    // Consider each edge (A,B) in S and its corresponding L.
    // Traverse backwards in PDT from B to L, marking each node visited;
    // mark L only if L = A.
    const controlDependencyMap = _findControlDependencies(postDominatedTree, edges, leastCommonAncestors);

    // Statements representing all marked nodes are control dependent on A with
    // the label that is on edge (A,B).
    for (const [node, controlDependencies] of controlDependencyMap.entries()) {
        for (const controlDependency of controlDependencies) {
            controlDependenceGraph.addEdge(node, controlDependency);
        }
    }

    return controlDependenceGraph;
};

/**
 * Generates and returns a Control Dependence Graph (CDG) for
 * a given Control Flow Graph (CFG), which is not altered.
 *
 * @param {ControlFlowGraph} cfg - the control flow graph the control dependence graph is generated from.
 * @returns {ControlDependenceGraph} the generated control dependence graph.
 */
const generateCDG = cfg => {
    cfg = cloneGraph(cfg);
    const postDominatedTree = computePostDominatedTree(cfg);
    const reversedPostDominatedTree = reverseGraph(postDominatedTree);
    return _computeControlDependenceGraph(cfg, postDominatedTree, reversedPostDominatedTree);
};

export {
    generateCDG,
    ControlDependenceGraph
};
