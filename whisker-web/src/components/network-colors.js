const RDYLGN11 = [
    null,
    '#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b',
    '#aaaaaa',
    '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'
];

function weightToColor(weight) {
    const idx = Math.min(11, Math.max(1, Math.round(weight + 6)));
    return RDYLGN11[idx];
}

module.exports = {weightToColor};
