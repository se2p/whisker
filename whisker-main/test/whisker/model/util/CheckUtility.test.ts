import {AbstractCheck} from "../../../../src/whisker/model/checks/AbstractCheck";
import {CheckUtility} from "../../../../src/whisker/model/util/CheckUtility";
import {ArgType} from "../../../../src/whisker/model/util/schema";
import {SpriteTouching} from "../../../../src/whisker/model/checks/SpriteTouching";
import {AttrComp} from "../../../../src/whisker/model/checks/AttrComp";
import {CheckName} from "../../../../src/whisker/model/checks/newCheck";

describe('CheckUtility', () => {
    describe("split event strings", () => {
        const table: [string, CheckName, boolean, ArgType[]][] = [
            ["SpriteColor:Sprite1:255:0:0", "SpriteColor", false, ["Sprite1", "255", "0", "0"]],
            ["SpriteTouching:Sprite1:Sprite2", "SpriteTouching", false, ["Sprite1", "Sprite2"]],
            ["!SpriteTouching:Sprite1:Sprite2", "SpriteTouching", true, ["Sprite1", "Sprite2"]],
            ["AttrComp:Sprite1:costume:=:costume2", "AttrComp", false, ["Sprite1", "costume", "=", "costume2"]],
        ];

        it.each(table)('split event strings for %s', (s: string, c: CheckName, n: boolean, args: ArgType[]) => {
            const result = CheckUtility.splitEventString(s);
            expect(result.name).toBe(c);
            expect(result.negated).toBe(n);
            expect(result.args).toEqual(args);
        });
    });

    describe("get event string", () => {
        const params: [CheckName, boolean, ArgType[], string][] = [
            ["SpriteColor", false, ["sprite1", "255", "0", "0"], "SpriteColor:sprite1:255:0:0"],
            ["Output", false, ["sprite1", "halloo"], "Output:sprite1:halloo"],
            ["AttrChange", true, ["sprite1", "x", ">", "100"], "!AttrChange:sprite1:x:>:100"],
        ];
        it.each(params)("get event string for: %s, %s, %s",
            (name: CheckName, negated: boolean, args: ArgType[], expected: string) => {
                expect(CheckUtility.getEventString(name, negated, ...args)).toBe(expected);
            });

        const effects: [AbstractCheck, string][] = [
            [new SpriteTouching("dummy", {id: "test", negated: false, args: ["sprite1", "sprite2"]}), "SpriteTouching:sprite1:sprite2"],
            [new AttrComp("dummy", {id: "test", negated: false, args: ["sprite1", "costume", "=", "costume2"]}), "AttrComp:sprite1:costume:=:costume2"]
        ];
        it.each(effects)('getEventString() with attributes of Check: %s', (check: AbstractCheck, expected: string) => {
            expect(CheckUtility.getEventString(check.name, check.negated, ...check.args)).toBe(expected);
        });
    });
});
