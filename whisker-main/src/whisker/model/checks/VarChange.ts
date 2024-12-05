import {AbstractCheck, Check, ICheckJSON, OptionalName, SpriteName, VariableName} from "./AbstractCheck";
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
    pSpriteName: SpriteName,

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
        super(edgeLabel, {...json, name}, VarChangeJSON.parse.bind(VarChangeJSON));
    }

    /**
     * Get a method checking whether a variable value of a sprite changed.
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): Check {
        const [pSpriteName, varName, change] = this.args;
        const negated = this.negated;
        const edgeLabel = this._edgeLabel;

        let sprite = ModelUtil.getStageOrSprite(t, pSpriteName);
        const {
            sprite: foundSprite,
            variable: foundVar
        } = ModelUtil.checkVariableExistence(t, sprite, varName);
        sprite = foundSprite;
        const spriteName = sprite.name;
        const variableName = foundVar.name;
        const eventString = CheckUtility.getEventString(name, negated, pSpriteName, varName, change);

        function check(): boolean {
            const sprite: Sprite = t.getSprites((sprite: Sprite) => sprite.name == spriteName, false)[0];
            const variable: Variable = sprite.getVariable(variableName);
            try {
                return !negated == ModelUtil.testChange(variable.old.value, variable.value, change);
            } catch (e) {
                throw new ErrorForVariable(pSpriteName, varName, e);
            }
        }

        cu.registerVarEvent(variableName, eventString, edgeLabel, graphID, check);
        return check;
    }
}
