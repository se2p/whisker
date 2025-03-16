import {
    AbstractCheck,
    CheckFun0,
    couldBeSpriteName,
    ICheckJSON,
    SlimCheckJSON,
    SpriteName,
    VariableName
} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForVariable} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {ComparingCheck, Comparison, ComparisonOp, isValidComparisonOp, newComparison} from "./Comparison";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";

const name = "VarComp" as const;

export type VarCompArgs = [
    /**
     * The name of the sprite whose variable is being evaluated
     */
    spriteName: SpriteName,

    /**
     * The name of the variable.
     */
    varName: VariableName,

    /**
     * Mode of comparison, e.g. =, <, >, <=, >=
     */
    comparisonOp: ComparisonOp,

    /**
     * Value to compare to the variable's current value.
     */
    varValue: string | number,
];

const VarCompArgs = z.tuple([
    SpriteName,
    VariableName,
    ComparisonOp,
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

export class VarComp extends AbstractCheck<VarCompJSON, CheckFun0> implements ComparingCheck {
    private readonly _comparison: Comparison;

    constructor(edgeLabel: string, json: SlimCheckJSON<VarCompJSON>) {
        super(edgeLabel, {...json, name});
        this._comparison = newComparison(this);
    }

    protected _validate(checkJSON: VarCompJSON): VarCompJSON {
        return VarCompJSON.parse(checkJSON) as VarCompJSON;
    }

    get operator(): ComparisonOp {
        return this._args[2];
    }

    get value(): string | number {
        return this._args[3];
    }

    /**
     * Get a method for checking whether a variable has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver for retrieving the value of an attribute of a sprite and its clones.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        const [pSpriteName, varName] = this._args;
        const {
            sprite: foundSprite,
            variable: foundVar
        } = ModelUtil.checkVariableExistence(t, ModelUtil.getStageOrSprite(t, pSpriteName), varName);
        const spriteName = foundSprite.name;
        const variableName = foundVar.name;

        const check = () => {
            const sprite = t.getSprites((sprite: Sprite) => sprite.name == spriteName, false)[0];
            const variable = sprite.getVariable(variableName);
            try {
                return this._comparison.apply(variable.value);
            } catch (e) {
                throw new ErrorForVariable(pSpriteName, varName, e);
            }
        };

        cu.registerVarEvent(variableName, this, graphID, check);
        return check;
    }

    protected override _contradicts(that: VarComp): boolean {
        const [thisSpriteName, thisVarName] = this._args;
        const [thatSpriteName, thatVarName] = that._args;

        if (thisSpriteName !== thatSpriteName || thisVarName !== thatVarName) {
            return false;
        }

        return this._comparison.contradicts(that._comparison);
    }

    override get dependsOnSayText(): boolean {
        return false;
    }

    public static convertArgs(args: ArgType[]): boolean[] {
        return [
            couldBeSpriteName(args[0]),
            ModelUtil.isAnAttributeOrEffect(args[1]),
            isValidComparisonOp(args[2]),
            ModelUtil.parseAndUpdate(args, 3) || typeof args[3] == "string"
            // TODO this should probably be improved to avoid something like "20" > "100" which would evaluate to false
        ];
    }
}
