const MAX_MESSAGES = 500;

class ConsoleLog {
    constructor(container, i18n = {}) {
        this._i18n = {
            title: i18n.title || 'Console Logs',
            all: i18n.all || 'All',
            info: i18n.info || 'Info',
            error: i18n.error || 'Error',
            warn: i18n.warn || 'Warn'
        };
        this._messages = [];
        this._filter = 'all';
        this._collapsed = false;
        this._buildUI(container);
        this._interceptConsole();
    }

    clear() {
        this._messages = [];
        this._output.innerHTML = '';
    }

    updateI18n(i18n) {
        this._i18n = {...this._i18n, ...i18n};
        this._titleEl.textContent = this._i18n.title;
        this._updateFilterLabels();
    }

    _buildUI(container) {
        const card = document.createElement('div');
        card.className = 'console-log-card';
        card.innerHTML = `
            <div class="console-log-header">
                <span class="console-log-title"></span>
                <button class="console-log-collapse-btn" aria-label="collapse">&#8963;</button>
            </div>
            <div class="console-log-filter-bar">
                <button class="console-log-filter-btn console-log-filter-btn--active" data-filter="all"><span class="console-log-filter-label"></span></button>
                <button class="console-log-filter-btn" data-filter="info"><i class="fas fa-info-circle"></i> <span class="console-log-filter-label"></span></button>
                <button class="console-log-filter-btn" data-filter="error"><i class="fas fa-times-circle"></i> <span class="console-log-filter-label"></span></button>
                <button class="console-log-filter-btn" data-filter="warn"><i class="fas fa-exclamation-triangle"></i> <span class="console-log-filter-label"></span></button>
            </div>
            <div class="console-log-output"></div>`;
        container.appendChild(card);

        this._card = card;
        this._output = card.querySelector('.console-log-output');
        this._titleEl = card.querySelector('.console-log-title');
        this._collapseBtn = card.querySelector('.console-log-collapse-btn');

        this._titleEl.textContent = this._i18n.title;
        this._updateFilterLabels();

        card.querySelectorAll('.console-log-filter-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                this._setFilter(btn.dataset.filter);
            });
        });

        card.querySelector('.console-log-header').addEventListener('click', () => this._toggleCollapse());
        this._collapseBtn.addEventListener('click', e => {
            e.stopPropagation();
            this._toggleCollapse();
        });
    }

    _updateFilterLabels() {
        this._card.querySelectorAll('.console-log-filter-btn').forEach(btn => {
            const label = btn.querySelector('.console-log-filter-label');
            if (label) label.textContent = this._i18n[btn.dataset.filter] || btn.dataset.filter;
        });
    }

    _setFilter(filter) {
        this._filter = filter;
        this._card.querySelectorAll('.console-log-filter-btn').forEach(btn => {
            btn.classList.toggle('console-log-filter-btn--active', btn.dataset.filter === filter);
        });
        this._card.querySelectorAll('.console-log-line').forEach(line => {
            line.style.display = (filter === 'all' || line.dataset.type === filter) ? '' : 'none';
        });
    }

    _toggleCollapse() {
        this._collapsed = !this._collapsed;
        this._output.style.display = this._collapsed ? 'none' : '';
        this._card.querySelector('.console-log-filter-bar').style.display = this._collapsed ? 'none' : '';
        this._collapseBtn.innerHTML = this._collapsed ? '&#8964;' : '&#8963;';
    }

    _formatArgs(args) {
        if (!args.length) return '';
        const first = args[0];
        if (typeof first === 'string' && first.includes('%c')) {
            const cssCount = (first.match(/%c/g) || []).length;
            const text = first.replace(/%c/g, '');
            const remaining = args.slice(1 + cssCount).map(a => {
                if (a === null) return 'null';
                if (typeof a === 'object') {
                    try {
                        return JSON.stringify(a);
                    } catch (e) {
                        return String(a);
                    }
                }
                return String(a);
            });
            return (text + (remaining.length ? ` ${remaining.join(' ')}` : '')).trim();
        }
        return args.map(a => {
            if (a === null) return 'null';
            if (typeof a === 'object') {
                try {
                    return JSON.stringify(a);
                } catch (e) {
                    return String(a);
                }
            }
            return String(a);
        }).join(' ');
    }

    _interceptConsole() {
        const typeMap = {log: 'info', info: 'info', debug: 'info', warn: 'warn', error: 'error'};
        Object.entries(typeMap).forEach(([method, type]) => {
            const original = console[method].bind(console);
            console[method] = (...args) => {
                original(...args);
                this._addMessage(type, this._formatArgs(args));
            };
        });
    }

    _addMessage(type, text) {
        if (this._messages.length >= MAX_MESSAGES) {
            this._messages.shift();
            if (this._output.firstChild) this._output.removeChild(this._output.firstChild);
        }
        this._messages.push({type, text});

        const line = document.createElement('div');
        line.className = 'console-log-line';
        line.dataset.type = type;
        line.style.display = (this._filter === 'all' || this._filter === type) ? '' : 'none';

        const typeSpan = document.createElement('span');
        typeSpan.className = `console-log-type console-log-type--${type}`;
        typeSpan.textContent = `[${type}]`;

        const textNode = document.createTextNode(`${text}`);

        line.appendChild(typeSpan);
        line.appendChild(textNode);
        this._output.appendChild(line);
        this._output.scrollTop = this._output.scrollHeight;
    }
}

module.exports = ConsoleLog;
