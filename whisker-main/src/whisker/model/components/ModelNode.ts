import TestDriver from "../../../test/test-driver";
import {ModelEdge} from "./ModelEdge";
import {ConditionState} from "../util/ConditionState";
import {ModelResult} from "../../../test-runner/test-result";

/**
 * Node structure for a model.
 */
export class ModelNode {

    private readonly id: string;
    outgoing: ModelEdge[] = [];

    isStartNode = false;
    isStopNode = false;

    /**
     * Node of a graph with an unique id identifier.
     * @param id
     */
    constructor(id: string) {
        this.id = id;
    }

    /**
     * Add an outgoing edge from this model node.
     * @param edge Edge to add.
     */
    addOutgoingEdge(edge: ModelEdge): void {
        this.outgoing.push(edge);
    }

    /**
     * Returns an model edge if one has its conditions for traversing the edge fulfilled or else null.
     */
    testEdgeConditions(testDriver: TestDriver, modelResult: ModelResult): ModelEdge {
        if (this.outgoing.length == 0) {
            return null;
        }

        for (let i = 0; i < this.outgoing.length; i++) {
            if (this.outgoing[i].checkConditions(testDriver, modelResult)) {
                return this.outgoing[i];
            }
        }

        return null;
    }

    /**
     * Check existences of sprites, existences of variables and ranges of arguments.
     * @param testDriver Instance of the test driver.
     */
    testEdgesForErrors(testDriver: TestDriver) {
        this.outgoing.forEach(edge => {
            edge.testEdgeForErrors(testDriver);
        })
    }

    /**
     * Register the condition state.
     */
    registerConditionState(conditionState: ConditionState) {
        this.outgoing.forEach(edge => {
            edge.registerConditionState(conditionState);
        })
    }

    reset() {
        this.outgoing.forEach(edge => {
            edge.reset();
        })
    }
}
