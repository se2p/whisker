const Modal = require('./modal');

const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 30;
const CHART_H = 150;
const MODAL_CHART_H = 400;

const PALETTE = [
    '#2563eb', '#f97316', '#ec4899', '#10b981', '#f59e0b',
    '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#6366f1',
    '#14b8a6', '#f43f5e', '#a855f7', '#eab308', '#22c55e',
    '#fb923c', '#e879f9', '#34d399', '#60a5fa', '#fbbf24'
];

class SpeciesPopulationChart {
    constructor(container, i18n = {}) {
        this._i18n = {
            title: i18n.title || 'Species Population',
            emptyMessage: i18n.emptyMessage || 'Start a NEAT algorithm to see species over time',
            expand: i18n.expand || 'Click to expand'
        };
        this._resetState();
        this._buildUI(container);
        window.Whisker.scratch.vm.on('SPECIES_NETWORK_TOPOLOGY', data => this._update(data));
        // Only Neatest emits this (single sequential target, species restart on each switch).
        window.Whisker.scratch.vm.on('SPECIES_NETWORK_TOPOLOGY_COVERED', data => this._onTargetCovered(data));
    }

    _resetState() {
        this._history = [];
        this._speciesOrder = [];
        this._colorMap = new Map();
        this._colorIndex = 0;
        this._pastTargets = [];
        this._selectedKey = 'current';
    }

    reset() {
        this._resetState();
        this._historySelect.innerHTML = '<option value="current">Current Target</option>';
        this._historySelect.style.display = 'none';
        this._emptyEl.style.display = '';
        this._canvas.style.display = 'none';
        this._countEl.textContent = '';
        this._modal.close();
    }

    startEmpty() {
        this._resetState();
        this._historySelect.innerHTML = '<option value="current">Current Target</option>';
        this._historySelect.style.display = 'none';
        this._emptyEl.style.display = 'none';
        this._canvas.style.display = '';
        this._redraw();
        this._modal.close();
    }

    updateI18n(i18n) {
        this._i18n = {...this._i18n, ...i18n};
        this._titleEl.textContent = this._i18n.title;
        this._emptyEl.textContent = this._i18n.emptyMessage;
        this._card.title = this._i18n.expand;
        this._modal.titleEl.textContent = this._i18n.title;
    }

    _buildUI(container) {
        const card = document.createElement('div');
        card.className = 'species-pop-chart-card';
        card.style.display = 'none';
        card.title = this._i18n.expand;
        card.innerHTML = `
            <div class="species-pop-chart-header">
                <span class="species-pop-chart-title"></span>
                <span class="species-pop-chart-count"></span>
                <span class="network-topology-expand-hint">⤢</span>
            </div>
            <div class="species-pop-chart-empty"></div>
            <canvas class="species-pop-chart-canvas" style="display:none;"></canvas>`;
        container.appendChild(card);

        this._card = card;
        this._titleEl = card.querySelector('.species-pop-chart-title');
        this._countEl = card.querySelector('.species-pop-chart-count');
        this._emptyEl = card.querySelector('.species-pop-chart-empty');
        this._canvas = card.querySelector('.species-pop-chart-canvas');
        this._ctx = this._canvas.getContext('2d');

        this._titleEl.textContent = this._i18n.title;
        this._emptyEl.textContent = this._i18n.emptyMessage;

        card.addEventListener('click', () => this._openModal());

        this._modal = new Modal({titleExtraClass: 'species-pop-chart-modal-title'});
        this._modal.titleEl.textContent = this._i18n.title;
        this._modal.titleEl.insertAdjacentHTML('afterend', `
            <select class="network-topology-history-select" id="spc-history-select" style="display:none;">
                <option value="current">Current Target</option>
            </select>`);
        this._historySelect = this._modal.el.querySelector('#spc-history-select');
        this._historySelect.addEventListener('change', () => {
            this._selectedKey = this._historySelect.value;
            const W = this._modalCanvas.parentElement.clientWidth - 32;
            this._drawChart(this._modalCanvas, this._modalCtx, W, MODAL_CHART_H, this._stateForKey(this._selectedKey));
        });
        this._modal.bodyEl.innerHTML = '<canvas class="species-pop-chart-modal-canvas"></canvas>';
        this._modalCanvas = this._modal.bodyEl.querySelector('.species-pop-chart-modal-canvas');
        this._modalCtx = this._modalCanvas.getContext('2d');
    }

    // Resolves 'current' | objectiveKey to the {history, speciesOrder, colorMap} it should render.
    _stateForKey(key) {
        const current = {history: this._history, speciesOrder: this._speciesOrder, colorMap: this._colorMap};
        if (key === 'current') return current;
        return this._pastTargets.find(t => String(t.objectiveKey) === key) || current;
    }

    _openModal() {
        if (!this._history.length && this._pastTargets.length === 0) return;
        this._modal.open();
        this._historySelect.value = this._selectedKey;
        const W = this._modalCanvas.parentElement.clientWidth - 32;
        this._drawChart(this._modalCanvas, this._modalCtx, W, MODAL_CHART_H, this._stateForKey(this._selectedKey));
    }

    _update(data) {
        const entries = new Map();
        let total = 0;
        for (const s of data.species) {
            entries.set(s.speciesId, s.memberCount);
            total += s.memberCount;
            if (!this._colorMap.has(s.speciesId)) {
                this._colorMap.set(s.speciesId, PALETTE[this._colorIndex % PALETTE.length]);
                this._colorIndex++;
                this._speciesOrder.push(s.speciesId);
            }
        }
        this._history.push({generation: data.generation, entries, total});
        this._emptyEl.style.display = 'none';
        this._canvas.style.display = '';
        this._countEl.textContent = `${data.species.length}`;
        this._redraw();
        if (this._modal.isOpen() && this._selectedKey === 'current') {
            const W = this._modalCanvas.parentElement.clientWidth - 32;
            this._drawChart(this._modalCanvas, this._modalCtx, W, MODAL_CHART_H, this._stateForKey('current'));
        }
    }

    // Neatest's current target was covered: species restart for the next target, so archive this target's
    // chart under its objective key instead of letting the live chart keep stacking across the switch.
    _onTargetCovered(data) {
        if (this._history.length > 0) {
            this._pastTargets.push({
                objectiveKey: data.objectiveKey,
                history: this._history,
                speciesOrder: this._speciesOrder,
                colorMap: this._colorMap
            });
            const opt = document.createElement('option');
            opt.value = String(data.objectiveKey);
            opt.textContent = `Obj. ${data.objectiveKey}`;
            opt.title = data.label;
            this._historySelect.appendChild(opt);
            this._historySelect.style.display = '';
        }
        this._history = [];
        this._speciesOrder = [];
        this._colorMap = new Map();
        this._colorIndex = 0;
        this._countEl.textContent = '';
        this._redraw();
    }

    _redraw() {
        const W = this._card.clientWidth - 2;
        if (W <= 0) return;
        this._drawChart(this._canvas, this._ctx, W, CHART_H, this._stateForKey('current'));
    }

    _drawChart(canvas, ctx, W, chartH, {history, speciesOrder, colorMap}) {
        canvas.width = W;
        canvas.height = chartH + PAD_T + PAD_B;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!history.length) return;

        const chartX = PAD_L;
        const chartY = PAD_T;
        const chartW = W - PAD_L - PAD_R;
        const n = history.length;
        const toX = i => chartX + (i / Math.max(n - 1, 1)) * chartW;
        const toY = prop => chartY + chartH - prop * chartH;

        // Draw stacked areas bottom-to-top
        const floors = new Array(n).fill(0);

        for (const speciesId of speciesOrder) {
            const color = colorMap.get(speciesId);
            const tops = history.map((h, i) => {
                const count = h.entries.get(speciesId) || 0;
                const prop = h.total > 0 ? count / h.total : 0;
                return floors[i] + prop;
            });

            ctx.beginPath();
            if (n === 1) {
                ctx.rect(chartX, toY(tops[0]), chartW, toY(floors[0]) - toY(tops[0]));
            } else {
                for (let i = 0; i < n; i++) {
                    const x = toX(i);
                    const y = toY(tops[i]);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                for (let i = n - 1; i >= 0; i--) {
                    ctx.lineTo(toX(i), toY(floors[i]));
                }
                ctx.closePath();
            }
            ctx.fillStyle = color;
            ctx.fill();

            for (let i = 0; i < n; i++) {
                floors[i] = tops[i];
            }
        }

        // X-axis line
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chartX, chartY + chartH);
        ctx.lineTo(chartX + chartW, chartY + chartH);
        ctx.stroke();

        // X-axis labels
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#9ca3af';

        const firstGen = history[0].generation;
        const lastGen = history[n - 1].generation;
        const genRange = lastGen - firstGen || 1;
        const tickStep = this._niceStep(genRange / 6);
        const labeled = new Set();

        ctx.textAlign = 'center';
        for (let g = firstGen; g <= lastGen; g += tickStep) {
            const rounded = Math.round(g / tickStep) * tickStep;
            if (labeled.has(rounded)) continue;
            const idx = history.findIndex(h => h.generation >= rounded);
            if (idx < 0) continue;
            ctx.fillText(String(history[idx].generation), toX(idx), chartY + chartH + 13);
            labeled.add(rounded);
        }

        ctx.textAlign = n > 1 ? 'right' : 'center';
        ctx.fillText(String(lastGen), toX(n - 1), chartY + chartH + 13);

        ctx.textAlign = 'center';
        ctx.fillText('Generations', chartX + chartW / 2, chartY + chartH + PAD_B - 4);
    }

    _niceStep(raw) {
        if (raw <= 0) return 1;
        const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
        const n = raw / magnitude;
        const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
        return Math.max(1, nice * magnitude);
    }
}

module.exports = SpeciesPopulationChart;
