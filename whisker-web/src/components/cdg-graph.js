// vis-network is already a project dependency and ships a DOT parser, so no extra dependency or
// webpack configuration is needed to render the CDG_UPDATE dot string sent by the backend.
const vis = require('vis-network');

// The CDG is a DAG, so a hierarchical layout gives deterministic positions in one pass, without running
// vis-network's force-directed physics simulation or its "improvedLayout" pre-clustering heuristic - both
// are what made large (~300+ node) graphs lag, since CDG_UPDATE fires every search iteration and would
// otherwise re-trigger them on every single render.
const NETWORK_OPTIONS = {
    edges: {arrows: 'to', smooth: {type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.5}},
    nodes: {shape: 'box', shapeProperties: {borderRadius: 4}, margin: 6, font: {size: 11}},
    physics: false,
    layout: {
        improvedLayout: false,
        // nodeSpacing is center-to-center distance between same-level nodes; it needs to clear each box's
        // actual rendered width (label + margin), not just look generously large in isolation.
        hierarchical: {direction: 'UD', sortMethod: 'hubsize', levelSeparation: 110, nodeSpacing: 180}
    },
    interaction: {dragView: true, zoomView: true}
};

// Re-rendering on every single iteration is unnecessary - nobody can read a graph redrawing dozens of
// times a second - and, for large graphs, is itself a real cost - skip renders that arrive faster than this.
const MIN_RENDER_INTERVAL_MS = 500;

class CdgGraph {
    constructor(container, i18n = {}) {
        this._i18n = {
            title: i18n.title || 'CDG Coverage',
            emptyMessage: i18n.emptyMessage || 'Start a search to see the covered/targeted control dependence graph',
            expand: i18n.expand || 'Click to expand',
            viewGraph: i18n.viewGraph || 'Graph',
            viewGrid: i18n.viewGrid || 'Grid'
        };
        this._lastData = null;
        this._lastRenderTime = 0;
        this._network = null;
        this._modalNetwork = null;
        this._viewMode = 'graph'; // 'graph' | 'grid'
        this._buildUI(container);
        window.Whisker.scratch.vm.on('CDG_UPDATE', data => this._update(data));
    }

    reset() {
        this._lastData = null;
        this._lastRenderTime = 0;
        this._titleEl.textContent = this._i18n.title;
        this._emptyEl.style.display = '';
        this._graphEl.style.display = 'none';
        this._gridEl.style.display = 'none';
        this._gridEl.innerHTML = '';
        this._modalGridEl.innerHTML = '';
        if (this._network) {
            this._network.destroy();
            this._network = null;
        }
        if (this._modalNetwork) {
            this._modalNetwork.destroy();
            this._modalNetwork = null;
        }
        this._closeModal();
    }

    startEmpty() {
        this.reset();
    }

    updateI18n(i18n) {
        this._i18n = {...this._i18n, ...i18n};
        this._titleEl.textContent = this._i18n.title;
        this._emptyEl.textContent = this._i18n.emptyMessage;
        this._card.title = this._i18n.expand;
        if (this._modalTitle) this._modalTitle.textContent = this._i18n.title;
        this._graphToggleBtn.textContent = this._i18n.viewGraph;
        this._gridToggleBtn.textContent = this._i18n.viewGrid;
    }

    _buildUI(container) {
        const card = document.createElement('div');
        card.className = 'cdg-graph-card';
        card.title = this._i18n.expand;
        card.innerHTML = `
            <div class="cdg-graph-header">
                <span class="cdg-graph-title"></span>
                <span style="flex:1;"></span>
                <div class="cdg-graph-view-toggle">
                    <button type="button" class="cdg-graph-view-btn cdg-graph-view-btn--graph"></button>
                    <button type="button" class="cdg-graph-view-btn cdg-graph-view-btn--grid"></button>
                </div>
                <span class="network-topology-expand-hint">⤢</span>
            </div>
            <div class="cdg-graph-empty"></div>
            <div class="cdg-graph-canvas" style="display:none;"></div>
            <div class="cdg-graph-grid" style="display:none;"></div>`;
        container.appendChild(card);

        this._card = card;
        this._titleEl = card.querySelector('.cdg-graph-title');
        this._emptyEl = card.querySelector('.cdg-graph-empty');
        this._graphEl = card.querySelector('.cdg-graph-canvas');
        this._gridEl = card.querySelector('.cdg-graph-grid');
        this._titleEl.textContent = this._i18n.title;
        this._emptyEl.textContent = this._i18n.emptyMessage;

        this._graphToggleBtn = card.querySelector('.cdg-graph-view-btn--graph');
        this._gridToggleBtn = card.querySelector('.cdg-graph-view-btn--grid');
        this._graphToggleBtn.textContent = this._i18n.viewGraph;
        this._gridToggleBtn.textContent = this._i18n.viewGrid;
        this._graphToggleBtn.addEventListener('click', e => {
            e.stopPropagation();
            this._setViewMode('graph');
        });
        this._gridToggleBtn.addEventListener('click', e => {
            e.stopPropagation();
            this._setViewMode('grid');
        });
        this._updateToggleButtons();

        card.addEventListener('click', () => this._openModal());

        // Reuses the same modal chrome/CSS as network-topology and coverage-curve.
        this._modal = document.createElement('div');
        this._modal.className = 'network-topology-modal';
        this._modal.innerHTML = `
            <div class="network-topology-modal-box">
                <div class="network-topology-modal-header">
                    <p class="network-topology-title"></p>
                    <button class="network-topology-modal-close">✕</button>
                </div>
                <div class="network-topology-modal-body">
                    <div class="cdg-graph-canvas cdg-graph-canvas--modal"></div>
                    <div class="cdg-graph-grid cdg-graph-grid--modal"></div>
                </div>
            </div>`;
        document.body.appendChild(this._modal);
        this._modalTitle = this._modal.querySelector('.network-topology-title');
        this._modalTitle.textContent = this._i18n.title;
        this._modalGraphEl = this._modal.querySelector('.cdg-graph-canvas--modal');
        this._modalGridEl = this._modal.querySelector('.cdg-graph-grid--modal');

        this._modal.addEventListener('click', e => {
            if (e.target === this._modal) this._closeModal();
        });
        this._modal.querySelector('.network-topology-modal-close').addEventListener('click', () => this._closeModal());
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') this._closeModal();
        });
    }

    _setViewMode(mode) {
        if (this._viewMode === mode) return;
        this._viewMode = mode;
        this._updateToggleButtons();
        if (this._lastData) {
            this._renderCurrentView(this._graphEl, this._gridEl, this._network, m => (this._network = m));
            if (this._modal.classList.contains('network-topology-modal--open')) {
                this._renderCurrentView(this._modalGraphEl, this._modalGridEl, this._modalNetwork, m => (this._modalNetwork = m));
            }
        }
    }

    _updateToggleButtons() {
        this._graphToggleBtn.classList.toggle('cdg-graph-view-btn--active', this._viewMode === 'graph');
        this._gridToggleBtn.classList.toggle('cdg-graph-view-btn--active', this._viewMode === 'grid');
    }

    _openModal() {
        if (!this._lastData) return;
        this._modal.classList.add('network-topology-modal--open');
        this._renderCurrentView(this._modalGraphEl, this._modalGridEl, this._modalNetwork, m => (this._modalNetwork = m));
    }

    _closeModal() {
        this._modal.classList.remove('network-topology-modal--open');
    }

    _update(data) {
        this._lastData = data;
        this._emptyEl.style.display = 'none';

        // Skip the actual (expensive, for large graphs) re-render if the previous one is still fresh;
        // _lastData above still gets updated, so opening the modal/switching views always shows the latest state.
        const now = Date.now();
        if (this._lastRenderTime && now - this._lastRenderTime < MIN_RENDER_INTERVAL_MS) {
            return;
        }
        this._lastRenderTime = now;

        this._renderCurrentView(this._graphEl, this._gridEl, this._network, m => (this._network = m));
        if (this._modal.classList.contains('network-topology-modal--open')) {
            this._renderCurrentView(this._modalGraphEl, this._modalGridEl, this._modalNetwork, m => (this._modalNetwork = m));
        }
    }

    // Shows/hides the graph vs. grid container for the active view mode and renders into whichever is shown.
    // Parses the dot string once here (both renderers need it) and updates the title from the payload's
    // statement counts (CDG nodes are statements, so the count is always statement coverage).
    _renderCurrentView(graphEl, gridEl, network, setNetwork) {
        const parsed = vis.parseDOTNetwork(this._lastData.dot);
        const {covered, total} = this._lastData;
        this._titleEl.textContent = `${this._i18n.title} — ${covered}/${total} statements`;

        if (this._viewMode === 'graph') {
            gridEl.style.display = 'none';
            graphEl.style.display = '';
            setNetwork(this._renderNetwork(graphEl, network, parsed));
        } else {
            graphEl.style.display = 'none';
            gridEl.style.display = '';
            this._renderGrid(gridEl, parsed);
        }
    }

    // Creates the network on first use and fits the view to it once (vis-network never does this on its
    // own). The CDG's structure (nodes/edges) never changes during a run - only which nodes are covered
    // or targeted does - so later updates patch each node's color/font directly on the existing DataSet
    // instead of calling setData(), which would fully recompute the hierarchical layout from scratch
    // (the main remaining cost at scale, even with physics off) and reset the user's zoom/pan every time.
    _renderNetwork(element, network, {nodes, edges}) {
        if (network) {
            const sameTopology = network.body.data.nodes.length === nodes.length;
            if (sameTopology) {
                network.body.data.nodes.update(nodes.map(n => ({id: n.id, color: n.color, font: n.font})));
            } else {
                // Topology genuinely changed (shouldn't normally happen) - fall back to a full re-layout.
                const position = network.getViewPosition();
                const scale = network.getScale();
                network.setData({nodes, edges});
                network.moveTo({position, scale, animation: false});
            }
            return network;
        }
        network = new vis.Network(element, {nodes, edges}, NETWORK_OPTIONS);
        network.fit();
        return network;
    }

    // Renders every CDG node as one colored/glyphed cell (darkgreen+✓ covered, gold+● targeted, light+·
    // neither), wrapped into a compact multi-row grid - a much cheaper, denser alternative to the graph
    // view for very large CDGs, at the cost of not showing the control-dependency edges.
    _renderGrid(container, {nodes}) {
        container.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'cdg-graph-heatmap-grid';
        nodes.forEach(node => {
            const background = (node.color && node.color.background) || '#eef1f8';
            const cell = document.createElement('div');
            cell.className = 'cdg-graph-heatmap-cell';
            cell.style.background = background;
            cell.title = node.label || String(node.id);
            if (background === 'darkgreen') {
                cell.textContent = '✓';
                cell.classList.add('cdg-graph-heatmap-cell--dark');
            } else if (background === 'yellow') {
                cell.textContent = '●';
            } else {
                cell.textContent = '·';
            }
            grid.appendChild(cell);
        });
        container.appendChild(grid);
    }
}

module.exports = CdgGraph;
