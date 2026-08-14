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
        if (this._modalOutput) this._modalOutput.innerHTML = '';
    }

    updateI18n(i18n) {
        this._i18n = {...this._i18n, ...i18n};
        this._titleEl.textContent = this._i18n.title;
        if (this._modalTitleEl) this._modalTitleEl.textContent = this._i18n.title;
        this._updateFilterLabels();
    }

    _buildUI(container) {
        const card = document.createElement('div');
        card.className = 'console-log-card';
        card.innerHTML = `
            <div class="console-log-header">
                <span class="console-log-title"></span>
                <button class="console-log-collapse-btn" aria-label="collapse">&#8963;</button>
                <span class="console-log-expand-hint">⤢</span>
            </div>
            <div class="console-log-filter-bar">
                <button class="console-log-filter-btn console-log-filter-btn--active" data-filter="all"><span class="console-log-filter-label"></span></button>
                <button class="console-log-filter-btn" data-filter="info"><i class="fas fa-info-circle"></i> <span class="console-log-filter-label"></span></button>
                <button class="console-log-filter-btn" data-filter="error"><i class="fas fa-times-circle"></i> <span class="console-log-filter-label"></span></button>
                <button class="console-log-filter-btn" data-filter="warn"><i class="fas fa-exclamation-triangle"></i> <span class="console-log-filter-label"></span></button>
                <button class="console-log-clear-btn"><i class="fas fa-trash"></i></button>
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
        card.querySelector('.console-log-clear-btn').addEventListener('click', e => {
            e.stopPropagation();
            this.clear();
        });

        card.querySelector('.console-log-header').addEventListener('click', () => this._openModal());
        this._collapseBtn.addEventListener('click', e => {
            e.stopPropagation();
            this._toggleCollapse();
        });

        const expandHint = card.querySelector('.console-log-expand-hint');
        expandHint.addEventListener('click', e => {
            e.stopPropagation();
            this._openModal();
        });

        // Modal
        this._modal = document.createElement('div');
        this._modal.className = 'network-topology-modal console-log-modal';
        this._modal.innerHTML = `
            <div class="network-topology-modal-box">
                <div class="network-topology-modal-header">
                    <p class="network-topology-title console-log-modal-title"></p>
                    <button class="network-topology-modal-close" id="cl-modal-close">✕</button>
                </div>
                <div class="console-log-filter-bar console-log-modal-filter-bar">
                    <button class="console-log-filter-btn console-log-filter-btn--active" data-filter="all"><span class="console-log-filter-label"></span></button>
                    <button class="console-log-filter-btn" data-filter="info"><i class="fas fa-info-circle"></i> <span class="console-log-filter-label"></span></button>
                    <button class="console-log-filter-btn" data-filter="error"><i class="fas fa-times-circle"></i> <span class="console-log-filter-label"></span></button>
                    <button class="console-log-filter-btn" data-filter="warn"><i class="fas fa-exclamation-triangle"></i> <span class="console-log-filter-label"></span></button>
                    <button class="console-log-clear-btn"><i class="fas fa-trash"></i></button>
                </div>
                <div class="network-topology-modal-body">
                    <div class="console-log-output console-log-modal-output"></div>
                </div>
            </div>`;
        document.body.appendChild(this._modal);

        this._modalOutput = this._modal.querySelector('.console-log-modal-output');
        this._modalTitleEl = this._modal.querySelector('.console-log-modal-title');
        this._modalTitleEl.textContent = this._i18n.title;

        this._modal.querySelector('#cl-modal-close').addEventListener('click', () => this._closeModal());
        this._modal.addEventListener('click', e => {
            if (e.target === this._modal) this._closeModal();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') this._closeModal();
        });

        this._modal.querySelectorAll('.console-log-filter-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                this._setFilter(btn.dataset.filter);
            });
        });
        this._modal.querySelector('.console-log-clear-btn').addEventListener('click', e => {
            e.stopPropagation();
            this.clear();
        });

        this._updateFilterLabels();
    }

    _openModal() {
        this._modal.classList.add('network-topology-modal--open');
        this._rebuildModalOutput();
        const body = this._modal.querySelector('.network-topology-modal-body');
        body.scrollTop = body.scrollHeight;
    }

    _closeModal() {
        this._modal.classList.remove('network-topology-modal--open');
    }

    _rebuildModalOutput() {
        this._modalOutput.innerHTML = '';
        this._messages.forEach(({type, text}) => {
            const line = this._createLine(type, text);
            line.style.display = (this._filter === 'all' || this._filter === type) ? '' : 'none';
            this._modalOutput.appendChild(line);
        });
    }

    _updateFilterLabels() {
        [this._card, this._modal].forEach(el => {
            if (!el) return;
            el.querySelectorAll('.console-log-filter-btn').forEach(btn => {
                const label = btn.querySelector('.console-log-filter-label');
                if (label) label.textContent = this._i18n[btn.dataset.filter] || btn.dataset.filter;
            });
        });
    }

    _setFilter(filter) {
        this._filter = filter;
        [this._card, this._modal].forEach(el => {
            if (!el) return;
            el.querySelectorAll('.console-log-filter-btn').forEach(btn => {
                btn.classList.toggle('console-log-filter-btn--active', btn.dataset.filter === filter);
            });
            el.querySelectorAll('.console-log-line').forEach(line => {
                line.style.display = (filter === 'all' || line.dataset.type === filter) ? '' : 'none';
            });
        });
    }

    _toggleCollapse() {
        this._collapsed = !this._collapsed;
        this._output.style.display = this._collapsed ? 'none' : '';
        this._card.querySelector('.console-log-filter-bar').style.display = this._collapsed ? 'none' : '';
        this._collapseBtn.innerHTML = this._collapsed ? '&#8964;' : '&#8963;';
    }

    _createLine(type, text) {
        const line = document.createElement('div');
        line.className = 'console-log-line';
        line.dataset.type = type;

        const typeSpan = document.createElement('span');
        typeSpan.className = `console-log-type console-log-type--${type}`;
        typeSpan.textContent = `[${type}]`;

        line.appendChild(typeSpan);
        line.appendChild(document.createTextNode(text));
        return line;
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
            if (this._modalOutput && this._modalOutput.firstChild) {
                this._modalOutput.removeChild(this._modalOutput.firstChild);
            }
        }
        this._messages.push({type, text});

        const visible = this._filter === 'all' || this._filter === type;

        const line = this._createLine(type, text);
        line.style.display = visible ? '' : 'none';
        this._output.appendChild(line);
        this._output.scrollTop = this._output.scrollHeight;

        if (this._modal && this._modal.classList.contains('network-topology-modal--open')) {
            const modalLine = this._createLine(type, text);
            modalLine.style.display = visible ? '' : 'none';
            this._modalOutput.appendChild(modalLine);
            const body = this._modal.querySelector('.network-topology-modal-body');
            body.scrollTop = body.scrollHeight;
        }
    }
}

module.exports = ConsoleLog;
