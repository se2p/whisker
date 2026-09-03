const {weightToColor} = require('./network-colors');

// Keyed by the backend NodeGene.toJSON() letter codes: I=Input, B=Bias, H=Hidden, A=Action/Output
const NODE_COLORS = {
    I: '#5b8dd9',
    B: '#5b8dd9',
    H: '#7c5cbf',
    A: '#27ae60'
};
const NODE_RADIUS = 10;
const COL_SPACING = 55;
const H_PAD = 50;
const V_PAD = 20;
const PREVIEW_H = 300;

class NetworkTopology {
    constructor(container, i18n = {}) {
        this.container = container;
        this._i18n = {
            title: i18n.title || 'Network Topology',
            generation: i18n.generation || 'Generation',
            expand: i18n.expand || 'Click to expand',
            emptyMessage: i18n.emptyMessage || 'Start a learning algorithm to see the network topology',
            currentTarget: i18n.currentTarget || 'Current Target',
            frontierTargets: i18n.frontierTargets || 'Current Targets',
            previousTargets: i18n.previousTargets || 'Previous Targets'
        };
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

    updateI18n(i18n) {
        this._i18n = {...this._i18n, ...i18n};
        const card = this.container.querySelector('.network-topology-card');
        if (card) card.title = this._i18n.expand;
        this.container.querySelectorAll('.network-topology-title').forEach(el => {
            el.textContent = this._i18n.title;
        });
        this.modal.querySelectorAll('.network-topology-title').forEach(el => {
            el.textContent = this._i18n.title;
        });
        if (this._emptyEl) this._emptyEl.textContent = this._i18n.emptyMessage;
        if (this._historySelect) this._historySelect.options[0].textContent = this._i18n.currentTarget;
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
        this._historySelect.innerHTML = `<option value="current">${this._i18n.currentTarget}</option>`;
        this._historySelect.style.display = '';
        this._historySelect.value = 'current';
        this._currentSelect.innerHTML = '';
        this._currentGroup.style.display = 'none';
        this.genLabel.innerHTML = '';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._emptyEl.style.display = '';
        this.canvas.style.display = 'none';
        this._closeModal();
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
        this._historySelect.innerHTML = `<option value="current">${this._i18n.currentTarget}</option>`;
        this._historySelect.value = 'current';
        this._currentSelect.innerHTML = '';
        this._currentGroup.style.display = 'none';
        this.genLabel.innerHTML = '';
        this.genLabel.innerHTML = '';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._emptyEl.style.display = 'none';
        this.canvas.style.display = '';
        this._closeModal();
    }

    _buildUI() {
        const card = document.createElement('div');
        card.className = 'network-topology-card';
        card.title = this._i18n.expand;
        card.style.display = 'none';
        card.innerHTML = `
            <div class="network-topology-header">
                <select class="network-topology-generation" id="nt-generation"></select>
                <p class="network-topology-title">${this._i18n.title}</p>
                <span style="flex:1;"></span>
                <div class="network-topology-current-group" id="nt-current-group" style="display:none;">
                    <span class="network-topology-current-label">Frontier</span>
                    <select class="network-topology-current-select" id="nt-current-select"></select>
                </div>
                <span class="network-topology-expand-hint">⤢</span>
            </div>
            <div class="network-topology-empty"></div>
            <canvas id="network-topology-canvas" style="display:none;"></canvas>`;
        this.container.appendChild(card);
        this._card = card;
        this.canvas = card.querySelector('#network-topology-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.genLabel = card.querySelector('#nt-generation');
        this._emptyEl = card.querySelector('.network-topology-empty');
        this._emptyEl.textContent = this._i18n.emptyMessage;
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

        // Modal
        this.modal = document.createElement('div');
        this.modal.className = 'network-topology-modal';
        this.modal.innerHTML = `
            <div class="network-topology-modal-box">
                <div class="network-topology-modal-header">
                    <span class="network-topology-generation" id="nt-modal-generation"></span>
                    <p class="network-topology-title">${this._i18n.title}</p>
                    <select class="network-topology-history-select" id="nt-history-select">
                        <option value="current">${this._i18n.currentTarget}</option>
                    </select>
                    <button class="network-topology-modal-close" id="nt-modal-close">✕</button>
                </div>
                <div class="network-topology-modal-body">
                    <canvas id="network-topology-modal-canvas"></canvas>
                </div>
            </div>`;
        document.body.appendChild(this.modal);
        this.modalCanvas = this.modal.querySelector('#network-topology-modal-canvas');
        this.modalCtx = this.modalCanvas.getContext('2d');
        this.modalGenLabel = this.modal.querySelector('#nt-modal-generation');

        this._tooltip = document.createElement('div');
        this._tooltip.className = 'nt-weight-tooltip';
        document.body.appendChild(this._tooltip);
        this._modalNodePos = null;
        this._modalConnections = null;
        this._modalNodes = null;

        this.modalCanvas.addEventListener('mousemove', e => this._onModalMouseMove(e));
        this.modalCanvas.addEventListener('mouseleave', () => {
            this._tooltip.style.display = 'none';
        });
        this._historySelect = this.modal.querySelector('#nt-history-select');
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
        this.modal.addEventListener('click', e => {
            if (e.target === this.modal) this._closeModal();
        });
        this.modal.querySelector('#nt-modal-close').addEventListener('click', () => this._closeModal());
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') this._closeModal();
        });
    }

    _openModal() {
        if (!this._lastData) return;
        this.modal.classList.add('network-topology-modal--open');
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
        frontierGroup.label = this._i18n.frontierTargets;
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
            coveredGroup.label = this._i18n.previousTargets;
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

    _closeModal() {
        this.modal.classList.remove('network-topology-modal--open');
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
                this.genLabel.innerHTML = `<option value="latest">${this._i18n.generation} ${gen}</option>`;
            } else {
                const latestOpt = this.genLabel.querySelector('option[value="latest"]');
                if (latestOpt) latestOpt.textContent = `${this._i18n.generation} ${gen}`;
                const prevGen = this._knownGenerations[this._knownGenerations.length - 2];
                const prevOpt = document.createElement('option');
                prevOpt.value = String(prevGen);
                prevOpt.textContent = `${this._i18n.generation} ${prevGen}`;
                this.genLabel.insertBefore(prevOpt, latestOpt);
            }
        }

        // Only re-render the canvas if user is watching live
        if (this._selectedGen !== 'latest') return;

        this._renderSnapshot(data);

        if (this.modal.classList.contains('network-topology-modal--open') && this._selectedKey === 'current') {
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
        if (this.modal.classList.contains('network-topology-modal--open')) {
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
        const hiddenNodes = nodes.filter(n => n.t === 'H');
        const hiddenDepths = [...new Set(hiddenNodes.map(n => n.d))];
        const hiddenCols = hiddenDepths.map(d => hiddenNodes.filter(n => n.d === d));
        const inputNodes = nodes.filter(n => n.t === 'I' || n.t === 'B');
        const outputNodes = nodes.filter(n => n.t === 'A');
        return Math.max(...[inputNodes, ...hiddenCols, outputNodes].map(c => c.length));
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
        this._setGenLabelText(genLabel, `${this._i18n.generation} ${generation}`);

        const inputNodes = nodes.filter(n => n.t === 'I' || n.t === 'B');
        const hiddenNodes = nodes.filter(n => n.t === 'H');
        const outputNodes = nodes.filter(n => n.t === 'A');
        const hiddenDepths = [...new Set(hiddenNodes.map(n => n.d))].sort((a, b) => a - b);
        const hiddenCols = hiddenDepths.map(d => hiddenNodes.filter(n => n.d === d));
        const columns = [inputNodes, ...hiddenCols, outputNodes];
        const numCols = columns.length;
        const maxColHeight = Math.max(...columns.map(c => c.length));

        const H = fixedH || maxColHeight * spacing + V_PAD * 2;
        canvas.width = Math.max(W, numCols * 40 + H_PAD * 2);
        canvas.height = H;

        ctx.clearRect(0, 0, canvas.width, H);

        const colX = i => H_PAD + i * ((canvas.width - H_PAD * 2) / Math.max(numCols - 1, 1));
        const nodePos = new Map();
        columns.forEach((col, ci) => {
            const x = colX(ci);
            col.forEach((node, ni) => {
                const y = H / 2 + (ni - (col.length - 1) / 2) * spacing;
                nodePos.set(node.id, {x, y, type: node.t});
            });
        });

        // Connections
        ctx.globalAlpha = 0.8;
        connections.forEach(({source, target, weight}) => {
            const src = nodePos.get(source);
            const tgt = nodePos.get(target);
            if (!src || !tgt) return;
            ctx.beginPath();
            ctx.moveTo(src.x, src.y);
            ctx.lineTo(tgt.x, tgt.y);
            ctx.strokeStyle = weightToColor(weight);
            ctx.lineWidth = Math.max(1.5, Math.min(4, Math.abs(weight) * 0.8));
            ctx.stroke();
        });
        ctx.globalAlpha = 1;

        // Nodes
        nodePos.forEach(({x, y, type}) => {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = NODE_COLORS[type] || NODE_COLORS.H;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = Math.max(1, radius * 0.2);
            ctx.stroke();
        });

        if (canvas === this.modalCanvas) {
            this._modalNodePos = nodePos;
            this._modalConnections = connections;
            this._modalNodes = nodes;
        }
    }

    _onModalMouseMove(e) {
        if (!this._modalNodePos || !this._modalConnections) return;
        const rect = this.modalCanvas.getBoundingClientRect();
        const scaleX = this.modalCanvas.width / rect.width;
        const scaleY = this.modalCanvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        // Check nodes first
        let label = null;
        for (const node of (this._modalNodes || [])) {
            const pos = this._modalNodePos.get(node.id);
            if (!pos) continue;
            const dx = mx - pos.x; const dy = my - pos.y;
            if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS) {
                if (node.t === 'I') label = `${node.sprite} · ${node.feature}`;
                else if (node.t === 'B') label = 'Bias';
                else if (node.t === 'A') label = node.event || null;
                else label = node.aF || '';
                break;
            }
        }

        // Fall back to connection weight
        if (label === null) {
            const THRESHOLD = 6;
            for (const {source, target, weight} of this._modalConnections) {
                const src = this._modalNodePos.get(source);
                const tgt = this._modalNodePos.get(target);
                if (!src || !tgt) continue;
                const dx = tgt.x - src.x; const dy = tgt.y - src.y;
                const lenSq = dx * dx + dy * dy;
                const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((mx - src.x) * dx + (my - src.y) * dy) / lenSq));
                const px = src.x + t * dx - mx; const py = src.y + t * dy - my;
                if (px * px + py * py <= THRESHOLD * THRESHOLD) {
                    label = weight.toFixed(4); break;
                }
            }
        }

        if (label === null) {
            this._tooltip.style.display = 'none';
        } else {
            this._tooltip.textContent = label;
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = `${e.clientX + 12}px`;
            this._tooltip.style.top = `${e.clientY - 24}px`;
        }
    }
}

module.exports = NetworkTopology;
