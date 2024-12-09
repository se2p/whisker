import {AbstractCheck, CheckFun, ICheckJSON, OptionalName, SpriteName, VariableName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import Variable from "../../../vm/variable";
import {ErrorForVariable} from "../util/ModelError";
import {z} from "zod";

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

    /**
     * For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same-.
     * "+=" for increase or staying the same."-=" for decrease or staying the same. For a numerical
     * change by an exact value '+<number>' or '<number>' or '-<number>'.
     */
    change: string,
];

export const VarChangeArgs = z.tuple([
    SpriteName,
    VariableName,
    z.string(),
]);

export interface VarChangeJSON extends ICheckJSON {
    name: typeof name;
    args: VarChangeArgs;
}

export const VarChangeJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: VarChangeArgs,
});

export class VarChange extends AbstractCheck<VarChangeJSON> {
    constructor(edgeLabel: string, json: OptionalName<VarChangeJSON>) {
        super(edgeLabel, {...json, name});
    }

    protected _validate(checkJSON: VarChangeJSON): VarChangeJSON {
        return VarChangeJSON.parse(checkJSON) as VarChangeJSON;
    }

    /**
     * Get a method checking whether a variable value of a sprite changed.
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): CheckFun {
        const [pSpriteName, varName, change] = this._args;
        const negated = this._negated;
        const edgeLabel = this._edgeLabel;

        let sprite = ModelUtil.getStageOrSprite(t, pSpriteName);
        const {
            sprite: foundSprite,
            variable: foundVar
        } = ModelUtil.checkVariableExistence(t, sprite, varName);
        sprite = foundSprite;
        const spriteName = sprite.name;
        const variableName = foundVar.name;
        function check(): boolean {
            const sprite: Sprite = t.getSprites((sprite: Sprite) => sprite.name == spriteName, false)[0];
            const variable: Variable = sprite.getVariable(variableName);
            try {
                return !negated == ModelUtil.testChange(variable.old.value, variable.value, change);
            } catch (e) {
                throw new ErrorForVariable(pSpriteName, varName, e);
            }
        }

        cu.registerVarEvent(variableName, this, edgeLabel, graphID, check);
        return check;
    }

    protected override _contradicts(that: VarChange): boolean {
        const [spriteNameThis, varNameThis] = this._args;
        const [spriteNameThat, varNameThat] = that._args;

        if (spriteNameThis !== spriteNameThat) {
            return false;
        }

        if (varNameThis !== varNameThat) {
            return false;
        }

        return this._checkChange(that);
    }

    private _checkChange(that: VarChange): boolean {
        let change1 = this._args[2];
        let change2 = that._args[2];
        let negated1 = this._negated;
        let negated2 = that._negated;

        if (change1.length == 2 && change2.length == 2) {
            // += & +=, -= & -= are not getting until here, caught before call to checkChange
            // += & -=, -= & += only tested here
            return this._negated == that._negated;
        }

        if (change1.length == 2) {
            change1 = this._getInvertedChangeOp(change1);
            negated1 = !negated1;
        } else if (change2.length == 2) {
            change2 = this._getInvertedChangeOp(change2);
            negated2 = !negated2;
        }

        if (change1 == change2) {
            return negated1 != negated2;
        }

        return !negated1 && !negated2;
    }

    // only for += and -=
    private _getInvertedChangeOp(change: string): string {
        return change == "+=" ? "-" : "+";
    }

    override get dependsOnSayText(): boolean {
        return false;
    }
}
