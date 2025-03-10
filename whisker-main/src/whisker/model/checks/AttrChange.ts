import {AbstractCheck, AttrName, CheckFun0, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForAttribute, ErrorForEffect} from "../util/ModelError";
import {CheckUtility} from "../util/CheckUtility";
import {z} from "zod";
import {Change, ChangingCheck, newQuantifiedChange, NumberOrChangeOp} from "./Change";
import {Quantification} from "./Quantification";
import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";

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

    change: NumberOrChangeOp,
];

const AttrChangeArgs = z.tuple([
    SpriteName,
    AttrName,
    NumberOrChangeOp,
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
    private readonly _change: Quantification<Change>;
    private readonly _isForEffect: boolean;

    constructor(edgeLabel: string, json: SlimCheckJSON<AttrChangeJSON>) {
        super(edgeLabel, {...json, name});
        this._change = newQuantifiedChange(this);
        this._isForEffect = ModelUtil.isAnEffect(this._args[1]);
    }

    get change(): NumberOrChangeOp {
        return this._args[2];
    }

    protected _validate(checkJSON: AttrChangeJSON): AttrChangeJSON {
        return AttrChangeJSON.parse(checkJSON) as AttrChangeJSON;
    }

    /**
     * Get a method checking whether an attribute of a sprite changed.
     * Attributes: checks, x, y, pos , direction, visible, size, currentCostume, this.volume, layerOrder, sayText
     * (only = allowed);
     * @param t Instance of the test driver for retrieving the value of an attribute of a sprite and its clones.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        const [pSpriteName, attrName] = this._args;

        const sprite = ModelUtil.getStageOrSprite(t, pSpriteName);
        const spriteName = sprite.name;
        if (!this._isForEffect) {
            ModelUtil.checkAttributeExistence(t, spriteName, attrName);
        }

        // The attribute sayText cannot be used as an AttributeChange predicate with any other operand than =, as it
        // is not a numerical value and e.g. an increase (+) on a string is not desired to be representable. An
        // AttributeChange predicate with sayText fails in the execution with e.g.
        // -> Error: Sprite1.sayText: Is not a numerical value to compare: Hello!
        // Therefore, no instrumentation is done here for the sayText attribute.
        if (attrName == "x" || attrName == "y") {
            this._registerOnMoveAttrChange(cu, graphID, spriteName);
        } else if (this._isForEffect || ["size", "direction", "effect", "visible", "currentCostumeName", "rotationStyle"].includes(attrName)) {
            this._registerOnVisualAttrChange(cu, graphID, spriteName);
        }

        return () => {
            const sprites = sprite.isStage ? [t.getStage()] : t.getSprite(spriteName).getClones(true);
            const Exception = this._isForEffect ? ErrorForEffect : ErrorForAttribute;

            const context = `${spriteName}.${attrName}`;
            try {
                return this._change.apply(sprites.map((s) => this._getAttr(s, attrName))).enhance(context);
            } catch (e) {
                throw new Exception(pSpriteName, attrName, e);
            }
        };
    }

    private _getAttr(s: Sprite, attrName: string) {
        return this._isForEffect
            ? [s.effects[attrName], s.old.effects[attrName]]
            : [s[attrName], s.old[attrName]];
    }

    private _registerOnMoveAttrChange(cu: CheckUtility, graphID: string, spriteName: string) {
        const [pSpriteName, attrName] = this._args;
        cu.registerOnMoveEvent(spriteName, this, graphID, (sprite) => {
            try {
                return this._change.applySingle(sprite[attrName], sprite.old[attrName]);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
        });
    }

    private _registerOnVisualAttrChange(cu: CheckUtility, graphID: string, spriteName: string) {
        const [pSpriteName, attrName] = this._args;
        const Exception = this._isForEffect ? ErrorForEffect : ErrorForAttribute;
        cu.registerOnVisualChange(spriteName, this, graphID, (sprite) => {
            try {
                return this._change.applySingle(...this._getAttr(sprite, attrName));
            } catch (e) {
                throw new Exception(pSpriteName, attrName, e);
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

        return this._change.contradicts(that._change);
    }
}
