import {AbstractCheck, Check, Comparison, ICheckJSON, OptionalName, SpriteName, VariableName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForVariable} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";
import {ArgType} from "../util/schema";

const name = "VarComp" as const;

export type VarCompArgs = [
    /**
     * The name of the sprite whose variable is being evaluated
     */
    pSpriteName: SpriteName,

    /**
     * The name of the variable.
     */
    varName: VariableName,

    /**
     * Mode of comparison, e.g. =, <, >, <=, >=
     */
    comparison: Comparison,

    /**
     * Value to compare to the variable's current value.
     */
    varValue: string | number,
];

const VarCompArgs = z.tuple([
    SpriteName,
    VariableName,
    Comparison,
    z.string().or(z.number()),
]);

export interface VarCompJSON extends ICheckJSON {
    name: typeof name;
    args: VarCompArgs;
}

export const VarCompJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: VarCompArgs,
});

export class VarComp extends AbstractCheck<VarCompJSON> {
    constructor(edgeLabel: string, json: OptionalName<VarCompJSON>) {
        super(edgeLabel, {...json, name});
    }

    protected _validate(checkJSON: VarCompJSON): VarCompJSON {
        return VarCompJSON.parse(checkJSON) as VarCompJSON;
    }

    /**
     * Get a method for checking whether a variable has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): Check {
        const [pSpriteName, varName, comparison, varValue] = this.args;
        const negated = this.negated;
        const edgeLabel = this._edgeLabel;
        const {
            sprite: foundSprite,
            variable: foundVar
        } = ModelUtil.checkVariableExistence(t, ModelUtil.getStageOrSprite(t, pSpriteName), varName);
        const spriteName = foundSprite.name;
        const variableName = foundVar.name;
        function check() {
            const sprite = t.getSprites((sprite: Sprite) => sprite.name == spriteName, false)[0];
            const variable = sprite.getVariable(variableName);
            try {
                return !negated == ModelUtil.compare(variable.value, varValue, comparison);
            } catch (e) {
                throw new ErrorForVariable(pSpriteName, varName, e);
            }
        }

        cu.registerVarEvent(variableName, this, edgeLabel, graphID, check);
        return check;
    }

    protected override _contradicts(that: VarCompJSON): boolean {
        const [thisSpriteName, thisVarName] = this.args;
        const [thatSpriteName, thatVarName] = that.args;

        if (thisSpriteName !== thatSpriteName) {
            return false;
        }

        if (thisVarName !== thatVarName) {
            return false;
        }

        let thisComp = this.args[2];
        let thatComp = that.args[2];

        if (this.negated) {
            thisComp = this._getInvertedCompOp(thisComp);
        }

        if (that.negated) {
            thatComp = this._getInvertedCompOp(thatComp);
        }

        return this._checkComparison(thisComp, thatComp, this.args[3], that.args[3]);
    }

    private _getInvertedCompOp(comp: Comparison): Comparison {
        switch (comp) {
            case "=":
            case "==":
                return "!=";
            case "!=":
                return "==";
            case "<":
                return ">=";
            case ">":
                return "<=";
            case ">=":
                return "<";
            case "<=":
                return ">";
            default:
                throw new NonExhaustiveCaseDistinction(comp);
        }
    }

    private _checkComparison(pComparison1: ArgType, pComparison2: ArgType, pValue1: ArgType, pValue2: ArgType): boolean {
        const comparison1 = String(pComparison1);
        const comparison2 = String(pComparison2);
        const value1 = String(pValue1);
        const value2 = String(pValue2);


        if (comparison1 == "!=" || comparison2 == "!=") {
            return false;
        }

        // =
        if ((comparison1 == '=' || comparison2 == '==') && (comparison2 == '=' || comparison2 == '==')) {
            return value1 != value2;
        }

        if (comparison1 == '=' || comparison1 == '==') {
            return !eval(value1 + comparison2 + value2);
        }

        if (comparison2 == '=' || comparison2 == '==') {
            return !eval(value2 + comparison1 + value1);
        }

        // < and <, > and >, < and <=, <= and <=, >= and >, > and >=
        if (comparison1.startsWith(comparison2) || comparison2.startsWith(comparison1)) {
            return false;
        }

        return !eval(value2 + comparison1 + value1) || !eval(value1 + comparison2 + value2);
    }

    override get dependsOnSayText(): boolean {
        return false;
    }
}
