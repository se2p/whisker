const H_PAD = 40;
const V_PAD = 20;
const CURVE_H = 180;

class CoverageCurve {
    constructor(container, i18n = {}) {
        this._i18n = {
            title: i18n.title || 'Branch Coverage',
            generation: i18n.generation || 'Generation',
            coverage: i18n.coverage || 'Coverage'
        };
        this._data = [];
        this._buildUI(container);
        window.Whisker.scratch.vm.on('COVERAGE_UPDATE', data => this._update(data));
    }

    reset() {
        this._data = [];
        this._redraw();
    }

    updateI18n(i18n) {
        this._i18n = {...this._i18n, ...i18n};
        this._titleEl.textContent = this._i18n.title;
    }

    _buildUI(container) {
        const card = document.createElement('div');
        card.className = 'coverage-curve-card';
        card.innerHTML = `
            <div class="coverage-curve-header">
                <span class="coverage-curve-title"></span>
                <span class="coverage-curve-value"></span>
            </div>
            <canvas class="coverage-curve-canvas"></canvas>`;
        container.appendChild(card);

        this._card = card;
        this._titleEl = card.querySelector('.coverage-curve-title');
        this._valueEl = card.querySelector('.coverage-curve-value');
        this._canvas = card.querySelector('.coverage-curve-canvas');
        this._ctx = this._canvas.getContext('2d');

        this._titleEl.textContent = this._i18n.title;
        this._redraw();
    }

    _update(data) {
        this._data.push(data);
        this._redraw();
    }

    _redraw() {
        const canvas = this._canvas;
        const ctx = this._ctx;
        const W = this._card.clientWidth - 2; // card border
        if (W <= 0) return;

        canvas.width = W;
        canvas.height = CURVE_H + V_PAD * 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const chartX = H_PAD;
        const chartY = V_PAD;
        const chartW = W - H_PAD - 10;
        const chartH = CURVE_H;

        // Grid lines + Y labels
        ctx.strokeStyle = 'rgba(0,0,0,0.07)';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
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

        if (!this._data.length) {
            this._valueEl.textContent = '';
            return;
        }

        // Coverage line — X scaled by index so even few points spread across full width
        const lastIdx = Math.max(this._data.length - 1, 1);
        const toX = i => chartX + (i / lastIdx) * chartW;
        const toY = cov => chartY + chartH - cov * chartH;

        ctx.beginPath();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        this._data.forEach((d, i) => {
            const x = toX(i);
            const y = toY(d.coverage);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Current value label
        const last = this._data[this._data.length - 1];
        this._valueEl.textContent = `${(last.coverage * 100).toFixed(1)}%`;
    }
}

module.exports = CoverageCurve;
