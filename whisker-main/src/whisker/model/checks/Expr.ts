import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {Dependencies, Expression, getDependencies, getExpressionForEval} from "../util/ModelUtil";
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

export class Expr extends PureCheck<ExprJSON, CheckFun0> {
    private readonly _code: string;

    constructor(edgeLabel: string, json: SlimCheckJSON<ExprJSON>) {
        super(edgeLabel, {...json, name});
        this._code = this._args.join("\n");
    }

    get code(): string {
        return this._code;
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(ExprArgs.safeParse(args));
    }

    protected _validate(checkJSON: ExprJSON): ExprJSON {
        return ExprJSON.parse(checkJSON) as ExprJSON;
    }

    /**
     * Get a method checking whether an expression such as "$(Cat.x) > 25" is fulfilled.
     * @param t Instance of the test driver for evaluating expression.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const e = getExpressionForEval(t, this._code, this.graphID);
        this._setupAllDependenciesForExpressions(e, this._code);
        return () => {
            const log = {};
            const res = this.evaluateExpression(e.expr, log);
            return result(Boolean(res), log, this.negated);
        };
    }

    protected _contradicts(_that: Expr): boolean {
        // Expressions are very powerful. While it's possible for two expressions to be contradicting, it's also very
        // difficult to check it here. Thus, we assume that expressions have been crafted not to contradict each other.
        return false;
    }

    /**
     * Sets up all dependencies for a check with expressions
     * (dependencies by $-function calls and parsed with RegEx from test driver use)
     * @param expr Expression with the dependencies from the $-function are registered.
     * @param code Code of the expression
     */
    private _setupAllDependenciesForExpressions(expr: Expression, code: string): void {
        this._setupDependencies(expr);
        const dep: Dependencies = getDependencies(code);
        if (dep.varDependencies.length > 0 || dep.attrDependencies.length > 0) {
            this._setupDependencies(dep);
        }
    }

    private _setupDependencies(d: Dependencies): void {
        d.varDependencies.forEach(dependency => {
            this._registerVarEvent(dependency.varName);
        });

        d.attrDependencies.forEach(({spriteName, attrName}) => {
            if (attrName == "x" || attrName == "y") {
                this._registerOnMoveEvent(spriteName);
            } else if (["size", "direction", "visible", "currentCostumeName", "rotationStyle"].includes(attrName)) {
                this._registerOnVisualChange(spriteName);
            } else if (attrName == "sayText") {
                this._registerOutput(spriteName);
            }
        });
    }
}
