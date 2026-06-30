// Mirrors the backend NodeType enum: INPUT=0, BIAS=1, HIDDEN=2, OUTPUT=3
const NODE_COLORS = {
    0: '#5b8dd9',
    1: '#5b8dd9',
    2: '#7c5cbf',
    3: '#27ae60'
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
            emptyMessage: i18n.emptyMessage || 'Start a learning algorithm to see the network topology'
        };
        this._lastData = null;
        this._buildUI();
        window.Whisker.scratch.vm.on('NETWORK_TOPOLOGY', data => this._render(data));

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
    }

    refresh() {
        if (this._lastData) this._render(this._lastData);
    }

    reset() {
        this._lastData = null;
        this.genLabel.textContent = '';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._emptyEl.style.display = '';
        this.canvas.style.display = 'none';
        this._closeModal();
    }

    startEmpty() {
        this._lastData = null;
        this.genLabel.textContent = '';
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
                <span class="network-topology-generation" id="nt-generation"></span>
                <p class="network-topology-title">${this._i18n.title}</p>
                <span class="network-topology-expand-hint">⤢</span>
            </div>
            <div class="network-topology-empty"></div>
            <canvas id="network-topology-canvas" style="display:none;"></canvas>`;
        this.container.appendChild(card);
        this.canvas = card.querySelector('#network-topology-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.genLabel = card.querySelector('#nt-generation');
        this._emptyEl = card.querySelector('.network-topology-empty');
        this._emptyEl.textContent = this._i18n.emptyMessage;

        // Modal
        this.modal = document.createElement('div');
        this.modal.className = 'network-topology-modal';
        this.modal.innerHTML = `
            <div class="network-topology-modal-box">
                <div class="network-topology-modal-header">
                    <span class="network-topology-generation" id="nt-modal-generation"></span>
                    <p class="network-topology-title">${this._i18n.title}</p>
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
        // Full-size render: use fixed spacing and full node radius, canvas grows to fit
        const modalW = this.modalCanvas.parentElement.clientWidth - 32;
        this._renderToCanvas(this._lastData, this.modalCanvas, this.modalCtx, this.modalGenLabel,
            modalW, COL_SPACING, NODE_RADIUS);
    }

    _closeModal() {
        this.modal.classList.remove('network-topology-modal--open');
    }

    _render(data) {
        this._lastData = data;
        this._emptyEl.style.display = 'none';
        this.canvas.style.display = '';
        const W = this.container.clientWidth - 32;
        if (W <= 0) return; // hidden — refresh() will draw at correct size when visible
        const maxColHeight = this._maxColHeight(data.nodes);
        const spacing = Math.min(COL_SPACING, (PREVIEW_H - V_PAD * 2) / Math.max(maxColHeight, 1));
        const radius = Math.max(3, Math.min(NODE_RADIUS, spacing * 0.35));
        this._renderToCanvas(data, this.canvas, this.ctx, this.genLabel, W, spacing, radius, PREVIEW_H);
        if (this.modal.classList.contains('network-topology-modal--open')) this._openModal();
    }

    _maxColHeight(nodes) {
        const hiddenNodes = nodes.filter(n => n.type === 2);
        const hiddenDepths = [...new Set(hiddenNodes.map(n => n.depth))];
        const hiddenCols = hiddenDepths.map(d => hiddenNodes.filter(n => n.depth === d));
        const inputNodes = nodes.filter(n => n.type === 0 || n.type === 1);
        const outputNodes = nodes.filter(n => n.type === 3);
        return Math.max(...[inputNodes, ...hiddenCols, outputNodes].map(c => c.length));
    }

    // fixedH is optional — if omitted the canvas grows to fit the content
    _renderToCanvas(data, canvas, ctx, genLabel, W, spacing, radius, fixedH) {
        const {generation, nodes, connections} = data;
        genLabel.textContent = `${this._i18n.generation} ${generation}`;

        const inputNodes = nodes.filter(n => n.type === 0 || n.type === 1);
        const hiddenNodes = nodes.filter(n => n.type === 2);
        const outputNodes = nodes.filter(n => n.type === 3);
        const hiddenDepths = [...new Set(hiddenNodes.map(n => n.depth))].sort((a, b) => a - b);
        const hiddenCols = hiddenDepths.map(d => hiddenNodes.filter(n => n.depth === d));
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
                nodePos.set(node.id, {x, y, type: node.type});
            });
        });

        // Connections
        connections.forEach(({source, target, weight}) => {
            const src = nodePos.get(source);
            const tgt = nodePos.get(target);
            if (!src || !tgt) return;
            ctx.beginPath();
            ctx.moveTo(src.x, src.y);
            ctx.lineTo(tgt.x, tgt.y);
            ctx.strokeStyle = `rgba(160, 160, 180, ${Math.min(0.85, 0.2 + Math.abs(weight) * 0.35)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Nodes
        nodePos.forEach(({x, y, type}) => {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = NODE_COLORS[type] || NODE_COLORS[2];
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = Math.max(1, radius * 0.2);
            ctx.stroke();
        });
    }
}

module.exports = NetworkTopology;
