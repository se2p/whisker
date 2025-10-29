import {BoundedCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {ErrorForAttribute, ErrorForEffect} from "../util/ModelError";
import {z} from "zod";
import {Bounds, Change, ChangingCheck, newChange} from "./Change";
import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {
    AttrName,
    BooleanAttribute,
    Effect,
    EffectAttribute,
    EqOrNeq,
    NumberAttribute,
    NumberOrChangeOp,
    parseAttributeError,
    ParsingResult,
    SpriteName,
    StringAttribute
} from "./CheckTypes";
import {checkAttributeExistence, currentMaxLayer, isAnEffect} from "../util/ModelUtil";

const name = "AttrChange" as const;

const attrNameIndex = 1;

export type AttrChangeArgs =
    | [spriteName: SpriteName, attrName: NumberAttribute | Effect, change: NumberOrChangeOp]
    | [spriteName: SpriteName, attrName: StringAttribute, change: EqOrNeq]
    | [spriteName: SpriteName, attrName: BooleanAttribute, change: EqOrNeq];


const AttrChangeArgs = z.union([
    z.tuple([SpriteName, NumberAttribute.or(EffectAttribute), NumberOrChangeOp]),
    z.tuple([SpriteName, StringAttribute, EqOrNeq]),
    z.tuple([SpriteName, BooleanAttribute, EqOrNeq]),
], {message: "InvalidAttribute"});

export interface AttrChangeJSON extends ICheckJSON {
    name: typeof name;
    args: AttrChangeArgs;
}

export const AttrChangeJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: AttrChangeArgs,
});

export class AttrChange extends BoundedCheck<AttrChangeJSON, CheckFun0> implements ChangingCheck {

    private readonly _isForEffect: boolean;
    private readonly _attributeName: AttrName;
    private _change: Change;

    constructor(edgeLabel: string, json: SlimCheckJSON<AttrChangeJSON>) {
        super(edgeLabel, {...json, name});
        this._attributeName = this._args[1];
        this._change = newChange(this, null);
        this._isForEffect = isAnEffect(this._attributeName);
    }

    get attrName(): AttrName {
        return this._attributeName;
    }

    get change(): NumberOrChangeOp {
        return this._args[2];
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseAttributeError(AttrChangeArgs.safeParse(args), attrNameIndex);
    }

    protected _validate(checkJSON: AttrChangeJSON): AttrChangeJSON {
        return AttrChangeJSON.parse(checkJSON) as AttrChangeJSON;
    }

    /**
     * Get a method checking whether an attribute of a sprite changed.
     * Attributes: checks, x, y, pos , direction, visible, size, currentCostume, this.volume, layerOrder, sayText
     * (only = allowed);
     * @param t Instance of the test driver for retrieving the value of an attribute of a sprite and its clones.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const [pSpriteName, attrName] = this._args;

        const sprite = this._getStageOrSprite(pSpriteName);
        const spriteName = sprite.name;
        if (!this._isForEffect) {
            checkAttributeExistence(t, spriteName, attrName);
        }
        this._change = newChange(this, this._getBound(sprite, t));

        const Exception = this._isForEffect ? ErrorForEffect : ErrorForAttribute;

        // The attribute sayText cannot be used as an AttributeChange predicate with any other operand than =, as it
        // is not a numerical value and e.g. an increase (+) on a string is not desired to be representable. An
        // AttributeChange predicate with sayText fails in the execution with e.g.
        // -> Error: Sprite1.sayText: Is not a numerical value to compare: Hello!
        // Therefore, no instrumentation is done here for the sayText attribute.
        if (attrName == "x" || attrName == "y") {
            this._registerOnMoveEvent(spriteName);
        } else if (this._isForEffect || ["size", "direction", "visible", "currentCostumeName", "rotationStyle"].includes(attrName)) {
            this._registerOnVisualChange(spriteName);
        }

        return () => {
            try {
                this._updateBounds(sprite, t);
                return this._change.apply(...this._getAttr(sprite));
            } catch (e) {
                throw new Exception(pSpriteName, attrName, e);
            }
        };
    }

    protected override _contradicts(that: AttrChange): boolean {
        const [spriteNameThis, attrNameThis] = this._args;
        const [spriteNameThat, attrNameThat] = that._args;

        if (spriteNameThis !== spriteNameThat || attrNameThis !== attrNameThat) {
            return false;
        }

        return this._change.contradicts(that._change);
    }

    protected _updateBounds(s: Sprite, t: TestDriver): void {
        if (this._boundsNeedUpdate(s)) {
            const res = this._getBound(s, t);
            this._change = newChange(this, res);
        }
    }

    private _getAttr(s: Sprite): [number, number] {
        return this._isForEffect
            ? [s.effects[this._attributeName], s.old.effects[this._attributeName]]
            : [s[this._attributeName], s.old[this._attributeName]];
    }

    private _getBound(s: Sprite, t: TestDriver): Bounds | null {
        switch (this._attributeName) {
            case "x":
                return {...s.getRangeOfX(), kind: "clamped"};
            case "y":
                return {...s.getRangeOfY(), kind: "clamped"};
            case "size":
                return {...s.getRangeOfSize(), kind: "clamped"};
            case "layerOrder":
                return {min: 1, max: currentMaxLayer(t), kind: "clamped"};
            case "direction":
                return {min: -180, max: 180, kind: "cyclic"};
            case "volume":
                return {min: 0, max: 100, kind: "clamped"};
            case "currentCostume":
                return {min: 0, max: s.getCostumeCount(), kind: "cyclic"};
            // the wiki states bounds for effects but the actual value of the effects has no bounds
            default:
                return null;
        }
    }
}
