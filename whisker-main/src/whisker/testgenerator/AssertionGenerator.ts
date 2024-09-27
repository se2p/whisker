import {WhiskerTest} from "./WhiskerTest";
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
import {VariableAssertion} from "./assertions/VariableAssertion";
import {VisibilityAssertion} from "./assertions/VisibilityAssertion";
import {VolumeAssertion} from "./assertions/VolumeAssertion";
import {CloneCountAssertion} from "./assertions/CloneCountAssertion";
import {TouchingAssertion} from "./assertions/TouchingAssertion";
import {TouchingEdgeAssertion} from "./assertions/TouchingEdgeAssertion";
import logger from "../../util/logger";

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
        //TouchingAssertion.createFactory(), // See comment in AssertionObserver
        //TouchingEdgeAssertion.createFactory(), // See comment in AssertionObserver
        VariableAssertion.createFactory(),
        VisibilityAssertion.createFactory(),
        VolumeAssertion.createFactory()];

    public async addAssertions(tests: WhiskerTest[]): Promise<void> {

        logger.debug("Adding assertions");

        // determine relevant attributes?
        for (const test of tests) {
            // produce execution trace
            const trace = await this._executeWithObserver(test);

            // TODO: Not a fix for the underlying issue, which is probably related to flaky touching blocks.
            if (trace == null) {
                logger.error("Mismatching behaviour for this test. Skipping assertion generation");
                continue;
            }


            // trace should have the same length as events in test
            const numEvents = test.getEventsCount();
            logger.debug("Adding assertions to test " + test + " of length " + numEvents);

            logger.debug("Trace length: " + trace.length);
            // for each event
            for (let position = 0; position < trace.length; position++) {
                for (const assertionFactory of this.assertionFactories) {
                    const assertions = assertionFactory.createAssertions(trace[position]);
                    for (const assertion of assertions) {
                        test.addAssertion(position, assertion);
                    }
                }
            }
            logger.debug("Resulting test: " + test);
        }
    }

    public async addStateChangeAssertions(tests: WhiskerTest[]): Promise<void> {
        logger.debug("Adding State change Assertions");

        // determine relevant attributes?
        for (const test of tests) {
            // produce execution trace
            const trace = await this._executeWithObserver(test);

            // TODO: Not a fix for the underlying issue, which is probably related to flaky touching blocks.
            if (trace == null) {
                logger.error("Mismatching behaviour for this test. Skipping assertion generation");
                continue;
            }

            // trace should have the same length as events in test
            const numEvents = test.getEventsCount();
            logger.debug("Adding assertions to test " + test + " of length " + numEvents);

            logger.debug("Trace length: " + trace.length);
            // for each event
            for (let position = 0; position < trace.length - 1; position++) {
                const stateBefore = trace[position];
                const stateAfter = trace[position + 1];
                for (const assertionFactory of this.assertionFactories) {
                    const assertionsAfter = assertionFactory.createAssertions(stateAfter);
                    for (const assertion of assertionsAfter) {
                        if (!assertion.evaluate(stateBefore)) {
                            test.addAssertion(position + 1, assertion);
                        }
                    }
                }
            }
            logger.debug("Resulting test: " + test);
        }
    }


    private async _executeWithObserver(test: WhiskerTest) {
        const executor = new TestExecutor(Container.vmWrapper, undefined, undefined);
        const observer = new AssertionObserver();
        executor.attach(observer);
        const coverageGroundTruth = test.chromosome.coverage;
        await executor.executeEventTrace(test.chromosome);
        const coverageAssertionExec = test.chromosome.coverage;
        if (coverageGroundTruth.size !== coverageAssertionExec.size ||
            !([...coverageGroundTruth].every((c) => coverageAssertionExec.has(c)))) {
            return null;
        }
        return observer.getExecutionTrace();
    }

}
