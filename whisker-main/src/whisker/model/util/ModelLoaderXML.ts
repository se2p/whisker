import * as xmljs from 'xml-js';
import {ModelNode} from "../components/ModelNode";
import {ModelEdge} from "../components/ModelEdge";
import {Model, ModelType} from "../Model";

/**
 * Load a model from a xml or graphml file.
 *
 *
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

    loadModels(xmlText: string): Model[] {
        // todo emit loading message?

        const graphs = JSON.parse(xmljs.xml2json(xmlText, this.xmlOptions)).graphs[0].graph;
        const models: Model[] = [];

        graphs.forEach(graph => {
            this.startNode = undefined;
            this.stopNodes = {};
            this.nodesMap = {};
            this.edgesMap = {};
            models.push(this._loadModel(graph));
        })
        return models;
    }

    /**
     * Load a model.
     * @param graph Contains a node array, an edge array and attributes.
     */
    _loadModel(graph: { [key: string]: any }): Model {
        // Get the nodes and edges..
        const graphEdges = graph.edge;
        const graphNodes = graph.node;

        // todo catch errors?
        graphNodes.forEach(node => this._loadNode(node['_attributes']));
        graphEdges.forEach(edge => this._loadEdge(edge['_attributes']));

        if (!this.startNode) {
            // todo throw new error
            console.error("Start node not marked.");
            return null;
        }
        if (Object.keys(this.stopNodes).length == 0) {
            // todo throw new error
            console.error("Stop nodes not marked.");
            return null;
        }

        const modelType = graph._attributes.usage == "program" ? ModelType.programModel : ModelType.userModel;
        return new Model(graph._attributes.id, modelType, this.startNode, this.stopNodes, this.nodesMap, this.edgesMap);
    }

    /**
     * Load a node into the node map.
     * @param nodeAttr attributes of the node: id, startNode: boolean (optional), stopNode: boolean (optional)
     */
    _loadNode(nodeAttr: { [key: string]: string }): void {
        if ((this.nodesMap)[nodeAttr.id]) {
            // todo throw new error
            console.error("ID '" + nodeAttr.id + "' already defined!");
            return
        }

        (this.nodesMap)[nodeAttr.id] = new ModelNode(nodeAttr.id);

        if (nodeAttr.startNode && nodeAttr.startNode == "true") {
            // already defined start node
            if (this.startNode) {
                // todo throw new error
                console.error("More than one start node!")
                return
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
            // todo throw new error
            console.error("ID '" + edgeAttr.id + "' already defined!");
            return
        } else if (!(this.nodesMap)[startID] || !(this.nodesMap)[endID]) {
            // todo throw new error
            console.error("Unknown node '" + startID + "' or '" + endID + "' in edge '" + edgeID + "'!");
            return
        }

        const newEdge = new ModelEdge(edgeID, (this.nodesMap)[startID], (this.nodesMap)[endID]);

        if (!edgeAttr.condition || !edgeAttr.effect) {
            // todo throw new error
            console.error("Condition or effect not given for edge '" + edgeID + "'.");
            return
        }

        // Set the condition for the edge
        newEdge.setCondition(function (event) {
            // todo eval the condition
            return event == edgeAttr.condition;
        });

        // Set the effect of the edge
        newEdge.setEffect(function () {
            // todo eval the effect
            console.log(edgeAttr.effect);
        });

        (this.nodesMap)[startID].addOutgoingEdge(newEdge);
        this.edgesMap[edgeID] = newEdge;
    }
}
