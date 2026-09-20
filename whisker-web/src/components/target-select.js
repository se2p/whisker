const {i18n} = require('../index');

/**
 * Fills the objective dropdown shared by the fitness chart, the species-networks card and the network-topology
 * card: a "current target" entry (or a group of frontier targets for many-objective runs), followed by the
 * targets covered earlier. Entry values are 'current', 'frontier:<key>' and 'covered:<key>'.
 *
 * @param {HTMLSelectElement} select the dropdown to (re)fill.
 * @param {{key: number, label: string}[]} frontier the targets pursued right now (many-objective runs only).
 * @param {{key: number, label: string}[]} previous the targets that were covered earlier.
 * @returns {string} the selected value: the previous selection if it still exists, otherwise the first entry.
 */
function fillTargetSelect(select, {frontier = [], previous = []}) {
    const prevValue = select.value;
    select.innerHTML = '';
    const hasFrontier = frontier.length > 0;

    const addOption = (parent, value, label, tooltip) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        if (tooltip) opt.title = tooltip;
        parent.appendChild(opt);
    };

    if (hasFrontier) {
        const frontierGroup = document.createElement('optgroup');
        frontierGroup.label = i18n.t('frontier-targets');
        frontier.forEach(t => addOption(frontierGroup, `frontier:${t.key}`, `Obj. ${t.key}`, t.label));
        select.appendChild(frontierGroup);
    } else {
        addOption(select, 'current', i18n.t('current-target'));
    }

    if (previous.length > 0) {
        const previousParent = hasFrontier ? document.createElement('optgroup') : select;
        if (hasFrontier) previousParent.label = i18n.t('previous-targets');
        previous.forEach(t => addOption(previousParent, `covered:${t.key}`, `Obj. ${t.key}`, t.label));
        if (hasFrontier) select.appendChild(previousParent);
    }

    const values = Array.from(select.options).map(o => o.value);
    if (values.includes(prevValue)) {
        select.value = prevValue;
    } else {
        select.value = hasFrontier ? `frontier:${frontier[0].key}` : 'current';
    }
    return select.value;
}

module.exports = {fillTargetSelect};
