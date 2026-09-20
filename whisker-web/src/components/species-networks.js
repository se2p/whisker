const Modal = require('./modal');
const {drawNetworkDiagram, createHoverTooltip, attachHoverTooltip} = require('./network-diagram');
const {i18n} = require('../index');

class SpeciesNetworks {
    constructor(container) {
        this.container = container;
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

    // Re-renders the text that is built in JS (rows, dropdown, labels); the static text is data-i18n.
    updateI18n() {
        if (this._lastData) this._render(this._lastData);
        else this._rebuildHistorySelect();
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
        this._modal.close();
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
        this._modal.close();
    }

    _buildUI() {
        this._card = document.createElement('div');
        this._card.className = 'species-networks-card';
        this._card.style.display = 'none';
        this._card.innerHTML = `
            <div class="species-networks-header">
                <select class="network-topology-generation" id="sn-generation"></select>
                <p class="species-networks-title" data-i18n="species-networks-title"></p>
                <select class="network-topology-history-select" id="sn-history-select">
                    <option value="current">${i18n.t('current-target')}</option>
                </select>
            </div>
            <div class="species-networks-empty" data-i18n="species-networks-empty"></div>
            <div class="species-networks-list" style="display:none;"></div>
            <div class="species-networks-preview" id="sn-preview" style="display:none;">
                <canvas id="sn-preview-canvas"></canvas>
            </div>`;
        this.container.appendChild(this._card);
        this._genLabel = this._card.querySelector('#sn-generation');
        this._emptyEl = this._card.querySelector('.species-networks-empty');
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
            this._modal.close();
        });

        this._historySelect.addEventListener('change', () => {
            this._selectedKey = this._historySelect.value;
            this._applySelection();
            this._modal.close();
        });

        this._modal = new Modal();
        this._modal.titleEl.insertAdjacentHTML('beforebegin',
            '<span class="species-networks-generation" id="sn-modal-gen"></span>');
        this._modal.bodyEl.innerHTML = '<canvas id="sn-modal-canvas"></canvas>';
        this._modalCanvas = this._modal.bodyEl.querySelector('#sn-modal-canvas');
        this._modalCtx = this._modalCanvas.getContext('2d');
        this._modalGen = this._modal.el.querySelector('#sn-modal-gen');
        this._modalTitle = this._modal.titleEl;

        this._tooltip = createHoverTooltip();
        this._modalNodePos = null;
        this._modalConnections = null;
        this._modalNodes = null;
        attachHoverTooltip(this._modalCanvas, this._tooltip, () => ({
            nodePos: this._modalNodePos, nodes: this._modalNodes, connections: this._modalConnections
        }));
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
            this._genLabel.innerHTML = `<option value="latest">${i18n.t('generation')} ${gen}</option>`;
        } else {
            const latestOpt = this._genLabel.querySelector('option[value="latest"]');
            if (latestOpt) latestOpt.textContent = `${i18n.t('generation')} ${gen}`;
            const prevGen = this._knownGenerations[this._knownGenerations.length - 2];
            const prevOpt = document.createElement('option');
            prevOpt.value = String(prevGen);
            prevOpt.textContent = `${i18n.t('generation')} ${prevGen}`;
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
            frontierGroup.label = i18n.t('frontier-targets');
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
            opt.textContent = i18n.t('current-target');
            this._historySelect.appendChild(opt);
        }
        if (this._history.length > 0) {
            const coveredParent = this._perTargetData.length > 0 ?
                document.createElement('optgroup') : this._historySelect;
            if (coveredParent !== this._historySelect) {
                coveredParent.label = i18n.t('previous-targets');
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

        if (this._modal.isOpen() && this._openSpecies && speciesList) {
            const updated = speciesList.find(s => s.speciesId === this._openSpecies.speciesId);
            if (updated) this._openModal(updated, generationLabel);
        }
    }

    _renderList(species, generationLabel, bestSpeciesId = null) {
        if (typeof generationLabel === 'number') {
            this._setGenLabelText(`${i18n.t('generation')} ${generationLabel}`);
        }
        this._listEl.innerHTML = '';
        for (const sp of species) {
            const row = document.createElement('div');
            row.className = 'species-networks-row';
            const isBest = bestSpeciesId !== null && sp.speciesId === bestSpeciesId;
            if (isBest) row.classList.add('species-networks-row--best');
            row.title = i18n.t('click-to-expand');
            const nodeCount = sp.nodes.length;
            const connCount = sp.connections.length;
            row.innerHTML = `
                <span class="species-networks-row-label">${i18n.t('species-networks-species')} ${sp.speciesId}</span>
                <span class="species-networks-row-members">${sp.memberCount} ${i18n.t('species-networks-members')}</span>
                <span class="species-networks-row-stats">Best network — ${nodeCount} nodes · ${connCount} connections</span>
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
        this._modal.open();
        this._modalTitle.textContent = `${i18n.t('species-networks-species')} ${species.speciesId} - ${i18n.t('species-networks-best-network')}`;
        const w = this._modalCanvas.parentElement.clientWidth - 32;
        this._renderToCanvas(species, generation, w);
    }

    _renderToCanvas(species, generation, W) {
        const {nodes, connections} = species;
        this._modalGen.textContent = typeof generation === 'number' ?
            `${i18n.t('generation')} ${generation}` :
            String(generation);

        const nodePos = drawNetworkDiagram(this._modalCanvas, this._modalCtx, species, {width: W});

        this._modalNodePos = nodePos;
        this._modalConnections = connections;
        this._modalNodes = nodes;
    }
}

module.exports = SpeciesNetworks;
