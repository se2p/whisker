const H_PAD = 40;
const V_PAD = 20;
const CURVE_H = 160;
const X_LABEL_H = 20;

class CoverageCurve {
    constructor(container, i18n = {}) {
        this._i18n = {
            title: i18n.title || 'Coverage',
            generation: i18n.generation || 'Generation',
            emptyMessage: i18n.emptyMessage || 'Start a search to see coverage over time'
        };
        this._data = [];
        this._buildUI(container);
        window.Whisker.scratch.vm.on('COVERAGE_UPDATE', data => this._update(data));
    }

    reset() {
        this._data = [];
        this._emptyEl.style.display = '';
        this._canvas.style.display = 'none';
        this._valueSEl.style.display = 'none';
        this._valueBEl.style.display = 'none';
    }

    startEmpty() {
        this._data = [];
        this._valueSEl.style.display = 'none';
        this._valueBEl.style.display = 'none';
        this._emptyEl.style.display = 'none';
        this._canvas.style.display = '';
        this._redraw();
    }

    updateI18n(i18n) {
        this._i18n = {...this._i18n, ...i18n};
        this._titleEl.textContent = this._i18n.title;
        this._emptyEl.textContent = this._i18n.emptyMessage;
    }

    _buildUI(container) {
        const card = document.createElement('div');
        card.className = 'coverage-curve-card';
        card.innerHTML = `
            <div class="coverage-curve-header">
                <span class="coverage-curve-title"></span>
                <span class="coverage-curve-value">
                    <span class="coverage-curve-value-s" style="display:none;"></span>
                    <span class="coverage-curve-value-b" style="display:none;"></span>
                </span>
            </div>
            <div class="coverage-curve-empty"></div>
            <canvas class="coverage-curve-canvas" style="display:none;"></canvas>`;
        container.appendChild(card);

        this._card = card;
        this._titleEl = card.querySelector('.coverage-curve-title');
        this._valueSEl = card.querySelector('.coverage-curve-value-s');
        this._valueBEl = card.querySelector('.coverage-curve-value-b');
        this._emptyEl = card.querySelector('.coverage-curve-empty');
        this._canvas = card.querySelector('.coverage-curve-canvas');
        this._ctx = this._canvas.getContext('2d');

        this._titleEl.textContent = this._i18n.title;
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
        const W = this._card.clientWidth - 2; // card border
        if (W <= 0) return;

        canvas.width = W;
        canvas.height = CURVE_H + V_PAD + X_LABEL_H + 4;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const chartX = H_PAD;
        const chartY = V_PAD;
        const chartW = W - H_PAD - 10;
        const chartH = CURVE_H;

        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#888';

        // Grid lines + Y labels
        ctx.strokeStyle = 'rgba(0,0,0,0.07)';
        ctx.lineWidth = 1;
        ctx.textAlign = 'right';
        for (let pct = 0; pct <= 100; pct += 25) {
            const y = chartY + chartH - (pct / 100) * chartH;
            ctx.beginPath();
            ctx.moveTo(chartX, y);
            ctx.lineTo(chartX + chartW, y);
            ctx.stroke();
            ctx.fillText(`${pct}%`, chartX - 4, y + 3);
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

        const maxIter = Math.max(this._data[this._data.length - 1].iteration, 1);
        const toX = iter => chartX + (iter / maxIter) * chartW;
        const toY = cov => chartY + chartH - cov * chartH;

        // X axis ticks + labels
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        const tickCount = 5;
        for (let t = 0; t <= tickCount; t++) {
            const iter = Math.round((t / tickCount) * maxIter);
            const x = toX(iter);
            ctx.beginPath();
            ctx.moveTo(x, chartY + chartH);
            ctx.lineTo(x, chartY + chartH + 4);
            ctx.stroke();
            ctx.fillText(String(iter), x, chartY + chartH + X_LABEL_H);
        }

        // Statement line
        ctx.beginPath();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        this._data.forEach((d, i) => {
            const x = toX(d.iteration);
            const y = toY(d.statementCoverage);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        // Branch line
        ctx.beginPath();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        this._data.forEach((d, i) => {
            const x = toX(d.iteration);
            const y = toY(d.branchCoverage);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Current value label
        const last = this._data[this._data.length - 1];
        this._valueSEl.style.display = '';
        this._valueBEl.style.display = '';
        this._valueSEl.textContent = `S: ${(last.statementCoverage * 100).toFixed(1)}%`;
        this._valueBEl.textContent = `B: ${(last.branchCoverage * 100).toFixed(1)}%`;
    }
}

module.exports = CoverageCurve;
