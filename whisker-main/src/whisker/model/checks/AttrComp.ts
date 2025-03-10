import {AbstractCheck, AttrName, CheckFun0, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForAttribute, ErrorForEffect} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {ComparingCheck, Comparison, ComparisonOp, newQuantifiedComparison} from "./Comparison";
import {Quantification} from "./Quantification";
import {fail} from "./CheckResult";
import TestDriver from "../../../test/test-driver";

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
    comparisonOp: ComparisonOp,

    /**
     * Value to compare to the attribute's current value.
     */
    attrValue: string | number,
];

const AttrCompArgs = z.tuple([
    SpriteName,
    AttrName,
    ComparisonOp,
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
    private readonly _comparison: Quantification<Comparison>;
    private readonly _isForEffect: boolean;

    constructor(edgeLabel: string, json: SlimCheckJSON<AttrCompJSON>) {
        super(edgeLabel, {...json, name});
        this._comparison = newQuantifiedComparison(this);
        this._isForEffect = ModelUtil.isAnEffect(this._args[1]);
    }

    get operator(): ComparisonOp {
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
        const context = `${spriteName}.${attrName}`;


        const listener = (sprite: Sprite) => {
            const Exception = this._isForEffect ? ErrorForEffect : ErrorForAttribute;
            try {
                return this._comparison.applySingle(this._getAttr(sprite, attrName)).enhance(context);
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
                return this._comparison.apply(sprites.map((s) => this._getAttr(s, attrName))).enhance(context);
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
