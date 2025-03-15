import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForAttribute, ErrorForEffect} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {AttributeType, ComparingCheck, Comparison, ComparisonOp, newQuantifiedComparison} from "./Comparison";
import {Quantification} from "./Quantification";
import TestDriver from "../../../test/test-driver";
import {
    AttrNames,
    BooleanAttribute,
    Effect,
    EffectNames,
    NumberAttribute,
    NumberAttributeNames,
    StringAttribute, StringAttributeNames
} from "./AttrChange";

const name = "AttrComp" as const;
type PosType = {
    x: number,
    y: number
}
export type AttrCompArgs =
    [spriteName: SpriteName, attrName: StringAttribute, comparisonOp: "==" | "!=", attrValue: string]
    | [spriteName: SpriteName, attrName: NumberAttribute | Effect, comparisonOp: ComparisonOp, attrValue: number ]
    | [spriteName: SpriteName, attrName: BooleanAttribute, comparisonOp: "==" | "!=", attrValue: boolean ]
    | [spriteName: SpriteName, attrName: "pos", comparisonOp: "==" | "!=", attrValue: PosType]
    | [spriteName: SpriteName, attrName: "effects", comparisonOp: "==" | "!=", attrValue: number[]];

const AttrCompArgs = z.union([
    z.tuple([SpriteName, z.literal("visible"), z.union([z.literal("=="), z.literal("!=")]), z.string().or(z.boolean())]),
    z.tuple([SpriteName, z.literal("pos"), z.union([z.literal("=="), z.literal("!=")]), z.string()]),
    z.tuple([SpriteName, z.literal("effects"), z.union([z.literal("=="), z.literal("!=")]), z.string()]),
    z.tuple([SpriteName, z.enum(NumberAttributeNames), ComparisonOp, z.string().or(z.number())]),
    z.tuple([SpriteName, z.enum(EffectNames), ComparisonOp, z.string().or(z.number())]),
    z.tuple([SpriteName, z.enum(StringAttributeNames), ComparisonOp, z.string()]),
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
    private readonly _comparison: Quantification<Comparison>;
    private readonly _isForEffect: boolean;
    private readonly _attrName: AttrNames;
    constructor(edgeLabel: string, json: SlimCheckJSON<AttrCompJSON>) {
        super(edgeLabel, {...json, name});
        this._attrName = this._args[1];
        this._comparison = newQuantifiedComparison(this);
        this._isForEffect = ModelUtil.isAnEffect(this._attrName);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // if (NumberAttributeNames.includes(this._attrName) || EffectNames.includes(this._attrName)) {
        //     this._args[3] = ModelUtil.testNumber(Number(this._args[3]));
        // } else if (this._attrName === "visible") {
        //     this._args[3] = Boolean(this._args[3]);
        // } else if (this._attrName === "pos" && typeof this._args[3] == "string") {
        //     this._args[3] = {x: 0, y: 0}; // TODO change to proper parsing
        // } else if (this._attrName === "effects" && typeof this._args[3] == "string") {
        //     this._args[3] = this._args[3].substring(1, this._args[3].length).split(",").map(ModelUtil.testNumber);
        // }
        // this._comparison = newQuantifiedComparison({operator: this.operator, value: this.value, negated: this.negated});
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

        const listener = (sprite: Sprite) => {
            const Exception = this._isForEffect ? ErrorForEffect : ErrorForAttribute;
            try {
                return this._comparison.applySingle(this._getAttr(sprite));
            } catch (e) {
                throw new Exception(pSpriteName, this._attrName, e);
            }
        };

        // on movement listener
        if (this._attrName == "x" || this._attrName == "y") {
            cu.registerOnMoveEvent(spriteName, this, graphID, listener);
        } else if (this._isForEffect || ["size", "direction", "effect", "visible", "currentCostumeName", "rotationStyle"].includes(this._attrName)) {
            cu.registerOnVisualChange(spriteName, this, graphID, listener);
        } else if (this._attrName == "sayText") {
            cu.registerOutput(spriteName, this, graphID, listener);
        }

        return () => {
            const sprites:Sprite[] = sprite.isStage ? [t.getStage()] : t.getSprite(spriteName).getClones(true);
            const Exception = this._isForEffect ? ErrorForEffect : ErrorForAttribute;

            try {
                return this._comparison.apply(sprites.map(s=> this._getAttr(s)));
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
}
