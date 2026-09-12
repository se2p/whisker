// Shared canvas rendering for NEAT network diagrams (nodes/connections/hover tooltip), used by both
// network-topology.js and species-networks.js
const { weightToColor } = require('./network-colors');

// Keyed by the backend NodeGene.toJSON() letter codes: I=Input, B=Bias, H=Hidden, A=Action/Output
const NODE_COLORS = { I: '#5b8dd9', B: '#5b8dd9', H: '#7c5cbf', A: '#27ae60' };
const NODE_RADIUS = 10;
const COL_SPACING = 55;
const H_PAD = 50;
const V_PAD = 20;

// Groups nodes into left-to-right columns: inputs/bias, one column per hidden depth (in order), outputs.
function groupNodesIntoColumns(nodes) {
    const inputNodes = nodes.filter(n => n.t === 'I' || n.t === 'B');
    const hiddenNodes = nodes.filter(n => n.t === 'H');
    const outputNodes = nodes.filter(n => n.t === 'A');
    const hiddenDepths = [...new Set(hiddenNodes.map(n => n.d))].sort((a, b) => a - b);
    const hiddenCols = hiddenDepths.map(d => hiddenNodes.filter(n => n.d === d));
    return [inputNodes, ...hiddenCols, outputNodes];
}

// Draws {nodes, connections} onto canvas/ctx and returns the node->{x,y,type} position map (needed for
// hover hit-testing). `width` is the minimum canvas width; `fixedHeight`, if given, is used as-is instead
// of sizing the canvas to fit the content (used for the network-topology card's capped preview height).
function drawNetworkDiagram(canvas, ctx, { nodes, connections }, { width, spacing = COL_SPACING, radius = NODE_RADIUS, fixedHeight }) {
    const columns = groupNodesIntoColumns(nodes);
    const numCols = columns.length;
    const maxColHeight = Math.max(...columns.map(c => c.length));

    const H = fixedHeight || maxColHeight * spacing + V_PAD * 2;
    canvas.width = Math.max(width, numCols * 40 + H_PAD * 2);
    canvas.height = H;
    ctx.clearRect(0, 0, canvas.width, H);

    const colX = i => H_PAD + i * ((canvas.width - H_PAD * 2) / Math.max(numCols - 1, 1));
    const nodePos = new Map();
    columns.forEach((col, ci) => {
        const x = colX(ci);
        col.forEach((node, ni) => {
            const y = H / 2 + (ni - (col.length - 1) / 2) * spacing;
            nodePos.set(node.id, { x, y, type: node.t });
        });
    });

    ctx.globalAlpha = 0.8;
    connections.forEach(({ s: source, t: target, w: weight }) => {
        const src = nodePos.get(source);
        const tgt = nodePos.get(target);
        if (!src || !tgt) return;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = weightToColor(weight);
        ctx.lineWidth = Math.max(1.5, Math.min(4, Math.abs(weight) * 0.8));
        ctx.stroke();
    });
    ctx.globalAlpha = 1;

    nodePos.forEach(({ x, y, type }) => {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = NODE_COLORS[type] || NODE_COLORS.H;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = Math.max(1, radius * 0.2);
        ctx.stroke();
    });

    return nodePos;
}

// Builds the floating tooltip element shared by every network diagram, appended to <body> once per
// component instance (matches the existing .nt-weight-tooltip CSS).
function createHoverTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'nt-weight-tooltip';
    document.body.appendChild(tooltip);
    return tooltip;
}

// Wires hover hit-testing (node first, then nearest connection within a pixel threshold) on `canvas`,
// showing the matched label in `tooltip`. `getData()` is called on every mousemove so the listener always
// sees the diagram's current state (`{nodePos, nodes, connections}`) without the caller needing to
// re-attach it on every re-render.
function attachHoverTooltip(canvas, tooltip, getData) {
    canvas.addEventListener('mousemove', e => {
        const { nodePos, nodes, connections } = getData();
        if (!nodePos || !connections) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        let label = null;
        for (const node of (nodes || [])) {
            const pos = nodePos.get(node.id);
            if (!pos) continue;
            const dx = mx - pos.x; const dy = my - pos.y;
            if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS) {
                if (node.t === 'I') label = `${node.sprite} · ${node.feature}`;
                else if (node.t === 'B') label = 'Bias';
                else if (node.t === 'A') label = node.event || null;
                else label = node.aF || '';
                break;
            }
        }

        if (label === null) {
            const THRESHOLD = 6;
            for (const { s: source, t: target, w: weight } of connections) {
                const src = nodePos.get(source);
                const tgt = nodePos.get(target);
                if (!src || !tgt) continue;
                const dx = tgt.x - src.x; const dy = tgt.y - src.y;
                const lenSq = dx * dx + dy * dy;
                const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((mx - src.x) * dx + (my - src.y) * dy) / lenSq));
                const px = src.x + t * dx - mx; const py = src.y + t * dy - my;
                if (px * px + py * py <= THRESHOLD * THRESHOLD) {
                    label = weight.toFixed(4); break;
                }
            }
        }

        if (label === null) {
            tooltip.style.display = 'none';
        } else {
            tooltip.textContent = label;
            tooltip.style.display = 'block';
            const tipW = tooltip.offsetWidth;
            const left = e.clientX + 12 + tipW > window.innerWidth ? e.clientX - tipW - 8 : e.clientX + 12;
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${e.clientY - 24}px`;
        }
    });
    canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });
}

module.exports = {
    NODE_COLORS, NODE_RADIUS, COL_SPACING, H_PAD, V_PAD,
    groupNodesIntoColumns, drawNetworkDiagram, createHoverTooltip, attachHoverTooltip
};
