import {ClusteringEventSelector, InterleavingEventSelector} from "../../../src/whisker/testcase/EventSelector";
import {ScratchEvent} from "../../../src/whisker/testcase/events/ScratchEvent";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";
import Arrays from "../../../src/whisker/utils/Arrays";
import {WaitEvent} from "../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../src/whisker/testcase/events/MouseMoveEvent";
import {KeyPressEvent} from "../../../src/whisker/testcase/events/KeyPressEvent";

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

    setParameter(): number[] {
        return [];
    }

    toJavaScript(): string {
        return "";
    }

    public toJSON(): Record<string, number | string> {
        return undefined;
    }

    toString(): string {
        return this._name;
    }
}

describe("ClusteringEventSelector Test", () => {

    const selector = new ClusteringEventSelector({min: 0, max: 14});

    test("Test select one available event", () => {
        const codons = Arrays.range(0,15);
        const event0 = new DummyEvent('event0');
        const events = [event0];
        const expected = Array(15).fill(event0);
        const actual = [];

        for (const i of Arrays.range(0,15)) {
            actual.push(selector.selectEvent(codons, i, events));
        }

        expect(actual).toStrictEqual(expected);
    });

    test("Test select multiple available events", () => {
        // The number of codons is a multiple of the number of clusters (events).
        const codons = Arrays.range(0,15);
        const events = Arrays.range(0,3).map((x) => new DummyEvent(`event${x}`));
        const [event0, event1, event2] = events;
        const expected = [
            event0, event0, event0, event0, event0,
            event1, event1, event1, event1, event1,
            event2, event2, event2, event2, event2
        ];
        const actual = [];

        for (const i of Arrays.range(0,15)) {
            actual.push(selector.selectEvent(codons, i, events));
        }

        expect(actual).toStrictEqual(expected);
    });

    test("Test select multiple available events (with inhomogeneous cluster size)", () => {
        // The number of codons is a NOT multiple of the number of clusters (events). The last cluster is smaller
        // than all other clusters.
        const codons = Arrays.range(0,15);
        const events = Arrays.range(0,4).map((x) => new DummyEvent(`event${x}`));
        const [event0, event1, event2, event3] = events;
        const expected = [
            event0, event0, event0, event0, // first cluster
            event1, event1, event1, event1, // second cluster
            event2, event2, event2, event2, // third cluster
            event3, event3, event3          // fourth cluster (smaller!)
        ];
        const actual = [];

        for (const i of Arrays.range(0,15)) {
            actual.push(selector.selectEvent(codons, i, events));
        }

        expect(actual).toStrictEqual(expected);
    });

    test("Test select all available events", () => {
        const codons = Arrays.range(0,15);
        const expected = Arrays.range(0,15).map((x) => new DummyEvent(`event${x}`));
        const events = expected;
        const actual = [];

        for (const i of Arrays.range(0,15)) {
            actual.push(selector.selectEvent(codons, i, events));
        }

        expect(actual).toStrictEqual(expected);
    });

    test("Find index for given event type with even number of available Events", () => {
        const codons = Arrays.range(0,101);
        const availableEvents = [new WaitEvent(), new MouseMoveEvent()];
        const desiredEvent = availableEvents[0];
        const index = selector.getIndexForEvent(desiredEvent, availableEvents);
        expect(selector.selectEvent(codons, index, availableEvents)).toStrictEqual(desiredEvent);
    });

    test("Find index for given event type with odd number of available Events", () => {
        const codons = Arrays.range(0,15);
        const availableEvents = [new WaitEvent(), new MouseMoveEvent(), new KeyPressEvent("space")];
        const desiredEvent = availableEvents[2];
        const index = selector.getIndexForEvent(desiredEvent, availableEvents);
        expect(selector.selectEvent(codons, index, availableEvents)).toStrictEqual(desiredEvent);
    });
});

describe("InterleavingEventSelector Test", () => {

    const selector = new InterleavingEventSelector();

    test("Test select event", () => {
        const codons = Arrays.range(0,15);
        const events = Arrays.range(0,3).map((x) => new DummyEvent(`event${x}`));
        const [event0, event1, event2] = events;
        const expected = [
            event0, event1, event2,
            event0, event1, event2,
            event0, event1, event2,
            event0, event1, event2,
            event0, event1, event2,
        ];
        const actual = [];

        for (const i of Arrays.range(0,15)) {
            actual.push(selector.selectEvent(codons, i, events));
        }

        expect(actual).toStrictEqual(expected);
    });

    test("Find index for given event type", () => {
        const codons = Arrays.range(0,15);
        const availableEvents = [new WaitEvent(), new MouseMoveEvent(), new KeyPressEvent("space")];
        const desiredEvent = availableEvents[1];
        const index = selector.getIndexForEvent(desiredEvent, availableEvents);
        expect(selector.selectEvent(codons, index, availableEvents)).toStrictEqual(desiredEvent);
    });
});
