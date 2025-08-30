import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForAttribute, ErrorForEffect} from "../util/ModelError";
import {CheckUtility} from "../util/CheckUtility";
import {z} from "zod";
import {Bounds, Change, ChangingCheck, newQuantifiedChange} from "./Change";
import {Quantification} from "./Quantification";
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

const name = "AttrChange" as const;

const bounds: Record<AttrName, Bounds | null> = Object.freeze({
    x: {min: -240, max: 240, kind: "clamped"},
    y: {min: -180, max: 180, kind: "clamped"},
    layerOrder: {min: 1, max: Number.MAX_VALUE, kind: "clamped"},
    direction: {min: -180, max: 180, kind: "cyclic"},

    // TODO: Unsure about some of those...
    size: {min: 1, max: Number.MAX_VALUE, kind: "clamped"},
    volume: {min: 0, max: 100, kind: "clamped"},
    color: {min: 0, max: 200, kind: "cyclic"},
    fisheye: {min: -100, max: Number.MAX_VALUE, kind: "clamped"},
    brightness: {min: -100, max: 100, kind: "clamped"},
    ghost: {min: 0, max: 100, kind: "clamped"},
    pixelate: {min: 0, max: Number.MAX_VALUE, kind: "clamped"},
    mosaic: {min: 0, max: 5105, kind: "clamped"},
    whirl: null,
    currentCostume: null, //depends on how many costumes a sprite has

    // These attributes don't have numeric values -> specifying bounds wouldn't make sense.
    currentCostumeName: null,
    sayText: null,
    rotationStyle: null,
    visible: null,
    pos: null,
    effects: null,
});

const attrNameIndex = 1;

export type AttrChangeArgs =
    [spriteName: SpriteName, attrName: NumberAttribute | Effect, change: NumberOrChangeOp]
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

export class AttrChange extends AbstractCheck<AttrChangeJSON, CheckFun0> implements ChangingCheck {
    private readonly _change: Quantification<Change>;
    private readonly _isForEffect: boolean;
    private readonly _attributeName: AttrName;

    constructor(edgeLabel: string, json: SlimCheckJSON<AttrChangeJSON>) {
        super(edgeLabel, {...json, name});
        this._attributeName = this._args[1];
        this._change = newQuantifiedChange(this, bounds[this._attributeName]);
        this._isForEffect = ModelUtil.isAnEffect(this._attributeName);
    }

    get change(): NumberOrChangeOp {
        return this._args[2];
    }

    override get dependsOnSayText(): boolean {
        return this._args[1] === "sayText";
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseAttributeError(AttrChangeArgs.safeParse(args), attrNameIndex);
    }

    /**
     * Get a method checking whether an attribute of a sprite changed.
     * Attributes: checks, x, y, pos , direction, visible, size, currentCostume, this.volume, layerOrder, sayText
     * (only = allowed);
     * @param t Instance of the test driver for retrieving the value of an attribute of a sprite and its clones.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const [pSpriteName, attrName] = this._args;

        const sprite = ModelUtil.getStageOrSprite(t, pSpriteName);
        const spriteName = sprite.name;
        if (!this._isForEffect) {
            ModelUtil.checkAttributeExistence(t, spriteName, attrName);
        }

        const Exception = this._isForEffect ? ErrorForEffect : ErrorForAttribute;

        const listener = (sprite: Sprite) => {
            try {
                return this._change.applySingle(...this._getAttr(sprite));
            } catch (e) {
                throw new Exception(pSpriteName, attrName, e);
            }
        };

        // The attribute sayText cannot be used as an AttributeChange predicate with any other operand than =, as it
        // is not a numerical value and e.g. an increase (+) on a string is not desired to be representable. An
        // AttributeChange predicate with sayText fails in the execution with e.g.
        // -> Error: Sprite1.sayText: Is not a numerical value to compare: Hello!
        // Therefore, no instrumentation is done here for the sayText attribute.
        if (attrName == "x" || attrName == "y") {
            this._registerOnMoveEvent(spriteName, listener);
        } else if (this._isForEffect || ["size", "direction", "visible", "currentCostumeName", "rotationStyle"].includes(attrName)) {
            this._registerOnVisualChange(spriteName, listener);
        }

        return () => {
            const sprites = sprite.isStage ? [t.getStage()] : t.getSprite(spriteName).getClones(true);

            try {
                return this._change.apply(sprites.map((s: Sprite) => this._getAttr(s)));
            } catch (e) {
                throw new Exception(pSpriteName, attrName, e);
            }
        };
    }

    protected _validate(checkJSON: AttrChangeJSON): AttrChangeJSON {
        return AttrChangeJSON.parse(checkJSON) as AttrChangeJSON;
    }

    protected override _contradicts(that: AttrChange): boolean {
        const [spriteNameThis, attrNameThis] = this._args;
        const [spriteNameThat, attrNameThat] = that._args;

        if (spriteNameThis !== spriteNameThat || attrNameThis !== attrNameThat) {
            return false;
        }

        return this._change.contradicts(that._change);
    }

    private _getAttr(s: Sprite) {
        return this._isForEffect
            ? [s.effects[this._attributeName], s.old.effects[this._attributeName]]
            : [s[this._attributeName], s.old[this._attributeName]];
    }
}
