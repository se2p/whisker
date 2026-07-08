const H_PAD = 44;
const V_PAD = 20;
const CHART_H = 180;

class FitnessChart {
    constructor(container, i18n = {}) {
        this._i18n = {
            title: i18n.title || 'Fitness Over Time',
            best: i18n.best || 'Best',
            average: i18n.average || 'Average',
            emptyMessage: i18n.emptyMessage || 'Start a NEAT algorithm to see fitness over time',
            labelNeatest: i18n.labelNeatest || 'Current objective'
        };
        this._data = [];
        this._buildUI(container);
        window.Whisker.scratch.vm.on('FITNESS_UPDATE', data => this._update(data));
    }

    reset() {
        this._data = [];
        this._emptyEl.style.display = '';
        this._canvas.style.display = 'none';
        this._valueEl.textContent = '';
    }

    startEmpty() {
        this._data = [];
        this._valueEl.textContent = '';
        this._emptyEl.style.display = 'none';
        this._canvas.style.display = '';
        this._redraw();
    }

    updateI18n(i18n) {
        this._i18n = {...this._i18n, ...i18n};
        this._titleEl.textContent = this._i18n.title;
        this._subtitleEl.textContent = this._i18n.labelNeatest;
        this._emptyEl.textContent = this._i18n.emptyMessage;
    }

    _buildUI(container) {
        const card = document.createElement('div');
        card.className = 'fitness-chart-card';
        card.innerHTML = `
            <div class="fitness-chart-header">
                <div class="fitness-chart-title-group">
                    <span class="fitness-chart-title"></span>
                    <span class="fitness-chart-subtitle"></span>
                </div>
                <span class="fitness-chart-value"></span>
            </div>
            <div class="fitness-chart-empty"></div>
            <canvas class="fitness-chart-canvas" style="display:none;"></canvas>`;
        container.appendChild(card);

        this._card = card;
        this._titleEl = card.querySelector('.fitness-chart-title');
        this._subtitleEl = card.querySelector('.fitness-chart-subtitle');
        this._valueEl = card.querySelector('.fitness-chart-value');
        this._emptyEl = card.querySelector('.fitness-chart-empty');
        this._canvas = card.querySelector('.fitness-chart-canvas');
        this._ctx = this._canvas.getContext('2d');

        this._titleEl.textContent = this._i18n.title;
        this._subtitleEl.textContent = this._i18n.labelNeatest;
        this._emptyEl.textContent = this._i18n.emptyMessage;
    }

    _update(data) {
        this._data.push(data);
        this._emptyEl.style.display = 'none';
        this._canvas.style.display = '';
        this._redraw();
    }

    _redraw() {
        const canvas = this._canvas;
        const ctx = this._ctx;
        const W = this._card.clientWidth - 2;
        if (W <= 0) return;

        canvas.width = W;
        canvas.height = CHART_H + V_PAD * 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const chartX = H_PAD;
        const chartY = V_PAD;
        const chartW = W - H_PAD - 10;
        const chartH = CHART_H;

        const hasAverage = this._data.some(d => d.average !== void 0);
        const rawMax = this._data.reduce((m, d) => Math.max(m, d.best, d.average ?? -Infinity), -Infinity);
        const rawMin = this._data.reduce((m, d) => Math.min(m, d.best, d.average ?? Infinity), Infinity);
        const dataMax = isFinite(rawMax) ? rawMax : 1;
        const dataMin = Math.min(isFinite(rawMin) ? rawMin : 0, 0);
        const yStep = this._niceStep((dataMax - dataMin) || 1);
        const yMax = Math.ceil(dataMax / yStep) * yStep || yStep;
        const yMin = Math.floor(dataMin / yStep) * yStep;
        const totalRange = yMax - yMin;

        // Grid lines + Y labels
        ctx.lineWidth = 1;
        ctx.font = '10px sans-serif';
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

        if (!this._data.length) return;

        const lastIdx = Math.max(this._data.length - 1, 1);
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
            this._data.forEach((d, i) => {
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

        // Best line
        ctx.beginPath();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        this._data.forEach((d, i) => {
            const x = toX(i);
            const y = toY(d.best);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Legend
        if (hasAverage) {
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'left';
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(chartX + 4, chartY + 10);
            ctx.lineTo(chartX + 18, chartY + 10);
            ctx.stroke();
            ctx.fillStyle = '#2563eb';
            ctx.fillText(this._i18n.best, chartX + 22, chartY + 13);

            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(chartX + 64, chartY + 10);
            ctx.lineTo(chartX + 78, chartY + 10);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#9ca3af';
            ctx.fillText(this._i18n.average, chartX + 82, chartY + 13);
        }

        // Header value
        const last = this._data[this._data.length - 1];
        this._valueEl.textContent = `${this._i18n.best}: ${this._formatVal(last.best)}`;
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
