import {ProgramModel} from "./ProgramModel";
import {ModelNode} from "./ModelNode";
import {ModelEdge} from "./ModelEdge";
import {ModelResult} from "../../../test-runner/test-result";
import TestDriver from "../../../test/test-driver";

export class ConstraintsModel extends ProgramModel {

    /**
     * Construct an constraints program model that defines all initialisation constraints e.g. on sprites attributes
     * or values on the first edge and all constraints for the variables or attributes after the first step.
     *
     * @param id ID of the model.
     * @param startNode Start node for traversing the graph.
     * @param stopNodes Nodes stopping the graph walk through.
     * @param nodes Dictionary mapping the node ids to the actual nodes in the graph.
     * @param edges Dictionary mapping the edge ids to the actual edges in the graph.
     */
    constructor(id: string, startNode: ModelNode, stopNodes: { [key: string]: ModelNode },
                nodes: { [key: string]: ModelNode }, edges: { [key: string]: ModelEdge }) {
        super(id, startNode, stopNodes, nodes, edges);
    }

    /**
     * Check constraints. Assumption here: it only needs to test one edge per step.
     */
    makeTransitions(testDriver: TestDriver, modelResult: ModelResult): ModelEdge[] {
        let edge = this.currentState.testEdgeConditions(testDriver, modelResult);

        if (edge) {
            this.coverageCurrentRun[edge.id] = true;
            this.coverageTotal[edge.id] = true;

            // check effects
            let failedEffects = edge.checkEffects(testDriver, modelResult, null);
            if (failedEffects.length > 0) {
                let output = "";
                for (let i = 0; i < failedEffects.length; i++) {
                    output = output + "[" + i + "]" + failedEffects[i].toString();
                }

                output = "Constraints failed. " + output;
                console.error(output, testDriver.getTotalStepsExecuted());
                modelResult.error.push(new Error(output));
            }

            this.currentState = edge.getEndNode();
        }
        return [];
    }
}
