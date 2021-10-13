import { EventBiasedMutation } from "../../../src/whisker/testcase/EventBiasedMutation";
import { MouseMoveToEvent } from "../../../src/whisker/testcase/events/MouseMoveToEvent";
import { ScratchEvent } from "../../../src/whisker/testcase/events/ScratchEvent";
import { SoundEvent } from "../../../src/whisker/testcase/events/SoundEvent";
import { TypeTextEvent } from "../../../src/whisker/testcase/events/TypeTextEvent";
import { WaitEvent } from "../../../src/whisker/testcase/events/WaitEvent";
import { EventAndParameters } from "../../../src/whisker/testcase/ExecutionTrace";
import { List } from "../../../src/whisker/utils/List";

describe("EventBiasedMutation Test", () => {
    test("Compute shared probabilities", () => {
        type EP = [ScratchEvent, number[]];
        const a: EP = [new WaitEvent(), [1, 2]];
        const b: EP = [new TypeTextEvent("nix"), []];
        const c: EP = [new MouseMoveToEvent(0, 1), [0, 1]];
        const d: EP = [new SoundEvent(), [42]];

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
