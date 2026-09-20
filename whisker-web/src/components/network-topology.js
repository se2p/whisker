const Modal = require('./modal');
const {
    NODE_RADIUS, COL_SPACING, V_PAD,
    groupNodesIntoColumns, drawNetworkDiagram, createHoverTooltip, attachHoverTooltip
} = require('./network-diagram');
const {i18n} = require('../index');
const PREVIEW_H = 300;

class NetworkTopology {
    constructor(container) {
        this.container = container;
        this._lastData = null;
        this._history = [];
        this._selectedKey = 'current';
        this._perTargetData = [];
        this._selectedCurrentKey = null;
        this._selectedGen = 'latest';
        this._knownGenerations = [];
        this._lastHistorySnapshot = null;
        this._buildUI();
        window.Whisker.scratch.vm.on('NETWORK_TOPOLOGY', data => this._render(data));
        window.Whisker.scratch.vm.on('NETWORK_TOPOLOGY_COVERED', data => this._onCovered(data));
        window.Whisker.scratch.vm.on('NETWORK_TOPOLOGY_HISTORY', data => this._renderHistorySnapshot(data));
    }

    // Refreshes the text that is built in JS (dropdown entry); the static text is data-i18n.
    updateI18n() {
        this._historySelect.options[0].textContent = i18n.t('current-target');
    }

    refresh() {
        if (this._lastData) this._render(this._lastData);
    }

    reset() {
        this._lastData = null;
        this._history = [];
        this._selectedKey = 'current';
        this._perTargetData = [];
        this._selectedCurrentKey = null;
        this._selectedGen = 'latest';
        this._knownGenerations = [];
        this._lastHistorySnapshot = null;
        this._historySelect.innerHTML = `<option value="current">${i18n.t('current-target')}</option>`;
        this._historySelect.style.display = '';
        this._historySelect.value = 'current';
        this._currentSelect.innerHTML = '';
        this._currentGroup.style.display = 'none';
        this.genLabel.innerHTML = '';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._emptyEl.style.display = '';
        this.canvas.style.display = 'none';
        this.modal.close();
    }

    startEmpty() {
        this._lastData = null;
        this._history = [];
        this._selectedKey = 'current';
        this._perTargetData = [];
        this._selectedCurrentKey = null;
        this._selectedGen = 'latest';
        this._knownGenerations = [];
        this._lastHistorySnapshot = null;
        this._historySelect.innerHTML = `<option value="current">${i18n.t('current-target')}</option>`;
        this._historySelect.value = 'current';
        this._currentSelect.innerHTML = '';
        this._currentGroup.style.display = 'none';
        this.genLabel.innerHTML = '';
        this.genLabel.innerHTML = '';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._emptyEl.style.display = 'none';
        this.canvas.style.display = '';
        this.modal.close();
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
                <span style="flex:1;"></span>
                <div class="network-topology-current-group" id="nt-current-group" style="display:none;">
                    <span class="network-topology-current-label">Frontier</span>
                    <select class="network-topology-current-select" id="nt-current-select"></select>
                </div>
                <span class="network-topology-expand-hint">⤢</span>
            </div>
            <div class="network-topology-empty" data-i18n="network-topology-empty"></div>
            <canvas id="network-topology-canvas" style="display:none;"></canvas>`;
        this.container.appendChild(card);
        this._card = card;
        this.canvas = card.querySelector('#network-topology-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.genLabel = card.querySelector('#nt-generation');
        this._emptyEl = card.querySelector('.network-topology-empty');
        this._currentGroup = card.querySelector('#nt-current-group');
        this._currentGroup.addEventListener('click', e => e.stopPropagation());
        this.genLabel.addEventListener('click', e => e.stopPropagation());
        this.genLabel.addEventListener('change', () => {
            this._selectedGen = this.genLabel.value;
            if (this._selectedGen === 'latest') {
                this._lastHistorySnapshot = null;
                if (this._lastData) this._renderSnapshot(this._lastData);
            } else {
                window.Whisker.scratch.vm.emit('REQUEST_TOPOLOGY_GEN', {generation: parseInt(this._selectedGen, 10)});
            }
        });
        this._currentSelect = card.querySelector('#nt-current-select');
        this._currentSelect.addEventListener('change', () => {
            this._selectedCurrentKey = parseInt(this._currentSelect.value, 10);
            const active = this._perTargetData.find(t => t.targetKey === this._selectedCurrentKey);
            if (active && this._lastData) {
                const W = this.container.clientWidth - 32;
                const maxColHeight = this._maxColHeight(active.nodes);
                const spacing = Math.min(COL_SPACING, (PREVIEW_H - V_PAD * 2) / Math.max(maxColHeight, 1));
                const radius = Math.max(3, Math.min(NODE_RADIUS, spacing * 0.35));
                this._renderToCanvas(
                    {nodes: active.nodes, connections: active.connections, generation: this._lastData.generation},
                    this.canvas, this.ctx, this.genLabel, W, spacing, radius, PREVIEW_H
                );
            }
        });

        this.modal = new Modal();
        // The generation label sits before the title, the history select after it, both inside the shared
        // header - inserted around titleEl rather than the modal dictating this header's extra controls.
        this.modal.titleEl.insertAdjacentHTML('beforebegin',
            '<span class="network-topology-generation" id="nt-modal-generation"></span>');
        this.modal.titleEl.setAttribute('data-i18n', 'network-topology-title');
        this.modal.titleEl.insertAdjacentHTML('afterend', `
            <select class="network-topology-history-select" id="nt-history-select">
                <option value="current">${i18n.t('current-target')}</option>
            </select>`);
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
        this._historySelect = this.modal.el.querySelector('#nt-history-select');
        this._historySelect.addEventListener('change', () => {
            const val = this._historySelect.value;
            const modalW = this.modalCanvas.parentElement.clientWidth - 32;
            if (val.startsWith('frontier:')) {
                const key = parseInt(val.split(':')[1], 10);
                this._selectedCurrentKey = key;
                this._currentSelect.value = String(key);
                const active = this._perTargetData.find(t => t.targetKey === key);
                if (active) {
                    this._renderToCanvas(
                        {nodes: active.nodes, connections: active.connections, generation: this._lastData.generation},
                        this.modalCanvas, this.modalCtx, this.modalGenLabel, modalW, COL_SPACING, NODE_RADIUS
                    );
                }
            } else if (val.startsWith('covered:')) {
                const key = parseInt(val.split(':')[1], 10);
                const entry = this._history.find(h => h.objectiveKey === key);
                if (entry) {
                    this._renderToCanvas(
                        {generation: '', nodes: entry.nodes, connections: entry.connections},
                        this.modalCanvas, this.modalCtx, this.modalGenLabel, modalW, COL_SPACING, NODE_RADIUS
                    );
                    this.modalGenLabel.textContent = `Obj. ${entry.objectiveKey}`;
                }
            } else {
                // plain Neatest 'current'
                this._selectedKey = val;
                if (val !== 'current') {
                    const entry = this._history.find(h => String(h.objectiveKey) === val);
                    if (entry) {
                        this._renderToCanvas(
                            {generation: '', nodes: entry.nodes, connections: entry.connections},
                            this.modalCanvas, this.modalCtx, this.modalGenLabel, modalW, COL_SPACING, NODE_RADIUS
                        );
                        this.modalGenLabel.textContent = `Obj. ${entry.objectiveKey}`;
                    }
                } else if (this._lastData) {
                    this._renderToCanvas(this._lastData, this.modalCanvas, this.modalCtx, this.modalGenLabel,
                        modalW, COL_SPACING, NODE_RADIUS);
                }
            }
        });

        card.addEventListener('click', () => this._openModal());
    }

    _openModal() {
        if (!this._lastData) return;
        this.modal.open();
        const modalW = this.modalCanvas.parentElement.clientWidth - 32;

        if (this._selectedGen !== 'latest' && this._lastHistorySnapshot) {
            this._historySelect.style.display = 'none';
            const snap = this._lastHistorySnapshot;
            let renderSrc = snap;
            let activeTargetKey = null;
            if (snap.perTarget && snap.perTarget.length > 0) {
                const active = snap.perTarget.find(t => t.targetKey === this._selectedCurrentKey) ?? snap.perTarget[0];
                activeTargetKey = active.targetKey;
                renderSrc = {nodes: active.nodes, connections: active.connections, generation: snap.generation};
            }
            this._renderToCanvas(renderSrc, this.modalCanvas, this.modalCtx, this.modalGenLabel,
                modalW, COL_SPACING, NODE_RADIUS);
            if (activeTargetKey !== null) {
                this.modalGenLabel.textContent += ` — Obj. ${activeTargetKey}`;
            }
            return;
        }

        this._historySelect.style.display = '';
        if (this._perTargetData.length > 0) {
            this._rebuildModalSelectPerTarget();
            const active = this._perTargetData.find(t => t.targetKey === this._selectedCurrentKey) ??
                        this._perTargetData[0];
            this._selectedCurrentKey = active.targetKey;
            this._historySelect.value = `frontier:${active.targetKey}`;
            this._renderToCanvas(
                {nodes: active.nodes, connections: active.connections, generation: this._lastData.generation},
                this.modalCanvas, this.modalCtx, this.modalGenLabel, modalW, COL_SPACING, NODE_RADIUS
            );
        } else {
            this._historySelect.value = this._selectedKey;
            if (this._selectedKey === 'current') {
                this._renderToCanvas(this._lastData, this.modalCanvas, this.modalCtx, this.modalGenLabel,
                    modalW, COL_SPACING, NODE_RADIUS);
            } else {
                const entry = this._history.find(h => String(h.objectiveKey) === this._selectedKey);
                if (entry) {
                    this._renderToCanvas(
                        {generation: '', nodes: entry.nodes, connections: entry.connections},
                        this.modalCanvas, this.modalCtx, this.modalGenLabel, modalW, COL_SPACING, NODE_RADIUS
                    );
                    this.modalGenLabel.textContent = `Obj. ${entry.objectiveKey}`;
                }
            }
        }
    }

    _rebuildModalSelectPerTarget() {
        this._historySelect.innerHTML = '';
        const frontierGroup = document.createElement('optgroup');
        frontierGroup.label = i18n.t('frontier-targets');
        this._perTargetData.forEach(t => {
            const opt = document.createElement('option');
            opt.value = `frontier:${t.targetKey}`;
            opt.textContent = `Obj. ${t.targetKey}`;
            opt.title = t.label;
            frontierGroup.appendChild(opt);
        });
        this._historySelect.appendChild(frontierGroup);
        if (this._history.length > 0) {
            const coveredGroup = document.createElement('optgroup');
            coveredGroup.label = i18n.t('previous-targets');
            this._history.forEach(h => {
                const opt = document.createElement('option');
                opt.value = `covered:${h.objectiveKey}`;
                opt.textContent = `Obj. ${h.objectiveKey}`;
                opt.title = h.label;
                coveredGroup.appendChild(opt);
            });
            this._historySelect.appendChild(coveredGroup);
        }
    }

    _render(data) {
        this._lastData = data;
        this._emptyEl.style.display = 'none';
        this.canvas.style.display = '';

        // Track generation for the history dropdown
        const gen = data.generation;
        if (!this._knownGenerations.includes(gen)) {
            this._knownGenerations.push(gen);
            if (this._knownGenerations.length === 1) {
                this.genLabel.innerHTML = `<option value="latest">${i18n.t('generation')} ${gen}</option>`;
            } else {
                const latestOpt = this.genLabel.querySelector('option[value="latest"]');
                if (latestOpt) latestOpt.textContent = `${i18n.t('generation')} ${gen}`;
                const prevGen = this._knownGenerations[this._knownGenerations.length - 2];
                const prevOpt = document.createElement('option');
                prevOpt.value = String(prevGen);
                prevOpt.textContent = `${i18n.t('generation')} ${prevGen}`;
                this.genLabel.insertBefore(prevOpt, latestOpt);
            }
        }

        // Only re-render the canvas if user is watching live
        if (this._selectedGen !== 'latest') return;

        this._renderSnapshot(data);

        if (this.modal.isOpen() && this._selectedKey === 'current') {
            this._openModal();
        }
    }

    _renderSnapshot(data) {
        const W = this.container.clientWidth - 32;
        if (W <= 0) return;
        let renderSrc = data;
        if (data.perTarget && data.perTarget.length > 0) {
            this._perTargetData = data.perTarget;
            this._rebuildCurrentSelect();
            const active = this._perTargetData.find(t => t.targetKey === this._selectedCurrentKey) ??
                        this._perTargetData[0];
            this._selectedCurrentKey = active.targetKey;
            renderSrc = {nodes: active.nodes, connections: active.connections, generation: data.generation};
        } else {
            this._perTargetData = [];
            this._currentGroup.style.display = 'none';
        }
        const maxColHeight = this._maxColHeight(renderSrc.nodes);
        const spacing = Math.min(COL_SPACING, (PREVIEW_H - V_PAD * 2) / Math.max(maxColHeight, 1));
        const radius = Math.max(3, Math.min(NODE_RADIUS, spacing * 0.35));
        this._renderToCanvas(renderSrc, this.canvas, this.ctx, this.genLabel, W, spacing, radius, PREVIEW_H);
    }

    _renderHistorySnapshot(data) {
        this._lastHistorySnapshot = data;
        this._renderSnapshot(data);
        if (this.modal.isOpen()) {
            this._openModal();
        }
    }

    _rebuildCurrentSelect() {
        const prevKey = this._selectedCurrentKey;
        this._currentSelect.innerHTML = '';
        this._perTargetData.forEach(t => {
            const opt = document.createElement('option');
            opt.value = String(t.targetKey);
            opt.textContent = `Obj. ${t.targetKey}`;
            opt.title = t.label;
            this._currentSelect.appendChild(opt);
        });
        const stillPresent = this._perTargetData.some(t => t.targetKey === prevKey);
        this._currentSelect.value = String(stillPresent ? prevKey : this._perTargetData[0].targetKey);
        this._currentGroup.style.display = '';
    }

    _onCovered(data) {
        this._history.push(data);
        if (this._perTargetData.length === 0) {
            const option = document.createElement('option');
            option.value = String(data.objectiveKey);
            option.textContent = `Obj. ${data.objectiveKey}`;
            option.title = data.label;
            this._historySelect.appendChild(option);
        }
    }

    _maxColHeight(nodes) {
        return Math.max(...groupNodesIntoColumns(nodes).map(c => c.length));
    }

    _setGenLabelText(genLabel, text) {
        if (genLabel.tagName === 'SELECT') {
            if (this._selectedGen !== 'latest') return;
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
        this._setGenLabelText(genLabel, `${i18n.t('generation')} ${generation}`);

        const nodePos = drawNetworkDiagram(canvas, ctx, data, {width: W, spacing, radius, fixedHeight: fixedH});

        if (canvas === this.modalCanvas) {
            this._modalNodePos = nodePos;
            this._modalConnections = connections;
            this._modalNodes = nodes;
        }
    }
}

module.exports = NetworkTopology;
