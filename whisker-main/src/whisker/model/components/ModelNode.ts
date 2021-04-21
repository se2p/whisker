import TestDriver from "../../../test/test-driver";
import {ModelEdge} from "./ModelEdge";
import {ConditionState} from "../util/ConditionState";

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
    testEdgeConditions(testDriver: TestDriver): ModelEdge {
        if (this.outgoing.length == 0) {
            return null;
        }

        for (let i = 0; i < this.outgoing.length; i++) {
            const result = this.outgoing[i].testConditions(testDriver);

            if (result) {
                return this.outgoing[i];
            }
        }

        return null;
    }

    /**
     * Check existences of sprites, existences of variables and ranges of arguments and register the conditions in
     * the condition state.
     * @param testDriver Instance of the test driver.
     * @param conditionState State saver of the conditions.
     */
    registerAndTestConditions(testDriver: TestDriver, conditionState: ConditionState) {
        this.outgoing.forEach(edge => {
            edge.registerAndTestConditions(testDriver, conditionState);
        })
    }
}
