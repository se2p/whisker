import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {Dependencies, ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {CheckResult, result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";

const name = "Expr" as const;

export type ExprArgs = [string, ...string[]];

const ExprArgs = z.string().array().nonempty();

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
        const e = ModelUtil.getExpressionForEval(t, this._code);
        const check = () => {
            const log = {};
            return result(Boolean(ModelUtil.evaluateExpression(t, e.expr, log)), log, this.negated);
        };
        this._setupDependencies(cu, graphID, e, check);
        const dep: Dependencies = ModelUtil.getDependencies(this._code);
        if (dep.varDependencies.length > 0 || dep.attrDependencies.length > 0) {
            this._setupDependencies(cu, graphID, dep, check);
        }
        return check;
    }

    private _setupDependencies(cu: CheckUtility, graphID: string, d: Dependencies, predicate: (...sprite: Sprite[]) => CheckResult) {
        d.varDependencies.forEach(dependency => {
            cu.registerVarEvent(dependency.varName, this, graphID, predicate);
        });

        d.attrDependencies.forEach(({spriteName, attrName}) => {
            if (attrName == "x" || attrName == "y") {
                cu.registerOnMoveEvent(spriteName, this, graphID, predicate);
            } else if (["size", "direction", "effect", "visible", "currentCostumeName", "rotationStyle"].includes(attrName)) {
                cu.registerOnVisualChange(spriteName, this, graphID, predicate);
            } else if (attrName == "sayText") {
                cu.registerOutput(spriteName, this, graphID, predicate);
            }
        });
    }

    override get dependsOnSayText(): boolean {
        return this._code.includes(".sayText");
    }

    protected _contradicts(_that: Expr): boolean {
        // Expressions are very powerful. While it's possible for two expressions to be contradicting, it's also very
        // difficult to check it here. Thus, we assume that expressions have been crafted not to contradict each other.
        return false;
    }
}
