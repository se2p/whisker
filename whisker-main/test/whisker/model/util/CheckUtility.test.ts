import {Effect} from "../../../../src/whisker/model/components/Effect";
import {CheckName} from "../../../../src/whisker/model/components/Check";
import {CheckUtility} from "../../../../src/whisker/model/util/CheckUtility";
import {ArgType} from "../../../../src/whisker/model/util/schema";

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

        const effects: [Effect, string][] = [
            [new Effect("test", "dummy", "SpriteTouching", false, ["sprite1", "sprite2"]), "SpriteTouching:sprite1:sprite2"],
            [new Effect("test", "dummy", "AttrComp", false, ["sprite1", "costume", "=", "costume2"]), "AttrComp:sprite1:costume:=:costume2"]
        ];
        it.each(effects)('getEventString() with attributes of Effect: %s', (check: Effect, expected: string) => {
            expect(CheckUtility.getEventString(check.name, check.negated, ...check.args)).toBe(expected);
        });
    });
});
