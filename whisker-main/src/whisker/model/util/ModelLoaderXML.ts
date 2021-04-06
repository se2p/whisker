import * as xmljs from 'xml-js';
import {ModelNode} from "../components/ModelNode";
import {ModelEdge} from "../components/ModelEdge";
import {Model, ModelType} from "../Model";

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
    private graphMap: { [key: string]: Model };

    /**
     * Load the models from a string file content.
     * @param xmlText Content of a xml file containing the models.
     */
    loadModels(xmlText: string): Model[] {
        const graphs = JSON.parse(xmljs.xml2json(xmlText, this.xmlOptions)).models[0].graph;
        this.graphMap = {}
        graphs.forEach(graph => {
            this.startNode = undefined;
            this.stopNodes = {};
            this.nodesMap = {};
            this.edgesMap = {};
            this._loadModel(graph);
        })
        return Object.values(this.graphMap);
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

        const modelType = graph._attributes.usage == "program" ? ModelType.programModel : ModelType.userModel;
        const model = new Model(graph._attributes.id, modelType, this.startNode, this.stopNodes, this.nodesMap,
            this.edgesMap);
        if (this.graphMap[model.id]) {
            throw new Error("Model id '" + model.id + "' already defined.");
        }
        this.graphMap[model.id] = model;
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

        // Set the condition for the edge
        newEdge.condition = edgeAttr.condition; //todo

        // Set the effect of the edge
        newEdge.setEffect(function () {
            // todo eval the effect?
            console.log(edgeAttr.effect);
        });

        (this.nodesMap)[startID].addOutgoingEdge(newEdge);
        this.edgesMap[edgeID] = newEdge;
    }
}

// import {readFileSync} from "fs";
// const text = readFileSync('../../../test/whisker/model/util/SimpleGraph.xml', 'utf8');
// const loader = new ModelLoaderXML();
// const model = loader.loadModels(text);
// console.log(model);
