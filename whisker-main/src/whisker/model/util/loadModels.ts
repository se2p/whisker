import {Model} from "../components/AbstractModel";
import {UserModel,} from "../components/UserModel";
import {EndModel, ProgramModel,} from "../components/ProgramModel";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";
import {ModelNode} from "../components/ModelNode";
import {ModelEdge} from "../components/AbstractEdge";
import {UserModelEdge} from "../components/UserModelEdge";
import {UserInput} from "../components/UserInput";
import logger from "../../../util/logger";
import {Condition} from "../components/Condition";
import {ProgramModelEdge} from "../components/ProgramModelEdge";
import {Effect} from "../components/Effect";
import {
    CheckJSON,
    EndModelJSON,
    ModelEdgeJSON,
    ModelJSON,
    ProgramModelJSON,
    UserInputJSON,
    UserModelJSON,
    parse
} from "./schema";

interface Models {
    programModels: ProgramModel[],
    userModels: UserModel[],
    onTestEndModels: EndModel[]
}

/**
 * Load models from a json string.
 *
 * ############ Assumptions ############
 * - only one start node per graph
 * - needs to have start node
 * - multiple conditions on an edge have to all be fulfilled for the condition to be true
 * - edges that have the same source and target but different conditions are alternatives
 * - there can be a constraint program model, that defines all constraints (initialisation of variable/attributes,
 * constraints after initialisation e.g. time < 30 as it decreases)
 */
export function loadModels(text: string): Models {
    const rawModels = parse(text);
    handleDuplicateModelIDs(rawModels);

    const models: Models = {
        programModels: [],
        userModels: [],
        onTestEndModels: [],
    };

    rawModels.forEach((raw) => {
        const model = loadModel(raw);
        const usage = model.usage;

        if (usage === "user") {
            models.userModels.push(model);
        } else if (usage == "program") {
            models.programModels.push(model);
        } else if (usage === "end") {
            models.onTestEndModels.push(model);
        } else {
            throw new NonExhaustiveCaseDistinction(usage);
        }
    });

    return models;
}

function handleDuplicateModelIDs(models: ModelJSON[]): void {
    const ids = new Set<string>();

    for (const m of models) {
        if (ids.has(m.id)) {
            m.id = `${m.id}_dup${ids.size}`;
            logger.warn(`Warning: Model id '${m.id}' already defined.`);
        }

        ids.add(m.id);
    }
}

function loadModel(raw: ModelJSON): Model {
    const usage = raw.usage;
    switch (usage) {
        case "user":
            return loadUserModel(raw);
        case "program":
            return loadProgramModel(raw);
        case "end":
            return loadEndModel(raw);
        default:
            throw new NonExhaustiveCaseDistinction(usage, `Unknown model of type "${usage}"`);
    }
}

function loadUserModel(raw: UserModelJSON): UserModel {
    const nodes = loadNodes<UserModelEdge>(raw);
    const edges = loadUserModelEdges(raw);
    addConnections(nodes, edges);
    const {id, startNodeId, stopNodeIds, stopAllNodeIds} = raw;
    return new UserModel(id, startNodeId, Object.fromEntries(nodes), Object.fromEntries(edges), stopNodeIds, stopAllNodeIds);
}

function loadProgramModel(raw: ProgramModelJSON): ProgramModel {
    const nodes = loadNodes<ProgramModelEdge>(raw);
    const edges = loadProgramModelEdges(raw);
    addConnections(nodes, edges);
    const {id, startNodeId, stopNodeIds, stopAllNodeIds} = raw;
    return new ProgramModel(id, startNodeId, Object.fromEntries(nodes), Object.fromEntries(edges), stopNodeIds, stopAllNodeIds);
}

function loadEndModel(raw: EndModelJSON): EndModel {
    const nodes = loadNodes<ProgramModelEdge>(raw);
    const edges = loadProgramModelEdges(raw);
    addConnections(nodes, edges);
    const {id, startNodeId, stopNodeIds, stopAllNodeIds} = raw;
    return new EndModel(id, startNodeId, Object.fromEntries(nodes), Object.fromEntries(edges), stopNodeIds, stopAllNodeIds);
}

function addConnections<E extends ModelEdge>(nodes: Map<string, ModelNode<E>>, edges: Map<string, E>): void {
    for (const [edgeID, edge] of edges) {
        if (!nodes.has(edge.from)) {
            throw new Error(`${edgeID}: Unknown node id '${edge.from}'.`);
        }

        if (!nodes.has(edge.to)) {
            throw new Error(`${edgeID}: Unknown node id '${edge.to}'.`);
        }

        nodes.get(edge.from).addOutgoingEdge(edge);
    }
}

function loadNodes<E extends ModelEdge>(raw: ModelJSON): Map<string, ModelNode<E>> {
    const nodes = new Map<string, ModelNode<E>>();

    raw.nodes.forEach(({id, label}) => {
        if (nodes.has(id)) {
            throw new Error("Node id '" + id + "' already defined.");
        }

        nodes.set(id, new ModelNode(id, label));
    });

    nodes.get(raw.startNodeId).isStartNode = true;
    raw.stopNodeIds.forEach((id) => nodes.get(id).isStopNode = true);
    raw.stopAllNodeIds.forEach((id) => nodes.get(id).isStopAllNode = true);
    return nodes;
}

function loadProgramModelEdges(raw: ProgramModelJSON | EndModelJSON): Map<string, ProgramModelEdge> {
    const edges = new Map<string, ProgramModelEdge>();

    handleDuplicateEdgeIDs(raw.edges);

    for (const rawEdge of raw.edges) {
        const {id, label, from, to, forceTestAfter, forceTestAt, effects, conditions} = rawEdge;
        const edge = new ProgramModelEdge(id, label, raw.id, from, to, forceTestAfter, forceTestAt);
        addEffects(edge, effects);
        addConditions(edge, conditions);
        edges.set(id, edge);
    }

    return edges;
}

function loadUserModelEdges(raw: UserModelJSON): Map<string, UserModelEdge> {
    const edges = new Map<string, UserModelEdge>();

    handleDuplicateEdgeIDs(raw.edges);

    for (const rawEdge of raw.edges) {
        const {id, label, from, to, forceTestAfter, forceTestAt, conditions, effects} = rawEdge;
        const edge = new UserModelEdge(id, label, raw.id, from, to, forceTestAfter, forceTestAt);
        addUserInputs(edge, effects);
        addConditions(edge, conditions);
        edges.set(id, edge);
    }

    return edges;
}

function handleDuplicateEdgeIDs(edges: ModelEdgeJSON[]): void {
    const ids = new Set<string>();

    for (const e of edges) {
        if (ids.has(e.id)) {
            e.id = `${e.id}_dup_${ids.size}`;
        }

        ids.add(e.id);
        e.label = e.label ?? e.id;
    }
}

function addUserInputs(edge: UserModelEdge, rawUserInputs: UserInputJSON[]): void {
    for (const i of rawUserInputs) {
        if (i.name === "InputKey") {
            i.args[0] = canonicalizeInputKey(i.args[0]);
        }

        edge.addUserInput(new UserInput(i.id, i.name, i.args));
    }
}

function addEffects(edge: ProgramModelEdge, rawEffects: CheckJSON[]): void {
    rawEffects.forEach((e) => edge.addEffect(new Effect(e.id, edge.id, e.name, e.negated, e.args)));
}

function addConditions(edge: ModelEdge, rawConditions: CheckJSON[]): void {
    rawConditions.forEach((c) => edge.addCondition(new Condition(c.id, edge.id, c.name, c.negated, c.args)));
}

function canonicalizeInputKey(key: unknown): string {
    const stringKey = String(key);

    switch (stringKey.toLowerCase()) {
        case "left":
            return "left arrow";
        case "right":
            return "right arrow";
        case "up":
            return "up arrow";
        case "down":
            return "down arrow";
        default:
            return stringKey;
    }
}
