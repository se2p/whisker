import * as xmljs from 'xml-js';
import {ModelNode} from "../components/ModelNode";
import {ModelEdge} from "../components/ModelEdge";
import {ProgramModel} from "../components/ProgramModel";
import {UserModel} from "../components/UserModel";
import {evalCondition} from "./EdgeEvent";

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
 */
export class ModelLoaderXML {

    private xmlOptions = {
        compact: true,
        spaces: 1,
        alwaysArray: true
    };

    private startNode: ModelNode;
    private stopNodes: { [key: string]: ModelNode };
    private nodesMap: { [key: string]: ModelNode };
    private edgesMap: { [key: string]: ModelEdge };
    private graphIDs: string[];

    private programModels: ProgramModel[];
    private userModels: UserModel[];

    /**
     * Load the models from a string file content.
     * @param xmlText Content of a xml file containing the models.
     */
    loadModels(xmlText: string): { programModels: ProgramModel[], userModels: UserModel[] } {
        const graphs = JSON.parse(xmljs.xml2json(xmlText, this.xmlOptions)).models[0].graph;
        this.graphIDs = [];
        this.programModels = [];
        this.userModels = [];

        graphs.forEach(graph => {
            this.startNode = undefined;
            this.stopNodes = {};
            this.nodesMap = {};
            this.edgesMap = {};
            this._loadModel(graph);
        })
        return {programModels: this.programModels, userModels: this.userModels};
    }

    /**
     * Load a model.
     * @param graph Contains a node array, an edge array and attributes.
     */
    _loadModel(graph: { [key: string]: any }): void {
        // Get the nodes and edges..
        const graphEdges = graph.edge;
        const graphNodes = graph.node;

        graphNodes.forEach(node => this._loadNode(node['_attributes']));
        graphEdges.forEach(edge => this._loadEdge(edge['_attributes']));

        if (!this.startNode) {
            throw new Error("Start node not marked.");
        }
        if (Object.keys(this.stopNodes).length == 0) {
            throw new Error("Stop nodes not marked.");
        }

        const graphID = graph._attributes.id;
        if (this.graphIDs.indexOf(graphID) != -1) { // todo test
            throw new Error("Model id '" + graphID + "' already defined.");
        }
        this.graphIDs.push(graphID);

        if (graph._attributes.usage == "program") {
            this.programModels.push(new ProgramModel(graphID, this.startNode, this.stopNodes, this.nodesMap,
                this.edgesMap))
        } else {
            this.userModels.push(new UserModel(graphID));// todo
        }
    }

    /**
     * Load a node into the node map.
     * @param nodeAttr attributes of the node: id, startNode: boolean (optional), stopNode: boolean (optional)
     */
    _loadNode(nodeAttr: { [key: string]: string }): void {
        if ((this.nodesMap)[nodeAttr.id]) {
            throw new Error("Node id '" + nodeAttr.id + "' already defined.");
        }

        (this.nodesMap)[nodeAttr.id] = new ModelNode(nodeAttr.id);

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
     * @param edgeAttr attributes of the edge: id, source: (nodeid as string), target: (nodeid as string),
     * condition: string, effect: string
     */
    _loadEdge(edgeAttr: { [key: string]: string }): void {
        const edgeID = edgeAttr.id;
        const startID = edgeAttr.source;
        const endID = edgeAttr.target;

        if ((this.edgesMap)[edgeID]) {
            throw new Error("ID '" + edgeAttr.id + "' already defined.");
        }

        if (!(this.nodesMap)[startID]) {
            throw new Error("Unknown node id '" + startID + "' in edge '" + edgeID + "'.");
        }
        if (!(this.nodesMap)[endID]) {
            throw new Error("Unknown node id '" + endID + "' in edge '" + edgeID + "'.");
        }

        const newEdge = new ModelEdge(edgeID, (this.nodesMap)[startID], (this.nodesMap)[endID]);

        if (!edgeAttr.condition || !edgeAttr.effect) {
            throw new Error("Condition or effect not given for edge '" + edgeID + "'.");
        }

        evalCondition(newEdge, edgeAttr);

        // Set the effect of the edge
        newEdge.setEffect(function () {
            // todo eval the effect?
            console.log(edgeAttr.effect);
        });

        (this.nodesMap)[startID].addOutgoingEdge(newEdge);
        this.edgesMap[edgeID] = newEdge;
    }
}
