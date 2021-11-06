import {ClusteringEventSelector, InterleavingEventSelector} from "../../../src/whisker/testcase/EventSelector";
import {ScratchEvent} from "../../../src/whisker/testcase/events/ScratchEvent";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";

class DummyEvent extends ScratchEvent {

    numSearchParameter(): number {
       return 0;
    }
    getSearchParameterNames(): string[] {
        return [];
    }
    stringIdentifier(): string {
        return `DummyEvent`;
    }
    private readonly _name: string;

    constructor(name: string) {
        super();
        this._name = name;
    }

    apply(): Promise<void> {
        return Promise.resolve(undefined);
    }

    getNumParameters(): number {
        return 0;
    }

    getParameters(): (number | string | RenderedTarget)[] {
        return [];
    }

    setParameter(args: number[]): void {
        // nothing
    }

    toJavaScript(): string {
        return "";
    }

    toString(): string {
        return this._name;
    }
}

describe("ClusteringEventSelector Test", () => {

    const selector = new ClusteringEventSelector({min: 0, max: 14});
    const range = (until) => [...Array(until).keys()];

    test("Test select one available event", () => {
        const codons = range(15);
        const event0 = new DummyEvent('event0');
        const events = [event0];
        const expected = Array(15).fill(event0);
        const actual = []

        for (const i of range(15)) {
            actual.push(selector.selectEvent(codons, i, events));
        }

        expect(actual).toStrictEqual(expected);
    });

    test("Test select multiple available events", () => {
        // The number of codons is a multiple of the number of clusters (events).
        const codons = range(15);
        const events = range(3).map((x) => new DummyEvent(`event${x}`));
        const [event0, event1, event2] = events;
        const expected = [
            event0, event0, event0, event0, event0,
            event1, event1, event1, event1, event1,
            event2, event2, event2, event2, event2
        ];
        const actual = [];

        for (const i of range(15)) {
            actual.push(selector.selectEvent(codons, i, events));
        }

        expect(actual).toStrictEqual(expected);
    });

    test("Test select multiple available events (with inhomogeneous cluster size)", () => {
        // The number of codons is a NOT multiple of the number of clusters (events). The last cluster is smaller
        // than all other clusters.
        const codons = range(15);
        const events = range(4).map((x) => new DummyEvent(`event${x}`));
        const [event0, event1, event2, event3] = events;
        const expected = [
            event0, event0, event0, event0, // first cluster
            event1, event1, event1, event1, // second cluster
            event2, event2, event2, event2, // third cluster
            event3, event3, event3          // fourth cluster (smaller!)
        ];
        const actual = [];

        for (const i of range(15)) {
            actual.push(selector.selectEvent(codons, i, events));
        }

        expect(actual).toStrictEqual(expected);
    });

    test("Test select all available events", () => {
        const codons = range(15);
        const expected = range(15).map((x) => new DummyEvent(`event${x}`));
        const events = expected;
        const actual = []

        for (const i of range(15)) {
            actual.push(selector.selectEvent(codons, i, events));
        }

        expect(actual).toStrictEqual(expected);
    });
});

describe("InterleavingEventSelector Test", () => {

    const selector = new InterleavingEventSelector();
    const range = (until) => [...Array(until).keys()];

    test("Test select event", () => {
        const codons = range(15);
        const events = range(3).map((x) => new DummyEvent(`event${x}`));
        const [event0, event1, event2] = events;
        const expected = [
            event0, event1, event2,
            event0, event1, event2,
            event0, event1, event2,
            event0, event1, event2,
            event0, event1, event2,
        ];
        const actual = []

        for (const i of range(15)) {
            actual.push(selector.selectEvent(codons, i, events));
        }

        expect(actual).toStrictEqual(expected);
    });
});
