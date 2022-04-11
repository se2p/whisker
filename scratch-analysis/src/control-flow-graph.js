import {ControlFilter, EventFilter, LooksFilter, StatementFilter} from './block-filter';
import {Extract, getBranchStart, getElseBranchStart} from './utils';
import {Graph, GraphNode, Mapping} from './graph-utils';

/**
 * Class representing a Control Flow Graph (CFG).
 * Next to a collection of nodes, the CFG contains arbitrary entry and exit node.
 *
 * The CFG's nodes are private, but can be queried with node related methods.
 *
 * @see Graph
 * @see GraphNode
 */
export class ControlFlowGraph extends Graph {
    constructor() {
        const entryNode = new GraphNode('Entry');
        const exitNode = new GraphNode('Exit');

        super(entryNode, exitNode);
    }
}

/**
 * Dummy node for an broadcast send or clone create event.
 *
 * @see GraphNode
 */
export class EventNode extends GraphNode {
    constructor(id, event) {
        super(id);

        this.event = event;
    }
}

/**
 * Dummy node for a user triggered event.
 *
 * @see GraphNode
 */
export class UserEventNode extends GraphNode {
    constructor(id, userEvent) {
        super(id);

        this.userEvent = userEvent;
    }
}

/**
 * Extends the successors of the last node inside the basic block with successors.
 * Before extending the successors, the exit node is removed to remove unwanted and duplicate edges to the exit node.
 * If the given should successors contains the exit node, it will be part of the successors.
 *
 * @param {ControlFlowGraph} cfg - the CFG containing all nodes.
 * @param {Mapping} successors - a collection of edges inside the CFG, mapping of node identifier to nodes.
 * @param {Array<GraphNode>} shouldSuccessors - the successors will extend the existing successors.
 * @param {GraphNode} startNode - the start node of the basic block.
 * @param {boolean} extra - whether extra handling for broadcast and cloning statements should be made.
 */
const _extendBasicBlockSuccessors = (cfg, successors, shouldSuccessors, startNode, extra) => {
    _extendBasicBlockSuccessors2(cfg, successors, shouldSuccessors, startNode, extra, new Set());
};

const _extendBasicBlockSuccessors2 = (cfg, successors, shouldSuccessors, startNode, extra, visited) => {
    let node = startNode;
    while (node.block) {
        // Extra handling for broadcast and cloning send statements
        if (extra && EventFilter.eventReceive(node.block)) {
            if (visited.has(node)) {
                break;
            }
            visited.add(node);
            for (const succ of successors.get(node.id)) {
                if (succ instanceof EventNode) {
                    for (const recv of successors.get(succ.id)) {
                        if (recv.block && EventFilter.eventReceive(recv.block)) {
                            _extendBasicBlockSuccessors2(cfg, successors, shouldSuccessors, recv, extra, visited);
                        }
                    }
                }
            }
        }
        if (!node.block.next) {
            break;
        }

        node = cfg.getNode(node.block.next);
    }

    if (node === cfg.exit()) {
        // Should not set successors of exit node
        return;
    }

    // If the exit node is part of the to be set successors that's okay, but it has to be removed here to avoid
    //   a) unwanted edges to the exit note
    //   b) duplicate edges to exit note
    successors.remove(node.id, cfg.exit());

    for (const suc of shouldSuccessors) {
        successors.put(node.id, suc);
    }
};

/**
 * Fixes the successors in a CFG of a given control statement or its succeeding branches,
 * depending on the type of control statement.
 *
 * @param {ControlFlowGraph} cfg - the CFG containing all nodes.
 * @param {Mapping<GraphNode>} successors - a {@link Mapping} from nodes to their successors.
 * @param {GraphNode} controlNode - the node of the to be fixed control statement.
 * @private
 */
const _fixControlStatement = (cfg, successors, controlNode) => {
    const controlStmt = controlNode.block;
    switch (controlStmt.opcode) {
        case 'control_repeat_until':
        case 'control_repeat': {
            const branchStart = getBranchStart(controlStmt);
            // Check whether the branch is empty.
            if (branchStart) {
                _extendBasicBlockSuccessors(cfg, successors, [controlNode], cfg.getNode(branchStart), true);
            }

            // Adding a "fake" edge from the loop head to the exit node turns repeat loops into control dependencies.
            successors.put(controlNode.id, cfg.exit());

            break;
        }
        case 'control_forever': {
            const branchStart = getBranchStart(controlStmt);
            if (branchStart) {
                _extendBasicBlockSuccessors(cfg, successors, [controlNode], cfg.getNode(branchStart), true);
                successors.set(controlNode.id, [cfg.getNode(branchStart), cfg.exit()]);
            } else {
                successors.set(controlNode.id, [cfg.exit()]);
            }

            break;
        }
        case 'control_if': {
            const ifBranchStart = getBranchStart(controlStmt);
            if (ifBranchStart) {
                const afterControl = successors.getAsArray(controlNode.id)
                    .filter(n => n.id !== ifBranchStart);

                _extendBasicBlockSuccessors(cfg, successors, afterControl, cfg.getNode(ifBranchStart), false);
            }
            break;
        }
        case 'control_if_else': {
            const ifBranchStart = getBranchStart(controlStmt);
            const elseBranchStart = getElseBranchStart(controlStmt);

            if (ifBranchStart && elseBranchStart) {
                const afterControl = successors.getAsArray(controlNode.id)
                    .filter(n => n.id !== ifBranchStart && n.id !== elseBranchStart);
                successors.removeAll(controlNode.id, afterControl);

                _extendBasicBlockSuccessors(cfg, successors, afterControl, cfg.getNode(ifBranchStart), false);
                _extendBasicBlockSuccessors(cfg, successors, afterControl, cfg.getNode(elseBranchStart), false);
            } else if (ifBranchStart) {
                // Only if branch has content
                const afterControl = successors.getAsArray(controlNode.id)
                    .filter(n => n.id !== ifBranchStart);

                _extendBasicBlockSuccessors(cfg, successors, afterControl, cfg.getNode(ifBranchStart), false);
            } else if (elseBranchStart) {
                // Only else branch has content
                const afterControl = successors.getAsArray(controlNode.id)
                    .filter(n => n.id !== elseBranchStart);

                _extendBasicBlockSuccessors(cfg, successors, afterControl, cfg.getNode(elseBranchStart), false);
            } else {
                // None has content -> no changes
            }
            break;
        }
        case 'control_stop': {
            const stopOption = Extract.stopOption(controlStmt);
            switch (stopOption) {
                case 'this script':
                case 'all': {
                    successors.set(controlNode.id, [cfg.exit()]);
                    break;
                }
                case 'other scripts in sprite':
                case 'other scripts in stage':
                    // Since this is just a 'normal' block after which other blocks can follow, we can ignore it.
                    break;
                default:
                    console.log(`Unrecognized stop option ${stopOption}.`);
            }
            break;
        }
        case 'control_delete_this_clone':
            successors.set(controlNode.id, [cfg.exit()]);
            break;
        case 'control_wait_until':
            successors.put(controlNode.id, cfg.getNode(controlNode.id));
            successors.put(controlNode.id, cfg.exit());
            break;
        case 'control_start_as_clone':
        case 'control_create_clone_of':
            // Can ignore these cases
            break;
        default: {
            console.log(`Unhandled control statement ${controlStmt.opcode} for block ${controlStmt.id}`);
        }
    }
};

/**
 * Helper function to recursively fix control statements.
 * Starting from the given node, depth first.
 *
 * @param {ControlFlowGraph} cfg - the control flow graph which control statements should be fixed.
 * @param {Mapping<GraphNode>} successors - a {@link Mapping} from nodes to their successors.
 * @param {GraphNode} node - the start node.
 * @param {Array<GraphNode>} visited - a list of already visited nodes.
 * @private
 */
const _fixControlStatements = (cfg, successors, node, visited) => {
    if (visited.find(n => n.id === node.id)) {
        return;
    }
    visited.push(node);

    const block = node.block;
    if (block && ControlFilter.controlBlock(block) && !ControlFilter.executionHaltingBlock(block)) {
        _fixControlStatement(cfg, successors, node);
    }

        // We add a "fake" edge from execution halting Blocks to the exit node in order to turn those blocks
    // into control dependencies.
    else if (block && ControlFilter.executionHaltingBlock(block)) {
        successors.put(node.id, cfg.exit());
    }

    for (const next of successors.get(node.id)) {
        _fixControlStatements(cfg, successors, next, visited);
    }
};

/**
 * Calls a recursive helper function to fix control statements from the Entry node, depth first.
 *
 * @param {ControlFlowGraph} cfg - the control flow graph which control statements should be fixed.
 * @param {Mapping<GraphNode>} successors - a {@link Mapping} from nodes to their successors.
 */
const fixControlStatements = (cfg, successors) => {
    _fixControlStatements(cfg, successors, cfg.entry(), []);
};

/**
 * Checks for a given user event node whether a preceeding user event node exists.
 * If the user events exists, it is returned.
 * If not, it is added to the given control flow graph
 *
 * @param {Array} targets - the targets of the program. Used to identify from which target a block is.
 * @param {ControlFlowGraph} cfg - the control flow graph.
 * @param {Mapping<GraphNode>} successors - a mapping from nodes to their successors.
 * @param {Map<string, GraphNode>} userEvents - a mapping from event key to user event node.
 * @param {GraphNode} node - the node that is initially checked. A successor of the user event node.
 * @returns {GraphNode} - the user event node, either existing or newly created.
 */
const addOrGetUserEventNode = (targets, cfg, successors, userEvents, node) => {
    const event = {
        name: node.block.opcode.substring(10), // removes leading "event_when"
        opcode: node.block.opcode
    };
    switch (node.block.opcode) {
        case 'event_whenflagclicked': {
            // necessary event information already complete
            break;
        }
        case 'event_whenthisspriteclicked': {
            event.value = Extract.clickedSprite(node.block);
            break;
        }
        case 'event_whenstageclicked': {
            event.value = 'Stage';
            break;
        }
        case 'event_whenkeypressed': {
            event.value = Extract.clickedKey(node.block);
            break;
        }
        case 'event_whengreaterthan': {
            // TODO: Technically, only sound is a user event but the block can also refer to the timer
            event.value = node.block.fields.WHENGREATERTHANMENU;
            break;
        }
    }

    const eventKey = `${event.name}${event.value ? (`:${event.value}`) : ''}`;
    let eventNode = userEvents.get(eventKey);
    if (!eventNode) {
        eventNode = new UserEventNode(eventKey, event);
        cfg.addNode(eventNode);

        successors.put(cfg.entry().id, eventNode);
        successors.put(eventNode.id, cfg.exit());

        userEvents.set(eventKey, eventNode);
    }
    return eventNode;
};


const getBroadcastTargets = blocks => {
    let broadcastTargets = new Set();
    for (const block of blocks.values()) {
        if (EventFilter.broadcastReceive(block)) {
            const event = Extract.broadcastForBlock(block);
            broadcastTargets.add(`broadcast:${event}`);
        }
    }
    return broadcastTargets;
}

const getBackdropTargets = (blocks, vm) => {
    let backdropTargets = new Set();
    for (const block of blocks.values()) {
        if (EventFilter.backdropStart(block)) {
            const backdropTarget = Extract.backdropStartTarget(block);
            if (checkIfBackdropExists(vm, backdropTarget)) {
                backdropTargets.add(`backdrop:${backdropTarget}`);
            }
        }
    }
    return backdropTargets;
}

const getCloneTargets = blocks => {
    let cloneTargets = new Set();
    for (const block of blocks.values()) {
        if (EventFilter.cloneStart(block)) {
            const cloneTarget = Extract.cloneSendTarget(block);
            cloneTargets.add(`clone:${cloneTarget}`);
        }
    }
    return cloneTargets;
}

/**
 * Create unique block ID
 * Based on https://github.com/LLK/scratch-blocks/blob/develop/core/utils.js
 * Soup omits $ because that would screw up the String.replaceAll later
 */
const soup_ = '!#()%*+,-./:;=?@[]^_`{|}~' + // $
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const genUid = function () {
    var length = 20;
    var soupLength = soup_.length;
    var id = [];
    for (var i = 0; i < length; i++) {
        id[i] = soup_.charAt(Math.random() * soupLength);
    }
    return id.join('');
};

export const getBlockMap = targets => {
    let blocks = new Map()
    for (const target of targets) {
        for (const block of Object.values(target.blocks._blocks)) {
            const blockKey = `${block.id}-${target.sprite.name}`;
            // Create a deep clone for the CFG to not alter the block residing in the Scratch-VM.
            const blockClone = JSON.parse(JSON.stringify(block))
            blockClone['target'] = target.sprite.name;
            changeBlockIds(blockClone, target)
            blocks.set(blockKey, blockClone);
        }
    }
    return blocks;
}


/**
 * Constructs an interprocedural control flow graph (CFG) for all blocks of a program.
 *
 * The given blocks represent the Abstract Syntax Tree (AST) of each script.
 * This method adds interprodecural edges from broadcast send to broadcast receive statements.
 *
 * Furthermore, this method updates the control statements, since their AST information cannot
 * be used directly for CFG generation.
 *
 * @param {VirtualMachine} vm - the instance of the current virtual machine state.
 * Contains all blocks in the program, used to construct the CFG.
 * @return {ControlFlowGraph} - a newly generated {@link ControlFlowGraph}.
 */
export const generateCFG = vm => {
    // So-called "renderer targets" (the individual sprites and the stage) in the current project.
    const targets = vm.runtime.targets;

    // To avoid duplicates in the CFG we save blocks using the key combination blockId-SpriteName, where SpriteName
    // corresponds to the name of the sprite the given block is contained in.
    let blocks = getBlockMap(targets);

    const backdropTargets = getBackdropTargets(blocks, vm);
    const broadcastTargets = getBroadcastTargets(blocks);
    const cloneTargets = getCloneTargets(blocks);

    const cfg = new ControlFlowGraph();
    const userEvents = new Map();
    const eventSend = new Mapping();
    const eventReceive = new Mapping();
    const successors = new Mapping();
    const nextBackDropNodes = [];

    // First, we insert all nodes into the CFG.
    for (const [id, block] of blocks.entries()) {

        // Certain Scratch blocks are not related to control flow; they are not "statement blocks". For example, none
        // of the blocks in the "Operators" category (e.g., arithmetic and boolean operators) are statement blocks.
        // For CFG construction, we must ignore such blocks.
        if (!StatementFilter.isStatementBlock(block)) {
            continue;
        }

        // Furthermore, many scratch blocks are "parameterized". For example, the "Say" block or a custom block accepts
        // text. These text parameters are considered blocks themselves by Scratch but they are not related to control
        // flow. We can identify such blocks by the fact that they are drawn with a shadow.
        if (block.shadow) {
            continue;
        }

        cfg.addNode(new GraphNode(id, block));
    }

    /*
     * A custom block in Scratch is referred to via its so called "proccode". The proccode is essentially the name
     * of the custom block given by the user when he/she defined the custom block.
     *
     * There are three kinds of opcodes related to custom blocks.
     *  - procedures_definition: represents the definition of a custom block; identified by its proccode
     *  - procedures_call: represents the call of a custom block; refers to the procedures_definition via its proccode
     *  - procedures_prototype: The proccode is usually directly accessible in the procedures_definition itself.
     *    However, this is not always the case; we need to query the procedures_prototype which then contains a
     *    reference to the corresponding procedures_definition.
     */
    const customBlockDefinitions = new Map();
    // Maps proccodes to the corresponding procedures_definition. The key  is formed by combining the proccode
    // with the name of the sprite in which the given block is contained in. This is necessary since multiple sprites
    // could have differing procedure_definitions with the same proccode.
    for (const block of blocks.values()) {
        if (block.opcode === 'procedures_definition') {
            if (block.inputs.custom_block.block) {
                const customBlockPrototype = blocks.get(block.inputs.custom_block.block);
                const proccode = customBlockPrototype.mutation.proccode;
                let definitionCallKey = proccode + "-" + block.target;
                if (customBlockDefinitions.has(definitionCallKey)) {
                    console.warn("Duplicate procedure definition for the custom block: ", proccode);
                    console.warn("Scratch will only execute one single procedure definition. Consider removing duplicates for a better code quality!")
                    const keys = [...customBlockDefinitions.keys()].filter(key => key.includes(definitionCallKey));
                    definitionCallKey += "-" + keys.length;
                }
                customBlockDefinitions.set(definitionCallKey, new GraphNode(block.id, block));
            }
        }
    }

    // Now, we establish the connections between the nodes.
    for (const node of cfg.getAllNodes()) {
        if (node.block.parent) {
            successors.put(node.block.parent, node);
        }

        const callsCustomBlock = node.block.opcode === 'procedures_call';
        if (callsCustomBlock) { // Adds an edge from the call site of a custom block to its definition
            const proccode = node.block.mutation.proccode;
            const definitionCallKey = proccode + "-" + node.block.target;
            const definitionKeys = [...customBlockDefinitions.keys()].filter(key => key.includes(definitionCallKey));
            for (const definitionKey of definitionKeys) {
                const callee = customBlockDefinitions.get(definitionKey);
                if (callee) {
                    successors.put(node.id, callee)
                } else {
                    console.warn("Call to undefined procedure: " + definitionCallKey);
                }
            }
            // FIXME: there also need to be edges that go back from the definition to all its call sites
        }

        if (!node.block.next) {
            // No exit node? Probably, the actual successors is the exit node
            successors.put(node.id, cfg.exit());
        }

        // Special cases
        if (EventFilter.userEvent(node.block)) {
            const userEventNode = addOrGetUserEventNode(targets, cfg, successors, userEvents, node);
            successors.put(userEventNode.id, node);
        }
        if (EventFilter.broadcastSend(node.block)) {
            if (EventFilter.broadcastMenu(blocks.get(node.block.inputs.BROADCAST_INPUT.block))) {
                const event = Extract.broadcastForStatement(blocks, node.block);
                eventSend.put(`broadcast:${event}`, node);
            } else {
                // Add edges to all items in eventReceive starting with a message
                for (const broadcastTarget of broadcastTargets) {
                    eventSend.put(broadcastTarget, node);
                }
            }
        }
        if (EventFilter.broadcastReceive(node.block)) {
            const event = Extract.broadcastForBlock(node.block);
            eventReceive.put(`broadcast:${event}`, node);
        }
        if (EventFilter.cloneCreate(node.block)) {
            if (EventFilter.cloneMenu([node.block.inputs.CLONE_OPTION.block])) {
                let cloneTarget = Extract.cloneCreateTarget(blocks, node.block);
                if (cloneTarget === '_myself_') {
                    cloneTarget = Extract.cloneSendTarget(node.block);
                }
                eventSend.put(`clone:${cloneTarget}`, node);
            } else {
                // Overapproximate since the target is not known statically
                for (const cloneTarget of cloneTargets) {
                    eventSend.put(cloneTarget, node);
                }
            }
        }
        if (EventFilter.cloneStart(node.block)) {
            const cloneTarget = Extract.cloneSendTarget(node.block);
            eventReceive.put(`clone:${cloneTarget}`, node);
        }
        if (EventFilter.backdropStart(node.block)) {
            const backdropTarget = Extract.backdropStartTarget(node.block);
            if (checkIfBackdropExists(vm, backdropTarget)) {
                eventReceive.put(`backdrop:${backdropTarget}`, node);
            }
        }
        if (LooksFilter.backdropChange(node.block)) {
            let backdropTarget = undefined;
            if(LooksFilter.backdropSet(node.block)){
                backdropTarget =  Extract.backdropChangeTarget(blocks, node.block);
            }
            // Special handling for nextBackdrop statements.
            if (LooksFilter.nextBackdrop(node.block) || backdropTarget === 'next backdrop') {
                nextBackDropNodes.push(node)
            } else if (LooksFilter.backdropBlock(blocks.get(node.block.inputs.BACKDROP.block))) {
                if (checkIfBackdropExists(vm, backdropTarget)) {
                    eventSend.put(`backdrop:${backdropTarget}`, node);
                }
            } else {
                // Add edges to all items in eventReceive starting with backdrop
                for (const backdropTarget of backdropTargets) {
                    eventSend.put(backdropTarget, node);
                }
            }
        }
    }

    // Afterwards, we add a global entry and exit node for the entire Scratch program.
    cfg.addNode(cfg.entry());
    cfg.addNode(cfg.exit());

    // Adds an extra event node for Broadcast and Cloning events iff the respective events can be triggered.
    const eventIds = new Set([...eventSend.keys(), ...eventReceive.keys()]);
    for (const eventKey of eventIds) {

        const splitEventId = eventKey.split(':')
        const eventType = splitEventId[0];
        const eventId = splitEventId[1];

        const sendEvents = eventSend.get(eventKey);
        const receiveEvents = eventReceive.get(eventKey);

        // If we have matching sender and receiver of events, create connections between them.
        if (sendEvents.size > 0 && receiveEvents.size > 0) {
            const event = {type: eventType, value: eventId};
            const sendNode = new EventNode(`${eventType}:${eventId}`, event);

            cfg.addNode(sendNode);
            successors.put(sendNode.id, cfg.exit());
            for (const sender of sendEvents) {
                successors.put(sender.id, sendNode);
                for (const receiver of receiveEvents) {
                    successors.put(sendNode.id, receiver);
                }
            }
        }

        // If we have blocks reacting to a backdrop switch and switch to next backdrop blocks, we over-approximate by
        // linking all next backdrop blocks to every backdrop reacting block since we do not know which specific
        // backdrop the next one will be.
        if (eventType === 'backdrop' && receiveEvents.size > 0 && nextBackDropNodes.length > 0) {
            const event = {type: eventType, value: eventId};
            const sendNode = new EventNode(`${eventType}:${eventId}`, event);

            cfg.addNode(sendNode);
            successors.put(sendNode.id, cfg.exit());
            for (const sender of nextBackDropNodes) {
                successors.put(sender.id, sendNode);
                for (const receiver of receiveEvents) {
                    successors.put(sendNode.id, receiver);
                }
            }
        }
    }

    // Branches of control statements most often have the exit node instead of the correct successor(s).
    // This call sets the correct successors
    fixControlStatements(cfg, successors);

    // Add actual successors to graph.
    for (const node of cfg.getAllNodes()) {
        for (const succ of successors.get(node.id)) {
            cfg.addEdge(node, succ);
        }
    }

    // Remove statement blocks that have no predecessors in the CFG and are therefore unreachable.
    let changed = true;
    while (changed) {
        changed = false;
        for (const node of cfg.getAllNodes()) {
            if (node.block !== undefined &&
                StatementFilter.isStatementBlock(node.block) &&
                cfg.getTransitivePredecessors(node).size === 0) {
                // If we are about to delete a node form the CFG we also have to delete it from the successor's
                // predecessor mapping in order to repeat those recursively if they
                for (const suc of successors.get(node.id)) {
                    const predecessors = cfg.predecessors(suc.id);
                    predecessors.delete(node)
                }
                cfg.removeNode(node);
                changed = true;
            }
        }
    }
    return cfg;
};

const checkIfBackdropExists = (vm, backdropName) => {
    const stage = vm.runtime.getTargetForStage();
    const backdrops = stage.sprite.costumes;
    for (const backDrop of Object.values(backdrops)) {
        if (backDrop.name === backdropName) {
            return true;
        }
    }
    return false;
}

function changeBlockIds(block, target) {
    // TODO: Are there other keys that map to ids we need to replace here?
    const idKeys = ['id', 'next', 'parent', 'block']
    for (const k in block) {
        if (typeof block[k] === 'object' && block[k] !== null) {
            changeBlockIds(block[k], target)
        } else if (idKeys.includes(k) && block[k] !== null) {
            block[k] = block[k] + "-" + target.sprite.name;
        }
    }
}

