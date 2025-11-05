import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";
import {getExpressionForEval} from "../util/ModelUtil";
import {Reason, result} from "./CheckResult";

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
        const output = this._args[1];

        const sprite = this._checkSpriteExistence(this._args[0]);
        const spriteName = sprite.name;
        let expression: string;
        try {
            expression = getExpressionForEval(t, output, this.graphID).expr;
        } catch (e) {
            // this is probably supposed to be constant text like "apple" and not an expression
            expression = getExpressionForEval(t, `'${output}'`, this.graphID).expr;
        }

        this._registerOutput(spriteName);
        return () => {
            const log: Reason = {};
            const exprRes = this.evaluateExpression(expression, log);
            const expected = String(exprRes).toLocaleLowerCase();

            let actual = sprite.sayText;
            let containsText: boolean;
            if (actual === null) {
                containsText = false;
            } else {
                actual = sprite.sayText.toLocaleLowerCase();
                containsText = actual.includes(expected);
            }
            return result(containsText, {...log, actual, expected}, this.negated);
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
