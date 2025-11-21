import {Solution} from "./Solution";
import {ExecutionTrace} from "../testcase/ExecutionTrace";

export interface TestCase extends Solution {
    /**
     * Returns the execution trace of the solution. Used for calculating coverage-based fitness functions.
     * @returns the execution trace of the solution.
     */
    getTrace(): ExecutionTrace

    /**
     * Returns the set of covered block ids during the execution of the solution.
     * @returns the set of covered block ids during the execution of the solution.
     */
    getCoveredBlocks(): Set<string>;

    /**
     * Returns the set of covered block ids during the execution of the solution.
     * @returns the set of covered block ids during the execution of the solution.
     */
    getCoveredBranches(): Set<string>;
}
