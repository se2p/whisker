import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {any, pass, fail, result} from "./CheckResult";

const name = "Output" as const;

export type OutputArgs = [
    /**
     * The name of the sprite.
     */
    spriteName: SpriteName,

    /**
     * Output to say.
     */
    output: string,
];

const OutputArgs = z.tuple([
    SpriteName,
    z.string(),
]);

export interface OutputJSON extends ICheckJSON {
    name: typeof name;
    args: OutputArgs;
}

export const OutputJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: OutputArgs,
});

export class Output extends AbstractCheck<OutputJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<OutputJSON>) {
        super(edgeLabel, {...json, name});
    }

    protected _validate(checkJSON: OutputJSON): OutputJSON {
        return OutputJSON.parse(checkJSON) as OutputJSON;
    }

    /**
     * Get a method checking whether a sprite has the given output included in their sayText.
     * @param t Instance of the test driver.
     * @param cu  Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): CheckFun0 {
        const [pSpriteName, output] = this._args;
        const negated = this.negated;

        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        let expression: string;
        try {
            expression = ModelUtil.getExpressionForEval(t, output).expr;
        } catch (e) {
            // this is probably supposed to be constant text like "apple" and not an expression
            expression = ModelUtil.getExpressionForEval(t, `'${output}'`).expr;
        }

        const expected = String(eval(expression)(t)).toLocaleLowerCase();

        const sayTextCheck = (s: Sprite) => {
            if (s.sayText === null) {
                return fail(`Expected sprite "${spriteName}" to say "${expected}" but got no speech`);
            }

            const actual = s.sayText.toLocaleLowerCase();

            if (!actual.includes(expected)) {
                return fail(`Expected sprite "${spriteName}" to say "${expected}" but got "${actual}"`);
            }

            return pass();
        };

        cu.registerOutput(spriteName, this, graphID, (s) => {
            return result(sayTextCheck(s).passed, "(reason unknown)", negated);
        });

        return () => {
            const sprites = t.getSprites((sprite: Sprite) => sprite.name === spriteName, false);
            const reason = `Expected sprite "${spriteName}" not to say "${expected}"`;
            return any(sayTextCheck, this.negated, reason, sprites);
        };
    }

    override get dependsOnSayText(): true {
        return true;
    }

    protected override _contradicts(that: Output): boolean {
        const [spriteThis, outputThis] = this._args;
        const [spriteThat, outputThat] = that._args;

        if (spriteThis !== spriteThat) {
            return false;
        }

        return outputThis !== outputThat; // The same sprite cannot output two different things at the same time.
    }
}
