import { EventBiasedMutation } from "../../../src/whisker/testcase/EventBiasedMutation";
import { ScratchEvent } from "../../../src/whisker/testcase/events/ScratchEvent";
import { EventAndParameters } from "../../../src/whisker/testcase/ExecutionTrace";
import { List } from "../../../src/whisker/utils/List";

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

    toJSON(): Record<string, any> {
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
        const b: EP = [new B(), []];
        const c: EP = [new C(), [0, 1]];
        const d: EP = [new D(), [42]];

        const events = [
            a, a, a,
            b, b,
            a,
            c, c, c, c,
            a, a,
            d, d, d,
        ].map(([ev, params]) => new EventAndParameters(ev, params));

        const actual = EventBiasedMutation.computeSharedProbabilities(42, new List(events));

        const pA = (1 / 4) / (6 * 3);
        const pB = (1 / 4) / (2 * 1);
        const pC = (1 / 4) / (4 * 3);
        const pD = (1 / 4) / (3 * 2);
        const expected = [
            pA, pA, pA, pA, pA, pA, pA, pA, pA,
            pB, pB,
            pA, pA, pA,
            pC, pC, pC, pC, pC, pC, pC, pC, pC, pC, pC, pC,
            pA, pA, pA, pA, pA, pA,
            pD, pD, pD, pD, pD, pD,
            0, 0, 0, 0,
        ];

        expect(actual).toStrictEqual(expected);
    });
});
