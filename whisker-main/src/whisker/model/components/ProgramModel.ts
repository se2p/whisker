import {ModelNode} from "./ModelNode";
import {ModelEdge} from "./ModelEdge";
import TestDriver from "../../../test/test-driver";
import EventEmitter from "events";
import {LogMessage, ModelTester} from "../ModelTester";

/**
 * Graph structure for a program model representing the program behaviour of a Scratch program.
 *
 *
 * (later also an user model representing the user behaviour when using the Scratch program ??)
 *
 * ############# Assumptions ##################
 * - Only one start node, unique
 * - Each edge has a condition (input event, condition for a variable,....)
 */
export class ProgramModel extends EventEmitter {

    readonly id: string;
    testDriver: TestDriver;

    private readonly startNode: ModelNode;
    currentState: ModelNode;

    private readonly stopNodes: { [key: string]: ModelNode };
    private readonly nodes: { [key: string]: ModelNode };
    private readonly edges: { [key: string]: ModelEdge };

    /**
     * Construct a model (graph) with a string identifier and model type (program or user model). Sets up the start
     * node and stopping nodes for simulating transitions on the graph.
     *
     * @param id ID of the model.
     * @param startNode Start node for traversing the graph.
     * @param stopNodes Nodes stopping the graph walkthrough.
     * @param nodes Dictionary mapping the node ids to the actual nodes in the graph.
     * @param edges Dictionary mapping the edge ids to the actual edges in the graph.
     */
    constructor(id: string, startNode: ModelNode, stopNodes: { [key: string]: ModelNode },
                nodes: { [key: string]: ModelNode }, edges: { [key: string]: ModelEdge }) {
        super();
        this.id = id;
        this.currentState = startNode;
        this.startNode = startNode;
        this.stopNodes = stopNodes;
        this.nodes = nodes;
        this.edges = edges;
    }

    /**
     * Simulate one transition on the graph.
     */
    makeOneTransition() {
        if (this.stopped()) {
            this.emit(LogMessage.MODEL_LOG, "already stopped");
            return;
        }

        if (!this.testDriver) {
            throw new Error("Model: no test driver registered");
        }

        // ask the current node for a valid transition
        const edge = this.currentState.testEdgeConditions(this.testDriver);
        if (edge != null) {

            // For outputs, ignore bowl for now
            if (!edge.id.startsWith("bowl")) {
                // change edge conditions format for output
                let conditions = [];
                edge.conditions.forEach(cond => {
                    conditions.push({name:cond.getConditionName(), args: cond.getArgs(), negated: cond.isANegation});
                })
                let edgeOutput = {edge: edge, edgeID: edge.id, conditions: conditions};


                this.emit(LogMessage.MODEL_EDGE_TRACE, edgeOutput);
                let ms = Date.now();
                console.log("EDGE " + edge.id + " taken", ms, edgeOutput);
            }
            edge.runEffect();

            if (this.currentState != edge.getEndNode()) {
                this.currentState = edge.getEndNode();
            }
        }
    }

    /**
     * The models stops when a stop node is reached.
     */
    stopped() {
        return this.currentState.isStopNode;
    }

    /**
     * Reset the graph to the start state.
     */
    reset(): void {
        this.currentState = this.startNode;
    }

    /**
     * Check existences of sprites, existences of variables and ranges of arguments.
     * @param testDriver Instance of the test driver.
     */
    testLabelsForErrors(testDriver: TestDriver) {
        Object.values(this.nodes).forEach(node => {
            node.testLabelsForErrors(testDriver);
        })
    }
}
