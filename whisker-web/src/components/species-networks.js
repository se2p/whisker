const NODE_COLORS = {0: '#5b8dd9', 1: '#5b8dd9', 2: '#7c5cbf', 3: '#27ae60'};
const NODE_RADIUS = 10;
const COL_SPACING = 55;
const H_PAD = 50;
const V_PAD = 20;

class SpeciesNetworks {
    constructor(container, i18n = {}) {
        this.container = container;
        this._i18n = {
            title: i18n.title || 'Species Networks',
            generation: i18n.generation || 'Generation',
            species: i18n.species || 'Species',
            members: i18n.members || 'members',
            bestNetwork: i18n.bestNetwork || 'Best Network',
            expand: i18n.expand || 'Click to expand',
            emptyMessage: i18n.emptyMessage || 'Start a NEAT algorithm to see per-species networks'
        };
        this._lastData = null;
        this._openSpecies = null;
        this._buildUI();
        window.Whisker.scratch.vm.on('SPECIES_NETWORK_TOPOLOGY', data => this._render(data));
    }

    updateI18n(i18n) {
        this._i18n = {...this._i18n, ...i18n};
        this._card.querySelectorAll('.species-networks-title').forEach(el => {
            el.textContent = this._i18n.title;
        });
        if (this._emptyEl) this._emptyEl.textContent = this._i18n.emptyMessage;
        if (this._lastData) this._render(this._lastData);
    }

    refresh() {
        if (this._lastData) this._render(this._lastData);
    }

    reset() {
        this._lastData = null;
        this._openSpecies = null;
        this._genLabel.textContent = '';
        this._listEl.innerHTML = '';
        this._emptyEl.style.display = '';
        this._listEl.style.display = 'none';
        this._closeModal();
    }

    startEmpty() {
        this._lastData = null;
        this._openSpecies = null;
        this._genLabel.textContent = '';
        this._listEl.innerHTML = '';
        this._emptyEl.style.display = 'none';
        this._listEl.style.display = '';
        this._closeModal();
    }

    _buildUI() {
        this._card = document.createElement('div');
        this._card.className = 'species-networks-card';
        this._card.style.display = 'none';
        this._card.innerHTML = `
            <div class="species-networks-header">
                <span class="species-networks-generation" id="sn-generation"></span>
                <p class="species-networks-title">${this._i18n.title}</p>
            </div>
            <div class="species-networks-empty"></div>
            <div class="species-networks-list" style="display:none;"></div>`;
        this.container.appendChild(this._card);
        this._genLabel = this._card.querySelector('#sn-generation');
        this._emptyEl = this._card.querySelector('.species-networks-empty');
        this._emptyEl.textContent = this._i18n.emptyMessage;
        this._listEl = this._card.querySelector('.species-networks-list');

        this._modal = document.createElement('div');
        this._modal.className = 'network-topology-modal';
        this._modal.innerHTML = `
            <div class="network-topology-modal-box">
                <div class="network-topology-modal-header">
                    <span class="species-networks-generation" id="sn-modal-gen"></span>
                    <p class="network-topology-title" id="sn-modal-title"></p>
                    <button class="network-topology-modal-close" id="sn-modal-close">✕</button>
                </div>
                <div class="network-topology-modal-body">
                    <canvas id="sn-modal-canvas"></canvas>
                </div>
            </div>`;
        document.body.appendChild(this._modal);
        this._modalCanvas = this._modal.querySelector('#sn-modal-canvas');
        this._modalCtx = this._modalCanvas.getContext('2d');
        this._modalGen = this._modal.querySelector('#sn-modal-gen');
        this._modalTitle = this._modal.querySelector('#sn-modal-title');

        this._modal.addEventListener('click', e => {
            if (e.target === this._modal) this._closeModal();
        });
        this._modal.querySelector('#sn-modal-close').addEventListener('click', () => this._closeModal());
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') this._closeModal();
        });
    }

    _render(data) {
        this._lastData = data;
        this._emptyEl.style.display = 'none';
        this._listEl.style.display = '';
        this._genLabel.textContent = `${this._i18n.generation} ${data.generation}`;

        this._listEl.innerHTML = '';
        for (const sp of data.species) {
            const row = document.createElement('div');
            row.className = 'species-networks-row';
            row.title = this._i18n.expand;
            row.innerHTML = `
                <span class="species-networks-row-label">${this._i18n.species} ${sp.speciesId}</span>
                <span class="species-networks-row-members">${sp.memberCount} ${this._i18n.members}</span>
                <span class="species-networks-expand-hint">⤢</span>`;
            row.addEventListener('click', () => this._openModal(sp, data.generation));
            this._listEl.appendChild(row);
        }

        if (this._modal.classList.contains('network-topology-modal--open') && this._openSpecies) {
            const updated = data.species.find(s => s.speciesId === this._openSpecies.speciesId);
            if (updated) this._openModal(updated, data.generation);
        }
    }

    _openModal(species, generation) {
        this._openSpecies = species;
        this._modal.classList.add('network-topology-modal--open');
        this._modalTitle.textContent = `${this._i18n.species} ${species.speciesId} - ${this._i18n.bestNetwork}`;
        const w = this._modalCanvas.parentElement.clientWidth - 32;
        this._renderToCanvas(species, generation, w);
    }

    _closeModal() {
        this._modal.classList.remove('network-topology-modal--open');
    }

    _renderToCanvas(species, generation, W) {
        const {nodes, connections} = species;
        this._modalGen.textContent = `${this._i18n.generation} ${generation}`;

        const inputNodes = nodes.filter(n => n.type === 0 || n.type === 1);
        const hiddenNodes = nodes.filter(n => n.type === 2);
        const outputNodes = nodes.filter(n => n.type === 3);
        const hiddenDepths = [...new Set(hiddenNodes.map(n => n.depth))].sort((a, b) => a - b);
        const hiddenCols = hiddenDepths.map(d => hiddenNodes.filter(n => n.depth === d));
        const columns = [inputNodes, ...hiddenCols, outputNodes];
        const numCols = columns.length;
        const maxColHeight = Math.max(...columns.map(c => c.length));

        const H = maxColHeight * COL_SPACING + V_PAD * 2;
        this._modalCanvas.width = Math.max(W, numCols * 40 + H_PAD * 2);
        this._modalCanvas.height = H;

        this._modalCtx.clearRect(0, 0, this._modalCanvas.width, H);

        const colX = i => H_PAD + i * ((this._modalCanvas.width - H_PAD * 2) / Math.max(numCols - 1, 1));
        const nodePos = new Map();
        columns.forEach((col, ci) => {
            const x = colX(ci);
            col.forEach((node, ni) => {
                const y = H / 2 + (ni - (col.length - 1) / 2) * COL_SPACING;
                nodePos.set(node.id, {x, y, type: node.type});
            });
        });

        connections.forEach(({source, target, weight}) => {
            const src = nodePos.get(source);
            const tgt = nodePos.get(target);
            if (!src || !tgt) return;
            this._modalCtx.beginPath();
            this._modalCtx.moveTo(src.x, src.y);
            this._modalCtx.lineTo(tgt.x, tgt.y);
            this._modalCtx.strokeStyle = `rgba(160, 160, 180, ${Math.min(0.85, 0.2 + Math.abs(weight) * 0.35)})`;
            this._modalCtx.lineWidth = 1;
            this._modalCtx.stroke();
        });

        nodePos.forEach(({x, y, type}) => {
            this._modalCtx.beginPath();
            this._modalCtx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2);
            this._modalCtx.fillStyle = NODE_COLORS[type] || NODE_COLORS[2];
            this._modalCtx.fill();
            this._modalCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            this._modalCtx.lineWidth = Math.max(1, NODE_RADIUS * 0.2);
            this._modalCtx.stroke();
        });
    }
}

module.exports = SpeciesNetworks;
