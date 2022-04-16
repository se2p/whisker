import { WhiskerTest } from "./WhiskerTest";
import {BooleanAssertion} from "./assertions/BooleanAssertion";
import {Container} from "../utils/Container";

export class AssertionGenerator {


    public async addAssertions(tests: WhiskerTest[]): Promise<void> {

        Container.debugLog("Adding assertions");

        // determine relevant attributes?
        for (const test of tests) {
            // produce execution trace
            // trace should be same length as events in test
            const numEvents = test.getEventsCount();
            Container.debugLog("Adding assertions to test "+test+" of length "+numEvents);

            // for each event
            for (let position = 0; position < numEvents; position++) {
                //   for each attribute
                //     if attribute changed value:
                //       add assertion to current event
                test.addAssertion(position, new BooleanAssertion(true));
            }
            Container.debugLog("Resulting test: "+test);
        }
    }

}
