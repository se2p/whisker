const Modal = require('./modal');
const {createHoverTooltip} = require('./network-diagram');
const {i18n} = require('../index');
const {fillTargetSelect} = require('./target-select');

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
    constructor(container) {
        this._layouts = new WeakMap();
        this._resetState();
        this._buildUI(container);
        this.updateI18n();
        window.Whisker.scratch.vm.on('SPECIES_NETWORK_TOPOLOGY', data => this._update(data));
        // Only Neatest emits these (single sequential target, species restart on each switch)
        window.Whisker.scratch.vm.on('SPECIES_TARGET_COVERED', data => this._onTargetCovered(data));
        window.Whisker.scratch.vm.on('SPECIES_NETWORK_TOPOLOGY_COVERED', data => {
            this._coveredSnapshot = data;
        });
        // A skipped (uncovered) target is dropped
        window.Whisker.scratch.vm.on('SPECIES_TARGET_ABANDONED', () => this._clearLive());
    }

    _resetState() {
        this._history = [];
        this._speciesOrder = [];
        this._colorMap = new Map();
        this._colorIndex = 0;
        this._pastTargets = [];
        this._coveredSnapshot = null;
        this._firstGeneration = 0;
        this._selectedKey = 'current';
    }

    reset() {
        this._resetState();
        this._rebuildHistorySelect();
        this._emptyEl.style.display = '';
        this._canvas.style.display = 'none';
        this._countEl.textContent = '';
        this._modal.close();
    }

    startEmpty() {
        this._resetState();
        this._rebuildHistorySelect();
        this._emptyEl.style.display = 'none';
        this._canvas.style.display = '';
        this._redraw();
        this._modal.close();
    }

    // Refreshes the text that is built in JS (dropdown entry, species count); the static text is data-i18n.
    updateI18n() {
        this._rebuildHistorySelect();
        this._renderCount();
    }

    // The objective dropdown: the current target, then the targets covered earlier. Only Neatest archives
    // targets, so it stays hidden until there is one (never for the many-objective runs).
    _rebuildHistorySelect() {
        this._selectedKey = fillTargetSelect(this._historySelect, {
            previous: this._pastTargets.map(t => ({key: t.objectiveKey, label: t.label}))
        });
        this._historySelect.style.display = this._pastTargets.length > 0 ? '' : 'none';
    }

    // Shows how many species the selected target has (in its latest generation).
    _renderCount() {
        const {history} = this._stateForKey(this._selectedKey);
        const count = history.length > 0 ? history[history.length - 1].entries.size : 0;
        this._countEl.textContent = count ? `${i18n.t('config-num-species')}: ${count}` : '';
    }

    _buildUI(container) {
        const card = document.createElement('div');
        card.className = 'species-pop-chart-card';
        card.style.display = 'none';
        card.setAttribute('data-i18n', '[title]click-to-expand');
        card.innerHTML = `
            <div class="species-pop-chart-header">
                <span class="species-pop-chart-title" data-i18n="species-pop-chart-title"></span>
                <span class="species-pop-chart-count"></span>
                <select class="target-select"></select>
                <span class="network-topology-expand-hint">⤢</span>
            </div>
            <div class="species-pop-chart-empty" data-i18n="species-pop-chart-empty"></div>
            <canvas class="species-pop-chart-canvas" style="display:none;"></canvas>`;
        container.appendChild(card);
        Modal.makeCollapsible(card, card.querySelector('.species-pop-chart-header'));

        this._card = card;
        this._countEl = card.querySelector('.species-pop-chart-count');
        this._historySelect = card.querySelector('.target-select');
        this._emptyEl = card.querySelector('.species-pop-chart-empty');
        this._canvas = card.querySelector('.species-pop-chart-canvas');
        this._ctx = this._canvas.getContext('2d');

        card.addEventListener('click', () => this._openModal());

        this._modal = new Modal({titleExtraClass: 'species-pop-chart-modal-title'});
        this._modal.titleEl.setAttribute('data-i18n', 'species-pop-chart-title');
        this._historySelect.addEventListener('click', e => e.stopPropagation());
        this._historySelect.addEventListener('change', () => {
            this._selectedKey = this._historySelect.value;
            this._renderCount();
            this._redraw();
            this._redrawModal();
        });
        this._modal.bodyEl.innerHTML = '<canvas class="species-pop-chart-modal-canvas"></canvas>';
        this._modalCanvas = this._modal.bodyEl.querySelector('.species-pop-chart-modal-canvas');
        this._modalCtx = this._modalCanvas.getContext('2d');

        this._tooltip = createHoverTooltip();
        [this._canvas, this._modalCanvas].forEach(canvas => this._attachHover(canvas));
    }

    // Shows "Species N: M members" for the stacked band under the cursor, using the geometry
    // _drawChart recorded for this canvas.
    _attachHover(canvas) {
        canvas.addEventListener('mousemove', e => {
            const layout = this._layouts.get(canvas);
            if (!layout) return this._hideTooltip();
            const {chartX, chartY, chartW, chartH, history, speciesOrder} = layout;
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (canvas.height / rect.height);
            if (mx < chartX || mx > chartX + chartW || my < chartY || my > chartY + chartH) {
                return this._hideTooltip();
            }

            const n = history.length;
            const entry = history[n === 1 ? 0 : Math.round(((mx - chartX) / chartW) * (n - 1))];
            const fromBottom = 1 - (my - chartY) / chartH;
            let floor = 0;
            for (const speciesId of speciesOrder) {
                const count = entry.entries.get(speciesId) || 0;
                const share = entry.total > 0 ? count / entry.total : 0;
                if (count > 0 && fromBottom >= floor && fromBottom < floor + share) {
                    this._tooltip.textContent = `${i18n.t('species-networks-species')} ${speciesId}: ${count} ${i18n.t('species-networks-members')}`;
                    this._tooltip.style.display = 'block';
                    const tipW = this._tooltip.offsetWidth;
                    const left = e.clientX + 12 + tipW > window.innerWidth ? e.clientX - tipW - 8 : e.clientX + 12;
                    this._tooltip.style.left = `${left}px`;
                    this._tooltip.style.top = `${e.clientY - 24}px`;
                    return;
                }
                floor += share;
            }
            this._hideTooltip();
        });
        canvas.addEventListener('mouseleave', () => this._hideTooltip());
    }

    _hideTooltip() {
        this._tooltip.style.display = 'none';
    }

    // Resolves 'current' | 'covered:<objectiveKey>' to the {history, speciesOrder, colorMap} it should render.
    _stateForKey(key) {
        const current = {history: this._history, speciesOrder: this._speciesOrder, colorMap: this._colorMap};
        if (key === 'current') return current;
        return this._pastTargets.find(t => `covered:${t.objectiveKey}` === key) || current;
    }

    _openModal() {
        if (!this._history.length && this._pastTargets.length === 0) return;
        this._modal.open();
        this._redrawModal();
    }

    _redrawModal() {
        if (!this._modal.isOpen()) return;
        const W = this._modalCanvas.parentElement.clientWidth - 32;
        this._drawChart(this._modalCanvas, this._modalCtx, W, MODAL_CHART_H, this._stateForKey(this._selectedKey));
    }

    _update(data) {
        this._addSnapshot(data.species, data.generation);
        this._emptyEl.style.display = 'none';
        this._canvas.style.display = '';
        this._renderCount();
        this._redraw();
        this._redrawModal();
    }

    // Appends one generation's species sizes to the live chart.
    _addSnapshot(species, generation) {
        const entries = new Map();
        let total = 0;
        for (const s of species) {
            entries.set(s.speciesId, s.memberCount);
            total += s.memberCount;
            if (!this._colorMap.has(s.speciesId)) {
                this._colorMap.set(s.speciesId, PALETTE[this._colorIndex % PALETTE.length]);
                this._colorIndex++;
                this._speciesOrder.push(s.speciesId);
            }
        }
        // Neatest's generation counter runs across targets, so each target's chart counts from its first snapshot.
        if (!this._history.length) this._firstGeneration = generation;
        this._history.push({generation: generation - this._firstGeneration, entries, total});
    }

    // Neatest's current target was covered: species restart for the next target, so archive this target's
    // chart under its objective key instead of letting the live chart keep stacking across the switch.
    _onTargetCovered(data) {
        // A target covered before its first generation has no snapshots; use the species it was covered with.
        const covered = this._coveredSnapshot;
        if (!this._history.length && covered && covered.objectiveKey === data.objectiveKey) {
            this._addSnapshot(covered.species, 0);
        }
        if (this._history.length > 0) {
            this._pastTargets.push({
                objectiveKey: data.objectiveKey,
                label: data.label,
                history: this._history,
                speciesOrder: this._speciesOrder,
                colorMap: this._colorMap
            });
            this._rebuildHistorySelect();
        }
        this._clearLive();
    }

    _clearLive() {
        this._history = [];
        this._speciesOrder = [];
        this._colorMap = new Map();
        this._colorIndex = 0;
        this._renderCount();
        this._redraw();
    }

    _redraw() {
        const W = this._card.clientWidth - 2;
        if (W <= 0) return;
        this._drawChart(this._canvas, this._ctx, W, CHART_H, this._stateForKey(this._selectedKey));
    }

    _drawChart(canvas, ctx, W, chartH, {history, speciesOrder, colorMap}) {
        canvas.width = W;
        canvas.height = chartH + PAD_T + PAD_B;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this._layouts.delete(canvas);

        if (!history.length) return;

        const chartX = PAD_L;
        const chartY = PAD_T;
        const chartW = W - PAD_L - PAD_R;
        const n = history.length;
        const toX = i => chartX + (i / Math.max(n - 1, 1)) * chartW;
        const toY = prop => chartY + chartH - prop * chartH;
        this._layouts.set(canvas, {chartX, chartY, chartW, chartH, history, speciesOrder});

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
            if (idx < 0 || idx === n - 1) continue;
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
