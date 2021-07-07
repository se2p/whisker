import TestDriver from "../../../test/test-driver";
import {ModelEdge} from "./ModelEdge";
import ModelResult from "../../../test-runner/model-result";
import {CheckUtility} from "../util/CheckUtility";
import {CheckName} from "./Check";

/**
 * Node structure for a model.
 */
export class ModelNode {
    readonly id: string;
    edges: ModelEdge[] = []; //outgoing edges

    isStartNode = false;
    isStopNode = false;
    isStopAllNode = false;

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
        this.edges.push(edge);
    }

    /**
     * Returns an model edge if one has its conditions for traversing the edge fulfilled or else null.
     * @param stepsSinceLastTransition Number of steps since the last transition in the model this effect belongs to
     * @param stepsSinceEnd Number of steps since the after run model tests started.
     */
    testEdgeConditions(testDriver: TestDriver, checkUtility: CheckUtility, stepsSinceLastTransition: number,
                       stepsSinceEnd: number, modelResult: ModelResult): ModelEdge {

        // get all edges that have not failing conditions and check for order of events
        for (let i = 0; i < this.edges.length; i++) {
            const result = this.edges[i].checkConditions(testDriver, stepsSinceLastTransition, stepsSinceEnd, modelResult);

            if (result && result.length == 0) {
                return this.edges[i];
            }
        }
        return null;
    }

    testForEvent(t: TestDriver, cu: CheckUtility, stepsSinceLastTransition: number, stepsSinceEnd: number,
                 modelResult: ModelResult, eventStrings: string[]) {
        for (let i = 0; i < this.edges.length; i++) {

            let check = false;

            // look up if this edge should be checked first based on its conditions
            // edge should only be checked if it contains any event of the eventStrings and no touchingSprite or
            // touchingColor event that is not in eventStrings
            for (let j = 0; j < this.edges[i].conditions.length; j++) {
                let cond = this.edges[i].conditions[j];

                if (cond.name == CheckName.SpriteTouching || cond.name == CheckName.SpriteColor) {

                    let eventString;
                    if (cond.name == CheckName.SpriteTouching) {
                        eventString = CheckUtility.getTouchingString(cond.args[0], cond.args[1], cond.negated);
                    } else  {
                        eventString = CheckUtility.getColorString(cond.args[0], cond.args[1], cond.args[2], cond.args[3],
                            cond.negated);
                    }

                    if (eventStrings.indexOf(eventString) == -1) {
                        check = false;
                        break;
                    } else {
                        check = true;
                    }
                }
            }

            if (check) {
                let failed = false;
                for (let j = 0; j < this.edges[i].conditions.length; j++) {
                    let cond = this.edges[i].conditions[j];

                    // check only not yet fulfilled conditions
                    if (cond.name != CheckName.SpriteTouching && cond.name != CheckName.SpriteColor) {
                        if (!cond.check(stepsSinceLastTransition, stepsSinceEnd)) {
                            failed = true;
                            break;
                        }
                    }
                }

                if (!failed) {
                    return this.edges[i];
                }
            }
        }

        return null;

    }

    /**
     * Register the check listener and test driver.
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver, result: ModelResult, caseSensitive: boolean) {
        this.edges.forEach(edge => {
            edge.registerComponents(checkListener, testDriver, result, caseSensitive);
        })
    }

    /**
     * Reset all edge's states that belong to one test run.
     */
    reset() {
        this.edges.forEach(edge => {
            edge.reset();
        })
    }

    simplifyForSave() {
        return {
            id: this.id,
            isStartNode: this.isStartNode,
            isStopNode: this.isStopNode,
            stopAllModels: this.isStopAllNode
        }
    }
}
