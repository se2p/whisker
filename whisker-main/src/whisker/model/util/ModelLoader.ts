import {ModelNode, NodeID, SimpleModelNode} from "../components/ModelNode";
import {
    EdgeID,
    ModelEdge,
    ProgramModelEdge,
    SimpleProgramModelEdge,
    SimpleUserModelEdge,
    UserModelEdge
} from "../components/ModelEdge";
import {ProgramModel} from "../components/ProgramModel";
import {UserModel} from "../components/UserModel";
import {Condition} from "../components/Condition";
import {Effect} from "../components/Effect";
import {InputEffect, InputEffectName, SimpleInputEffect} from "../components/InputEffect";
import {ArgType, CheckName, SimpleCheck} from "../components/Check";

export type ModelType = "program" | "user" | "end";

interface Attributes {
    id: string,
}

interface StoredModelEdge {
    id: EdgeID;
    label: string;
    from: NodeID;
    to: NodeID;
    forceTestAt: number;
    forceTestAfter: number
    conditions: SimpleCheck[];
    inputEffects?: SimpleInputEffect[];
    // effects: SimpleInputEffect[] | SimpleCheck[];
    effects: any[];
}

interface StoredModel {
    usage: string,
    _attributes: Attributes,
    nodeIds?: NodeID[],
    id: string;
    nodes: SimpleModelNode[];
    edges: StoredModelEdge[];
    startNodeId: NodeID;
    stopNodeIds: NodeID[];
    stopAllNodeIds: NodeID[]
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

    static readonly PROGRAM_MODEL_ID: ModelType = "program";
    static readonly USER_MODEL_ID: ModelType = "user";
    static readonly ON_TEST_END_ID: ModelType = "end";

    private startNodeId: string;
    private stopNodeIds: string[];
    private stopAllNodeIds: string[];

    private nodesMap: Record<string, ModelNode>;
    private edgesMapProgram: Record<string, ProgramModelEdge>;
    private edgesMapUser: Record<string, UserModelEdge>;
    private graphIDs: string[];

    private programModels: ProgramModel[];
    private userModels: UserModel[];
    private onTestEndModels: ProgramModel[];

    private idUndefined = 0;
    private static readonly ID_UNDEFINED = "id_undefined";

    /**
     * Load the models from a string file content.
     * @param jsonText Content of a json file containing the models.
     */
    loadModels(jsonText: string): {
        programModels: ProgramModel[],
        userModels: UserModel[],
        onTestEndModels: ProgramModel[]
    } {
        const graphs: StoredModel[] = JSON.parse(jsonText);
        this.graphIDs = [];
        this.programModels = [];
        this.userModels = [];
        this.onTestEndModels = [];

        try {
            graphs.forEach(graph => {
                this.loadGraph(graph);
            });
        } catch (e) {
            e.message = "Model Loader: " + e.message;
            throw e;
        }

        return {
            programModels: this.programModels,
            userModels: this.userModels,
            onTestEndModels: this.onTestEndModels
        };
    }

    private loadGraph(graph: StoredModel) {
        const graphID = graph.id;
        if (graph.startNodeId == undefined) {
            throw new Error(graphID + ": Start node id of the graph is undefined");
        } else if (Array.isArray(graph.startNodeId)) {
            throw new Error(graphID + ": Only one start node allowed.");
        }
        this.startNodeId = graph.startNodeId;

        this.stopNodeIds = graph.stopNodeIds;
        if (graph.stopNodeIds == undefined || !Array.isArray(graph.stopNodeIds)) {
            console.warn("Warning: Graph without stop node ids.");
            this.stopNodeIds = [];
        }

        this.stopAllNodeIds = graph.stopAllNodeIds;
        if (graph.stopAllNodeIds == undefined || !Array.isArray(graph.stopAllNodeIds)) {
            console.warn("Warning: Graph without stop-all node ids.");
            this.stopAllNodeIds = [];
        }
        this.nodesMap = {};
        this.edgesMapProgram = {};
        this.edgesMapUser = {};
        this.loadModel(graph);
    }

    private loadModel(graph: StoredModel): void {
        let graphID = graph.id;
        if (graphID == undefined) {
            graphID = ModelLoader.ID_UNDEFINED + this.idUndefined;
            this.idUndefined++;
            console.warn("Warning: A graph id was not given. Defining as " + graphID);
        } else if (this.graphIDs.indexOf(graphID) != -1) {
            graphID = graphID + "_dup" + this.graphIDs.length;
            console.warn("Warning: Model id '" + graph._attributes.id + "' already defined.");
        }
        this.graphIDs.push(graphID);

        // create all nodes, allowed is either a 'nodeIds' string array or an array 'nodes' with{id:string,
        // label:string}
        const nodeIDs = graph.nodeIds;
        const nodes = graph.nodes;
        if ((!Array.isArray(nodeIDs) || nodeIDs.length == 0) && (!Array.isArray(nodes) || nodes.length == 0)) {
            throw new Error(graphID + ": No nodes given.");
        }
        if (nodes) {
            this.loadNodes(nodes);
        } else {
            this.loadNodesFromIds(nodeIDs);
        }
        this.setupNodes();

        // Load the edges
        try {
            graph.edges.forEach((edge: SimpleProgramModelEdge | SimpleUserModelEdge) => this.loadEdge(graph.usage, graphID, edge));
        } catch (e) {
            throw new Error(graphID + ": " + e.message);
        }

        let model: ProgramModel | UserModel;
        switch (graph.usage) {
            case ModelLoader.PROGRAM_MODEL_ID:
                model = new ProgramModel(graphID, this.startNodeId, this.nodesMap, this.edgesMapProgram,
                    this.stopNodeIds, this.stopAllNodeIds);
                this.programModels.push(model);
                break;
            case ModelLoader.USER_MODEL_ID:
                model = new UserModel(graphID, this.startNodeId, this.nodesMap, this.edgesMapUser, this.stopNodeIds,
                    this.stopAllNodeIds);
                this.userModels.push(model);
                break;
            case ModelLoader.ON_TEST_END_ID:
                model = new ProgramModel(graphID, this.startNodeId, this.nodesMap, this.edgesMapProgram, this.stopNodeIds,
                    this.stopAllNodeIds);
                this.onTestEndModels.push(model);
                break;
            default:
                throw Error("Model type id not known.");
        }
    }

    private loadNodes(nodes: SimpleModelNode[]): void {
        nodes.forEach(node => {
            if ((this.nodesMap)[node.id]) {
                throw new Error("Node id '" + node.id + "' already defined.");
            }
            if (!node.label) {
                node.label = node.id;
            }

            (this.nodesMap)[node.id] = new ModelNode(node.id, node.label);
        });
    }

    private loadNodesFromIds(nodeIds: string[]): void {
        nodeIds.forEach(id => {
            if ((this.nodesMap)[id]) {
                throw new Error("Node id '" + id + "' already defined.");
            }
            (this.nodesMap)[id] = new ModelNode(id, id);
        });
    }

    private setupNodes() {
        this.nodesMap[this.startNodeId].isStartNode = true;
        this.stopNodeIds.forEach(id => {
            this.nodesMap[id].isStopNode = true;
        });
        this.stopAllNodeIds.forEach(id => {
            this.nodesMap[id].isStopAllNode = true;
        });
    }

    private loadEdge(usage: string, graphID: string, edge: StoredModelEdge): void {
        let edgeID: string;
        if (edge.id == undefined) {
            edgeID = "edge-undef-" + this.idUndefined;
            this.idUndefined++;
            console.warn("Warning: ID for an edge not given.");
        } else if ((this.edgesMapProgram)[edge.id]) {
            edgeID = edge.id + "_dup_" + Object.keys(this.edgesMapProgram).length;
            console.warn("Warning: ID '" + edge.id + "' already defined.");
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

        if (!this.nodesMap[from]) {
            throw new Error(edgeID + ": Unknown node id '" + from + "'.");
        }
        if (!this.nodesMap[to]) {
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

        if (usage != ModelLoader.USER_MODEL_ID) {
            const newEdge = new ProgramModelEdge(edgeID, label, graphID, from, to, forceTestAfter, forceTestAt);

            if (!edge.conditions) {
                throw new Error("Edge '" + edgeID + "': Condition not given.");
            }

            this.loadConditions(newEdge, edge.conditions);
            if (edge.effects) {
                this.loadEffects(newEdge, edge.effects);
            }

            this.nodesMap[from].addOutgoingEdge(newEdge);
            this.edgesMapProgram[edgeID] = newEdge;
        } else {
            const newEdge = new UserModelEdge(edgeID, label, graphID, from, to, forceTestAfter, forceTestAt);

            if (!edge.conditions) {
                throw new Error("Edge '" + edgeID + "': Condition not given.");
            }

            this.loadConditions(newEdge, edge.conditions);

            // old models have inputEffects in json, modelEditor writes just effects so this is just as a precaution
            if (edge.inputEffects) {
                this.loadInputEffect(newEdge, edge.inputEffects);
            } else if (edge.effects) {
                this.loadInputEffect(newEdge, edge.effects);
            }

            this.nodesMap[from].addOutgoingEdge(newEdge);
            this.edgesMapUser[edgeID] = newEdge;
        }
    }

    private loadConditions(newEdge: ModelEdge, conditions: SimpleCheck[]): void {
        let id: string, name: CheckName, negated: boolean, args: ArgType[];
        conditions.forEach(condition => {
            id = condition.id;
            name = condition.name;
            negated = condition.negated;
            args = condition.args;

            if (id == undefined) {
                id = "condition" + this.idUndefined;
                console.warn("Warning: " + newEdge.id + " ID for an condition not given.");
                this.idUndefined++;
            }

            if (name == undefined || CheckName[name] == undefined) {
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

    private loadEffects(newEdge: ProgramModelEdge, effects: SimpleCheck[]): void {
        let id: string, name: CheckName, negated: boolean, args: ArgType[];
        effects.forEach((effect: SimpleCheck) => {
            id = effect.id;
            name = effect.name;
            negated = effect.negated;
            args = effect.args;

            if (id == undefined) {
                id = "condition" + this.idUndefined;
                console.warn("Warning: " + newEdge.id + " ID for an effect not given.");
                this.idUndefined++;
            }

            if (name == undefined || CheckName[name] == undefined) {
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

    private loadInputEffect(newEdge: UserModelEdge, effects: SimpleInputEffect[]): void {
        let id: string, name: InputEffectName, args: ArgType[];
        effects.forEach(effect => {
            id = effect.id;
            name = effect.name;
            args = effect.args;

            if (name == InputEffectName.InputKey) {
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
                id = "condition" + this.idUndefined;
                console.warn("Warning: " + newEdge.id + " ID for an input effect not given.");
                this.idUndefined++;
            }

            if (name == undefined || InputEffectName[name] == undefined) {
                throw new Error(newEdge.id + ": Name of input effect wrong or missing.");
            }

            if (args == undefined || !Array.isArray(args)) {
                throw new Error(newEdge.id + ": Arguments for input effect not given or not an array.");
            }

            newEdge.addInputEffect(new InputEffect(id, name, args));
        });
    }

}
