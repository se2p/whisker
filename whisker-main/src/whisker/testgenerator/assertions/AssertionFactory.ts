import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionTargetState} from "./AssertionObserver";

export interface AssertionFactory<T extends WhiskerAssertion> {
    createAssertions (state: Map<string, AssertionTargetState>): T[];
}
