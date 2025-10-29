import {BoundedCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {ErrorForAttribute, ErrorForEffect} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {AttributeType, ComparingCheck, Comparison, Interval, newComparison} from "./Comparison";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {
    AttrName,
    BooleanAttribute,
    BooleanLike,
    ComparisonOp,
    Effect,
    EffectAttribute,
    EqOrNeq,
    NumberAttribute,
    NumberLike,
    parseAttributeError,
    ParsingResult,
    SpriteName,
    StringAttribute,
} from "./CheckTypes";
import {checkAttributeExistence, currentMaxLayer, isAnEffect} from "../util/ModelUtil";

const name = "AttrComp" as const;

const attrNameIndex = 1;

export type AttrCompArgs =
    [spriteName: SpriteName, attrName: NumberAttribute | Effect, comparisonOp: ComparisonOp, attrValue: number]
    | [spriteName: SpriteName, attrName: StringAttribute, comparisonOp: EqOrNeq, attrValue: string]
    | [spriteName: SpriteName, attrName: BooleanAttribute, comparisonOp: EqOrNeq, attrValue: boolean]

const AttrCompArgs = z.union([
    z.tuple([SpriteName, NumberAttribute.or(EffectAttribute), ComparisonOp, NumberLike]),
    z.tuple([SpriteName, StringAttribute, EqOrNeq, z.string()]),
    z.tuple([SpriteName, BooleanAttribute, EqOrNeq, BooleanLike]),
], {message: "InvalidAttribute"});

export interface AttrCompJSON extends ICheckJSON {
    name: typeof name;
    args: AttrCompArgs;
}

export const AttrCompJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: AttrCompArgs,
});

export class AttrComp extends BoundedCheck<AttrCompJSON, CheckFun0> implements ComparingCheck {
    private readonly _isForEffect: boolean;
    private readonly _attrName: AttrName;
    private _comparison: Comparison<Interval>;

    constructor(edgeLabel: string, json: SlimCheckJSON<AttrCompJSON>) {
        super(edgeLabel, {...json, name});
        this._attrName = this._args[1];
        this._comparison = newComparison(this, null);
        this._isForEffect = isAnEffect(this._attrName);
    }

    get attrName(): AttrName {
        return this._attrName;
    }

    get operator(): ComparisonOp {
        return this._args[2];
    }

    get value(): AttributeType {
        return this._args[3];
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseAttributeError(AttrCompArgs.safeParse(args), attrNameIndex);
    }

    protected _validate(checkJSON: AttrCompJSON): AttrCompJSON {
        return AttrCompJSON.parse(checkJSON) as AttrCompJSON;
    }

    /**
     * Get a method for checking whether a sprite's attribute has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver for retrieving the value of an attribute of a sprite and its clones.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const pSpriteName = this._args[0];

        const sprite = this._getStageOrSprite(pSpriteName);
        const spriteName = sprite.name;
        if (!this._isForEffect) {
            checkAttributeExistence(t, spriteName, this._attrName);
        }

        const Exception = this._isForEffect ? ErrorForEffect : ErrorForAttribute;
        const bounds = this._getBound(sprite, t);
        this._comparison = newComparison(this, bounds);

        // on movement listener
        if (this._attrName == "x" || this._attrName == "y") {
            this._registerOnMoveEvent(spriteName);
        } else if (this._isForEffect || ["size", "direction", "visible", "currentCostumeName", "rotationStyle"].includes(this._attrName)) {
            this._registerOnVisualChange(spriteName);
        } else if (this._attrName == "sayText") {
            this._registerOutput(spriteName);
        }

        return () => {
            try {
                this._updateBounds(sprite, t);
                return this._comparison.apply(this._getAttr(sprite));
            } catch (e) {
                throw new Exception(pSpriteName, this._attrName, e);
            }
        };
    }

    protected override _contradicts(that: AttrComp): boolean {
        const [thisSpriteName, thisAttrName] = this._args;
        const [thatSpriteName, thatAttrName] = that._args;

        if (thisSpriteName !== thatSpriteName || thisAttrName !== thatAttrName) {
            return false;
        }

        return this._comparison.contradicts(that._comparison);
    }

    protected _updateBounds(s: Sprite, t: TestDriver): void {
        if (this._boundsNeedUpdate(s)) {
            const res = this._getBound(s, t);
            this._comparison = newComparison(this, res);
        }
    }

    private _getAttr(s: Sprite) {
        return this._isForEffect ? s.effects[this._attrName] : s[this._attrName];
    }

    private _getBound(s: Sprite, t: TestDriver): Interval | null {
        switch (this._attrName) {
            case "x":
                return {...s.getRangeOfX()};
            case "y":
                return {...s.getRangeOfY()};
            case "size":
                return {...s.getRangeOfSize()};
            case "layerOrder":
                return {min: 1, max: currentMaxLayer(t)};
            case "direction":
                return {min: -180, max: 180};
            case "volume":
                return {min: 0, max: 100};
            case "currentCostume":
                return {min: 0, max: s.getCostumeCount()};
            // the wiki states bounds for effects but the actual value of the effects has no bounds
            default:
                return null;
        }
    }
}
