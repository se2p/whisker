const {weightToColor} = require('./network-colors');

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
            emptyMessage: i18n.emptyMessage || 'Start a NEAT algorithm to see per-species networks',
            currentTarget: i18n.currentTarget || 'Current',
            frontierTargets: i18n.frontierTargets || 'Current Targets',
            previousTargets: i18n.previousTargets || 'Previous Targets'
        };
        this._lastData = null;
        this._openSpecies = null;
        this._history = [];
        this._perTargetData = [];
        this._selectedKey = 'current';
        this._knownGenerations = [];
        this._selectedGen = 'latest';
        this._lastHistorySnapshot = null;
        this._buildUI();
        window.Whisker.scratch.vm.on('SPECIES_NETWORK_TOPOLOGY', data => this._render(data));
        window.Whisker.scratch.vm.on('SPECIES_NETWORK_TOPOLOGY_COVERED', data => this._onCovered(data));
        window.Whisker.scratch.vm.on('SPECIES_NETWORK_TOPOLOGY_HISTORY', data => this._renderHistorySnapshot(data));
    }

    updateI18n(i18n) {
        this._i18n = {...this._i18n, ...i18n};
        this._card.querySelectorAll('.species-networks-title').forEach(el => {
            el.textContent = this._i18n.title;
        });
        if (this._emptyEl) this._emptyEl.textContent = this._i18n.emptyMessage;
        if (this._lastData) this._render(this._lastData);
        else if (this._historySelect) this._rebuildHistorySelect();
    }

    refresh() {
        if (this._lastData) this._render(this._lastData);
    }

    reset() {
        this._lastData = null;
        this._openSpecies = null;
        this._history = [];
        this._perTargetData = [];
        this._selectedKey = 'current';
        this._knownGenerations = [];
        this._selectedGen = 'latest';
        this._lastHistorySnapshot = null;
        this._genLabel.innerHTML = '';
        this._listEl.innerHTML = '';
        this._emptyEl.style.display = '';
        this._listEl.style.display = 'none';
        this._rebuildHistorySelect();
        this._closeModal();
    }

    startEmpty() {
        this._lastData = null;
        this._openSpecies = null;
        this._history = [];
        this._perTargetData = [];
        this._selectedKey = 'current';
        this._knownGenerations = [];
        this._selectedGen = 'latest';
        this._lastHistorySnapshot = null;
        this._genLabel.innerHTML = '';
        this._listEl.innerHTML = '';
        this._emptyEl.style.display = 'none';
        this._listEl.style.display = '';
        this._rebuildHistorySelect();
        this._closeModal();
    }

    _buildUI() {
        this._card = document.createElement('div');
        this._card.className = 'species-networks-card';
        this._card.style.display = 'none';
        this._card.innerHTML = `
            <div class="species-networks-header">
                <select class="network-topology-generation" id="sn-generation"></select>
                <p class="species-networks-title">${this._i18n.title}</p>
                <select class="network-topology-history-select" id="sn-history-select">
                    <option value="current">${this._i18n.currentTarget}</option>
                </select>
            </div>
            <div class="species-networks-empty"></div>
            <div class="species-networks-list" style="display:none;"></div>
            <div class="species-networks-preview" id="sn-preview" style="display:none;">
                <canvas id="sn-preview-canvas"></canvas>
            </div>`;
        this.container.appendChild(this._card);
        this._genLabel = this._card.querySelector('#sn-generation');
        this._emptyEl = this._card.querySelector('.species-networks-empty');
        this._emptyEl.textContent = this._i18n.emptyMessage;
        this._listEl = this._card.querySelector('.species-networks-list');
        this._historySelect = this._card.querySelector('#sn-history-select');
        this._previewEl = this._card.querySelector('#sn-preview');
        this._previewCanvas = this._card.querySelector('#sn-preview-canvas');
        this._previewCtx = this._previewCanvas.getContext('2d');

        this._genLabel.addEventListener('click', e => e.stopPropagation());
        this._genLabel.addEventListener('change', () => {
            this._selectedGen = this._genLabel.value;
            if (this._selectedGen === 'latest') {
                this._lastHistorySnapshot = null;
                if (this._lastData) {
                    this._perTargetData = this._lastData.perTarget || [];
                    this._rebuildHistorySelect();
                    this._applySelection();
                }
            } else {
                window.Whisker.scratch.vm.emit('REQUEST_SPECIES_TOPOLOGY_GEN',
                    {generation: parseInt(this._selectedGen, 10)});
            }
            this._closeModal();
        });

        this._historySelect.addEventListener('change', () => {
            this._selectedKey = this._historySelect.value;
            this._applySelection();
            this._closeModal();
        });

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

        this._tooltip = document.createElement('div');
        this._tooltip.className = 'nt-weight-tooltip';
        document.body.appendChild(this._tooltip);
        this._modalNodePos = null;
        this._modalConnections = null;
        this._modalNodes = null;

        this._modalCanvas.addEventListener('mousemove', e => this._onModalMouseMove(e));
        this._modalCanvas.addEventListener('mouseleave', () => {
            this._tooltip.style.display = 'none';
        });

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
        this._trackGeneration(data.generation);
        if (this._selectedGen !== 'latest') return;
        this._perTargetData = data.perTarget || [];
        this._rebuildHistorySelect();
        this._applySelection();
    }

    _renderHistorySnapshot(data) {
        this._lastHistorySnapshot = data;
        this._perTargetData = data.perTarget || [];
        this._rebuildHistorySelect();
        this._applySelection();
    }

    _trackGeneration(gen) {
        if (this._knownGenerations.includes(gen)) return;
        this._knownGenerations.push(gen);
        if (this._knownGenerations.length === 1) {
            this._genLabel.innerHTML = `<option value="latest">${this._i18n.generation} ${gen}</option>`;
        } else {
            const latestOpt = this._genLabel.querySelector('option[value="latest"]');
            if (latestOpt) latestOpt.textContent = `${this._i18n.generation} ${gen}`;
            const prevGen = this._knownGenerations[this._knownGenerations.length - 2];
            const prevOpt = document.createElement('option');
            prevOpt.value = String(prevGen);
            prevOpt.textContent = `${this._i18n.generation} ${prevGen}`;
            this._genLabel.insertBefore(prevOpt, latestOpt);
        }
    }

    _activeData() {
        return this._selectedGen === 'latest' ? this._lastData : this._lastHistorySnapshot;
    }

    _setGenLabelText(text) {
        if (this._selectedGen !== 'latest') return;
        const latestOpt = this._genLabel.querySelector('option[value="latest"]');
        if (latestOpt) latestOpt.textContent = text;
    }

    _rebuildHistorySelect() {
        const prevValue = this._historySelect.value;
        this._historySelect.innerHTML = '';
        if (this._perTargetData.length > 0) {
            const frontierGroup = document.createElement('optgroup');
            frontierGroup.label = this._i18n.frontierTargets;
            this._perTargetData.forEach(t => {
                const opt = document.createElement('option');
                opt.value = `frontier:${t.targetKey}`;
                opt.textContent = `Obj. ${t.targetKey}`;
                if (t.label) opt.title = t.label;
                frontierGroup.appendChild(opt);
            });
            this._historySelect.appendChild(frontierGroup);
        } else {
            const opt = document.createElement('option');
            opt.value = 'current';
            opt.textContent = this._i18n.currentTarget;
            this._historySelect.appendChild(opt);
        }
        if (this._history.length > 0) {
            const coveredParent = this._perTargetData.length > 0 ?
                document.createElement('optgroup') : this._historySelect;
            if (coveredParent !== this._historySelect) {
                coveredParent.label = this._i18n.previousTargets;
            }
            this._history.forEach(h => {
                const opt = document.createElement('option');
                opt.value = `covered:${h.objectiveKey}`;
                opt.textContent = `Obj. ${h.objectiveKey}`;
                opt.title = h.label;
                coveredParent.appendChild(opt);
            });
            if (coveredParent !== this._historySelect) {
                this._historySelect.appendChild(coveredParent);
            }
        }

        const values = Array.from(this._historySelect.options).map(o => o.value);
        if (values.includes(prevValue)) {
            this._historySelect.value = prevValue;
        } else if (this._perTargetData.length > 0) {
            this._historySelect.value = `frontier:${this._perTargetData[0].targetKey}`;
        } else {
            this._historySelect.value = 'current';
        }
        this._selectedKey = this._historySelect.value;
    }

    _applySelection() {
        let speciesList = null;
        let generationLabel = null;
        let bestSpeciesId = null;
        const key = this._selectedKey;

        const active = this._activeData();

        if (key.startsWith('frontier:')) {
            const targetKey = parseInt(key.split(':')[1], 10);
            const entry = this._perTargetData.find(t => t.targetKey === targetKey);
            if (entry) {
                speciesList = entry.species;
                generationLabel = active ? active.generation : '';
                bestSpeciesId = entry.bestSpeciesId;
            }
        } else if (key.startsWith('covered:')) {
            const targetKey = parseInt(key.split(':')[1], 10);
            const entry = this._history.find(h => h.objectiveKey === targetKey);
            if (entry) {
                speciesList = entry.species;
                generationLabel = `Obj. ${entry.objectiveKey}`;
                bestSpeciesId = entry.bestSpeciesId;
            }
        } else if (active) {
            speciesList = active.species;
            generationLabel = active.generation;
            bestSpeciesId = active.bestSpeciesId;
        }

        if (speciesList) {
            this._emptyEl.style.display = 'none';
            this._listEl.style.display = '';
            this._renderList(speciesList, generationLabel, bestSpeciesId);
        } else {
            this._listEl.innerHTML = '';
            this._listEl.style.display = 'none';
            this._emptyEl.style.display = '';
        }

        if (this._modal.classList.contains('network-topology-modal--open') && this._openSpecies && speciesList) {
            const updated = speciesList.find(s => s.speciesId === this._openSpecies.speciesId);
            if (updated) this._openModal(updated, generationLabel);
        }
    }

    _renderList(species, generationLabel, bestSpeciesId = null) {
        if (typeof generationLabel === 'number') {
            this._setGenLabelText(`${this._i18n.generation} ${generationLabel}`);
        }
        this._listEl.innerHTML = '';
        for (const sp of species) {
            const row = document.createElement('div');
            row.className = 'species-networks-row';
            const isBest = bestSpeciesId !== null && sp.speciesId === bestSpeciesId;
            if (isBest) row.classList.add('species-networks-row--best');
            row.title = this._i18n.expand;
            const nodeCount = isBest ? sp.nodes.length : null;
            const connCount = isBest ? sp.connections.length : null;
            row.innerHTML = `
                <span class="species-networks-row-label">${this._i18n.species} ${sp.speciesId}</span>
                <span class="species-networks-row-members">${sp.memberCount} ${this._i18n.members}</span>
                ${isBest ? `<span class="species-networks-row-stats">Best network — ${nodeCount} nodes · ${connCount} connections</span>` : ''}
                <span class="species-networks-expand-hint">⤢</span>`;
            row.addEventListener('click', () => this._openModal(sp, generationLabel));
            this._listEl.appendChild(row);
        }
    }

    _onCovered(data) {
        this._history.push(data);
        this._rebuildHistorySelect();
        this._applySelection();
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
        this._modalGen.textContent = typeof generation === 'number' ?
            `${this._i18n.generation} ${generation}` :
            String(generation);

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

        this._modalCtx.globalAlpha = 0.8;
        connections.forEach(({source, target, weight}) => {
            const src = nodePos.get(source);
            const tgt = nodePos.get(target);
            if (!src || !tgt) return;
            this._modalCtx.beginPath();
            this._modalCtx.moveTo(src.x, src.y);
            this._modalCtx.lineTo(tgt.x, tgt.y);
            this._modalCtx.strokeStyle = weightToColor(weight);
            this._modalCtx.lineWidth = Math.max(1.5, Math.min(4, Math.abs(weight) * 0.8));
            this._modalCtx.stroke();
        });
        this._modalCtx.globalAlpha = 1;

        nodePos.forEach(({x, y, type}) => {
            this._modalCtx.beginPath();
            this._modalCtx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2);
            this._modalCtx.fillStyle = NODE_COLORS[type] || NODE_COLORS[2];
            this._modalCtx.fill();
            this._modalCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            this._modalCtx.lineWidth = Math.max(1, NODE_RADIUS * 0.2);
            this._modalCtx.stroke();
        });

        this._modalNodePos = nodePos;
        this._modalConnections = connections;
        this._modalNodes = nodes;
    }

    _onModalMouseMove(e) {
        if (!this._modalNodePos || !this._modalConnections) return;
        const rect = this._modalCanvas.getBoundingClientRect();
        const scaleX = this._modalCanvas.width / rect.width;
        const scaleY = this._modalCanvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        let label = null;
        for (const node of (this._modalNodes || [])) {
            const pos = this._modalNodePos.get(node.id);
            if (!pos) continue;
            const dx = mx - pos.x; const dy = my - pos.y;
            if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS) {
                if (node.type === 0 || node.type === 1) label = `${node.sprite} · ${node.feature}`;
                else if (node.type === 3) label = node.event || null;
                else label = node.aF || '';
                break;
            }
        }

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
            const tipW = this._tooltip.offsetWidth;
            const left = e.clientX + 12 + tipW > window.innerWidth ? e.clientX - tipW - 8 : e.clientX + 12;
            this._tooltip.style.left = `${left}px`;
            this._tooltip.style.top = `${e.clientY - 24}px`;
        }
    }
}

module.exports = SpeciesNetworks;
