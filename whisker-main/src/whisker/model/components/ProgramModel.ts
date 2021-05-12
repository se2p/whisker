import {ModelNode} from "./ModelNode";
import {ModelEdge} from "./ModelEdge";
import TestDriver from "../../../test/test-driver";
import {CheckListener} from "../util/CheckListener";
import {ModelResult} from "../../../test-runner/test-result";

const EFFECT_LEEWAY = 1;

/**
 * Graph structure for a program model representing the program behaviour of a Scratch program.
 *
 *
 * (later also an user model representing the user behaviour when using the Scratch program ??)
 *
 * ############# Assumptions ##################
 * - Only one start node, unique
 * - Not every program model needs to have a stop node. (but one of the program nodes has one)
 * - Each edge has a condition (input event, condition for a variable,....) -> or at least an always true condition
 * - Effects can also occur at a later VM step, therefore its tested 3 successive steps long for occurrence.
 */
export class ProgramModel {

    readonly id: string;
    protected readonly startNode: ModelNode;
    protected currentState: ModelNode;

    protected readonly stopNodes: { [key: string]: ModelNode }; // delete?
    protected readonly nodes: { [key: string]: ModelNode };
    protected readonly edges: { [key: string]: ModelEdge };

    private edgesToCheck: ModelEdge[]; // edge with the failed effects

    private waitingFunction: () => boolean = undefined;
    protected coverageCurrentRun: { [key: string]: boolean } = {};
    protected coverageTotal: { [key: string]: boolean } = {};

    /**
     * Construct a program model (graph) with a string identifier. Sets up the start node and stop nodes for
     * simulating transitions on the graph.
     *
     * @param id ID of the model.
     * @param startNode Start node for traversing the graph.
     * @param stopNodes Nodes stopping the graph walk through.
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
     * Simulate transitions on the graph. Edges are tested only once if they are reached.
     */
    makeTransitions(testDriver: TestDriver, modelResult: ModelResult): ModelEdge[] {
        // wait effect
        if (this.waitingFunction) {
            if (!this.waitingFunction()) {
                // still waiting
                return [];
            } else {
                this.waitingFunction = undefined;
            }
        }

        let transitions = [];

        while (true) {
            // ask the current node for a valid transition
            let edge = this.currentState.testEdgeConditions(testDriver, modelResult);

            if (!edge) {
                break;
            }
            this.coverageCurrentRun[edge.id] = true;
            this.coverageTotal[edge.id] = true;

            transitions.push(edge);
            this.edgesToCheck.push(edge);
            if (this.currentState != edge.getEndNode()) {
                this.currentState = edge.getEndNode();
            } else {
                break;
            }
        }
        return transitions;
    }

    /**
     * Get the coverage of this model of the last run.
     */
    getCoverageCurrentRun() {
        let covered = 0;
        for (const key in this.coverageCurrentRun) {
            if (this.coverageCurrentRun[key]) {
                covered++;
            }
        }
        return {
            covered: covered,
            total: Object.keys(this.coverageCurrentRun).length
        }
    }

    /**
     * Get the coverage of all test runs with this model. Resets the total coverage.
     */
    getTotalCoverage() {
        let covered = 0;
        for (const key in this.coverageTotal) {
            if (this.coverageTotal[key]) {
                covered++;
            }
            this.coverageTotal[key] = false;
        }
        return {
            covered: covered,
            total: Object.keys(this.coverageTotal).length
        }
    }

    waitEffectStart(waitCheck) {
        this.waitingFunction = waitCheck
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
        this.edgesToCheck = [];
        Object.values(this.nodes).forEach(node => {
            node.reset()
        });
        for (const edgesCoveredKey in this.coverageCurrentRun) {
            this.coverageCurrentRun[edgesCoveredKey] = false;
        }
    }

    /**
     * Register the check listener and test driver.
     */
    registerComponents(checkListener: CheckListener, testDriver: TestDriver, result: ModelResult) {
        Object.values(this.nodes).forEach(node => {
            node.registerComponents(checkListener, testDriver, result);
        })
    }

    /**
     * Check the effects that are still missing.
     * Edges are taken when conditions are met, that means e.g. a key was active. The effect of the edge is tested
     * in the same step the condition was tested. If it fails, it is again tested the next three steps. If it is
     * only late it then accepts. While it tests these three steps other edges can be taken. Their effects are also
     * tested. After the three steps the effect is reported as missing.
     *
     * If the effect is missing and tested for in the next three steps and another edge with the same effect is
     * taken, the effect has to be fulfilled in two different steps. Therefore, dont test the same effect in the same
     * step twice (in effect solved). The old edge missing the effect is preferred in the check if the effect is
     * fulfilled.
     */
    checkEffects(testDriver: TestDriver, modelResult: ModelResult) {
        if (this.edgesToCheck.length == 0) {
            return;
        }

        let newEffectsToCheck = [];
        for (let i = 0; i < this.edgesToCheck.length; i++) {
            let edge = this.edgesToCheck[i];
            let result = edge.checkEffects(testDriver, modelResult, this);


            // failed some effect
            if (result && result.length > 0) {


                // if it failed more than allowed by the leeway
                if (edge.numberOfEffectFailures > EFFECT_LEEWAY) {
                    // make a wonderful output
                    let output = "Effects:";
                    for (let i = 0; i < edge.failedEffects.length; i++) {
                        output = output + " [" + i + "]" + edge.failedEffects[i].toString();
                    }

                    output = "Effect failed. Edge: '" + edge.id + "'. " + output;
                    console.error(output, testDriver.getTotalStepsExecuted());
                    modelResult.error.push(new Error(output));
                } else {
                    newEffectsToCheck.push(this.edgesToCheck[i]);
                }
            }
        }
        this.edgesToCheck = newEffectsToCheck;
    }
}
