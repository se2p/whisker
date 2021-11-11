import {EventBiasedMutation} from "../../../src/whisker/testcase/EventBiasedMutation";
import {ScratchEvent} from "../../../src/whisker/testcase/events/ScratchEvent";
import {EventAndParameters} from "../../../src/whisker/testcase/ExecutionTrace";

abstract class ScratchEventMock extends ScratchEvent {
    apply(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    getSearchParameterNames(): string[] {
        throw new Error("Method not implemented.");
    }

    setParameter(): void {
        throw new Error("Method not implemented.");
    }

    getParameters(): unknown[] {
        throw new Error("Method not implemented.");
    }

    toJavaScript(): string {
        throw new Error("Method not implemented.");
    }

    toString(): string {
        throw new Error("Method not implemented.");
    }

    stringIdentifier(): string {
        throw new Error("Method not implemented.");
    }
}

class A extends ScratchEventMock {
    numSearchParameter(): number {
        return 2;
    }
}

class B extends ScratchEventMock {
    numSearchParameter(): number {
        return 0;
    }
}

class C extends ScratchEventMock {
    numSearchParameter(): number {
        return 2;
    }
}

class D extends ScratchEventMock {
    numSearchParameter(): number {
        return 1;
    }
}

describe("EventBiasedMutation Test", () => {
    test("Compute shared probabilities", () => {

        type EP = [ScratchEvent, number[]];
        const a: EP = [new A(), [1, 2]];
        const b: EP = [new B(), [10, 410]];
        const c: EP = [new C(), [0, 1]];
        const d: EP = [new D(), [42, 210]];

        const events = [
            a, a, a,
            b, b,
            a,
            c, c, c, c,
            a, a,
            d, d, d,
        ].map(([ev, params]) => new EventAndParameters(ev, params));

        const virtualSpace = 3;
        const eventBiasedMutation = new EventBiasedMutation(0, 480, 42, virtualSpace, 5);
        const actual = eventBiasedMutation.computeSharedProbabilities(42, events);

        const pA = (1 / 4) / (6 * virtualSpace);
        // noinspection PointlessArithmeticExpressionJS
        const pB = (1 / 4) / (2 * virtualSpace);
        const pC = (1 / 4) / (4 * virtualSpace);
        const pD = (1 / 4) / (3 * virtualSpace);
        const expected = [
            pA, pA, pA, pA, pA, pA, pA, pA, pA,
            pB, pB, pB, pB, pB, pB,
            pA, pA, pA,
            pC, pC, pC, pC, pC, pC, pC, pC, pC, pC, pC, pC,
            pA, pA, pA, pA, pA, pA,
            pD, pD, pD, pD, pD, pD, pD, pD, pD
        ];

        expect(actual).toStrictEqual(expected);
    });
});
