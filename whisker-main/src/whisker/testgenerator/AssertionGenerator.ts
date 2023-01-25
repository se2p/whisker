import { WhiskerTest } from "./WhiskerTest";
import {Container} from "../utils/Container";
import {TestExecutor} from "../testcase/TestExecutor";
import {AssertionObserver} from "./assertions/AssertionObserver";
import {BackdropAssertion} from "./assertions/BackdropAssertion";
import {CostumeAssertion} from "./assertions/CostumeAssertion";
import {DirectionAssertion} from "./assertions/DirectionAssertion";
import {GraphicsEffectAssertion} from "./assertions/GraphicsEffectAssertion";
import {LayerAssertion} from "./assertions/LayerAssertion";
import {ListAssertion} from "./assertions/ListAssertion";
import {PositionAssertion} from "./assertions/PositionAssertion";
import {SayAssertion} from "./assertions/SayAssertion";
import {SizeAssertion} from "./assertions/SizeAssertion";
import {TouchingAssertion} from "./assertions/TouchingAssertion";
import {VariableAssertion} from "./assertions/VariableAssertion";
import {VisibilityAssertion} from "./assertions/VisibilityAssertion";
import {VolumeAssertion} from "./assertions/VolumeAssertion";
import {CloneCountAssertion} from "./assertions/CloneCountAssertion";
import assert from "assert";
import {TouchingEdgeAssertion} from "./assertions/TouchingEdgeAssertion";

export class AssertionGenerator {

    private assertionFactories = [BackdropAssertion.createFactory(),
        CostumeAssertion.createFactory(),
        CloneCountAssertion.createFactory(),
        DirectionAssertion.createFactory(),
        GraphicsEffectAssertion.createFactory(),
        LayerAssertion.createFactory(),
        ListAssertion.createFactory(),
        PositionAssertion.createFactory(),
        SayAssertion.createFactory(),
        SizeAssertion.createFactory(),
        //TouchingAssertion.createFactory(), //FIXME: Buggy
        //TouchingEdgeAssertion.createFactory(), // FIXME: Buggy
        VariableAssertion.createFactory(),
        VisibilityAssertion.createFactory(),
        VolumeAssertion.createFactory()];

    public async addAssertions(tests: WhiskerTest[]): Promise<void> {

        Container.debugLog("Adding assertions");

        // determine relevant attributes?
        for (const test of tests) {
            // produce execution trace
            const trace = await this._executeWithObserver(test);

            // trace should be same length as events in test
            const numEvents = test.getEventsCount();
            Container.debugLog("Adding assertions to test "+test+" of length "+numEvents);

            Container.debugLog("Trace length: "+trace.length);
            // for each event
            for (let position = 0; position < numEvents; position+=2) {
                for (const assertionFactory of this.assertionFactories) {
                    const assertions = assertionFactory.createAssertions(trace[position/2]);
                    for (const assertion of assertions) {
                        test.addAssertion(position + 1, assertion);
                    }
                }
            }
            Container.debugLog("Resulting test: "+test);
        }
    }

    public async addStateChangeAssertions(tests: WhiskerTest[]): Promise<void> {

        await Container.vmWrapper.resetVM();
        Container.debugLog("Adding State change Assertions");

        // determine relevant attributes?
        for (const test of tests) {
            // produce execution trace
            const trace = await this._executeWithObserver(test);

            // trace should be same length as events in test
            const numEvents = test.getEventsCount();
            Container.debugLog("Adding assertions to test " + test + " of length " + numEvents);

            Container.debugLog("Trace length: " + trace.length);
            // for each event
            for (let position = 2; position < numEvents; position += 2) {
                const stateBefore = trace[(position / 2) - 1];
                const stateAfter = trace[position / 2];
                for (const assertionFactory of this.assertionFactories) {
                    const assertionsAfter = assertionFactory.createAssertions(stateAfter);
                    for (const assertion of assertionsAfter) {
                        if (!assertion.evaluate(stateBefore)) {
                            test.addAssertion(position + 1, assertion);
                        }
                    }
                }
            }
            Container.debugLog("Resulting test: " + test);
        }
    }


    private async _executeWithObserver(test: WhiskerTest)  {
        const executor = new TestExecutor(Container.vmWrapper, Container.config.getEventExtractor(),
            Container.config.getEventSelector());
        const observer = new AssertionObserver();
        executor.attach(observer);
        await executor.executeEventTrace(test.chromosome);
        return observer.getExecutionTrace();
    }

}
