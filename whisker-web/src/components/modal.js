// Shared modal chrome for every dashboard card that expands into a larger view (network topology,
// species networks, fitness/coverage charts, console log, CDG graph).
class Modal {
    /**
     * @param {object} [options] per-component CSS overrides.
     * @param {string} [options.extraClass] extra class(es) on the modal wrapper, for a component's own
     *   CSS overrides (e.g. console-log's taller box).
     * @param {string} [options.titleExtraClass] extra class(es) on the title element.
     */
    constructor({extraClass, titleExtraClass} = {}) {
        this.el = document.createElement('div');
        this.el.className = extraClass ? `modal ${extraClass}` : 'modal';
        this.el.innerHTML = `
            <div class="modal-box">
                <div class="modal-header">
                    <p class="modal-title${titleExtraClass ? ` ${titleExtraClass}` : ''}"></p>
                    <button class="modal-close">✕</button>
                </div>
                <div class="modal-body"></div>
            </div>`;
        document.body.appendChild(this.el);

        // Exposed so a component can insert its own controls (dropdowns, a filter bar) into the header
        // or between the header and the body, rather than the modal dictating a fixed content shape.
        this.boxEl = this.el.querySelector('.modal-box');
        this.headerEl = this.el.querySelector('.modal-header');
        this.titleEl = this.el.querySelector('.modal-title');
        this.bodyEl = this.el.querySelector('.modal-body');
        this.closeBtn = this.el.querySelector('.modal-close');

        this.el.addEventListener('click', e => {
            if (e.target === this.el) this.close();
        });
        this.closeBtn.addEventListener('click', () => this.close());
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') this.close();
        });
    }

    // Adds a collapse button to a card's header; collapsing hides everything in the card but the header.
    static makeCollapsible(card, header, onExpand) {
        header.classList.add('card-collapsible-header');

        const button = document.createElement('button');
        button.className = 'card-collapse-btn';
        button.innerHTML = '&#8963;';

        const expandHint = header.querySelector('.network-topology-expand-hint');
        if (expandHint) {
            expandHint.before(button);
        } else {
            header.append(button);
        }

        button.addEventListener('click', e => {
            e.stopPropagation();
            const collapsed = card.classList.toggle('card-collapsed');
            button.innerHTML = collapsed ? '&#8964;' : '&#8963;';
            if (!collapsed && onExpand) {
                onExpand();
            }
        });
    }

    open() {
        this.el.classList.add('modal--open');
    }

    close() {
        this.el.classList.remove('modal--open');
    }

    isOpen() {
        return this.el.classList.contains('modal--open');
    }
}

module.exports = Modal;
