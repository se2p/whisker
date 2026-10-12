const {i18n} = require('../index');

/**
 * The generation dropdown of the network-topology and species-networks cards. It only offers the generations that
 * belong to the objective picked in the target dropdown. In a single-target run those are the generations a
 * covered target ran through, or the ones seen since the current target started (see saveTarget()). Many-objective
 * runs pursue several targets in the same generation, so each snapshot names the targets that were active and
 * track() records the generation under each of them.
 *
 * The last entry of a list has the value 'latest'; the other entries use their generation number.
 */
class GenerationSelect {
    /** @param {HTMLSelectElement} select the dropdown to keep filled. */
    constructor(select) {
        this._select = select;
        this.reset();
    }

    reset() {
        this._current = [];
        this._byObjective = new Map();
        this.selected = 'latest';
        this._select.innerHTML = '';
    }

    // Records a snapshot; `activeKeys` are the targets it was pursuing (many-objective runs only).
    // Returns whether its generation is new (so the list needs a rebuild).
    track(generation, activeKeys = []) {
        activeKeys.forEach(key => {
            if (!this._byObjective.has(key)) this._byObjective.set(key, []);
            const gens = this._byObjective.get(key);
            if (!gens.includes(generation)) gens.push(generation);
        });
        if (this._current.includes(generation)) return false;
        this._current.push(generation);
        return true;
    }

    // The current target was covered: the generations seen so far belong to it.
    saveTarget(objectiveKey) {
        this._byObjective.set(objectiveKey, this._current);
        this._current = [];
    }

    // The current target was skipped: its generations don't belong to any objective that can be picked.
    dropCurrent() {
        this._current = [];
    }

    // Refills the dropdown for the objective picked in the target dropdown ('current', 'frontier:<key>' or
    // 'covered:<key>').
    // Keeps the selected generation if it is still offered, otherwise falls back to 'latest'.
    rebuild(targetKey) {
        const gens = this._generationsFor(targetKey);
        this._select.innerHTML = '';
        gens.forEach((gen, i) => {
            const opt = document.createElement('option');
            opt.value = i === gens.length - 1 ? 'latest' : String(gen);
            opt.textContent = `${i18n.t('generation')} ${gen}`;
            this._select.appendChild(opt);
        });
        const values = Array.from(this._select.options).map(o => o.value);
        if (values.includes(this.selected)) {
            this._select.value = this.selected;
        } else {
            this.selected = 'latest';
        }
    }

    _generationsFor(targetKey) {
        if (targetKey !== 'current') {
            const gens = this._byObjective.get(parseInt(targetKey.split(':')[1], 10));
            if (gens) return gens;
        }
        return this._current;
    }
}

module.exports = {GenerationSelect};
