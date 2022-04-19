import {WhiskerAssertion} from "./WhiskerAssertion";

export interface AssertionFactory<T extends WhiskerAssertion> {
    createAssertions (state): T[];
}
