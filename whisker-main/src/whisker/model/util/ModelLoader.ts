import * as xmljs from 'xml-js';
/**
 * todo REMOVE??????
 *
 * ########## Assumptions ##########
 * - An input event as condition for a transition over an edge is saved as a function comparing the input to the event
 * - Each graphml file includes only one connected graph, multiple program/user models needs to be given by multiple
 * files
 * - A node with no incoming edges is a start node (there should be only one)
 * - A node with no outgoing edges is a stop node (could be multiple)
 */
import {Model} from "../Model";

// todo remove class wrapper?
export class ModelLoader {


    private xmlOptions = {
        compact: true,
        spaces: 1,
        alwaysArray: true,
        // alwaysChildren: true // for empty children if there are none
    };


    loadModel(graphmlAsText: string): Model[] {
        // Get the graph out of the  graphml text as a json string and then as a json object...
        const graphJSON = xmljs.xml2json(graphmlAsText, this.xmlOptions);
        const graph = JSON.parse(graphJSON).graphml[0].graph[0];
        // console.log(graph);

        // Get the nodes and edges..
        const graphEdges = graph.edge;

        const nodesMap: { [key: string]: ModelNode } = {};
        const startNode: { [key: string]: ModelNode } = {};

        graphEdges.forEach(edge => {
            // console.log(edge);
            const edgeID = edge._attributes.id;
            const startID = edge._attributes.source;
            const endID = edge._attributes.target;

            // startid not yet as node in the map
            if (!nodesMap[startID]) {
                nodesMap[startID] = new ModelNode(startID);
                nodesMap[startID].isStopNode = false;
                nodesMap[startID].isStartNode = true; // could be a start node

                // save it as a start node
                startNode[startID] = nodesMap[startID];
            }

            // end id not yet as node in the map
            if (!nodesMap[endID]) {
                nodesMap[endID] = new ModelNode(endID);
                nodesMap[endID].isStartNode = false;
                nodesMap[endID].isStopNode = true; // could be a stop node
            }

            // remove the end node as a possible start node if it is in the start node map
            if (startNode[endID]) {
                startNode[endID] = undefined;
            }


            console.log(nodesMap);
            const newEdge = new ModelEdge(edgeID, nodesMap[startID], nodesMap[endID]);


            // edge.data.forEach(console.log);
            // todo set the condition and effect for the edge

            edge.data.forEach(dataAttr => {
                console.log("Attr", dataAttr) // todo ???
            })


            nodesMap[startID].addOutgoingEdge(newEdge);
        })


        if (Object.keys(startNode).length > 1) {
            console.error("Multiple start nodes.");
            // todo throw error
        }


        return null;
    }

}

import {readFileSync} from 'fs';
import {ModelNode} from "../components/ModelNode";
import {ModelEdge} from "../components/ModelEdge";

const text = readFileSync('util/programModelHmm.graphml', 'utf8');
const loader = new ModelLoader();
const model = loader.loadModel(text);

// todo test model
