import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {any, fail, pass} from "./CheckResult";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";
import {checkSpriteExistence, evaluateExpression, getExpressionForEval} from "../util/ModelUtil";

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

export class Output extends PureCheck<OutputJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<OutputJSON>) {
        super(edgeLabel, {...json, name});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(OutputArgs.safeParse(args));
    }

    protected _validate(checkJSON: OutputJSON): OutputJSON {
        return OutputJSON.parse(checkJSON) as OutputJSON;
    }

    /**
     * Get a method checking whether a sprite has the given output included in their sayText.
     * @param t Instance of the test driver for retrieving the sayText value of a sprite and its clones
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const [pSpriteName, output] = this._args;

        const spriteName = checkSpriteExistence(t, pSpriteName).name;
        let expression: string;
        try {
            expression = getExpressionForEval(t, output, this.graphID).expr;
        } catch (e) {
            // this is probably supposed to be constant text like "apple" and not an expression
            expression = getExpressionForEval(t, `'${output}'`, this.graphID).expr;
        }

        const sayTextCheck = (s: Sprite) => {
            const expected = String(evaluateExpression(t, expression, this.graphID)).toLocaleLowerCase();

            if (s.sayText === null) {
                return fail({actual: null, expected: expected});
            }

            const actual = s.sayText.toLocaleLowerCase();

            if (!actual.includes(expected)) {
                return fail({actual, expected});
            }

            return pass();
        };

        this._registerOutput(spriteName);

        return () => {
            const sprites = t.getSprites((sprite: Sprite) => sprite.name === spriteName, false);
            return any(sayTextCheck, this.negated, sprites);
        };
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
