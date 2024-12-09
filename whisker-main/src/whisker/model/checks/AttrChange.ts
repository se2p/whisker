import {AbstractCheck, Check, ICheckJSON, OptionalName, SpriteName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForAttribute} from "../util/ModelError";
import {CheckUtility} from "../util/CheckUtility";
import {z} from "zod";

const name = "AttrChange" as const;

export type AttrChangeArgs = [
    /**
     * The name of the sprite whose attribute is evaluated
     */
    pSpriteName: SpriteName,

    /**
     * Name of the attribute.
     */
    attrName: string,

    /**
     * For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same-.
     * "+=" for increase or staying the same."-=" for decrease or staying the same. For a numerical
     * change by an exact value '+<number>' or '<number>' or '-<number>'.
     */
    change: string,
];

const AttrChangeArgs = z.tuple([
    SpriteName,
    z.string(),
    z.string(),
]);

export interface AttrChangeJSON extends ICheckJSON {
    name: typeof name;
    args: AttrChangeArgs;
}

export const AttrChangeJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: AttrChangeArgs,
});

export class AttrChange extends AbstractCheck<AttrChangeJSON> {
    constructor(edgeLabel: string, json: OptionalName<AttrChangeJSON>) {
        super(edgeLabel, {...json, name});
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
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): Check {
        // eslint-disable-next-line prefer-const
        let [pSpriteName, attrName, change] = this.args;
        const negated = this.negated;

        if (attrName == "costume" || attrName == "currentCostume") {
            attrName = "currentCostumeName";
        }

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
        const [pSpriteName, attrName, change] = this.args;
        cu.registerOnMoveEvent(spriteName, this, this._edgeLabel, graphID, (sprite) => {
            try {
                return !this.negated == ModelUtil.testChange(sprite.old[attrName], sprite[attrName], change);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
        });
    }

    private _registerOnVisualAttrChange(cu: CheckUtility, graphID: string, spriteName: string) {
        const [pSpriteName, attrName, change] = this.args;
        cu.registerOnVisualChange(spriteName, this, this._edgeLabel, graphID, (sprite) => {
            try {
                return !this.negated == ModelUtil.testChange(sprite.old[attrName], sprite[attrName], change);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
        });
    }

    override get dependsOnSayText(): boolean {
        return this.args[1] === "sayText";
    }

    protected override _contradicts(that: AttrChange): boolean {
        const [spriteNameThis, attrNameThis] = this.args;
        const [spriteNameThat, attrNameThat] = that.args;

        if (spriteNameThis !== spriteNameThat) {
            return false;
        }

        if (attrNameThis !== attrNameThat) {
            return false;
        }

        return this._checkChange(that);
    }

    private _checkChange(that: AttrChange): boolean {
        let change1 = this.args[2];
        let change2 = that.args[2];
        let negated1 = this.negated;
        let negated2 = that.negated;

        if (change1.length == 2 && change2.length == 2) {
            // += & +=, -= & -= are not getting until here, caught before call to checkChange
            // += & -=, -= & += only tested here
            return this.negated == that.negated;
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
}
