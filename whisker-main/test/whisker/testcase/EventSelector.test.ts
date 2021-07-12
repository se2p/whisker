import {LocalityEventSelector, UniformEventSelector} from "../../../src/whisker/testcase/EventSelector";
import {List} from "../../../src/whisker/utils/List";
import {ScratchEvent} from "../../../src/whisker/testcase/events/ScratchEvent";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";

class DummyEvent extends ScratchEvent {
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

    getParameter(): (number | string | RenderedTarget)[] {
        return [];
    }

    setParameter(args: number[]): void {
    }

    toJavaScript(): string {
        return "";
    }

    toString(): string {
        return this._name;
    }
}

describe("LocalityEventSelector Test", () => {

    const selector = new LocalityEventSelector({min: 0, max: 14});
    const range = (until) => [...Array(until).keys()];

    test("Test select one available event", () => {
        const codons = new List<number>(range(15));
        const event0 = new DummyEvent('event0');
        const events = new List<ScratchEvent>([event0]);
        const expected = Array(15).fill(event0);
        const actual = []

        for (const i of range(15)) {
            actual.push(selector.selectEvent(codons, i, events));
        }

        expect(actual).toStrictEqual(expected);
    });

    test("Test select multiple available events", () => {
        const codons = new List<number>(range(15));
        const events = new List<ScratchEvent>(range(3).map((x) => new DummyEvent(`event${x}`)));
        const [event0, event1, event2] = events;
        const expected = [
            event0, event0, event0, event0, event0,
            event1, event1, event1, event1, event1,
            event2, event2, event2, event2, event2
        ];
        const actual = []

        for (const i of range(15)) {
            actual.push(selector.selectEvent(codons, i, events));
        }

        expect(actual).toStrictEqual(expected);
    });

    test("Test select all available events", () => {
        const codons = new List<number>(range(15));
        const expected = range(15).map((x) => new DummyEvent(`event${x}`));
        const events = new List<ScratchEvent>(expected);
        const actual = []

        for (const i of range(15)) {
            actual.push(selector.selectEvent(codons, i, events));
        }

        expect(actual).toStrictEqual(expected);
    });
});

describe("UniformEventSelector Test", () => {

    const selector = new UniformEventSelector();
    const range = (until) => [...Array(until).keys()];

    test("Test select event", () => {
        const codons = new List<number>(range(15));
        const events = new List<ScratchEvent>(range(3).map((x) => new DummyEvent(`event${x}`)));
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
