// Draws real Scratch blocks with scratch-blocks: a sprite's whole scripts, or single blocks to place elsewhere,
// plus the covered/targeted/dimmed look shared by every view that shows blocks. Block XML comes from
// scratch-vm's own serializer - the one the real Scratch editor uses to load a project - so blocks appear
// exactly as the user built them.
const scratchBlocks = require('scratch-blocks');

const COVERED_COLOR = '#2e7d32';
const TARGETED_COLOR = '#f2c200';
// The targeted glow sits outside the block's edge (against the page background) rather than just tinting
// the edge, so it stays visible even on a similarly colored block.
const TARGETED_GLOW_COLOR = '#fff8dc';

let stylesInjected = false;
function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    const style = document.createElement('style');
    style.textContent = `
        .blocklyToolboxDiv, .blocklyFlyout { display: none !important; }
        .whisker-block-covered > .blocklyPath {
            stroke: ${COVERED_COLOR}; stroke-width: 5px;
        }
        .whisker-block-targeted > .blocklyPath {
            stroke: ${TARGETED_COLOR}; stroke-width: 5px;
            filter: drop-shadow(0 0 3px ${TARGETED_GLOW_COLOR}) drop-shadow(0 0 3px ${TARGETED_GLOW_COLOR});
            animation: whisker-block-pulse 1.2s ease-in-out infinite;
        }
        @keyframes whisker-block-pulse {
            50% {
                filter: drop-shadow(0 0 8px ${TARGETED_GLOW_COLOR}) drop-shadow(0 0 14px ${TARGETED_GLOW_COLOR})
                    drop-shadow(0 0 22px ${TARGETED_COLOR});
            }
        }
        .whisker-block-neither > :not([data-id]) { opacity: 0.45; }
    `;
    document.head.appendChild(style);
}

// Creates a workspace with no toolbox/trashcan/flyout - just a canvas to drop real scripts onto.
function createWorkspace(container, {scrollable = true} = {}) {
    injectStyles();
    return scratchBlocks.inject(container, {
        toolbox: '<xml style="display: none"></xml>',
        readOnly: true,
        trashcan: false,
        scrollbars: scrollable,
        zoom: {controls: false, wheel: scrollable},
        media: 'blockly-media/'
    });
}

// Clears the workspace and loads every script of `target` at its real recorded position.
function renderTarget(workspace, target) {
    workspace.clear();
    const xml = `<xml>${target.blocks.toXML(target.comments)}</xml>`;
    const dom = scratchBlocks.Xml.textToDom(xml);
    scratchBlocks.Xml.domToWorkspace(dom, workspace);
}

// Serializes one block by itself: scratch-vm's XML for the block, minus
// what makes it part of a script - its next-chain and the statements nested inside a C-shaped block, which
// are separate CDG nodes of their own.
function singleBlockDom(target, blockId) {
    const xml = `<xml>${target.blocks.blockToXML(blockId, target.comments)}</xml>`;
    const dom = scratchBlocks.Xml.textToDom(xml);
    const block = dom.firstElementChild;
    block.querySelectorAll(':scope > next, :scope > value[name^="SUBSTACK"]').forEach(child => child.remove());
    block.setAttribute('x', '0');
    block.setAttribute('y', '0');
    return dom;
}

// Renders single blocks in a hidden workspace and returns copies of them to place elsewhere. A block's
// drawing never changes during a run, so each one is rendered once and cached by block id.
function createBlockRenderer() {
    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;left:-10000px;top:0;width:1000px;height:600px;';
    document.body.appendChild(container);
    const workspace = createWorkspace(container, {scrollable: false});
    const cache = new Map();

    // Returns {element, width, height}: a fresh copy of the block's SVG group (at 0,0) and its size.
    return function renderBlock(target, blockId) {
        if (!cache.has(blockId)) {
            workspace.clear();
            scratchBlocks.Xml.domToWorkspace(singleBlockDom(target, blockId), workspace);
            const block = workspace.getTopBlocks()[0];
            const element = block.getSvgRoot().cloneNode(true);
            element.removeAttribute('transform');
            const {width, height} = block.getHeightWidth();
            cache.set(blockId, {element, width, height});
        }
        const {element, width, height} = cache.get(blockId);
        return {element: element.cloneNode(true), width, height};
    };
}

// Covered/targeted blocks get a thicker colored outline (targeted also a glow); every other block is dimmed
// so the highlighted ones stand out clearly against it.
const BLOCK_STATES = ['covered', 'targeted', 'neither'];

// Once every statement is covered nothing can still be a target, so a block the backend left marked as
// targeted is just the last one covered and is shown as covered instead. Takes a CDG_UPDATE payload.
function effectiveHighlight({covered, total, coveredBlockIds, targetedBlockIds}) {
    return {coveredBlockIds, targetedBlockIds: total > 0 && covered === total ? [] : targetedBlockIds};
}

// The highlight's block id lists as Sets, for looking blocks up by id.
function highlightSets({coveredBlockIds, targetedBlockIds}) {
    return {covered: new Set(coveredBlockIds), targeted: new Set(targetedBlockIds)};
}

// `covered` and `targeted` are Sets of block ids.
function blockState(blockId, covered, targeted) {
    if (targeted.has(blockId)) return 'targeted';
    return covered.has(blockId) ? 'covered' : 'neither';
}

// `element` is the block's root SVG group.
function setBlockState(element, state) {
    element.classList.remove(...BLOCK_STATES.map(s => `whisker-block-${s}`));
    element.classList.add(`whisker-block-${state}`);
}

function highlightBlocks(workspace, highlight) {
    const {covered, targeted} = highlightSets(highlight);
    for (const block of workspace.getAllBlocks()) {
        const root = block.getSvgRoot();
        if (!root) continue;
        // Coverage is per-statement; reporter/boolean blocks plugged into an input (they have an output
        // connection, statement blocks don't) aren't individual coverage targets, so leave them untouched.
        if (block.outputConnection) continue;
        setBlockState(root, blockState(block.id, covered, targeted));
    }
}

// The cards showing blocks redraw at most this often; re-rendering on every single iteration is unnecessary.
const MIN_RENDER_INTERVAL_MS = 500;

// A card's title with the coverage summary of a CDG_UPDATE payload, e.g. "Source Code — 12/40 statements".
function coverageTitle(title, {covered, total}) {
    return `${title} — ${covered}/${total} statements`;
}

module.exports = {
    createWorkspace,
    renderTarget,
    createBlockRenderer,
    highlightBlocks,
    effectiveHighlight,
    highlightSets,
    blockState,
    setBlockState,
    MIN_RENDER_INTERVAL_MS,
    coverageTitle
};
