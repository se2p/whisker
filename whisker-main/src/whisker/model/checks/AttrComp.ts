import {AbstractCheck, AttrName, CheckFun0, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForAttribute, ErrorForEffect} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {AttributeType, ComparingCheck, Comparison, ComparisonOp, newQuantifiedComparison} from "./Comparison";
import {Quantification} from "./Quantification";
import TestDriver from "../../../test/test-driver";
import {
    BooleanAttribute,
    Effect,
    EffectNames,
    NumberAttribute,
    NumberAttributeNames,
    StringAttribute
} from "./AttrChange";

const name = "AttrComp" as const;
type PosType = {
    x: number,
    y: number
}
export type AttrCompArgs =
    [spriteName: SpriteName, attrName: StringAttribute, comparisonOp: "==" | "!=", attrValue: string]
    | [spriteName: SpriteName, attrName: NumberAttribute | Effect, comparisonOp: ComparisonOp, attrValue: number | string]
    | [spriteName: SpriteName, attrName: BooleanAttribute, comparisonOp: ComparisonOp, attrValue: boolean | string]
    | [spriteName: SpriteName, attrName: "pos", comparisonOp: ComparisonOp, attrValue: PosType | string]
    | [spriteName: SpriteName, attrName: "effects", comparisonOp: ComparisonOp, attrValue: number[] | string];

const AttrCompArgs = z.tuple([SpriteName, AttrName, ComparisonOp, z.string().or(z.number()),
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

    constructor(edgeLabel: string, json: SlimCheckJSON<AttrCompJSON>) {
        super(edgeLabel, {...json, name});
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (NumberAttributeNames.includes(this._args[1]) || EffectNames.includes(this._args[1])) {
            this._args[3] = ModelUtil.testNumber(Number(this._args[3]));
        } else if (this._args[1] === "visible") {
            this._args[3] = Boolean(this._args[3]);
        } else if (this._args[1] === "pos" && typeof this._args[3] == "string") {
            this._args[3] = {x: 0, y: 0}; // TODO change to proper parsing
        } else if (this._args[1] === "effects" && typeof this._args[3] == "string") {
            this._args[3] = this._args[3].substring(1, this._args[3].length).split(",").map(ModelUtil.testNumber);
        }
        this._comparison = newQuantifiedComparison(this);
        this._isForEffect = ModelUtil.isAnEffect(this._args[1]);
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
        const [pSpriteName, attrName] = this._args;

        const sprite = ModelUtil.getStageOrSprite(t, pSpriteName);
        const spriteName = sprite.name;
        if (!this._isForEffect) {
            ModelUtil.checkAttributeExistence(t, spriteName, attrName);
        }

        const listener = (sprite: Sprite) => {
            const Exception = this._isForEffect ? ErrorForEffect : ErrorForAttribute;
            try {
                return this._comparison.applySingle(this._getAttr(sprite, attrName));
            } catch (e) {
                throw new Exception(pSpriteName, attrName, e);
            }
        };

        // on movement listener
        if (attrName == "x" || attrName == "y") {
            cu.registerOnMoveEvent(spriteName, this, graphID, listener);
        } else if (this._isForEffect || ["size", "direction", "effect", "visible", "currentCostumeName", "rotationStyle"].includes(attrName)) {
            cu.registerOnVisualChange(spriteName, this, graphID, listener);
        } else if (attrName == "sayText") {
            cu.registerOutput(spriteName, this, graphID, listener);
        }

        return () => {
            const sprites = sprite.isStage ? [t.getStage()] : t.getSprite(spriteName).getClones(true);
            const Exception = this._isForEffect ? ErrorForEffect : ErrorForAttribute;

            try {
                return this._comparison.apply(sprites.map((s) => this._getAttr(s, attrName)));
            } catch (e) {
                throw new Exception(pSpriteName, attrName, e);
            }
        };
    }

    private _getAttr(s: Sprite, attrName: string) {
        return this._isForEffect ? s.effects[attrName] : s[attrName];
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

        return this._comparison.contradicts(that._comparison);
    }
}
