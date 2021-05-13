import * as xmljs from 'xml-js';
import {ModelNode} from "../components/ModelNode";
import {ModelEdge} from "../components/ModelEdge";
import {ProgramModel} from "../components/ProgramModel";
import {UserModel} from "../components/UserModel";
import {setUpCondition} from "../components/Condition";
import {setUpEffect} from "../components/Effect";

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
 * - needs to have start and stop nodes marked
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

    private xmlOptions = {
        compact: true,
        spaces: 1,
        alwaysArray: true
    };

    private startNode: ModelNode;
    private stopNodes: { [key: string]: ModelNode };
    private nodesMap: { [key: string]: ModelNode };
    private hasAStopNode: boolean;
    private edgesMap: { [key: string]: ModelEdge };
    private graphIDs: string[];

    private constraints: ProgramModel;
    private programModels: ProgramModel[];
    private userModels: UserModel[];

    /**
     * Load the models from a string file content.
     * @param xmlText Content of a xml file containing the models.
     */
    loadModels(xmlText: string): { programModels: ProgramModel[], userModels: UserModel[], constraintsModel: ProgramModel } {
        const graphs = JSON.parse(xmljs.xml2json(xmlText, this.xmlOptions)).models[0].graph;
        this.graphIDs = [];
        this.programModels = [];
        this.userModels = [];

        graphs.forEach(graph => {
            this.startNode = undefined;
            this.stopNodes = {};
            this.nodesMap = {};
            this.edgesMap = {};
            this.loadModel(graph);
        })

        if (!this.hasAStopNode) {
            throw new Error("Graphs have no stop nodes.");
        }

        return {
            programModels: this.programModels,
            userModels: this.userModels,
            constraintsModel: this.constraints
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
        const graphID = graph._attributes.id;

        if (graphID == undefined) {
            throw new Error("Graph id not given.");
        } else if (this.graphIDs.indexOf(graphID) != -1) {
            throw new Error("Model id '" + graphID + "' already defined.");
        }

        try {
            graphNodes.forEach(node => this.loadNode(graphID, node['_attributes']));
            graphEdges.forEach(edge => this.loadEdge(graphID, edge['_attributes']));
        } catch (e) {
            throw new Error("Graph '" + graphID + "':\n" + e.message);
        }

        if (!this.startNode) {
            throw new Error("Graph '" + graphID + "':\n" + "Start node not marked.");
        }
        if (Object.keys(this.stopNodes).length != 0) {
            this.hasAStopNode = true;
        }

        this.graphIDs.push(graphID);

        switch (graph._attributes.usage) {
            case ModelLoaderXML.PROGRAM_MODEL_ID:
                let model = new ProgramModel(graphID, this.startNode, this.stopNodes, this.nodesMap,
                    this.edgesMap)
                this.programModels.push(model);
                for (let edgesMapKey in this.edgesMap) {
                    this.edgesMap[edgesMapKey].registerProgramModel(model);
                }
                break;
            case ModelLoaderXML.USER_MODEL_ID:
                this.userModels.push(new UserModel(graphID));// todo
                break;
            case ModelLoaderXML.CONSTRAINTS_MODEL_ID:
                this.constraints = new ProgramModel(graphID, this.startNode, this.stopNodes, this.nodesMap,
                    this.edgesMap);
                for (let edgesMapKey in this.edgesMap) {
                    this.edgesMap[edgesMapKey].registerProgramModel(this.constraints);
                }
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
        if ((this.nodesMap)[nodeAttr.id]) {
            throw new Error("Node id '" + nodeAttr.id + "' already defined.");
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
    }

    /**
     * Load an edge and save it in the edge map.
     * @param graphID ID of the graph.
     * @param edgeAttr attributes of the edge: id, source: (nodeid as string), target: (nodeid as string),
     * condition: string, effect: string
     * @private
     */
    private loadEdge(graphID: string, edgeAttr: { [key: string]: string }): void {
        const edgeID = graphID + "-" + edgeAttr.id;
        const startID = edgeAttr.source;
        const endID = edgeAttr.target;

        if ((this.edgesMap)[edgeID]) {
            throw new Error("ID '" + edgeAttr.id + "' already defined.");
        }

        if (!(this.nodesMap)[startID]) {
            throw new Error("Edge '" + edgeID + "': Unknown node id '" + startID + "'.");
        }
        if (!(this.nodesMap)[endID]) {
            throw new Error("Edge '" + edgeID + "':Unknown node id '" + endID + "'.");
        }

        const newEdge = new ModelEdge(edgeID, (this.nodesMap)[startID], (this.nodesMap)[endID]);

        if (!edgeAttr.condition) {
            throw new Error("Edge '" + edgeID + "': Condition not given.");
        }

        setUpCondition(newEdge, edgeAttr.condition);
        if (edgeAttr.effect) {
            setUpEffect(newEdge, edgeAttr.effect);
        }

        (this.nodesMap)[startID].addOutgoingEdge(newEdge);
        this.edgesMap[edgeID] = newEdge;
    }
}
