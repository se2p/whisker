import { WhiskerTest } from "./WhiskerTest";
import {BooleanAssertion} from "./assertions/BooleanAssertion";
import {Container} from "../utils/Container";
import {TestExecutor} from "../testcase/TestExecutor";
import {AssertionObserver} from "./assertions/AssertionObserver";

export class AssertionGenerator {


    public async addAssertions(tests: WhiskerTest[]): Promise<void> {

        Container.debugLog("Adding assertions");

        // determine relevant attributes?
        for (const test of tests) {
            // produce execution trace
            const trace = this._executeWithObserver(test);

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

    private async _executeWithObserver(test: WhiskerTest)  {
        const executor = new TestExecutor(Container.vmWrapper, Container.config.getEventExtractor(),
            Container.config.getEventSelector());
        const observer = new AssertionObserver();
        executor.attach(observer);
        await executor.execute(test.chromosome);
        return observer.getExecutionTrace();
    }

}
