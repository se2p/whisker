import {ModelNode} from "./ModelNode";
import {ModelEdge} from "./ModelEdge";
import TestDriver from "../../../test/test-driver";
import {ConditionState} from "../util/ConditionState";
import {ModelResult} from "../../../test-runner/test-result";

const EFFECT_LEEWAY = 3;

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
export class ProgramModel {

    readonly id: string;
    private readonly startNode: ModelNode;
    currentState: ModelNode;

    private readonly stopNodes: { [key: string]: ModelNode };
    private readonly nodes: { [key: string]: ModelNode };
    private readonly edges: { [key: string]: ModelEdge };

    private effectsToCheck: ModelEdge[]; // edge with the failed effects

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
    makeOneTransition(testDriver: TestDriver, modelResult: ModelResult): ModelEdge {
        // console.log("model step " + this.id, testDriver.getTotalStepsExecuted())

        // ask the current node for a valid transition
        let edge = this.currentState.testEdgeConditions(testDriver);
        if (edge != null) {
            // add it to the edge effects to check
            this.effectsToCheck.push(edge);
            if (this.currentState != edge.getEndNode()) {
                this.currentState = edge.getEndNode();
            }
        }

        this.checkEffects(testDriver, modelResult);
        return edge;
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
        this.effectsToCheck = [];
        Object.values(this.nodes).forEach(node => {
            node.reset()
        });
    }

    /**
     * Check existences of sprites, existences of variables and ranges of arguments.
     * @param testDriver Instance of the test driver.
     */
    testModel(testDriver: TestDriver) {
        Object.values(this.nodes).forEach(node => {
            node.testEdgesForErrors(testDriver);
        })
    }

    /**
     * Register the condition state.
     */
    registerConditionState(conditionState: ConditionState) {
        Object.values(this.nodes).forEach(node => {
            node.registerConditionState(conditionState);
        })
    }

    /**
     * Check the effects that are still missing.
     */
    checkEffects(testDriver: TestDriver, modelResult: ModelResult) {
        if (this.effectsToCheck.length == 0) {
            return;
        }

        let newEffectsToCheck = [];
        for (let i = 0; i < this.effectsToCheck.length; i++) {
            let result = this.effectsToCheck[i].checkEffects(testDriver, modelResult);
            if (result) {
                newEffectsToCheck.push(this.effectsToCheck[i]);
            }
        }
        this.effectsToCheck = newEffectsToCheck;
        if (this.effectsToCheck.length == 0) {
            return;
        }

        // if it failed more than once
        if (this.effectsToCheck[0].numberOfEffectFailures > EFFECT_LEEWAY) {
            // make a wonderful output
            let failedEdge = this.effectsToCheck[0];
            let output = "Failed effects:";
            for (let i = 0; i < failedEdge.failedEffects.length; i++) {
                output = output + " [" + i + "]" + failedEdge.failedEffects[i].toString();
            }

            output = "Effect failed. Edge: '" + failedEdge.id + "'. " + output;
            console.error(output, testDriver.getTotalStepsExecuted());
            modelResult.error.push(new Error(output));

            // remove it to not check again
            this.effectsToCheck = this.effectsToCheck.splice(1, this.effectsToCheck.length);
        }
    }
}
