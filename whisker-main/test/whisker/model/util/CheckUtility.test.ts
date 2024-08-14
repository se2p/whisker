import {Effect} from "../../../../src/whisker/model/components/Effect";
import {CheckName} from "../../../../src/whisker/model/components/Check";
import {CheckUtility} from "../../../../src/whisker/model/util/CheckUtility";

describe('CheckUtility', () => {
    test("split event strings", () => {
        let eventString = "SpriteColor:Sprite1:255:0:0";
        let result = CheckUtility.splitEventString(eventString);
        expect(result.name).toBe(CheckName.SpriteColor);
        expect(result.negated).toBe(false);
        expect(result.args).toEqual(["Sprite1", "255", "0", "0"]);

        eventString = "SpriteTouching:Sprite1:Sprite2";
        result = CheckUtility.splitEventString(eventString);
        expect(result.name).toBe(CheckName.SpriteTouching);
        expect(result.negated).toBe(false);
        expect(result.args).toEqual(["Sprite1", "Sprite2"]);

        eventString = "!SpriteTouching:Sprite1:Sprite2";
        result = CheckUtility.splitEventString(eventString);
        expect(result.name).toBe(CheckName.SpriteTouching);
        expect(result.negated).toBe(true);
        expect(result.args).toEqual(["Sprite1", "Sprite2"]);

        eventString = "AttrComp:Sprite1:costume:=:costume2";
        result = CheckUtility.splitEventString(eventString);
        expect(result.name).toBe(CheckName.AttrComp);
        expect(result.negated).toBe(false);
        expect(result.args).toEqual(["Sprite1", "costume", "=", "costume2"]);
    });

    test("get event string", () => {
        let name = CheckName.SpriteColor;
        let negated = false;
        let args = ["sprite1", "255", "0", "0"];
         expect(CheckUtility.getEventString(name, negated, ...args)).toBe("SpriteColor:sprite1:255:0:0");


        name = CheckName.Output;
        args = ["sprite1", "halloo"];
        expect(CheckUtility.getEventString(name, negated, ...args)).toBe("Output:sprite1:halloo");

        name = CheckName.AttrChange;
        negated = true;
        args = ["sprite1", "x", ">", "100"];
        expect(CheckUtility.getEventString(name, negated, ...args)).toBe("!AttrChange:sprite1:x:>:100");

        let check = new Effect("test", "dummy", CheckName.SpriteTouching, false, ["sprite1", "sprite2"]);
        expect(CheckUtility.getEventString(check.name, check.negated, ...check.args)).toBe("SpriteTouching:sprite1:sprite2");

        check = new Effect("test", "dummy", CheckName.AttrComp, false, ["sprite1", "costume", "=", "costume2"]);
        expect(CheckUtility.getEventString(check.name, check.negated, ...check.args)).toBe("AttrComp:sprite1:costume:=:costume2");
    });
});
