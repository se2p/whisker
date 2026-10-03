// Shows a sprite's (or the Stage's) actual scripts as real Scratch blocks, laid out as the user built them, with
// the covered/targeted statements highlighted (see block-workspace.js).
const Modal = require('./modal');
const {
    createWorkspace, renderTarget, resizeWorkspace, highlightBlocks, effectiveHighlight, MIN_RENDER_INTERVAL_MS,
    coverageTitle
} = require('./block-workspace');

const TEXT = {
    title: 'Source Code',
    emptyMessage: 'Start a search to see which blocks are covered and targeted'
};

class SourceCode {
    constructor(container) {
        this._lastData = null;
        this._lastRenderTime = 0;
        this._selectedTargetName = null;
        // each gets {blocksEl, targetSelect, workspace, renderedTargetName} in _buildUI
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
            view.renderedTargetName = null;
        }
        this._modal.close();
        // A new project may have different sprites, so re-derive the target list from it.
        this._rebuildTargetSelects();
    }

    startEmpty() {
        this.reset();
    }

    // The card may have been updated while hidden (e.g. on the Results tab), in which case Blockly rendered
    // into a zero-size container and drew nothing. Force a full re-render once it becomes visible again.
    refresh() {
        if (this._views.card.workspace) resizeWorkspace(this._views.card.workspace);
    }

    _buildUI(container) {
        const card = document.createElement('div');
        card.className = 'source-code-card';
        card.setAttribute('data-i18n', '[title]click-to-expand');
        card.innerHTML = `
            <div class="source-code-header">
                <span class="source-code-title"></span>
                <select class="network-topology-generation source-code-target-select"></select>
                <span style="flex:1;"></span>
                <span class="network-topology-expand-hint">⤢</span>
            </div>
            <div class="source-code-empty"></div>
            <div class="source-code-blocks" style="display:none;"></div>`;
        container.appendChild(card);
        Modal.makeCollapsible(card, card.querySelector('.source-code-header'));

        this._card = card;
        this._titleEl = card.querySelector('.source-code-title');
        this._emptyEl = card.querySelector('.source-code-empty');
        this._titleEl.textContent = TEXT.title;
        this._emptyEl.textContent = TEXT.emptyMessage;
        this._views.card.blocksEl = card.querySelector('.source-code-blocks');
        this._views.card.targetSelect = card.querySelector('.source-code-target-select');
        this._wireTargetSelect(this._views.card);

        card.addEventListener('click', () => this._openModal());

        this._modal = new Modal();
        this._modal.titleEl.textContent = TEXT.title;
        this._modal.titleEl.insertAdjacentHTML('afterend',
            '<select class="network-topology-generation source-code-target-select"></select>');
        this._modal.bodyEl.innerHTML = '<div class="source-code-blocks source-code-blocks--modal"></div>';
        this._views.modal.blocksEl = this._modal.bodyEl.querySelector('.source-code-blocks--modal');
        this._views.modal.targetSelect = this._modal.el.querySelector('.source-code-target-select');
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

    _openModal() {
        if (!this._lastData) return;
        this._modal.open();
        this._renderView('modal');
    }

    _update(data) {
        this._lastData = data;
        this._emptyEl.style.display = 'none';

        // _lastData above still gets updated, so opening the modal always shows the latest state.
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

    // A target's scripts (their structure/position) never change during a run, so the workspace is only
    // (re-)populated when it doesn't exist yet or the selected target changed; every other update just
    // re-applies the covered/targeted outline to the existing blocks. The small card preview is not
    // scrollable (scripts are just clipped there); the expanded modal is.
    _renderView(key) {
        const view = this._views[key];
        view.blocksEl.style.display = '';
        if (!this._selectedTargetName) return;
        if (!view.workspace) view.workspace = createWorkspace(view.blocksEl, {scrollable: key === 'modal'});
        if (view.renderedTargetName !== this._selectedTargetName) {
            const target = window.Whisker.scratch.vm.runtime.targets
                .find(t => t.getName() === this._selectedTargetName);
            if (!target) return;
            renderTarget(view.workspace, target);
            view.renderedTargetName = this._selectedTargetName;
        }
        highlightBlocks(view.workspace, effectiveHighlight(this._lastData));
    }
}

module.exports = SourceCode;
