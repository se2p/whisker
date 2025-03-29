import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForAttribute, ErrorForEffect} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {AttributeType, ComparingCheck, Comparison, newQuantifiedComparison} from "./Comparison";
import {Quantification} from "./Quantification";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {
    AttrNames,
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

const name = "AttrComp" as const;

export type AttrCompArgs =
    [spriteName: SpriteName, attrName: NumberAttribute | Effect, comparisonOp: ComparisonOp, attrValue: number]
    | [spriteName: SpriteName, attrName: StringAttribute, comparisonOp: EqOrNeq, attrValue: string]
    | [spriteName: SpriteName, attrName: BooleanAttribute, comparisonOp: EqOrNeq, attrValue: boolean]

const AttrCompArgs = z.union([
    z.tuple([SpriteName, NumberAttribute, ComparisonOp, NumberLike]),
    z.tuple([SpriteName, EffectAttribute, ComparisonOp, NumberLike]),
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

export class AttrComp extends AbstractCheck<AttrCompJSON, CheckFun0> implements ComparingCheck {
    private readonly _comparison: Quantification<Comparison>;
    private readonly _isForEffect: boolean;
    private readonly _attrName: AttrNames;

    constructor(edgeLabel: string, json: SlimCheckJSON<AttrCompJSON>) {
        super(edgeLabel, {...json, name});
        this._attrName = this._args[1];
        this._comparison = newQuantifiedComparison(this);
        this._isForEffect = ModelUtil.isAnEffect(this._attrName);
    }

    get operator(): ComparisonOp {
        return this._args[2];
    }

    get value(): AttributeType {
        return this._args[3];
    }

    protected _validate(checkJSON: AttrCompJSON): AttrCompJSON {
        return AttrCompJSON.parse(checkJSON) as AttrCompJSON;
    }

    /**
     * Get a method for checking whether a sprite's attribute has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver for retrieving the value of an attribute of a sprite and its clones.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        const pSpriteName = this._args[0];

        const sprite = ModelUtil.getStageOrSprite(t, pSpriteName);
        const spriteName = sprite.name;
        if (!this._isForEffect) {
            ModelUtil.checkAttributeExistence(t, spriteName, this._attrName);
        }

        const Exception = this._isForEffect ? ErrorForEffect : ErrorForAttribute;

        const listener = (sprite: Sprite) => {
            try {
                return this._comparison.applySingle(this._getAttr(sprite));
            } catch (e) {
                throw new Exception(pSpriteName, this._attrName, e);
            }
        };

        // on movement listener
        if (this._attrName == "x" || this._attrName == "y") {
            cu.registerOnMoveEvent(spriteName, this, graphID, listener);
        } else if (this._isForEffect || ["size", "direction", "visible", "currentCostumeName", "rotationStyle"].includes(this._attrName)) {
            cu.registerOnVisualChange(spriteName, this, graphID, listener);
        } else if (this._attrName == "sayText") {
            cu.registerOutput(spriteName, this, graphID, listener);
        }

        return () => {
            const sprites: Sprite[] = sprite.isStage ? [t.getStage()] : t.getSprite(spriteName).getClones(true);

            try {
                return this._comparison.apply(sprites.map(s => this._getAttr(s)));
            } catch (e) {
                throw new Exception(pSpriteName, this._attrName, e);
            }
        };
    }

    private _getAttr(s: Sprite) {
        return this._isForEffect ? s.effects[this._attrName] : s[this._attrName];
    }

    override get dependsOnSayText(): boolean {
        return this._attrName === "sayText";
    }

    protected override _contradicts(that: AttrComp): boolean {
        const [thisSpriteName, thisAttrName] = this._args;
        const [thatSpriteName, thatAttrName] = that._args;

        if (thisSpriteName !== thatSpriteName || thisAttrName !== thatAttrName) {
            return false;
        }

        return this._comparison.contradicts(that._comparison);
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseAttributeError(AttrCompArgs.safeParse(args));
    }
}
