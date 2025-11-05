import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import Variable from "../../../vm/variable";
import {ErrorForVariable} from "../util/ModelError";
import {z} from "zod";
import {Change, ChangingCheck, newChange} from "./Change";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {NumberOrChangeOp, parseNonUnionError, ParsingResult, SpriteName, VariableName} from "./CheckTypes";
import {checkVariableExistence, testNumber} from "../util/ModelUtil";

const name = "VarChange" as const;

export type VarChangeArgs = [
    /**
     * The name of the sprite whose variable is evaluated
     */
    spriteName: SpriteName,

    /**
     * The name of the variable.
     */
    varName: VariableName,

    change: NumberOrChangeOp,
];

export const VarChangeArgs = z.tuple([
    SpriteName,
    VariableName,
    NumberOrChangeOp,
]);

export interface VarChangeJSON extends ICheckJSON {
    name: typeof name;
    args: VarChangeArgs;
}

export const VarChangeJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: VarChangeArgs,
});

export class VarChange extends PureCheck<VarChangeJSON, CheckFun0> implements ChangingCheck {
    private readonly _change: Change;

    constructor(edgeLabel: string, json: SlimCheckJSON<VarChangeJSON>) {
        super(edgeLabel, {...json, name});
        this._change = newChange(this);
    }

    get change(): NumberOrChangeOp {
        return this._args[2];
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(VarChangeArgs.safeParse(args));
    }

    protected _validate(checkJSON: VarChangeJSON): VarChangeJSON {
        return VarChangeJSON.parse(checkJSON) as VarChangeJSON;
    }

    /**
     * Get a method checking whether a variable value of a sprite changed.
     * @param t Instance of the test driver for retrieving the current and old values of a sprites and its clones attribute.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const [pSpriteName, varName] = this._args;

        const sprite = this._getStageOrSprite(pSpriteName);
        const {
            sprite: foundSprite,
            variable: foundVar
        } = checkVariableExistence(t, sprite, varName);
        const variableName = foundVar.name;

        this._registerVarEvent(variableName);

        return () => {
            const variable: Variable = foundSprite.getVariable(variableName);
            try {
                return this._change.apply(
                    testNumber(variable.value),
                    testNumber(variable.old.value)
                );
            } catch (e) {
                throw new ErrorForVariable(pSpriteName, varName, e);
            }
        };
    }

    protected override _contradicts(that: VarChange): boolean {
        const [spriteNameThis, varNameThis] = this._args;
        const [spriteNameThat, varNameThat] = that._args;

        if (spriteNameThis !== spriteNameThat || varNameThis !== varNameThat) {
            return false;
        }

        return this._change.contradicts(that._change);
    }
}
