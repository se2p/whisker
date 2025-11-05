import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {ErrorForVariable} from "../util/ModelError";
import {z} from "zod";
import {ComparingCheck, Comparison, newComparison} from "./Comparison";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {
    ComparisonOp,
    EqOrNeq,
    eqOrNeqOPs,
    NumberLike,
    parseUnionError,
    ParsingResult,
    SpriteName,
    VariableName
} from "./CheckTypes";
import {checkVariableExistence} from "../util/ModelUtil";

const name = "VarComp" as const;

export type VarCompArgs =
    [spriteName: SpriteName, varName: VariableName, comparisonOp: EqOrNeq, varValue: string | number]
    | [spriteName: SpriteName, varName: VariableName, comparisonOp: ComparisonOp, varValue: number];

const VarCompArgs = z.union([
    z.tuple([SpriteName, VariableName, z.enum(eqOrNeqOPs, {message: "InvalidComparison"}), z.string().or(z.number())]),
    z.tuple([SpriteName, VariableName, ComparisonOp, NumberLike], {message: "InvalidVarCompArgs"}),
]);

export interface VarCompJSON extends ICheckJSON {
    name: typeof name;
    args: VarCompArgs;
}

export const VarCompJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: VarCompArgs,
});

export class VarComp extends PureCheck<VarCompJSON, CheckFun0> implements ComparingCheck {
    private readonly _comparison: Comparison;

    constructor(edgeLabel: string, json: SlimCheckJSON<VarCompJSON>) {
        super(edgeLabel, {...json, name});
        this._comparison = newComparison(this);
    }

    get operator(): ComparisonOp {
        return this._args[2];
    }

    get value(): string | number {
        return this._args[3];
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseUnionError(VarCompArgs.safeParse(args), {2: "InvalidComparison"}, e => e.issues.length);
    }

    protected _validate(checkJSON: VarCompJSON): VarCompJSON {
        return VarCompJSON.parse(checkJSON) as VarCompJSON;
    }

    /**
     * Get a method for checking whether a variable has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver for retrieving the value of an attribute of a sprite and its clones.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const [pSpriteName, varName] = this._args;
        const {
            sprite: foundSprite,
            variable: foundVar
        } = checkVariableExistence(t, this._getStageOrSprite(pSpriteName), varName);
        const variableName = foundVar.name;

        this._registerVarEvent(variableName);

        return () => {
            const variable = foundSprite.getVariable(variableName);
            try {
                return this._comparison.apply(variable.value as string);
            } catch (e) {
                throw new ErrorForVariable(pSpriteName, varName, e);
            }
        };
    }

    protected override _contradicts(that: VarComp): boolean {
        const [thisSpriteName, thisVarName] = this._args;
        const [thatSpriteName, thatVarName] = that._args;

        if (thisSpriteName !== thatSpriteName || thisVarName !== thatVarName) {
            return false;
        }

        return this._comparison.contradicts(that._comparison);
    }
}
