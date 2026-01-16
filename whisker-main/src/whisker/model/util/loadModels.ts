import {Model} from "../components/AbstractModel";
import {UserModel,} from "../components/UserModel";
import {EndModel, ProgramModel,} from "../components/ProgramModel";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";
import {ModelNode} from "../components/ModelNode";
import {ModelEdge} from "../components/AbstractEdge";
import {UserModelEdge} from "../components/UserModelEdge";
import logger from "../../../util/logger";
import {ProgramModelEdge} from "../components/ProgramModelEdge";
import {
    EndModelJSON,
    ModelEdgeJSON,
    ModelJSON,
    OracleModelJSON,
    parse,
    ProgramModelJSON,
    UserModelJSON
} from "./schema";
import {CheckJSON, ConditionJSON, newCheck, newCondition} from "../checks/newCheck";
import {newUserInput, UserInputJSON} from "../inputs/newUserInput";

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
    const {id, startNodeId, stopAllNodeIds, initialStorage, maxDuration} = raw;
    const nodes = loadNodes<UserModelEdge>(raw);
    const edges = loadUserModelEdges(raw);
    addConnections(id, nodes, edges);
    return new UserModel(id, startNodeId, Object.fromEntries(nodes), Object.fromEntries(edges), stopAllNodeIds, initialStorage, maxDuration);
}

function loadProgramModel(raw: ProgramModelJSON): ProgramModel {
    const {id, startNodeId, stopAllNodeIds, initialStorage, type, param} = raw;
    const nodes = loadNodes<ProgramModelEdge>(raw);
    const edges = loadProgramModelEdges(raw);
    addConnections(id, nodes, edges);
    return new ProgramModel(id, startNodeId, Object.fromEntries(nodes), Object.fromEntries(edges), stopAllNodeIds, initialStorage, type, param);
}

function loadEndModel(raw: EndModelJSON): EndModel {
    const {id, startNodeId, stopAllNodeIds, initialStorage} = raw;
    const nodes = loadNodes<ProgramModelEdge>(raw);
    const edges = loadProgramModelEdges(raw);
    addConnections(id, nodes, edges);
    return new EndModel(id, startNodeId, Object.fromEntries(nodes), Object.fromEntries(edges), stopAllNodeIds, initialStorage);
}

function addConnections<E extends ModelEdge>(graphId: string, nodes: Map<string, ModelNode<E>>, edges: Map<string, E>): void {
    for (const [edgeID, edge] of edges) {
        if (!nodes.has(edge.from)) {
            throw new Error(`graph ${graphId}, edge: ${edgeID}: Unknown node id '${edge.from}'.`);
        }

        if (!nodes.has(edge.to)) {
            throw new Error(`graph ${graphId}, edge: ${edgeID}: Unknown node id '${edge.to}'.`);
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

        nodes.set(id, new ModelNode(id, label, raw.stopAllNodeIds.includes(id)));
    });
    return nodes;
}

function loadProgramModelEdges(raw: OracleModelJSON): Map<string, ProgramModelEdge> {
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
    rawUserInputs.forEach((i) => edge.addUserInput(newUserInput(i)));
}

function addEffects(edge: ProgramModelEdge, rawEffects: CheckJSON[]): void {
    rawEffects.forEach((e) => edge.addEffect(newCheck(edge.id, e)));
}

function addConditions(edge: ModelEdge, rawConditions: ConditionJSON[]): void {
    rawConditions.forEach((c) => edge.addCondition(newCondition(edge.id, c)));
}
