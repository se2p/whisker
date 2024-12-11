import {AbstractCheck, AttrName, CheckFun0, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForAttribute} from "../util/ModelError";
import {CheckUtility} from "../util/CheckUtility";
import {z} from "zod";
import {Change, ChangingCheck, contradicts} from "./changes";

const name = "AttrChange" as const;

export type AttrChangeArgs = [
    /**
     * The name of the sprite whose attribute is evaluated
     */
    spriteName: SpriteName,

    /**
     * Name of the attribute.
     */
    attrName: string,

    change: Change,
];

const AttrChangeArgs = z.tuple([
    SpriteName,
    AttrName,
    Change,
]);

export interface AttrChangeJSON extends ICheckJSON {
    name: typeof name;
    args: AttrChangeArgs;
}

export const AttrChangeJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: AttrChangeArgs,
});

export class AttrChange extends AbstractCheck<AttrChangeJSON, CheckFun0> implements ChangingCheck {
    constructor(edgeLabel: string, json: SlimCheckJSON<AttrChangeJSON>) {
        super(edgeLabel, {...json, name});
    }

    get change(): Change {
        return this._args[2];
    }

    protected _validate(checkJSON: AttrChangeJSON): AttrChangeJSON {
        return AttrChangeJSON.parse(checkJSON) as AttrChangeJSON;
    }

    /**
     * Get a method checking whether an attribute of a sprite changed.
     * Attributes: checks, x, y, pos , direction, visible, size, currentCostume, this.volume, layerOrder, sayText
     * (only = allowed);
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): CheckFun0 {
        const [pSpriteName, attrName, change] = this._args;
        const negated = this.negated;

        const sprite = ModelUtil.getStageOrSprite(t, pSpriteName);
        const spriteName = sprite.name;
        ModelUtil.checkAttributeExistence(t, spriteName, attrName);

        // The attribute sayText cannot be used as an AttributeChange predicate with any other operand than =, as it
        // is not a numerical value and e.g. an increase (+) on a string is not desired to be representable. An
        // AttributeChange predicate with sayText fails in the execution with e.g.
        // -> Error: Sprite1.sayText: Is not a numerical value to compare: Hello!
        // Therefore, no instrumentation is done here for the sayText attribute.
        if (attrName == "x" || attrName == "y") {
            this._registerOnMoveAttrChange(cu, graphID, spriteName);
        } else if (["size", "direction", "effect", "visible", "currentCostumeName", "rotationStyle"].includes(attrName)) {
            this._registerOnVisualAttrChange(cu, graphID, spriteName);
        }

        return () => {
            const sprites = sprite.isStage ? [t.getStage()] : t.getSprite(spriteName).getClones(true);
            try {
                for (const s of sprites) {
                    if (ModelUtil.testChange(s.old[attrName], s[attrName], change)) {
                        return !negated;
                    }
                }
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
            return negated;
        };
    }

    private _registerOnMoveAttrChange(cu: CheckUtility, graphID: string, spriteName: string) {
        const [pSpriteName, attrName, change] = this._args;
        cu.registerOnMoveEvent(spriteName, this, graphID, (sprite) => {
            try {
                return !this.negated == ModelUtil.testChange(sprite.old[attrName], sprite[attrName], change);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
        });
    }

    private _registerOnVisualAttrChange(cu: CheckUtility, graphID: string, spriteName: string) {
        const [pSpriteName, attrName, change] = this._args;
        cu.registerOnVisualChange(spriteName, this, graphID, (sprite) => {
            try {
                return !this.negated == ModelUtil.testChange(sprite.old[attrName], sprite[attrName], change);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
        });
    }

    override get dependsOnSayText(): boolean {
        return this._args[1] === "sayText";
    }

    protected override _contradicts(that: AttrChange): boolean {
        const [spriteNameThis, attrNameThis] = this._args;
        const [spriteNameThat, attrNameThat] = that._args;

        if (spriteNameThis !== spriteNameThat || attrNameThis !== attrNameThat) {
            return false;
        }

        return contradicts(this, that);
    }
}
