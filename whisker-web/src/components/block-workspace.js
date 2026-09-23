// Renders a target's actual scripts as real Scratch blocks (via scratch-blocks), reusing scratch-vm's own
// Blocks.toXML() serializer - the same one the real Scratch editor uses to load a project into its block
// workspace - so scripts appear exactly as the user built them (position, fields, inputs, next-chains).
const scratchBlocks = require('scratch-blocks');

// The drop-shadow glow sits outside the block's edge (against the page background) rather than just
// tinting the edge itself, so it stays visible even against a similarly-colored block (e.g. yellow on
// Scratch's own gold/orange Events and Control blocks).
const COVERED_COLOR = '#2e7d32';
const TARGETED_COLOR = '#f2c200';
const TARGETED_GLOW_COLOR = '#fff8dc';

let styleInjected = false;
function injectHighlightStyle() {
    if (styleInjected) return;
    styleInjected = true;
    const style = document.createElement('style');
    style.textContent = `
        .whisker-block-covered > .blocklyPath {
            stroke: ${COVERED_COLOR}; stroke-width: 5px;
        }
        .whisker-block-targeted > .blocklyPath {
            stroke: ${TARGETED_COLOR}; stroke-width: 5px;
            filter: drop-shadow(0 0 5px ${TARGETED_GLOW_COLOR}) drop-shadow(0 0 5px ${TARGETED_GLOW_COLOR});
        }
        .whisker-block-neither { opacity: 0.45; }
    `;
    document.head.appendChild(style);
}

// Creates a workspace with no toolbox/trashcan/flyout - just a canvas to drop real scripts onto. The small
// card preview stays scrollbar-free (scripts are just clipped there); the expanded modal is scrollable.
function createWorkspace(container, {scrollable = true} = {}) {
    injectHighlightStyle();
    const workspace = scratchBlocks.inject(container, {
        toolbox: '<xml style="display: none"></xml>',
        readOnly: true,
        trashcan: false,
        scrollbars: scrollable,
        zoom: {controls: false, wheel: scrollable},
        media: 'blockly-media/'
    });
    const style = document.createElement('style');
    style.textContent = '.blocklyToolboxDiv, .blocklyFlyout { display: none !important; }';
    container.appendChild(style);
    return workspace;
}

// Clears the workspace and loads every script of `target` at its real recorded position.
function renderTarget(workspace, target) {
    workspace.clear();
    const xml = `<xml>${target.blocks.toXML(target.comments)}</xml>`;
    const dom = scratchBlocks.Xml.textToDom(xml);
    scratchBlocks.Xml.domToWorkspace(dom, workspace);
}

// Covered/targeted blocks get a thicker colored outline; every other block is dimmed so the highlighted
// ones stand out clearly against it.
function highlightBlocks(workspace, {coveredBlockIds = [], targetedBlockIds = []} = {}) {
    const covered = new Set(coveredBlockIds);
    const targeted = new Set(targetedBlockIds);
    for (const block of workspace.getAllBlocks()) {
        const root = block.getSvgRoot();
        if (!root) continue;
        root.classList.remove('whisker-block-covered', 'whisker-block-targeted', 'whisker-block-neither');
        // Coverage is per-statement; reporter/boolean blocks plugged into an input (they have an output
        // connection, statement blocks don't) aren't individual coverage targets, so leave them untouched.
        if (block.outputConnection) continue;

        if (targeted.has(block.id)) root.classList.add('whisker-block-targeted');
        else if (covered.has(block.id)) root.classList.add('whisker-block-covered');
        else root.classList.add('whisker-block-neither');
    }
}

module.exports = {createWorkspace, renderTarget, highlightBlocks};
