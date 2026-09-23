const Modal = require('./modal');
const {i18n} = require('../index');
const {fillTargetSelect} = require('./target-select');

const H_PAD = 44;
const V_PAD = 20;
const CHART_H = 180;

class FitnessChart {
    constructor(container) {
        this._data = [];
        this._history = [];
        this._perTargetSeries = new Map();
        this._perTargetLabels = new Map();
        this._selectedKey = 'current';
        this._buildUI(container);
        this.updateI18n();
        window.Whisker.scratch.vm.on('FITNESS_UPDATE', data => this._update(data));
        window.Whisker.scratch.vm.on('NETWORK_TOPOLOGY_COVERED', data => this._onTargetCovered(data));
        window.Whisker.scratch.vm.on('OBJECTIVE_COVERED', data => this._onTargetCovered(data));
        // A skipped (uncovered) target is dropped
        window.Whisker.scratch.vm.on('SPECIES_TARGET_ABANDONED', () => {
            this._data = [];
            this._applySelection();
        });
    }

    reset() {
        this._data = [];
        this._history = [];
        this._perTargetSeries = new Map();
        this._perTargetLabels = new Map();
        this._selectedKey = 'current';
        this._emptyEl.style.display = '';
        this._canvas.style.display = 'none';
        this._valueEl.textContent = '';
        this._subtitleEl.textContent = i18n.t('current-target');
        this._rebuildHistorySelect();
        this._modal.close();
    }

    startEmpty() {
        this._data = [];
        this._history = [];
        this._perTargetSeries = new Map();
        this._perTargetLabels = new Map();
        this._selectedKey = 'current';
        this._valueEl.textContent = '';
        this._subtitleEl.textContent = i18n.t('current-target');
        this._emptyEl.style.display = 'none';
        this._canvas.style.display = '';
        this._rebuildHistorySelect();
        this._redraw();
    }

    // Refreshes the text that is built in JS (dropdown entries, subtitle); the static text is data-i18n.
    updateI18n() {
        this._rebuildHistorySelect();
        this._applySelection();
    }

    _buildUI(container) {
        const card = document.createElement('div');
        card.className = 'fitness-chart-card';
        card.setAttribute('data-i18n', '[title]click-to-expand');
        card.innerHTML = `
            <div class="fitness-chart-header">
                <div class="fitness-chart-title-group">
                    <span class="fitness-chart-title" data-i18n="fitness-chart-title"></span>
                    <span class="fitness-chart-subtitle"></span>
                </div>
                <div class="fitness-chart-right-group">
                    <span class="fitness-chart-value"></span>
                    <select class="target-select fitness-chart-history-select">
                        <option value="current"></option>
                    </select>
                    <span class="network-topology-expand-hint">⤢</span>
                </div>
            </div>
            <div class="fitness-chart-empty" data-i18n="fitness-chart-empty"></div>
            <canvas class="fitness-chart-canvas" style="display:none;"></canvas>`;
        container.appendChild(card);

        this._card = card;
        this._subtitleEl = card.querySelector('.fitness-chart-subtitle');
        this._valueEl = card.querySelector('.fitness-chart-value');
        this._emptyEl = card.querySelector('.fitness-chart-empty');
        this._canvas = card.querySelector('.fitness-chart-canvas');
        this._ctx = this._canvas.getContext('2d');
        this._historySelect = card.querySelector('.fitness-chart-history-select');

        this._historySelect.addEventListener('click', e => e.stopPropagation());
        this._historySelect.addEventListener('change', () => {
            this._selectedKey = this._historySelect.value;
            this._applySelection();
        });

        card.addEventListener('click', () => this._openModal());

        this._modal = new Modal();
        this._modal.titleEl.setAttribute('data-i18n', 'fitness-chart-title');
        this._modal.bodyEl.innerHTML = '<canvas class="chart-modal-canvas"></canvas>';
        this._modalCanvas = this._modal.bodyEl.querySelector('.chart-modal-canvas');
        this._modalCtx = this._modalCanvas.getContext('2d');
    }

    _openModal() {
        const data = this._currentData || this._data;
        if (!data.length) return;
        this._modal.open();
        const w = this._modalCanvas.parentElement.clientWidth - 32;
        this._renderToCanvas(data, this._modalCanvas, this._modalCtx, w);
    }

    _onTargetCovered(event) {
        const key = event.objectiveKey;
        const seriesData = this._perTargetSeries.has(key) ? this._perTargetSeries.get(key) : [...this._data];
        // A covered target is no longer scored, so the search reports its final value along with the event.
        if (event.best !== void 0) seriesData.push({best: event.best, average: event.average});
        this._history.push({objectiveKey: key, label: event.label, data: seriesData});
        this._perTargetSeries.delete(key);
        this._perTargetLabels.delete(key);
        if (this._perTargetSeries.size === 0) this._data = [];
        this._rebuildHistorySelect();
        this._applySelection();
    }

    _update(data) {
        if (data.perTarget && data.perTarget.length > 0) {
            data.perTarget.forEach(t => {
                if (!this._perTargetSeries.has(t.targetKey)) this._perTargetSeries.set(t.targetKey, []);
                this._perTargetSeries.get(t.targetKey).push({best: t.best, average: t.average});
                this._perTargetLabels.set(t.targetKey, t.label);
            });
            this._rebuildHistorySelect();
            this._applySelection();
            return;
        }
        if (this._selectedKey !== 'current') return;
        this._data.push(data);
        this._subtitleEl.textContent = data.label || i18n.t('current-target');
        this._emptyEl.style.display = 'none';
        this._canvas.style.display = '';
        this._redraw();
    }

    _rebuildHistorySelect() {
        this._selectedKey = fillTargetSelect(this._historySelect, {
            frontier: [...this._perTargetSeries.keys()].map(key => ({key, label: this._perTargetLabels.get(key)})),
            previous: this._history.map(h => ({key: h.objectiveKey, label: h.label}))
        });
    }

    _applySelection() {
        const key = this._selectedKey;
        let data = null;
        let title = i18n.t('current-target');

        if (key.startsWith('frontier:')) {
            const targetKey = parseInt(key.split(':')[1], 10);
            data = this._perTargetSeries.get(targetKey) || [];
            title = this._perTargetLabels.get(targetKey) || `Obj. ${targetKey}`;
        } else if (key.startsWith('covered:')) {
            const targetKey = parseInt(key.split(':')[1], 10);
            const entry = this._history.find(h => h.objectiveKey === targetKey);
            data = entry ? entry.data : [];
            title = entry ? entry.label : '';
        } else {
            data = this._data;
            const latest = data[data.length - 1];
            title = (latest && latest.label) || i18n.t('current-target');
        }

        const runStarted = data.length > 0;
        this._emptyEl.style.display = runStarted ? 'none' : '';
        this._canvas.style.display = runStarted ? '' : 'none';
        this._subtitleEl.textContent = title;
        if (!data.length) this._valueEl.textContent = '';
        this._redrawData(data);
    }

    _redraw() {
        this._redrawData(this._data);
    }

    _redrawData(data) {
        this._currentData = data;
        const W = this._card.clientWidth - 2;
        if (W > 0) this._renderToCanvas(data, this._canvas, this._ctx, W);
        if (this._modal.isOpen()) {
            const w = this._modalCanvas.parentElement.clientWidth - 32;
            this._renderToCanvas(data, this._modalCanvas, this._modalCtx, w);
        }
    }

    _renderToCanvas(data, canvas, ctx, W) {
        canvas.width = W;
        canvas.height = CHART_H + V_PAD * 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const chartX = H_PAD;
        const chartY = V_PAD;
        const chartW = W - H_PAD - 10;
        const chartH = CHART_H;

        const hasAverage = data.some(d => d.average !== void 0);
        const rawMax = data.reduce((m, d) => Math.max(m, d.best, d.average ?? -Infinity), -Infinity);
        const rawMin = data.reduce((m, d) => Math.min(m, d.best, d.average ?? Infinity), Infinity);
        const dataMax = isFinite(rawMax) ? rawMax : 1;
        const dataMin = Math.min(isFinite(rawMin) ? rawMin : 0, 0);
        const yStep = this._niceStep((dataMax - dataMin) || 1);
        const yMax = Math.ceil(dataMax / yStep) * yStep || yStep;
        const yMin = Math.floor(dataMin / yStep) * yStep;
        const totalRange = yMax - yMin;

        // Grid lines + Y labels
        ctx.lineWidth = 1;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        for (let v = yMin; v <= yMax + yStep * 0.01; v += yStep) {
            const y = chartY + chartH - ((v - yMin) / totalRange) * chartH;
            ctx.strokeStyle = 'rgba(0,0,0,0.07)';
            ctx.beginPath();
            ctx.moveTo(chartX, y);
            ctx.lineTo(chartX + chartW, y);
            ctx.stroke();
            ctx.fillStyle = '#888';
            ctx.fillText(this._formatVal(v), chartX - 4, y + 3);
        }

        // Axes
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chartX, chartY);
        ctx.lineTo(chartX, chartY + chartH);
        ctx.lineTo(chartX + chartW, chartY + chartH);
        ctx.stroke();

        if (!data.length) return;

        const lastIdx = Math.max(data.length - 1, 1);
        const toX = i => chartX + (i / lastIdx) * chartW;
        const toY = v => chartY + chartH - ((v - yMin) / totalRange) * chartH;

        // Average line (dashed, only when present)
        if (hasAverage) {
            ctx.beginPath();
            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.lineJoin = 'round';
            let started = false;
            data.forEach((d, i) => {
                if (d.average === void 0) return;
                const x = toX(i);
                const y = toY(d.average);
                if (started) {
                    ctx.lineTo(x, y);
                } else {
                    ctx.moveTo(x, y);
                    started = true;
                }
            });
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Best line (or dot for single point)
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        if (data.length === 1) {
            ctx.beginPath();
            ctx.arc(toX(0), toY(data[0].best), 3, 0, Math.PI * 2);
            ctx.fillStyle = '#2563eb';
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.lineJoin = 'round';
            data.forEach((d, i) => {
                const x = toX(i);
                const y = toY(d.best);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
        }

        // Legend
        if (hasAverage) {
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(chartX + 4, chartY + 10);
            ctx.lineTo(chartX + 18, chartY + 10);
            ctx.stroke();
            ctx.fillStyle = '#2563eb';
            ctx.fillText(i18n.t('fitness-chart-best'), chartX + 22, chartY + 13);

            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(chartX + 64, chartY + 10);
            ctx.lineTo(chartX + 78, chartY + 10);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#9ca3af';
            ctx.fillText(i18n.t('fitness-chart-average'), chartX + 82, chartY + 13);
        }

        // Header value
        const last = data[data.length - 1];
        this._valueEl.textContent = `${i18n.t('fitness-chart-best')}: ${this._formatVal(last.best)}`;
    }

    _niceStep(max) {
        if (max <= 0) return 1;
        const raw = max / 4;
        const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
        const n = raw / magnitude;
        const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
        return nice * magnitude;
    }

    _formatVal(v) {
        if (v === 0) return '0';
        if (Math.abs(v) >= 10000) return `${(v / 1000).toFixed(1)}k`;
        if (Number.isInteger(v) || Math.abs(v) >= 100) return `${Math.round(v)}`;
        if (Math.abs(v) >= 10) return v.toFixed(1);
        return v.toFixed(2);
    }
}

module.exports = FitnessChart;
