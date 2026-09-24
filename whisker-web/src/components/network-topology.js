const Modal = require('./modal');
const {
    NODE_RADIUS, COL_SPACING, V_PAD,
    groupNodesIntoColumns, drawNetworkDiagram, createHoverTooltip, attachHoverTooltip
} = require('./network-diagram');
const {i18n} = require('../index');
const {fillTargetSelect} = require('./target-select');
const {GenerationSelect} = require('./generation-select');
const PREVIEW_H = 300;

class NetworkTopology {
    constructor(container) {
        this.container = container;
        this._lastData = null;
        this._history = [];
        this._selectedKey = 'current';
        this._perTargetData = [];
        this._lastHistorySnapshot = null;
        this._buildUI();
        window.Whisker.scratch.vm.on('NETWORK_TOPOLOGY', data => this._render(data));
        window.Whisker.scratch.vm.on('NETWORK_TOPOLOGY_COVERED', data => this._onCovered(data));
        window.Whisker.scratch.vm.on('SPECIES_TARGET_ABANDONED', () => {
            this._gens.dropCurrent();
            this._gens.rebuild(this._selectedKey);
        });
        window.Whisker.scratch.vm.on('NETWORK_TOPOLOGY_HISTORY', data => this._renderHistorySnapshot(data));
    }

    // Refreshes the text that is built in JS (dropdown entry); the static text is data-i18n.
    updateI18n() {
        this._rebuildHistorySelect();
        this._gens.rebuild(this._selectedKey);
    }

    refresh() {
        if (this._lastData) this._render(this._lastData);
    }

    reset() {
        this._resetState();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._emptyEl.style.display = '';
        this.canvas.style.display = 'none';
        this.modal.close();
    }

    startEmpty() {
        this._resetState();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._emptyEl.style.display = 'none';
        this.canvas.style.display = '';
        this.modal.close();
    }

    _resetState() {
        this._lastData = null;
        this._history = [];
        this._selectedKey = 'current';
        this._perTargetData = [];
        this._lastHistorySnapshot = null;
        this._gens.reset();
        this._rebuildHistorySelect();
    }

    _buildUI() {
        const card = document.createElement('div');
        card.className = 'network-topology-card';
        card.setAttribute('data-i18n', '[title]click-to-expand');
        card.style.display = 'none';
        card.innerHTML = `
            <div class="network-topology-header">
                <select class="network-topology-generation" id="nt-generation"></select>
                <p class="modal-title" data-i18n="network-topology-title"></p>
                <select class="target-select" id="nt-history-select"></select>
                <span class="network-topology-expand-hint">⤢</span>
            </div>
            <div class="network-topology-empty" data-i18n="network-topology-empty"></div>
            <canvas id="network-topology-canvas" style="display:none;"></canvas>`;
        this.container.appendChild(card);
        Modal.makeCollapsible(card, card.querySelector('.network-topology-header'));
        this._card = card;
        this.canvas = card.querySelector('#network-topology-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.genLabel = card.querySelector('#nt-generation');
        this._gens = new GenerationSelect(this.genLabel);
        this._historySelect = card.querySelector('#nt-history-select');
        this._emptyEl = card.querySelector('.network-topology-empty');

        this.genLabel.addEventListener('click', e => e.stopPropagation());
        this.genLabel.addEventListener('change', () => {
            this._gens.selected = this.genLabel.value;
            if (this._gens.selected === 'latest') {
                this._lastHistorySnapshot = null;
                if (this._lastData) this._showSnapshot(this._lastData);
            } else {
                window.Whisker.scratch.vm.emit('REQUEST_TOPOLOGY_GEN', {generation: parseInt(this._gens.selected, 10)});
            }
        });
        this._historySelect.addEventListener('click', e => e.stopPropagation());
        this._historySelect.addEventListener('change', () => {
            this._selectedKey = this._historySelect.value;
            this._gens.selected = 'latest';
            this._lastHistorySnapshot = null;
            this._gens.rebuild(this._selectedKey);
            this._applySelection();
        });

        this.modal = new Modal();
        // The generation label sits before the title inside the shared header, inserted rather than the modal
        // dictating this header's extra controls.
        this.modal.titleEl.insertAdjacentHTML('beforebegin',
            '<span class="network-topology-generation" id="nt-modal-generation"></span>');
        this.modal.titleEl.setAttribute('data-i18n', 'network-topology-title');
        this.modal.bodyEl.innerHTML = '<canvas id="network-topology-modal-canvas"></canvas>';
        this.modalCanvas = this.modal.bodyEl.querySelector('#network-topology-modal-canvas');
        this.modalCtx = this.modalCanvas.getContext('2d');
        this.modalGenLabel = this.modal.el.querySelector('#nt-modal-generation');

        this._tooltip = createHoverTooltip();
        this._modalNodePos = null;
        this._modalConnections = null;
        this._modalNodes = null;
        attachHoverTooltip(this.modalCanvas, this._tooltip, () => ({
            nodePos: this._modalNodePos, nodes: this._modalNodes, connections: this._modalConnections
        }));

        card.addEventListener('click', () => this._openModal());
        this._rebuildHistorySelect();
    }

    _openModal() {
        if (!this._lastData) return;
        this.modal.open();
        const source = this._selectedSource();
        if (source) this._renderModal(source);
    }

    _render(data) {
        this._lastData = data;

        const activeKeys = (data.perTarget || []).map(t => t.targetKey);
        if (this._gens.track(data.generation, activeKeys)) this._gens.rebuild(this._selectedKey);

        // Only re-render if the user is watching live
        if (this._gens.selected !== 'latest') return;
        this._showSnapshot(data);
    }

    _renderHistorySnapshot(data) {
        this._lastHistorySnapshot = data;
        this._showSnapshot(data);
    }

    _showSnapshot(data) {
        this._perTargetData = data.perTarget || [];
        this._rebuildHistorySelect();
        this._applySelection();
    }

    _onCovered(data) {
        // In a single-target run, the generations seen so far were spent on the target that was just covered.
        // Many-objective runs share their generations between targets, so they keep the whole list.
        if (this._perTargetData.length === 0) this._gens.saveTarget(data.objectiveKey);
        this._history.push(data);
        this._rebuildHistorySelect();
        this._gens.rebuild(this._selectedKey);
        this._applySelection();
    }

    // The snapshot being watched: the live one, or the past generation picked in the generation dropdown.
    _activeData() {
        return this._gens.selected === 'latest' ? this._lastData : this._lastHistorySnapshot;
    }

    // The network the objective dropdown points at: the whole snapshot for 'current', one entry of a
    // many-objective snapshot for 'frontier:<key>', or the network saved when a target was covered.
    _selectedSource() {
        const key = this._selectedKey;
        const active = this._activeData();
        if (key.startsWith('frontier:')) {
            const targetKey = parseInt(key.split(':')[1], 10);
            const entry = this._perTargetData.find(t => t.targetKey === targetKey);
            return entry && active &&
                {nodes: entry.nodes, connections: entry.connections, generation: active.generation};
        }
        if (key.startsWith('covered:')) {
            // A past generation picked for that objective; otherwise the network saved when it was covered
            if (this._gens.selected !== 'latest') return active;
            const objectiveKey = parseInt(key.split(':')[1], 10);
            const entry = this._history.find(h => h.objectiveKey === objectiveKey);
            return entry && {nodes: entry.nodes, connections: entry.connections, objectiveKey};
        }
        return active;
    }

    _rebuildHistorySelect() {
        this._selectedKey = fillTargetSelect(this._historySelect, {
            frontier: this._perTargetData.map(t => ({key: t.targetKey, label: t.label})),
            previous: this._history.map(h => ({key: h.objectiveKey, label: h.label}))
        });
    }

    _applySelection() {
        const source = this._selectedSource();
        if (!source) return;
        this._emptyEl.style.display = 'none';
        this.canvas.style.display = '';

        const W = this.container.clientWidth - 32;
        if (W > 0) {
            const maxColHeight = Math.max(...groupNodesIntoColumns(source.nodes).map(c => c.length));
            const spacing = Math.min(COL_SPACING, (PREVIEW_H - V_PAD * 2) / Math.max(maxColHeight, 1));
            const radius = Math.max(3, Math.min(NODE_RADIUS, spacing * 0.35));
            this._renderToCanvas(source, this.canvas, this.ctx, this.genLabel, W, spacing, radius, PREVIEW_H);
        }
        if (this.modal.isOpen()) this._renderModal(source);
    }

    _renderModal(source) {
        const modalW = this.modalCanvas.parentElement.clientWidth - 32;
        this._renderToCanvas(source, this.modalCanvas, this.modalCtx, this.modalGenLabel,
            modalW, COL_SPACING, NODE_RADIUS);
        if (typeof source.objectiveKey === 'number') this.modalGenLabel.textContent = `Obj. ${source.objectiveKey}`;
    }

    _setGenLabelText(genLabel, text) {
        if (genLabel.tagName === 'SELECT') {
            if (this._gens.selected !== 'latest') return;
            const latestOpt = genLabel.querySelector('option[value="latest"]');
            if (latestOpt) latestOpt.textContent = text;
            else if (genLabel.options.length > 0) genLabel.options[0].textContent = text;
        } else {
            genLabel.textContent = text;
        }
    }

    // fixedH is optional — if omitted the canvas grows to fit the content
    _renderToCanvas(data, canvas, ctx, genLabel, W, spacing, radius, fixedH) {
        const {generation, nodes, connections} = data;
        // A network saved when a target was covered has no generation of its own
        if (typeof generation === 'number') this._setGenLabelText(genLabel, `${i18n.t('generation')} ${generation}`);

        const nodePos = drawNetworkDiagram(canvas, ctx, data, {width: W, spacing, radius, fixedHeight: fixedH});

        if (canvas === this.modalCanvas) {
            this._modalNodePos = nodePos;
            this._modalConnections = connections;
            this._modalNodes = nodes;
        }
    }
}

module.exports = NetworkTopology;
