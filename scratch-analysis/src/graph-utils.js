/**
 * A mapping from arbitrary identifiers to an array of values.
 */
class Mapping {
    constructor () {
        this._values = {};
    }

    keys () {
        return Object.keys(this._values);
    }

    has (id) {
        return this._values.hasOwnProperty(id);
    }

    get (id) {
        if (!this._values.hasOwnProperty(id)) {
            return new Set();
        }
        return this._values[id];
    }
    getAsArray (id) {
        return Array.from(this.get(id));
    }

    put (id, value) {
        if (!this._values.hasOwnProperty(id)) {
            this._values[id] = new Set();
        }
        this._values[id].add(value);
    }

    set (id, values) {
        this._values[id] = new Set(values);
    }

    remove (id, value) {
        if (this._values.hasOwnProperty(id)) {
            this._values[id].delete(value);
        }
    }

    removeAll (id, values) {
        for (const value of values) {
            this.remove(id, value);
        }
    }
}

class Edge {
    constructor (from, to) {
        this.from = from;
        this.to = to;
    }

    toString () {
        return `${this.from} -> ${this.to}`;
    }
}

/**
 * Default graph node class.
 */
class GraphNode {
    constructor (id, block) {
        this.id = id;
        this.block = block;
    }

    toString () {
        if (this.block && this.block.opcode) {
            return `${this.block.opcode}:${this.id.substring(0, 2)}-${this.block.target}`;
        } else { // eslint-disable-line no-else-return
            return this.id;
        }
    }
}

/**
 * Default graph class.
 */
class Graph {
    constructor (entryNode, exitNode) {
        this._entryNode = entryNode;
        this._exitNode = exitNode;
        this._nodes = {};
        this._successors = new Mapping();
        this._predecessors = new Mapping();
    }
    successors (id) {
        return this._successors.get(id);
    }
    predecessors (id) {
        return this._predecessors.get(id);
    }

    entry () {
        return this._entryNode;
    }

    exit () {
        return this._exitNode;
    }

    addNode (node) {
        this._nodes[node.id] = node;
    }

    removeNode(node){
        delete this._nodes[node.id];
    }

    addEdge (node, successor) {
        this._predecessors.put(successor.id, node);
        this._successors.put(node.id, successor);
    }

    getNode (id) {
        return this._nodes[id];
    }

    getNodeIds () {
        return Object.keys(this._nodes);
    }

    getAllNodes () {
        return Object.values(this._nodes);
    }

    _transitivePredecessors (node, visited) {
        const predecessors = new Set();
        for (const pred of this.predecessors(node.id)) {
            if (!visited.has(pred)) {
                predecessors.add(pred);
                visited.add(pred);
                for (const pred2 of this._transitivePredecessors(pred, visited)) {
                    predecessors.add(pred2);
                }
            }
        }
        return predecessors;
    }

    _transitiveSuccessors (node, visited) {
        const successors = new Set();
        for (const succ of this.successors(node.id)) {
            if (!visited.has(succ)) {
                successors.add(succ);
                visited.add(succ);
                for (const succ2 of this._transitiveSuccessors(succ, visited)) {
                    successors.add(succ2);
                }
            }
        }
        return successors;
    }

    /**
     * Gathers and returns all transitive predecessors of a given node.
     * Transitive predecessors are all nodes which can be reached from a certain node
     * in reverse direction.
     *
     * @param {GraphNode} node - the node which transitive predecessors are returned.
     * @returns {Set<GraphNode>} - a set of all transitive predecessors.
     */
    getTransitivePredecessors (node) {
        return this._transitivePredecessors(node, new Set());
    }

    /**
     * Gathers and returns all transitive successors of a given node.
     * Transitive successors are all nodes which can be reached from a certain node.
     *
     * @param {GraphNode} node - the node which transitive successors are returned.
     * @returns {Set<GraphNode>} - a set of all transitive successors.
     */
    getTransitiveSuccessors (node) {
        return this._transitiveSuccessors(node, new Set());
    }

    _containsTransitiveSuccessors (pStartNode, pFirstNode, pSecondNode) {
        const transitiveSuccessors = this.getTransitiveSuccessors(pStartNode);
        transitiveSuccessors.add(pStartNode);
        return transitiveSuccessors.has(pFirstNode) && transitiveSuccessors.has(pSecondNode);
    }

    /**
     * Finds and returns the least common ancestor of two given nodes in this graph.
     *
     * @param {GraphNode} pFirstNode - the first node.
     * @param {GraphNode} pSecondNode - the second node.
     * @returns {GraphNode} the least common ancestor of both given nodes.
     */
    getLeastCommonAncestor (pFirstNode, pSecondNode) {
        let current = pFirstNode;
        while (!this._containsTransitiveSuccessors(current, pFirstNode, pSecondNode)) {
            // eslint-disable-next-line newline-per-chained-call
            const iterator = this.predecessors(current.id).values().next();
            if (iterator.done) {
                return current;
            }

            current = iterator.value;
        }
        return current;
    }

    toDot () {
        const edges = [];
        for (const node of this.getAllNodes()) {
            for (const succ of this.successors(node.id)) {
                edges.push(`\t"${node.toString()}" -> "${succ.toString()}";`);
            }
        }
        const renderedEdges = edges.join('\n');

        const result = `digraph ScratchProgram {\n${renderedEdges}\n}`;

        this.dot = result;
        return result;
    }

    toCoverageDot (uncoveredKeys) {
        const edges = [];
        const nodes = [];
        for (const node of this.getAllNodes()) {
            if (uncoveredKeys.includes(node.id)) {
                nodes.push(`\t"${node.toString()}" [style=filled,fillcolor=\"red\",fontcolor=\"white\"];`);
            } else {
                nodes.push(`\t"${node.toString()}" [style=filled,fillcolor=\"darkgreen\",fontcolor=\"white\"];`);
            }
            for (const succ of this.successors(node.id)) {
                edges.push(`\t"${node.toString()}" -> "${succ.toString()}";`);
            }
        }
        const renderedEdges = edges.join('\n');
        const renderedNodes = nodes.join('\n');

        const result = `digraph ScratchProgram {\n${renderedNodes}\n${renderedEdges}\n}`;

        this.dot = result;
        return result;
    }

    toString () {
        if (!this.dot) {
            return this.toDot();
        }
    }
}

/**
 * Creates a new cloned graph of a given graph.
 *
 * @param {Graph} graph - the graph to be cloned, will not be altered.
 * @returns {Graph} - a cloned graph.
 */
const cloneGraph = graph => {
    const cloned = new Graph(graph.entry(), graph.exit());
    for (const node of graph.getAllNodes()) {
        cloned.addNode(node);
        for (const succ of graph.successors(node.id)) {
            cloned.addEdge(node, succ);
        }
    }
    return cloned;
};

/**
 * Creates a new reversed graph of a given graph.
 *
 * @param {Graph} graph - the graph to be reverse, will not be altered.
 * @returns {Graph} - a reversed graph.
 */
const reverseGraph = graph => {
    const reversed = new Graph(graph.exit(), graph.entry());
    for (const node of graph.getAllNodes()) {
        reversed.addNode(node);
        for (const succ of graph.successors(node.id)) {
            reversed.addEdge(succ, node);
        }
    }
    return reversed;
};

export {
    Edge,
    GraphNode,
    Graph,
    Mapping,
    cloneGraph,
    reverseGraph
};
