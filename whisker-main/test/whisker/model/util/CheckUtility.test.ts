import {Effect} from "../../../../src/whisker/model/components/Effect";
import {ArgType, CheckName} from "../../../../src/whisker/model/components/Check";
import {CheckUtility} from "../../../../src/whisker/model/util/CheckUtility";

describe('CheckUtility', () => {
    describe("split event strings", () => {
        const table: [string, CheckName, boolean, ArgType[]][] = [
            ["SpriteColor:Sprite1:255:0:0", CheckName.SpriteColor, false, ["Sprite1", "255", "0", "0"]],
            ["SpriteTouching:Sprite1:Sprite2", CheckName.SpriteTouching, false, ["Sprite1", "Sprite2"]],
            ["!SpriteTouching:Sprite1:Sprite2", CheckName.SpriteTouching, true, ["Sprite1", "Sprite2"]],
            ["AttrComp:Sprite1:costume:=:costume2", CheckName.AttrComp, false, ["Sprite1", "costume", "=", "costume2"]],
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
            [CheckName.SpriteColor, false, ["sprite1", "255", "0", "0"], "SpriteColor:sprite1:255:0:0"],
            [CheckName.Output, false, ["sprite1", "halloo"], "Output:sprite1:halloo"],
            [CheckName.AttrChange, true, ["sprite1", "x", ">", "100"], "!AttrChange:sprite1:x:>:100"],
        ];
        it.each(params)("get event string for: %s, %s, %s",
            (name: CheckName, negated: boolean, args: ArgType[], expected: string) => {
                expect(CheckUtility.getEventString(name, negated, ...args)).toBe(expected);
            });

        const effects: [Effect, string][] = [
            [new Effect("test", "dummy", CheckName.SpriteTouching, false, ["sprite1", "sprite2"]), "SpriteTouching:sprite1:sprite2"],
            [new Effect("test", "dummy", CheckName.AttrComp, false, ["sprite1", "costume", "=", "costume2"]), "AttrComp:sprite1:costume:=:costume2"]
        ];
        it.each(effects)('', (check: Effect, expected: string) => {
            expect(CheckUtility.getEventString(check.name, check.negated, ...check.args)).toBe(expected);
        });
    });
});
