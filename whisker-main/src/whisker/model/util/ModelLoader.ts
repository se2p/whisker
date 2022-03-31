import {ModelNode} from "../components/ModelNode";
import {ModelEdge, ProgramModelEdge, UserModelEdge} from "../components/ModelEdge";
import {ProgramModel} from "../components/ProgramModel";
import {UserModel} from "../components/UserModel";
import {Condition} from "../components/Condition";
import {Effect} from "../components/Effect";
import {InputEffect, InputEffectName} from "../components/InputEffect";
import {CheckName} from "../components/Check";

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

    static readonly PROGRAM_MODEL_ID = "program";
    static readonly USER_MODEL_ID = "user";
    static readonly ON_TEST_END_ID = "end";

    private startNodeId: string;
    private stopNodeIds: string[];
    private stopAllNodeIds: string[];

    private nodesMap: { [key: string]: ModelNode };
    private edgesMapProgram: { [key: string]: ProgramModelEdge };
    private edgesMapUser: { [key: string]: UserModelEdge };
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
    loadModels(jsonText: string): { programModels: ProgramModel[], userModels: UserModel[], onTestEndModels: ProgramModel[] } {
        const graphs = JSON.parse(jsonText);
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

    private loadGraph(graph) {
        let graphID = graph.id;
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

    private loadModel(graph): void {
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

        // create all nodes, allowed are either a 'nodeIds' string array or an array 'nodes' with{id:string,
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

        // Load the edges
        try {
            graph.edges.forEach(edge => this.loadEdge(graph.usage, graphID, edge));
        } catch (e) {
            throw new Error(graphID + ": " + e.message);
        }

        let model;
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

    private loadNodes(nodes) {
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
        this.setupNodes();
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

    private loadEdge(usage: string, graphID: string, edge): void {
        let edgeID;
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

        let forceTestAt, forceTestAfter;
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


    private loadConditions(newEdge: ModelEdge, conditions: any[]) {
        let id, name, negated, args;
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

    private loadEffects(newEdge: ProgramModelEdge, effects: any[]) {
        let id, name, negated, args;
        effects.forEach(effect => {
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

    private loadInputEffect(newEdge: UserModelEdge, effects: any[]) {
        let id, name, args;
        effects.forEach(effect => {
            id = effect.id;
            name = effect.name;
            args = effect.args;

            if (name == InputEffectName.InputKey) {
                if (args[0].toLowerCase() == "left") {
                    args[0] = "left arrow";
                } else if (args[0].toLowerCase() == "right") {
                    args[0] = "right arrow";
                } else if (args[0].toLowerCase() == "up") {
                    args[0] = "up arrow";
                } else if (args[0].toLowerCase() == "down") {
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
