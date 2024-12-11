import {AbstractCheck, AttrName, CheckFun0, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForAttribute} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {ComparingCheck, Comparison, contradicts} from "./comparisons";

const name = "AttrComp" as const;

export type AttrCompArgs = [

    /**
     * The name of the sprite whose attribute is evaluated
     */
    spriteName: SpriteName,

    /**
     * Name of the attribute.
     */
    attrName: string,

    /**
     * Mode of comparison, e.g. ==, <, >, <=, >=
     */
    comparison: Comparison,

    /**
     * Value to compare to the attribute's current value.
     */
    attrValue: string | number,
];

const AttrCompArgs = z.tuple([
    SpriteName,
    AttrName,
    Comparison,
    z.string().or(z.number()),
]);

export interface AttrCompJSON extends ICheckJSON {
    name: typeof name;
    args: AttrCompArgs;
}

export const AttrCompJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: AttrCompArgs,
});

export class AttrComp extends AbstractCheck<AttrCompJSON, CheckFun0> implements ComparingCheck {
    constructor(edgeLabel: string, json: SlimCheckJSON<AttrCompJSON>) {
        super(edgeLabel, {...json, name});
    }

    get comparison(): Comparison {
        return this._args[2];
    }

    get value(): string | number {
        return this._args[3];
    }

    protected _validate(checkJSON: AttrCompJSON): AttrCompJSON {
        return AttrCompJSON.parse(checkJSON) as AttrCompJSON;
    }

    /**
     * Get a method for checking whether a sprite's attribute has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): CheckFun0 {
        const [pSpriteName, attrName, comparison, attrValue] = this._args;
        const negated = this.negated;

        const spriteName = ModelUtil.getStageOrSprite(t, pSpriteName).name;
        ModelUtil.checkAttributeExistence(t, spriteName, attrName);

        const listener = (sprite) => {
            try {
                return !negated == ModelUtil.compare(sprite[attrName], attrValue, comparison);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
        };

        // on movement listener
        if (attrName == "x" || attrName == "y") {
            cu.registerOnMoveEvent(spriteName, this, graphID, listener);
        } else if (["size", "direction", "effect", "visible", "currentCostumeName", "rotationStyle"].includes(attrName)) {
            cu.registerOnVisualChange(spriteName, this, graphID, listener);
        } else if (attrName == "sayText") {
            cu.registerOutput(spriteName, this, graphID, listener);
        }

        // without movement
        return () => {
            const sprites: Sprite[] = t.getSprites((s: Sprite) => s.name == spriteName, false)[0].getClones(true);
            try {
                for (const s of sprites) {
                    if (ModelUtil.compare(s[attrName], attrValue, comparison)) {
                        return !negated;
                    }
                }
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
            return negated;
        };
    }

    override get dependsOnSayText(): boolean {
        return this._args[1] === "sayText";
    }

    protected override _contradicts(that: AttrComp): boolean {
        const [thisSpriteName, thisAttrName] = this._args;
        const [thatSpriteName, thatAttrName] = that._args;

        if (thisSpriteName !== thatSpriteName || thisAttrName !== thatAttrName) {
            return false;
        }

        return contradicts(this, that);
    }
}
