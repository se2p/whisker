// vis-network ships a DOT parser, used for the compact Grid view. The Graph view instead renders each
// target's actual scripts as real Scratch blocks (see block-workspace.js) rather than the CDG's abstract
// node/edge structure - a real script's own nesting/order already shows control dependency visually.
const vis = require('vis-network');
const Modal = require('./modal');
const {createWorkspace, renderTarget, highlightBlocks} = require('./block-workspace');

// Re-rendering on every single iteration is unnecessary
const MIN_RENDER_INTERVAL_MS = 500;

// Drives the toggle-button setup/update loop below instead of writing out each button by hand.
const VIEW_I18N_KEYS = {graph: 'viewGraph', grid: 'viewGrid'};

// Not translated yet: there are no locale keys for this card's text.
const TEXT = {
    title: 'CDG Coverage',
    emptyMessage: 'Start a search to see the covered/targeted control dependence graph',
    viewGraph: 'Blocks',
    viewGrid: 'Grid'
};

class CdgGraph {
    constructor(container) {
        this._lastData = null;
        this._lastRenderTime = 0;
        this._viewMode = 'graph'; // 'graph' | 'grid'
        this._selectedTargetName = null;
        // each gets {blocksEl, gridEl, targetSelect, workspace, renderedTargetName} in _buildUI
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
            view.blocksEl.style.display = 'none';
            view.gridEl.style.display = 'none';
            view.gridEl.innerHTML = '';
            view.renderedTargetName = null;
        }
        this._modal.close();
        // A new project may have different sprites, so re-derive the target list from it.
        this._rebuildTargetSelects();
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
                <select class="network-topology-generation cdg-graph-target-select"></select>
                <span style="flex:1;"></span>
                <div class="cdg-graph-view-toggle">
                    <button type="button" class="cdg-graph-view-btn cdg-graph-view-btn--graph"></button>
                    <button type="button" class="cdg-graph-view-btn cdg-graph-view-btn--grid"></button>
                </div>
                <span class="network-topology-expand-hint">⤢</span>
            </div>
            <div class="cdg-graph-empty"></div>
            <div class="cdg-graph-blocks" style="display:none;"></div>
            <div class="cdg-graph-grid" style="display:none;"></div>`;
        container.appendChild(card);

        this._card = card;
        this._titleEl = card.querySelector('.cdg-graph-title');
        this._emptyEl = card.querySelector('.cdg-graph-empty');
        this._titleEl.textContent = TEXT.title;
        this._emptyEl.textContent = TEXT.emptyMessage;
        this._views.card.blocksEl = card.querySelector('.cdg-graph-blocks');
        this._views.card.gridEl = card.querySelector('.cdg-graph-grid');
        this._views.card.targetSelect = card.querySelector('.cdg-graph-target-select');
        this._wireTargetSelect(this._views.card);

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
        this._modal.titleEl.insertAdjacentHTML('afterend',
            '<select class="network-topology-generation cdg-graph-target-select"></select>');
        this._modal.bodyEl.innerHTML = `
            <div class="cdg-graph-blocks cdg-graph-blocks--modal"></div>
            <div class="cdg-graph-grid cdg-graph-grid--modal"></div>`;
        this._views.modal.blocksEl = this._modal.bodyEl.querySelector('.cdg-graph-blocks--modal');
        this._views.modal.gridEl = this._modal.bodyEl.querySelector('.cdg-graph-grid--modal');
        this._views.modal.targetSelect = this._modal.el.querySelector('.cdg-graph-target-select');
        this._wireTargetSelect(this._views.modal);

        this._rebuildTargetSelects();
    }

    _wireTargetSelect(view) {
        view.targetSelect.addEventListener('click', e => e.stopPropagation());
        view.targetSelect.addEventListener('change', () => {
            this._selectedTargetName = view.targetSelect.value;
            for (const other of Object.values(this._views)) other.targetSelect.value = this._selectedTargetName;
            if (this._lastData) this._renderVisibleViews();
        });
    }

    // Populates both target selects from the live project (sprites + Stage; clones share their original's
    // blocks so they're skipped).
    _rebuildTargetSelects() {
        const targets = (window.Whisker.scratch.vm.runtime.targets || [])
            .filter(t => t.isStage || t.isOriginal);
        if (!this._selectedTargetName || !targets.some(t => t.getName() === this._selectedTargetName)) {
            this._selectedTargetName = targets.length > 0 ? targets[0].getName() : null;
        }
        for (const view of Object.values(this._views)) {
            view.targetSelect.innerHTML = targets
                .map(t => `<option value="${t.getName()}">${t.isStage ? 'Stage' : t.getName()}</option>`).join('');
            view.targetSelect.value = this._selectedTargetName;
        }
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

    // Once every statement is covered nothing can still be a target, so a block the backend left marked as
    // targeted is just the last one covered and is shown as covered instead.
    _effectiveHighlight() {
        const {covered, total, coveredBlockIds, targetedBlockIds} = this._lastData;
        const isFullyCovered = total > 0 && covered === total;
        return {coveredBlockIds, targetedBlockIds: isFullyCovered ? [] : targetedBlockIds};
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
        const {covered, total} = this._lastData;
        this._titleEl.textContent = `${TEXT.title} — ${covered}/${total} statements`;

        this._renderView('card');
        if (this._modal.isOpen()) this._renderView('modal');
    }

    // Shows/hides the blocks vs. grid container for the given view (card or modal) and renders into
    // whichever is active.
    _renderView(key) {
        const view = this._views[key];
        if (this._viewMode === 'graph') {
            view.gridEl.style.display = 'none';
            view.blocksEl.style.display = '';
            this._renderBlocksView(view, key === 'card');
        } else {
            view.blocksEl.style.display = 'none';
            view.gridEl.style.display = '';
            this._renderGrid(view.gridEl, vis.parseDOTNetwork(this._lastData.dot));
        }
    }

    // A target's scripts (their structure/position) never change during a run, so the workspace is only
    // (re-)populated when it doesn't exist yet or the selected target changed; every other update just
    // re-applies the covered/targeted outline to the existing blocks.
    _renderBlocksView(view, isCard) {
        if (!this._selectedTargetName) return;
        if (!view.workspace) view.workspace = createWorkspace(view.blocksEl, {scrollable: !isCard});
        if (view.renderedTargetName !== this._selectedTargetName) {
            const target = window.Whisker.scratch.vm.runtime.targets
                .find(t => t.getName() === this._selectedTargetName);
            if (!target) return;
            renderTarget(view.workspace, target);
            view.renderedTargetName = this._selectedTargetName;
        }
        highlightBlocks(view.workspace, this._effectiveHighlight());
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
