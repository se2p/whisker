// Draws the control dependence graph as a top-down tree: each statement is its real Scratch block, the
// structural nodes (Entry, start, user events) are white pills, and control dependencies are black arrows.
// Layout and drawing are done here (plain SVG) - blocks are only borrowed from scratch-blocks as drawings.
const {blockState, setBlockState, highlightSets} = require('./block-workspace');

const SVG_NS = 'http://www.w3.org/2000/svg';
const H_GAP = 28;
const V_GAP = 70;
const PILL_HEIGHT = 34;
const PILL_PADDING = 18;
const FIT_MARGIN = 16;
const SELF_LOOP_WIDTH = 40;
const MAX_SCALE = 1; // when fitting the whole tree; the user can zoom in further, up to MAX_ZOOM
const MAX_ZOOM = 2;
const MIN_SCALE = 0.02;
const ZOOM_STEP = 1.15;

function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    return element;
}

class CdgTree {
    /**
     * @param {HTMLElement} container the (visible) element to draw into.
     * @param {function(string): ?{element: SVGElement, width: number, height: number}} renderBlock draws the
     *   block with the given id, or returns null if it can't be found.
     * @param {{interactive: boolean}} options whether the user can pan (drag) and zoom (wheel).
     */
    constructor(container, renderBlock, {interactive = true} = {}) {
        this._renderBlock = renderBlock;
        this._graphKey = null;
        this._blockNodes = new Map();
        this._scale = 1;
        this._offset = {x: 0, y: 0};
        this._bounds = {width: 0, height: 0};

        this._svg = svgElement('svg', {class: 'cdg-tree-svg', width: '100%', height: '100%'});
        this._svg.appendChild(this._createArrowHead());
        this._viewport = svgElement('g');
        this._edges = svgElement('g');
        this._nodes = svgElement('g');
        this._viewport.append(this._edges, this._nodes);
        this._svg.appendChild(this._viewport);
        container.appendChild(this._svg);
        this._container = container;
        if (interactive) this._enableInteraction();
    }

    // Draws `graph` ({nodes: [{id, label?}], edges: [{from, to}]}) unless that exact graph is already drawn.
    // Only structural nodes have a label; every other node is drawn as its block.
    setGraph(graph) {
        const key = graph.nodes.map(node => node.id).join('|');
        if (key === this._graphKey) return;
        this._graphKey = key;
        this._edges.replaceChildren();
        this._nodes.replaceChildren();
        this._blockNodes.clear();

        const nodes = new Map(graph.nodes.map(node => [node.id, this._createNode(node)]));
        this._layout(nodes, graph.edges);
        this._drawEdges(nodes, graph.edges);
        this.fit();
    }

    // Outlines the covered/targeted blocks and dims the others (see block-workspace.js).
    setHighlight(highlight) {
        const {covered, targeted} = highlightSets(highlight);
        for (const [id, element] of this._blockNodes) {
            setBlockState(element, blockState(id, covered, targeted));
        }
    }

    // Scales and centers the whole tree inside the container.
    fit() {
        const {width, height} = this._container.getBoundingClientRect();
        if (width === 0 || height === 0 || this._bounds.width === 0) return;
        this._scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE,
            (width - 2 * FIT_MARGIN) / this._bounds.width, (height - 2 * FIT_MARGIN) / this._bounds.height));
        this._offset = {
            x: (width - this._bounds.width * this._scale) / 2,
            y: FIT_MARGIN
        };
        this._applyTransform();
    }

    _createArrowHead() {
        const defs = svgElement('defs');
        const marker = svgElement('marker', {
            id: 'cdg-arrow',
            viewBox: '0 0 10 10',
            refX: '9',
            refY: '5',
            markerWidth: '9',
            markerHeight: '9',
            orient: 'auto-start-reverse'
        });
        marker.appendChild(svgElement('path', {d: 'M 0 0 L 10 5 L 0 10 z', fill: '#000'}));
        defs.appendChild(marker);
        return defs;
    }

    // Creates a node's drawing (not yet positioned) and remembers its size.
    _createNode(node) {
        const group = svgElement('g');
        this._nodes.appendChild(group); // attached first: a pill's width is measured from its rendered text
        const drawn = 'label' in node ? null : this._renderBlock(node.id);
        let size;
        if (drawn) {
            group.appendChild(drawn.element);
            size = drawn;
            // The highlight CSS expects the block's own group (its outline path is a direct child).
            this._blockNodes.set(node.id, drawn.element);
        } else {
            size = this._drawPill(group, node.label || '?'); // '?' when a block can't be found
        }
        return {
            id: node.id,
            group,
            width: size.width,
            height: size.height,
            children: [],
            x: 0,
            y: 0,
            subtreeWidth: 0,
            depth: 0
        };
    }

    // Draws a white pill with `label` into `group` and returns its size.
    _drawPill(group, label) {
        const text = svgElement('text', {
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            'font-size': '14',
            'font-family': 'sans-serif',
            'fill': '#000'
        });
        text.textContent = label;
        group.appendChild(text);
        const width = text.getBBox().width + 2 * PILL_PADDING;
        const height = PILL_HEIGHT;
        text.setAttribute('x', width / 2);
        text.setAttribute('y', height / 2);
        group.insertBefore(svgElement('rect', {
            width, height, 'rx': height / 2, 'fill': '#fff', 'stroke': '#000', 'stroke-width': '2'
        }), text);
        return {width, height};
    }

    // Places the nodes as a tree: a node's tree parent is the first one that reaches it (breadth-first, in
    // the order the backend sent the nodes); edges to nodes with several parents, and back edges, are still
    // drawn but don't influence the layout. Every node is centered over its children.
    _layout(nodes, edges) {
        const roots = this._buildTree(nodes, edges);
        const height = this._assignRows(nodes);

        let left = 0;
        for (const root of roots) {
            this._measure(root);
            this._place(root, left);
            left += root.subtreeWidth + H_GAP * 2;
        }
        this._bounds = {width: Math.max(left - H_GAP * 2, 0), height};
    }

    // Fills in each node's `children` and `depth` (breadth-first) and returns the roots of the resulting trees.
    _buildTree(nodes, edges) {
        const incoming = new Set(edges.map(edge => edge.to));
        const outgoing = new Map();
        for (const edge of edges) {
            if (!outgoing.has(edge.from)) outgoing.set(edge.from, []);
            outgoing.get(edge.from).push(edge.to);
        }

        const reached = new Set();
        const roots = [];
        const growFrom = root => {
            roots.push(root);
            reached.add(root.id);
            const queue = [root];
            for (let i = 0; i < queue.length; i++) {
                const parent = queue[i];
                for (const childId of outgoing.get(parent.id) || []) {
                    const child = nodes.get(childId);
                    if (!child || reached.has(childId)) continue;
                    child.depth = parent.depth + 1;
                    parent.children.push(child);
                    reached.add(childId);
                    queue.push(child);
                }
            }
        };
        for (const node of nodes.values()) if (!incoming.has(node.id)) growFrom(node);
        for (const node of nodes.values()) if (!reached.has(node.id)) growFrom(node); // only reachable in cycles
        return roots;
    }

    // Sets every node's `y` so that all nodes of a depth share a row, and returns the total height.
    _assignRows(nodes) {
        const rowHeights = [];
        for (const node of nodes.values()) {
            rowHeights[node.depth] = Math.max(rowHeights[node.depth] || 0, node.height);
        }
        const rowTops = [];
        let top = 0;
        for (let depth = 0; depth < rowHeights.length; depth++) {
            rowTops[depth] = top;
            top += rowHeights[depth] + V_GAP;
        }
        for (const node of nodes.values()) node.y = rowTops[node.depth];
        return Math.max(top - V_GAP, 0);
    }

    // Sets each node's `subtreeWidth`: the width its whole subtree needs, at least the node's own.
    _measure(node) {
        let childrenWidth = 0;
        for (const child of node.children) childrenWidth += this._measure(child) + H_GAP;
        node.subtreeWidth = Math.max(node.width, childrenWidth - H_GAP);
        return node.subtreeWidth;
    }

    // Positions the subtree of `node` starting at `left`, with the node centered over its children.
    _place(node, left) {
        const childrenWidth = node.children.reduce((sum, child) => sum + child.subtreeWidth + H_GAP, 0) - H_GAP;
        let childLeft = left + (node.subtreeWidth - childrenWidth) / 2;
        for (const child of node.children) {
            this._place(child, childLeft);
            childLeft += child.subtreeWidth + H_GAP;
        }
        if (node.children.length > 0) {
            const first = node.children[0];
            const last = node.children[node.children.length - 1];
            node.x = (first.x + last.x + last.width) / 2 - node.width / 2;
        } else {
            node.x = left + (node.subtreeWidth - node.width) / 2;
        }
        node.group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
    }

    _drawEdges(nodes, edges) {
        for (const edge of edges) {
            const from = nodes.get(edge.from);
            const to = nodes.get(edge.to);
            if (!from || !to) continue;
            const x1 = from.x + from.width / 2;
            const y1 = from.y + from.height;
            const x2 = to.x + to.width / 2;
            const y2 = to.y;
            const d = from === to ?
                `M ${from.x + from.width} ${from.y + from.height / 2} ` +
                `C ${from.x + from.width + SELF_LOOP_WIDTH} ${from.y}, ` +
                `${from.x + from.width + SELF_LOOP_WIDTH} ${from.y + from.height}, ` +
                `${from.x + from.width} ${from.y + from.height / 2}` :
                `M ${x1} ${y1} L ${x2} ${y2}`;
            this._edges.appendChild(svgElement('path', {
                d, 'fill': 'none', 'stroke': '#000', 'stroke-width': '2', 'marker-end': 'url(#cdg-arrow)'
            }));
        }
    }

    _applyTransform() {
        this._viewport.setAttribute('transform',
            `translate(${this._offset.x}, ${this._offset.y}) scale(${this._scale})`);
    }

    _enableInteraction() {
        this._svg.style.cursor = 'grab';
        this._svg.addEventListener('pointerdown', event => {
            this._svg.setPointerCapture(event.pointerId);
            this._dragStart = {x: event.clientX - this._offset.x, y: event.clientY - this._offset.y};
            this._svg.style.cursor = 'grabbing';
        });
        this._svg.addEventListener('pointermove', event => {
            if (!this._dragStart) return;
            this._offset = {x: event.clientX - this._dragStart.x, y: event.clientY - this._dragStart.y};
            this._applyTransform();
        });
        const stopDrag = () => {
            this._dragStart = null;
            this._svg.style.cursor = 'grab';
        };
        this._svg.addEventListener('pointerup', stopDrag);
        this._svg.addEventListener('pointercancel', stopDrag);
        // Zoom around the cursor, so the point under it stays put.
        this._svg.addEventListener('wheel', event => {
            event.preventDefault();
            const rect = this._svg.getBoundingClientRect();
            const pointerX = event.clientX - rect.left;
            const pointerY = event.clientY - rect.top;
            const scale = Math.max(MIN_SCALE,
                Math.min(MAX_ZOOM, this._scale * (event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP)));
            const ratio = scale / this._scale;
            this._offset = {
                x: pointerX - (pointerX - this._offset.x) * ratio,
                y: pointerY - (pointerY - this._offset.y) * ratio
            };
            this._scale = scale;
            this._applyTransform();
        }, {passive: false});
    }
}

module.exports = CdgTree;
