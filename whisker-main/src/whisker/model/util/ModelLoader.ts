import {ModelNode, ModelNodeJSON} from "../components/ModelNode";
import {LegacyModelEdgeJSON, AbstractEdge, ModelEdgeJSON} from "../components/AbstractEdge";
import {EndModel, ProgramModel} from "../components/ProgramModel";
import {UserModel} from "../components/UserModel";
import {Condition} from "../components/Condition";
import {Effect} from "../components/Effect";
import {InputEffect, InputEffectJSON, InputEffectName} from "../components/InputEffect";
import {ArgType, CheckJSON, CheckName} from "../components/Check";
import logger from "../../../util/logger";
import {getErrorMessage} from "./ModelError";
import {UserModelEdge} from "../components/UserModelEdge";
import {ProgramModelEdge} from "../components/ProgramModelEdge";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";
import {LegacyModelJSON, ModelJSON, ModelUsage} from "../components/AbstractModel";

interface Models {
    programModels: ProgramModel[],
    userModels: UserModel[],
    onTestEndModels: EndModel[]
}

/**
 * Load models from a json file.
 *
 * ############ Assumptions ############
 * - only one start node per graph
 * - needs to have start node
 * - multiple conditions on an edge have to all be fulfilled for the condition to be true
 * - edges that have the same source and target but different conditions are alternatives
 * - there can be a constraint program model, that defines all constraints (initialisation of variable/attributes,
 * constraints after initialisation e.g. time < 30 as it decreases)
 */
export class ModelLoader {
    private _startNodeId: string;
    private _stopNodeIds: string[];
    private _stopAllNodeIds: string[];

    private _userNodesMap: Record<string, ModelNode<UserModelEdge>>;
    private _programNodesMap: Record<string, ModelNode<ProgramModelEdge>>;

    private _edgesMapProgram: Record<string, ProgramModelEdge>;
    private _edgesMapUser: Record<string, UserModelEdge>;
    private _graphIDs: string[];

    private _programModels: ProgramModel[];
    private _userModels: UserModel[];
    private _onTestEndModels: EndModel[];

    private _idUndefined = 0;
    private static readonly _ID_UNDEFINED = "id_undefined";

    constructor() {
        // FIXME: the code from loadModels() should probably be cut and pasted here. Then, delete loadModels(), and
        //  invoke the constructor instead.

        this._startNodeId = "";
        this._stopNodeIds = [];
        this._stopAllNodeIds = [];
        this._userNodesMap = {};
        this._programNodesMap = {};
        this._edgesMapProgram = {};
        this._edgesMapUser = {};
        this._graphIDs = [];
        this._programModels = [];
        this._userModels = [];
        this._onTestEndModels = [];
    }

    /**
     * Load the models from a string file content.
     * @param jsonText Content of a json file containing the models.
     */
    loadModels(jsonText: string): Models {
        const graphs: (ModelJSON | LegacyModelJSON)[] = JSON.parse(jsonText);
        this._graphIDs = [];
        this._programModels = [];
        this._userModels = [];
        this._onTestEndModels = [];

        try {
            graphs.forEach(graph => {
                this._loadGraph(graph);
            });
        } catch (e) {
            if (e instanceof Error) {
                e.message = "Model Loader: " + e.message;
            }
            throw e;
        }

        return {
            programModels: this._programModels,
            userModels: this._userModels,
            onTestEndModels: this._onTestEndModels
        };
    }

    private _loadGraph(graph: ModelJSON | LegacyModelJSON) {
        const graphID = graph.id;

        if (graph.startNodeId == undefined) {
            throw new Error(graphID + ": Start node id of the graph is undefined");
        }

        if (Array.isArray(graph.startNodeId)) {
            throw new Error(graphID + ": Only one start node allowed.");
        }

        this._startNodeId = graph.startNodeId;

        this._stopNodeIds = graph.stopNodeIds;
        if (graph.stopNodeIds == undefined || !Array.isArray(graph.stopNodeIds)) {
            logger.warn("Warning: Graph without stop node ids.");
            this._stopNodeIds = [];
        }

        this._stopAllNodeIds = graph.stopAllNodeIds;
        if (graph.stopAllNodeIds == undefined || !Array.isArray(graph.stopAllNodeIds)) {
            logger.warn("Warning: Graph without stop-all node ids.");
            this._stopAllNodeIds = [];
        }
        this._userNodesMap = {};
        this._programNodesMap = {};
        this._edgesMapProgram = {};
        this._edgesMapUser = {};
        this._loadModel(graph);
    }

    private _loadModel(graph: ModelJSON | LegacyModelJSON): void {
        let graphID = graph.id;
        if (graphID == undefined) {
            graphID = ModelLoader._ID_UNDEFINED + this._idUndefined;
            this._idUndefined++;
            logger.warn("Warning: A graph id was not given. Defining as " + graphID);
        } else if (this._graphIDs.includes(graphID)) {
            graphID = graphID + "_dup" + this._graphIDs.length;
            logger.warn("Warning: Model id '" + graph.id + "' already defined.");
        }
        this._graphIDs.push(graphID);

        // create all nodes, allowed is either a 'nodeIds' string array or an array 'nodes' with{id:string,
        // label:string}
        if ("nodeIds" in graph) {
            const nodeIds = graph.nodeIds;

            if (!Array.isArray(nodeIds) || nodeIds.length == 0) {
                throw new Error(graphID + ": No nodes given.");
            }

            this._loadNodesFromIds(nodeIds!, graph.usage);
        } else {
            const nodes = graph.nodes;

            if (!Array.isArray(nodes) || nodes.length == 0) {
                throw new Error(graphID + ": No nodes given.");
            }

            this._loadNodes(nodes, graph.usage);
        }

        this._setupNodes(graph.usage);

        // Load the edges
        try {
            graph.edges.forEach((edge) => this._loadEdge(graph.usage, graphID, edge));
        } catch (e) {
            throw new Error(graphID + ": " + getErrorMessage(e));
        }

        let model: ProgramModel | UserModel | EndModel;
        switch (graph.usage) {
            case "program":
                model = new ProgramModel(graphID, this._startNodeId, this._programNodesMap, this._edgesMapProgram,
                    this._stopNodeIds, this._stopAllNodeIds);
                this._programModels.push(model);
                break;
            case "user":
                model = new UserModel(graphID, this._startNodeId, this._userNodesMap, this._edgesMapUser, this._stopNodeIds,
                    this._stopAllNodeIds);
                this._userModels.push(model);
                break;
            case "end":
                model = new EndModel(graphID, this._startNodeId, this._programNodesMap, this._edgesMapProgram, this._stopNodeIds,
                    this._stopAllNodeIds);
                this._onTestEndModels.push(model);
                break;
            default:
                throw new NonExhaustiveCaseDistinction(graph.usage, "Model type id not known.");
        }
    }

    private _loadNodes(nodes: ModelNodeJSON[], usage: ModelUsage): void {
        const map = usage === "user" ? this._userNodesMap : this._programNodesMap;

        nodes.forEach(node => {
            if (map[node.id]) {
                throw new Error("Node id '" + node.id + "' already defined.");
            }
            if (!node.label) {
                node.label = node.id;
            }

            map[node.id] = new ModelNode<typeof map extends "user" ? UserModelEdge : ProgramModelEdge>(node.id, node.label);
        });
    }

    private _loadNodesFromIds(nodeIds: string[], usage: ModelUsage): void {
        const map = usage === "user" ? this._userNodesMap : this._programNodesMap;

        nodeIds.forEach(id => {
            if (map[id]) {
                throw new Error("Node id '" + id + "' already defined.");
            }
            map[id] = new ModelNode<typeof map extends "user" ? UserModelEdge : ProgramModelEdge>(id, id);
        });
    }

    private _setupNodes(usage: ModelUsage) {
        const map = usage === "user" ? this._userNodesMap : this._programNodesMap;

        map[this._startNodeId].isStartNode = true;
        this._stopNodeIds.forEach(id => {
            map[id].isStopNode = true;
        });
        this._stopAllNodeIds.forEach(id => {
            map[id].isStopAllNode = true;
        });
    }

    private _loadEdge(usage: ModelUsage, graphID: string, edge: ModelEdgeJSON | LegacyModelEdgeJSON): void {
        const edgesMap = usage === "user" ? this._edgesMapUser : this._edgesMapProgram;

        let edgeID: string;
        if (edge.id == undefined) {
            edgeID = "edge-undef-" + this._idUndefined;
            this._idUndefined++;
            logger.warn("Warning: ID for an edge not given.");
        } else if ((edgesMap)[edge.id]) {
            edgeID = edge.id + "_dup_" + Object.keys(edgesMap).length;
            logger.warn("Warning: ID '" + edge.id + "' already defined.");
        } else {
            edgeID = edge.id;
        }

        const from = edge.from;
        const to = edge.to;
        let label = edge.label;

        if (label == undefined) {
            label = edgeID;
        }

        if (from == undefined) {
            throw new Error(edgeID + ": source node (from) not defined.");
        }

        if (to == undefined) {
            throw new Error(edgeID + ": target node (to) not defined.");
        }

        const nodesMap = usage === "user" ? this._userNodesMap : this._programNodesMap;

        if (!nodesMap[from]) {
            throw new Error(edgeID + ": Unknown node id '" + from + "'.");
        }
        if (!nodesMap[to]) {
            throw new Error(edgeID + ": Unknown node id '" + to + "'.");
        }

        let forceTestAt: number, forceTestAfter: number;
        if (edge.forceTestAfter == undefined) {
            forceTestAfter = -1;
        } else {
            forceTestAfter = Number(edge.forceTestAfter.toString());
        }

        if (edge.forceTestAt == undefined) {
            forceTestAt = -1;
        } else {
            forceTestAt = Number(edge.forceTestAt.toString());
        }

        if (usage === "user") {
            const newEdge = new UserModelEdge(edgeID, label, graphID, from, to, forceTestAfter, forceTestAt);

            if (!edge.conditions) {
                throw new Error("Edge '" + edgeID + "': Condition not given.");
            }

            this._loadConditions(newEdge, edge.conditions);

            // old models have inputEffects in json, modelEditor writes just effects so this is just as a precaution
            if ("inputEffects" in edge) {
                this._loadInputEffect(newEdge, edge.inputEffects as InputEffectJSON[]);
            } else if ("effects" in edge) {
                this._loadInputEffect(newEdge, edge.effects as InputEffectJSON[]);
            }

            this._userNodesMap[from].addOutgoingEdge(newEdge);
            this._edgesMapUser[edgeID] = newEdge;
        } else {
            const newEdge = new ProgramModelEdge(edgeID, label, graphID, from, to, forceTestAfter, forceTestAt);

            if (!edge.conditions) {
                throw new Error("Edge '" + edgeID + "': Condition not given.");
            }

            this._loadConditions(newEdge, edge.conditions);
            if (edge.effects) {
                this._loadEffects(newEdge, edge.effects as CheckJSON[]);
            }
            this._programNodesMap[from].addOutgoingEdge(newEdge);
            this._edgesMapProgram[edgeID] = newEdge;
        }
    }

    private _loadConditions(newEdge: AbstractEdge, conditions: CheckJSON[]): void {
        let id: string, name: CheckName, negated: boolean, args: ArgType[];
        conditions.forEach(condition => {
            id = condition.id;
            name = condition.name;
            negated = condition.negated;
            args = condition.args;

            if (id == undefined) {
                id = "condition" + this._idUndefined;
                logger.warn("Warning: " + newEdge.id + " ID for an condition not given.");
                this._idUndefined++;
            }

            if (name == undefined) {
                throw new Error(newEdge.id + ": Name of condition wrong or missing.");
            }

            if (negated == undefined || (typeof negated) != 'boolean') {
                throw new Error(newEdge.id + ": Negated attribute of condition missing or not a boolean.");
            }

            if (args == undefined || !Array.isArray(args)) {
                throw new Error(newEdge.id + ": Arguments for condition not given or not an array.");
            }

            newEdge.addCondition(new Condition(id, newEdge.id, name, negated, args));
        });
    }

    private _loadEffects(newEdge: ProgramModelEdge, effects: CheckJSON[]): void {
        let id: string, name: CheckName, negated: boolean, args: ArgType[];
        effects.forEach((effect: CheckJSON) => {
            id = effect.id;
            name = effect.name;
            negated = effect.negated;
            args = effect.args;

            if (id == undefined) {
                id = "condition" + this._idUndefined;
                logger.warn("Warning: " + newEdge.id + " ID for an effect not given.");
                this._idUndefined++;
            }

            if (name == undefined) {
                throw new Error(newEdge.id + ": Name of effect wrong or missing.");
            }

            if (negated == undefined || (typeof negated) != 'boolean') {
                throw new Error(newEdge.id + ": Negated attribute of effect missing or not a boolean.");
            }

            if (args == undefined || !Array.isArray(args)) {
                throw new Error(newEdge.id + ": Arguments for effect not given or not an array.");
            }

            newEdge.addEffect(new Effect(id, newEdge.id, name, negated, args));
        });
    }

    private _loadInputEffect(newEdge: UserModelEdge, effects: InputEffectJSON[]): void {
        let id: string, name: InputEffectName, args: ArgType[];
        effects.forEach(effect => {
            id = effect.id;
            name = effect.name;
            args = effect.args;

            if (name == "InputKey") {
                if (String(args[0]).toLowerCase() == "left") {
                    args[0] = "left arrow";
                } else if (String(args[0]).toLowerCase() == "right") {
                    args[0] = "right arrow";
                } else if (String(args[0]).toLowerCase() == "up") {
                    args[0] = "up arrow";
                } else if (String(args[0]).toLowerCase() == "down") {
                    args[0] = "down arrow";
                }
            }

            if (id == undefined) {
                id = "condition" + this._idUndefined;
                logger.warn("Warning: " + newEdge.id + " ID for an input effect not given.");
                this._idUndefined++;
            }

            if (name == undefined) {
                throw new Error(newEdge.id + ": Name of input effect wrong or missing.");
            }

            if (args == undefined || !Array.isArray(args)) {
                throw new Error(newEdge.id + ": Arguments for input effect not given or not an array.");
            }

            newEdge.addInputEffect(new InputEffect(id, name, args));
        });
    }
}
