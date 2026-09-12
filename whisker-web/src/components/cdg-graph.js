// vis-network is already a project dependency and ships a DOT parser, so no extra dependency or
// webpack configuration is needed to render the CDG_UPDATE dot string sent by the backend.
const vis = require('vis-network');
const Modal = require('./modal');

// The CDG is a DAG, so a hierarchical layout gives deterministic positions in one pass
const NETWORK_OPTIONS = {
    edges: {arrows: 'to', smooth: {type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.5}},
    nodes: {shape: 'box', shapeProperties: {borderRadius: 4}, margin: 6, font: {size: 11}},
    physics: false,
    layout: {
        improvedLayout: false,
        hierarchical: {direction: 'UD', sortMethod: 'hubsize', levelSeparation: 110, nodeSpacing: 180}
    },
    interaction: {dragView: true, zoomView: true}
};

// Re-rendering on every single iteration is unnecessary
const MIN_RENDER_INTERVAL_MS = 500;

// Drives the toggle-button setup/update loop below instead of writing out each button by hand.
const VIEW_I18N_KEYS = {graph: 'viewGraph', grid: 'viewGrid'};

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
        this._viewMode = 'graph'; // 'graph' | 'grid'
        this._views = {card: {}, modal: {}}; // each gets {graphEl, gridEl, network} in _buildUI
        this._buildUI(container);
        window.Whisker.scratch.vm.on('CDG_UPDATE', data => this._update(data));
    }

    reset() {
        this._lastData = null;
        this._lastRenderTime = 0;
        this._titleEl.textContent = this._i18n.title;
        this._emptyEl.style.display = '';
        for (const view of Object.values(this._views)) {
            view.graphEl.style.display = 'none';
            view.gridEl.style.display = 'none';
            view.gridEl.innerHTML = '';
            if (view.network) {
                view.network.destroy();
                view.network = null;
            }
        }
        this._modal.close();
    }

    startEmpty() {
        this.reset();
    }

    updateI18n(i18n) {
        this._i18n = {...this._i18n, ...i18n};
        this._titleEl.textContent = this._i18n.title;
        this._emptyEl.textContent = this._i18n.emptyMessage;
        this._card.title = this._i18n.expand;
        this._modal.titleEl.textContent = this._i18n.title;
        for (const [mode, btn] of Object.entries(this._toggleButtons)) {
            btn.textContent = this._i18n[VIEW_I18N_KEYS[mode]];
        }
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
        this._titleEl.textContent = this._i18n.title;
        this._emptyEl.textContent = this._i18n.emptyMessage;
        this._views.card.graphEl = card.querySelector('.cdg-graph-canvas');
        this._views.card.gridEl = card.querySelector('.cdg-graph-grid');
        this._views.card.network = null;

        this._toggleButtons = {};
        for (const mode of Object.keys(VIEW_I18N_KEYS)) {
            const btn = card.querySelector(`.cdg-graph-view-btn--${mode}`);
            btn.textContent = this._i18n[VIEW_I18N_KEYS[mode]];
            btn.addEventListener('click', e => {
                e.stopPropagation();
                this._setViewMode(mode);
            });
            this._toggleButtons[mode] = btn;
        }
        this._updateToggleButtons();

        card.addEventListener('click', () => this._openModal());

        this._modal = new Modal();
        this._modal.titleEl.textContent = this._i18n.title;
        this._modal.bodyEl.innerHTML = `
            <div class="cdg-graph-canvas cdg-graph-canvas--modal"></div>
            <div class="cdg-graph-grid cdg-graph-grid--modal"></div>`;
        this._views.modal.graphEl = this._modal.bodyEl.querySelector('.cdg-graph-canvas--modal');
        this._views.modal.gridEl = this._modal.bodyEl.querySelector('.cdg-graph-grid--modal');
        this._views.modal.network = null;
    }

    _setViewMode(mode) {
        if (this._viewMode === mode) return;
        this._viewMode = mode;
        this._updateToggleButtons();
        if (this._lastData) this._renderVisibleViews();
    }

    _updateToggleButtons() {
        for (const [mode, btn] of Object.entries(this._toggleButtons)) {
            btn.classList.toggle('cdg-graph-view-btn--active', this._viewMode === mode);
        }
    }

    _openModal() {
        if (!this._lastData) return;
        this._modal.open();
        this._renderView('modal', vis.parseDOTNetwork(this._lastData.dot));
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
        this._renderVisibleViews();
    }

    // Parses the dot string once (every visible view needs it) and updates the title from the payload's
    // statement counts (CDG nodes are statements, so the count is always statement coverage), then renders
    // the card and, if open, the modal.
    _renderVisibleViews() {
        const parsed = vis.parseDOTNetwork(this._lastData.dot);
        const {covered, total} = this._lastData;
        this._titleEl.textContent = `${this._i18n.title} — ${covered}/${total} statements`;

        this._renderView('card', parsed);
        if (this._modal.isOpen()) this._renderView('modal', parsed);
    }

    // Shows/hides the graph vs. grid container for the given view (card or modal) and renders into
    // whichever is active.
    _renderView(key, parsed) {
        const view = this._views[key];
        if (this._viewMode === 'graph') {
            view.gridEl.style.display = 'none';
            view.graphEl.style.display = '';
            view.network = this._renderNetwork(view.graphEl, view.network, parsed);
        } else {
            view.graphEl.style.display = 'none';
            view.gridEl.style.display = '';
            this._renderGrid(view.gridEl, parsed);
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
