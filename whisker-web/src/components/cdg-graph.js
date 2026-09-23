// The control dependence graph as a tree of real Scratch blocks (see cdg-tree.js), or as a compact grid.
const Modal = require('./modal');
const CdgTree = require('./cdg-tree');
const {
    createBlockRenderer, effectiveHighlight, highlightSets, blockState, MIN_RENDER_INTERVAL_MS, coverageTitle
} = require('./block-workspace');

// Drives the toggle-button setup/update loop below instead of writing out each button by hand.
const VIEW_I18N_KEYS = {graph: 'viewGraph', grid: 'viewGrid'};

const TEXT = {
    title: 'CDG Coverage',
    emptyMessage: 'Start a search to see the covered/targeted control dependence graph',
    viewGraph: 'Graph',
    viewGrid: 'Grid'
};

const GRID_COLORS = {covered: 'darkgreen', targeted: 'yellow', neither: 'red', structural: 'lightgray'};
const GRID_GLYPHS = {covered: '✓', targeted: '●', neither: '·', structural: '·'};

class CdgGraph {
    constructor(container) {
        this._lastData = null;
        this._lastRenderTime = 0;
        this._viewMode = 'graph'; // 'graph' | 'grid'
        this._blockRenderer = null; // created on first use, shared by both views
        // each gets {treeEl, gridEl, tree} in _buildUI
        this._views = {card: {}, modal: {}};
        this._buildUI(container);
        window.Whisker.scratch.vm.on('CDG_UPDATE', data => this._update(data));
    }

    reset() {
        this._lastData = null;
        this._lastRenderTime = 0;
        this._titleEl.textContent = TEXT.title;
        this._emptyEl.style.display = '';
        for (const view of Object.values(this._views)) {
            view.treeEl.style.display = 'none';
            view.gridEl.style.display = 'none';
            view.gridEl.innerHTML = '';
        }
        this._modal.close();
    }

    startEmpty() {
        this.reset();
    }

    _buildUI(container) {
        const card = document.createElement('div');
        card.className = 'cdg-graph-card';
        card.setAttribute('data-i18n', '[title]click-to-expand');
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
            <div class="cdg-graph-tree" style="display:none;"></div>
            <div class="cdg-graph-grid" style="display:none;"></div>`;
        container.appendChild(card);

        this._card = card;
        this._titleEl = card.querySelector('.cdg-graph-title');
        this._emptyEl = card.querySelector('.cdg-graph-empty');
        this._titleEl.textContent = TEXT.title;
        this._emptyEl.textContent = TEXT.emptyMessage;
        this._views.card.treeEl = card.querySelector('.cdg-graph-tree');
        this._views.card.gridEl = card.querySelector('.cdg-graph-grid');

        this._toggleButtons = {};
        for (const mode of Object.keys(VIEW_I18N_KEYS)) {
            const btn = card.querySelector(`.cdg-graph-view-btn--${mode}`);
            btn.textContent = TEXT[VIEW_I18N_KEYS[mode]];
            btn.addEventListener('click', e => {
                e.stopPropagation();
                this._setViewMode(mode);
            });
            this._toggleButtons[mode] = btn;
        }
        this._updateToggleButtons();

        card.addEventListener('click', () => this._openModal());

        this._modal = new Modal();
        this._modal.titleEl.textContent = TEXT.title;
        this._modal.bodyEl.innerHTML = `
            <div class="cdg-graph-tree cdg-graph-tree--modal"></div>
            <div class="cdg-graph-grid cdg-graph-grid--modal"></div>`;
        this._views.modal.treeEl = this._modal.bodyEl.querySelector('.cdg-graph-tree--modal');
        this._views.modal.gridEl = this._modal.bodyEl.querySelector('.cdg-graph-grid--modal');
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
        this._renderView('modal');
    }

    _update(data) {
        this._lastData = data;
        this._emptyEl.style.display = 'none';

        // Skip the actual (expensive, for large grids) re-render if the previous one is still fresh;
        // _lastData above still gets updated, so opening the modal/switching views always shows the latest state.
        const now = Date.now();
        if (this._lastRenderTime && now - this._lastRenderTime < MIN_RENDER_INTERVAL_MS) {
            return;
        }
        this._lastRenderTime = now;
        this._renderVisibleViews();
    }

    _renderVisibleViews() {
        this._titleEl.textContent = coverageTitle(TEXT.title, this._lastData);

        this._renderView('card');
        if (this._modal.isOpen()) this._renderView('modal');
    }

    // Shows/hides the tree vs. grid container for the given view (card or modal) and renders into
    // whichever is active.
    _renderView(key) {
        const view = this._views[key];
        if (this._viewMode === 'graph') {
            view.gridEl.style.display = 'none';
            view.treeEl.style.display = '';
            this._renderTree(view, key === 'modal');
        } else {
            view.treeEl.style.display = 'none';
            view.gridEl.style.display = '';
            this._renderGrid(view.gridEl);
        }
    }

    // The graph's structure never changes during a run, so the tree only redraws when it does; every other
    // update just re-applies the covered/targeted highlight. Only the expanded modal can be panned/zoomed.
    _renderTree(view, interactive) {
        if (!view.tree) {
            view.tree = new CdgTree(view.treeEl, blockId => this._renderBlock(blockId), {interactive});
        }
        view.tree.setGraph(this._lastData.graph);
        view.tree.setHighlight(effectiveHighlight(this._lastData));
    }

    // Draws the block with the given id (from whichever sprite owns it) with the shared block renderer.
    _renderBlock(blockId) {
        const target = this._ownerOf(blockId);
        if (!target) return null;
        if (!this._blockRenderer) this._blockRenderer = createBlockRenderer();
        return this._blockRenderer(target, blockId);
    }

    // Renders every CDG node as one colored/glyphed cell (darkgreen+✓ covered, yellow+● targeted, red+· neither,
    // gray+· structural), wrapped into a compact multi-row grid - a much cheaper, denser alternative to the
    // tree for very large CDGs, at the cost of not showing the control dependencies.
    _renderGrid(container) {
        const {graph} = this._lastData;
        const {covered, targeted} = highlightSets(effectiveHighlight(this._lastData));
        container.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'cdg-graph-heatmap-grid';
        for (const node of graph.nodes) {
            const cell = document.createElement('div');
            cell.className = 'cdg-graph-heatmap-cell';
            const isStructural = 'label' in node;
            const state = isStructural ? 'structural' : blockState(node.id, covered, targeted);
            cell.style.background = GRID_COLORS[state];
            cell.textContent = GRID_GLYPHS[state];
            if (state === 'covered') cell.classList.add('cdg-graph-heatmap-cell--dark');
            cell.title = isStructural ? node.label : this._opcodeOf(node.id);
            grid.appendChild(cell);
        }
        container.appendChild(grid);
    }

    _opcodeOf(blockId) {
        const target = this._ownerOf(blockId);
        return target ? target.blocks.getBlock(blockId).opcode : blockId;
    }

    // The sprite (or the Stage) whose scripts contain the block with the given id.
    _ownerOf(blockId) {
        return window.Whisker.scratch.vm.runtime.targets.find(t => t.blocks.getBlock(blockId));
    }
}

module.exports = CdgGraph;
