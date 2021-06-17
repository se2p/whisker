import * as xmljs from 'xml-js';
import {ModelNode} from "../components/ModelNode";
import {ProgramModelEdge, UserModelEdge} from "../components/ModelEdge";
import {ProgramModel} from "../components/ProgramModel";
import {UserModel} from "../components/UserModel";
import {setUpCondition} from "../components/Condition";
import {setUpEffect} from "../components/Effect";
import {setUpInputEffect} from "../components/InputEffect";

/**
 * Load models from a xml file.
 *
 * ########### Example XML FILE ###########
 * <graphs>
 *     <graph id="g0" usage="program">
 *         <node id="n0" startNode="true"/>
 *         <node id="n1" stopNode="true"/>
 *         <edge id="e0" source="n0" target="n1" condition="Key:Space" effect="print('Hmm...')"/>
 *     </graph>
 * </graphs>
 *
 *
 * ############ Assumptions ############
 * - only one start node per graph
 * - needs to have start node
 * - edge has a condition and effect noted.
 * - multiple conditions on an edge have to all be fulfilled for the condition to be true
 * - edges that have the same source and target but different conditions are alternatives
 * - there can be a constraint program model, that defines all constraints (initialisation of variable/attributes,
 * constraints after initialisation e.g. time < 30 as it decreases)
 */
export class ModelLoaderXML {

    private static readonly PROGRAM_MODEL_ID = "program";
    private static readonly CONSTRAINTS_MODEL_ID = "constraints";
    private static readonly USER_MODEL_ID = "user";
    private static readonly ON_TEST_END_ID = "end";

    private xmlOptions = {
        compact: true,
        spaces: 1,
        alwaysArray: true
    };

    private startNode: ModelNode;
    private stopNodes: { [key: string]: ModelNode };
    private nodesMap: { [key: string]: ModelNode };
    private edgesMapProgram: { [key: string]: ProgramModelEdge };
    private edgesMapUser: { [key: string]: UserModelEdge };
    private graphIDs: string[];

    private constraintsModels: ProgramModel[];
    private programModels: ProgramModel[];
    private userModels: UserModel[];
    private onTestEndModels: ProgramModel[];

    private idUndefined = 0;
    private static readonly ID_UNDEFINED = "id_undefined";

    /**
     * Load the models from a string file content.
     * @param xmlText Content of a xml file containing the models.
     */
    loadModels(xmlText: string): { programModels: ProgramModel[], userModels: UserModel[], constraintsModels: ProgramModel[], onTestEndModels: ProgramModel[] } {
        const graphs = JSON.parse(xmljs.xml2json(xmlText, this.xmlOptions)).models[0].model;
        this.graphIDs = [];
        this.programModels = [];
        this.userModels = [];
        this.constraintsModels = [];
        this.onTestEndModels = [];

        graphs.forEach(graph => {
            this.startNode = undefined;
            this.stopNodes = {};
            this.nodesMap = {};
            this.edgesMapProgram = {};
            this.edgesMapUser = {};
            this.loadModel(graph);
        })

        return {
            programModels: this.programModels,
            userModels: this.userModels,
            constraintsModels: this.constraintsModels,
            onTestEndModels: this.onTestEndModels
        };
    }

    /**
     * Load a model.
     * @param graph Contains a node array, an edge array and attributes.
     * @private
     */
    private loadModel(graph: { [key: string]: any }): void {
        // Get the nodes and edges..
        const graphEdges = graph.edge;
        const graphNodes = graph.node;
        let graphID = graph._attributes.id;

        if (graphID == undefined) {
            graphID = ModelLoaderXML.ID_UNDEFINED + this.idUndefined;
            this.idUndefined++;
            console.error("Warning: A graph id was not given. Defining as " + graphID);
        } else if (this.graphIDs.indexOf(graphID) != -1) {
            graphID = graphID + "_dup" + this.graphIDs.length;
            console.error("Warning: Model id '" + graph._attributes.id + "' already defined.");
        }

        try {
            graphNodes.forEach(node => this.loadNode(graphID, node['_attributes']));
            if (graph._attributes.usage == ModelLoaderXML.USER_MODEL_ID) {
                graphEdges.forEach(edge => this.loadUserEdge(graphID, edge['_attributes']));
            } else {
                graphEdges.forEach(edge => this.loadProgramEdge(graphID, edge['_attributes']));
            }
        } catch (e) {
            throw new Error("Graph '" + graphID + "':\n" + e.message);
        }

        if (!this.startNode) {
            throw new Error("Graph '" + graphID + "':\n" + "Start node not marked.");
        }

        this.graphIDs.push(graphID);

        let model;
        switch (graph._attributes.usage) {
            case ModelLoaderXML.PROGRAM_MODEL_ID:
                model = new ProgramModel(graphID, this.startNode, this.stopNodes, this.nodesMap, this.edgesMapProgram)
                this.programModels.push(model);
                break;
            case ModelLoaderXML.USER_MODEL_ID:
                model = new UserModel(graphID, this.startNode, this.stopNodes, this.nodesMap, this.edgesMapUser);
                this.userModels.push(model);
                break;
            case ModelLoaderXML.CONSTRAINTS_MODEL_ID:
                model = new ProgramModel(graphID, this.startNode, this.stopNodes, this.nodesMap, this.edgesMapProgram)
                this.constraintsModels.push(model);
                break;
            case ModelLoaderXML.ON_TEST_END_ID:
                model = new ProgramModel(graphID, this.startNode, this.stopNodes, this.nodesMap, this.edgesMapProgram)
                this.onTestEndModels.push(model);
                break;
        }
    }

    /**
     * Load a node into the node map.
     * @param graphID ID of the graph.
     * @param nodeAttr attributes of the node: id, startNode: boolean (optional), stopNode: boolean (optional)
     * @private
     */
    private loadNode(graphID: string, nodeAttr: { [key: string]: string }): void {
        if ((this.nodesMap)[graphID + "-" + nodeAttr.id]) {
            throw new Error("Node id '" + graphID + "-" + nodeAttr.id + "' already defined.");
        }

        (this.nodesMap)[nodeAttr.id] = new ModelNode(graphID + "-" + nodeAttr.id);

        if (nodeAttr.startNode && nodeAttr.startNode == "true") {
            // already defined start node
            if (this.startNode) {
                throw new Error("More than one start node!")
            }
            this.startNode = this.nodesMap[nodeAttr.id];
            this.nodesMap[nodeAttr.id].isStartNode = true;
        }

        if (nodeAttr.stopNode && nodeAttr.stopNode == "true") {
            this.stopNodes[nodeAttr.id] = (this.nodesMap[nodeAttr.id]);
            this.nodesMap[nodeAttr.id].isStopNode = true;
        }

        if (nodeAttr.stopAllModels && nodeAttr.stopAllModels == "true") {
            this.nodesMap[nodeAttr.id].stopAllModels = true;
        }
    }

    /**
     * Load an edge and save it in the edge map of the program edges.
     * @param graphID ID of the graph.
     * @param edgeAttr attributes of the edge: id, source: (nodeid as string), target: (nodeid as string),
     * condition: string, effect: string
     * @private
     */
    private loadProgramEdge(graphID: string, edgeAttr: { [key: string]: string }): void {
        let edgeID;
        if (!edgeAttr.id) {
            edgeID = graphID + "-edge-undef-" + this.idUndefined;
            this.idUndefined++;
        } else {
            if ((this.edgesMapProgram)[graphID + "-" + edgeAttr.id]) {
                edgeID = graphID + "-" + edgeAttr.id + "_dup_" + Object.keys(this.edgesMapProgram).length;
                console.error("Warning: ID '" + graphID + "-" + edgeAttr.id + "' already defined.");
            } else {
                edgeID = graphID + "-" + edgeAttr.id;
            }
        }

        const startID = edgeAttr.source;
        const endID = edgeAttr.target;

        if (startID == undefined) {
            throw new Error("Edge '" + edgeID + "': source node not defined.");
        }

        if (endID == undefined) {
            throw new Error("Edge '" + edgeID + "': target node not defined.");
        }

        if (!(this.nodesMap)[startID]) {
            throw new Error("Edge '" + edgeID + "': Unknown node id '" + startID + "'.");
        }
        if (!(this.nodesMap)[endID]) {
            throw new Error("Edge '" + edgeID + "': Unknown node id '" + endID + "'.");
        }

        const newEdge = new ProgramModelEdge(edgeID, (this.nodesMap)[startID], (this.nodesMap)[endID]);

        if (!edgeAttr.condition) {
            throw new Error("Edge '" + edgeID + "': Condition not given.");
        }

        setUpCondition(newEdge, edgeAttr.condition, edgeAttr.forceTestAfter, edgeAttr.forceTestAt);
        if (edgeAttr.effect) {
            setUpEffect(newEdge, edgeAttr.effect);
        }

        (this.nodesMap)[startID].addOutgoingEdge(newEdge);
        this.edgesMapProgram[edgeID] = newEdge;
    }

    private loadUserEdge(graphID: string, edgeAttr: { [key: string]: string }): void {
        let edgeID;
        if (!edgeAttr.id) {
            edgeID = graphID + "-edge-undef-" + this.idUndefined;
            this.idUndefined++;
        } else {
            if ((this.edgesMapUser)[graphID + "-" + edgeAttr.id]) {
                edgeID = graphID + "-" + edgeAttr.id + "_dup_" + Object.keys(this.edgesMapUser).length;
                console.error("Warning: ID '" + graphID + "-" + edgeAttr.id + "' already defined.");
            } else {
                edgeID = graphID + "-" + edgeAttr.id;
            }
        }
        const startID = edgeAttr.source;
        const endID = edgeAttr.target;

        if (startID == undefined) {
            throw new Error("Edge '" + edgeID + "': source node not defined.");
        }

        if (endID == undefined) {
            throw new Error("Edge '" + edgeID + "': target node not defined.");
        }

        if (!(this.nodesMap)[startID]) {
            throw new Error("Edge '" + edgeID + "': Unknown node id '" + startID + "'.");
        }
        if (!(this.nodesMap)[endID]) {
            throw new Error("Edge '" + edgeID + "': Unknown node id '" + endID + "'.");
        }

        const newEdge = new UserModelEdge(edgeID, (this.nodesMap)[startID], (this.nodesMap)[endID]);

        if (!edgeAttr.condition) {
            throw new Error("Edge '" + edgeID + "': Condition not given.");
        }

        setUpCondition(newEdge, edgeAttr.condition, edgeAttr.forceTestAfter, edgeAttr.forceTestAt);
        if (edgeAttr.effect) {
            setUpInputEffect(newEdge, edgeAttr.effect);
        }

        (this.nodesMap)[startID].addOutgoingEdge(newEdge);
        this.edgesMapUser[edgeID] = newEdge;
    }
}
