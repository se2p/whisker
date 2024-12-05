import {AbstractCheck, Check, ICheckJSON, OptionalName, SpriteName, VariableName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import {ComparisonNotKnownError, ErrorForVariable} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";

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
    comparison: string,

    /**
     * Value to compare to the variable's current value.
     */
    varValue: string | number,
];

const VarCompArgs = z.tuple([
    SpriteName,
    VariableName,
    z.string(),
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
        const eventString = CheckUtility.getEventString(name, negated, pSpriteName, varName,
            comparison, varValue);

        if (comparison != "==" && comparison != "=" && comparison != ">" && comparison != ">="
            && comparison != "<" && comparison != "<=") {
            throw new ComparisonNotKnownError(comparison);
        }

        function check() {
            const sprite = t.getSprites((sprite: Sprite) => sprite.name == spriteName, false)[0];
            const variable = sprite.getVariable(variableName);
            try {
                return !negated == ModelUtil.compare(variable.value, varValue, comparison);
            } catch (e) {
                throw new ErrorForVariable(pSpriteName, varName, e);
            }
        }

        cu.registerVarEvent(variableName, eventString, edgeLabel, graphID, check);
        return check;
    }
}
