import {AbstractCheck, Check, ICheckJSON} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {Dependencies, ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {z} from "zod";

const NAME = "Expr" as const;

export type ExprArgs = [string, ...string[]];

const ExprArgs = z.string().array().nonempty();

export interface ExprJSON extends ICheckJSON {
    name: typeof NAME;
    args: ExprArgs;
}

export const ExprJSON = ICheckJSON.extend({
    name: z.literal(NAME),
    args: ExprArgs,
});

export class Expr extends AbstractCheck<ExprJSON> {
    private readonly _code: string;

    constructor(id: string, edgeLabel: string, negated: boolean, args: ExprArgs) {
        super(id, edgeLabel, negated, NAME, args);
        this._code = args.join("\n");
    }

    /**
     * Get a method checking whether an expression such as "$(Cat.x) > 25" is fulfilled.
     * @param t Instance of the test driver.
     * @param cu Listener for checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): Check {
        const e = ModelUtil.getExpressionForEval(t, this._code);
        const check: () => boolean = () => !this._negated == ModelUtil.evaluateExpression(t, e.expr);
        this._setupDependencies(cu, graphID, e, check);
        const dep: Dependencies = ModelUtil.getDependencies(this._code);
        if (dep.varDependencies.length > 0 || dep.attrDependencies.length > 0) {
            this._setupDependencies(cu, graphID, dep, check);
        }
        return check;
    }

    private _setupDependencies(cu: CheckUtility, graphID: string, d: Dependencies, predicate: (...sprite: Sprite[]) => boolean) {
        const edgeLabel = this._edgeLabel;
        const eventString = CheckUtility.getEventString("Expr", this._negated, this._code);

        d.varDependencies.forEach(dependency => {
            cu.registerVarEvent(dependency.varName, eventString, edgeLabel, graphID, predicate);
        });

        d.attrDependencies.forEach(({spriteName, attrName}) => {
            if (attrName == "x" || attrName == "y") {
                cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, predicate);
            } else if (["size", "direction", "effect", "visible", "currentCostumeName", "rotationStyle"].includes(attrName)) {
                cu.registerOnVisualChange(spriteName, eventString, edgeLabel, graphID, predicate);
            } else if (attrName == "sayText") {
                cu.registerOutput(spriteName, eventString, edgeLabel, graphID, predicate);
            }
        });
    }

    override get dependsOnSayText(): boolean {
        return this._code.includes(".sayText");
    }
}
