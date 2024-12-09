import {AbstractCheck, Check, Comparison, ICheckJSON, OptionalName, SpriteName, VariableName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForVariable} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";

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
        const [pSpriteName, varName, comparison, varValue] = this._args;
        const negated = this._negated;
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

    protected override _contradicts(that: VarComp): boolean {
        const [thisSpriteName, thisVarName] = this._args;
        const [thatSpriteName, thatVarName] = that._args;

        if (thisSpriteName !== thatSpriteName) {
            return false;
        }

        if (thisVarName !== thatVarName) {
            return false;
        }

        let thisComp = this._args[2];
        let thatComp = that._args[2];

        if (this._negated) {
            thisComp = this._getInvertedCompOp(thisComp);
        }

        if (that._negated) {
            thatComp = this._getInvertedCompOp(thatComp);
        }

        return this._checkComparison(thisComp, thatComp, this._args[3], that._args[3]);
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

    private _checkComparison(comparison1: Comparison, comparison2: Comparison, pValue1: string | number, pValue2: string | number): boolean {
        const value1 = String(pValue1);
        const value2 = String(pValue2);

        if (comparison1 == "!=" || comparison2 == "!=") {
            return false;
        }

        // =
        if ((comparison1 == '=' || comparison1 == '==') && (comparison2 == '=' || comparison2 == '==')) {
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
