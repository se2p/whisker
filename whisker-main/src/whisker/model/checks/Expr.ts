import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import {z} from "zod";
import {result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult} from "./CheckTypes";

const name = "Expr" as const;

export type ExprArgs = [string, ...string[]];

export const ExprArgs = z.string().array()
    .nonempty()
    .refine(arg => arg.some(s => s && s.length > 0, {message: "NoNonEmptyExprText"}));

export interface ExprJSON extends ICheckJSON {
    name: typeof name;
    args: ExprArgs;
}

export const ExprJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: ExprArgs,
});

export class Expr extends AbstractCheck<ExprJSON, CheckFun0> {
    private readonly _code: string;

    constructor(edgeLabel: string, json: SlimCheckJSON<ExprJSON>) {
        super(edgeLabel, {...json, name});
        this._code = this._args.join("\n");
    }

    get code(): string {
        return this._code;
    }

    protected _validate(checkJSON: ExprJSON): ExprJSON {
        return ExprJSON.parse(checkJSON) as ExprJSON;
    }

    /**
     * Get a method checking whether an expression such as "$(Cat.x) > 25" is fulfilled.
     * @param t Instance of the test driver for evaluating expression.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        const e = ModelUtil.getExpressionForEval(t, this._code, graphID);
        const check = () => {
            const log = {};
            return result(Boolean(ModelUtil.evaluateExpression(t, e.expr, graphID, log)), log, this.negated);
        };
        ModelUtil.setupAllDependenciesForExpressions(this, cu, graphID, e, this._code, check);
        return check;
    }

    override get dependsOnSayText(): boolean {
        return this._code.includes(".sayText");
    }

    protected _contradicts(_that: Expr): boolean {
        // Expressions are very powerful. While it's possible for two expressions to be contradicting, it's also very
        // difficult to check it here. Thus, we assume that expressions have been crafted not to contradict each other.
        return false;
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(ExprArgs.safeParse(args));
    }
}
