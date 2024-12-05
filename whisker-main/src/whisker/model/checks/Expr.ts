import {AbstractCheck, Check, ICheckJSON, OptionalName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {Dependencies, ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {z} from "zod";

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

export class Expr extends AbstractCheck<ExprJSON> {
    private readonly _code: string;

    constructor(edgeLabel: string, json: OptionalName<ExprJSON>) {
        super(edgeLabel, {...json, name}, ExprJSON.parse.bind(ExprJSON));
        this._code = this.args.join("\n");
    }

    /**
     * Get a method checking whether an expression such as "$(Cat.x) > 25" is fulfilled.
     * @param t Instance of the test driver.
     * @param cu Listener for checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): Check {
        const e = ModelUtil.getExpressionForEval(t, this._code);
        const check: () => boolean = () => !this.negated == ModelUtil.evaluateExpression(t, e.expr);
        this._setupDependencies(cu, graphID, e, check);
        const dep: Dependencies = ModelUtil.getDependencies(this._code);
        if (dep.varDependencies.length > 0 || dep.attrDependencies.length > 0) {
            this._setupDependencies(cu, graphID, dep, check);
        }
        return check;
    }

    private _setupDependencies(cu: CheckUtility, graphID: string, d: Dependencies, predicate: (...sprite: Sprite[]) => boolean) {
        const edgeLabel = this._edgeLabel;
        const eventString = this.getEventString();

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
