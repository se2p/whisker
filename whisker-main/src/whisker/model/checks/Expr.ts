import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {Dependencies, Expression, ModelUtil} from "../util/ModelUtil";
import {z} from "zod";
import {CheckResult, result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult} from "./CheckTypes";
import Sprite from "../../../vm/sprite";

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

    override get dependsOnSayText(): boolean {
        return this._code.includes(".sayText");
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(ExprArgs.safeParse(args));
    }

    /**
     * Get a method checking whether an expression such as "$(Cat.x) > 25" is fulfilled.
     * @param t Instance of the test driver for evaluating expression.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const e = ModelUtil.getExpressionForEval(t, this._code, this.graphID);
        const check = () => {
            const log = {};
            return result(Boolean(ModelUtil.evaluateExpression(t, e.expr, this.graphID, log)), log, this.negated);
        };
        this._setupAllDependenciesForExpressions(e, this._code, check);
        return check;
    }

    protected _validate(checkJSON: ExprJSON): ExprJSON {
        return ExprJSON.parse(checkJSON) as ExprJSON;
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
     * @param predicate Generated check
     */
    private _setupAllDependenciesForExpressions(expr: Expression, code: string, predicate: (...sprite: Sprite[]) => CheckResult): void {
        this._setupDependencies(expr, predicate);
        const dep: Dependencies = ModelUtil.getDependencies(code);
        if (dep.varDependencies.length > 0 || dep.attrDependencies.length > 0) {
            this._setupDependencies(dep, predicate);
        }
    }

    private _setupDependencies(d: Dependencies, predicate: (...sprite: Sprite[]) => CheckResult): void {
        d.varDependencies.forEach(dependency => {
            this._registerVarEvent(dependency.varName, predicate);
        });

        d.attrDependencies.forEach(({spriteName, attrName}) => {
            if (attrName == "x" || attrName == "y") {
                this._registerOnMoveEvent(spriteName, predicate);
            } else if (["size", "direction", "visible", "currentCostumeName", "rotationStyle"].includes(attrName)) {
                this._registerOnVisualChange(spriteName, predicate);
            } else if (attrName == "sayText") {
                this._registerOutput(spriteName, predicate);
            }
        });
    }
}
