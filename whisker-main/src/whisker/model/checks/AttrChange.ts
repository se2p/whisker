import {
    AbstractCheck,
    AttrName,
    CheckFun0,
    couldBeSpriteName,
    ICheckJSON,
    SlimCheckJSON,
    SpriteName
} from "./AbstractCheck";
import {EffectNames, ModelUtil, NumberAttributeNames, StringAttributeNames} from "../util/ModelUtil";
import {ErrorForAttribute, ErrorForEffect} from "../util/ModelError";
import {CheckUtility} from "../util/CheckUtility";
import {z} from "zod";
import {Change, ChangingCheck, isValidChangeOperator, newQuantifiedChange, NumberOrChangeOp} from "./Change";
import {Quantification} from "./Quantification";
import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {NotYetImplementedException} from "../../core/exceptions/NotYetImplementedException";
import {CheckResult, fail, pass} from "./CheckResult";
import {ArgType} from "../util/schema";
import {InputErrorCodes} from "./newCheck";

const name = "AttrChange" as const;

export const EqOrNeqOPs = ["=", "!="] as const;
export type StringAttribute = typeof StringAttributeNames[number];
export type NumberAttribute = typeof NumberAttributeNames[number];
export type BooleanAttribute = "visible"
export type Effect = typeof EffectNames[number];
export type EqOrNeqOp = typeof EqOrNeqOPs[number];
export type AttrNames = StringAttribute | NumberAttribute | Effect | BooleanAttribute;
export type AttrChangeArgs =
    [spriteName: SpriteName, attrName: StringAttribute, change: EqOrNeqOp]
    | [spriteName: SpriteName, attrName: NumberAttribute | Effect, change: NumberOrChangeOp]
    | [spriteName: SpriteName, attrName: "visible", change: EqOrNeqOp];


const AttrChangeArgs = z.union([
    z.tuple([SpriteName, AttrName, NumberOrChangeOp,]),
    z.tuple([])
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
    private readonly _attributeIsNumber: boolean;
    private readonly _attributeName: AttrNames;

    constructor(edgeLabel: string, json: SlimCheckJSON<AttrChangeJSON>) {
        super(edgeLabel, {...json, name});
        this._change = newQuantifiedChange(this);
        this._attributeName = this._args[1];
        this._isForEffect = ModelUtil.isAnEffect(this._attributeName);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this._attributeIsNumber = this._isForEffect || NumberAttributeNames.includes(this._attributeName);
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
        const sprite = ModelUtil.getStageOrSprite(t, this._args[0]);
        const spriteName = sprite.name;
        if (!this._isForEffect) {
            ModelUtil.checkAttributeExistence(t, spriteName, this._attributeName);
        }

        // The attribute sayText cannot be used as an AttributeChange predicate with any other operand than =, as it
        // is not a numerical value and e.g. an increase (+) on a string is not desired to be representable. An
        // AttributeChange predicate with sayText fails in the execution with e.g.
        // -> Error: Sprite1.sayText: Is not a numerical value to compare: Hello!
        // Therefore, no instrumentation is done here for the sayText attribute.
        const check = (s: Sprite) => {
            try {
                return this._attributeIsNumber
                    ? this.checkChangeConsideringBounds(s)
                    : this._change.applySingle(this._getAttr(s));
            } catch (e) {
                throw new ErrorForAttribute(spriteName, this._attributeName, e);
            }
        };
        if (this._attributeName == "x" || this._attributeName == "y") {
            cu.registerOnMoveEvent(spriteName, this, graphID, check);
        } else if (this._isForEffect || ["size", "direction", "visible", "currentCostumeName", "rotationStyle"].includes(this._attributeName)) {
            cu.registerOnVisualChange(spriteName, this, graphID, check);
        }

        return () => {
            const sprites: Sprite[] = sprite.isStage ? [t.getStage()] : t.getSprite(spriteName).getClones(true);
            const Exception = this._isForEffect ? ErrorForEffect : ErrorForAttribute;

            try {
                if (!this._attributeIsNumber) {
                    return this._change.apply(sprites.map(s => this._getAttr(s)));
                }
                const reason: Record<string, Record<string, unknown>> = {};
                for (let i = 0; i < sprites.length; i++) {
                    const s = sprites[i];
                    const res = this.checkChangeConsideringBounds(s);
                    if (res.passed === false) {
                        reason[`${spriteName}${i}`] = res.reason;
                    } else if (!this.negated) {
                        return pass(); // there exists a pass() so pass()
                    }
                }
                const count = Object.keys(reason).length;
                return count == 0 ? pass() : (count == 1 ? fail(Object.values(reason)[0]) : fail(reason));
            } catch (e) {
                throw new Exception(spriteName, this._attributeName, e);
            }
        };
    }

    private _getAttr(s: Sprite) {
        return this._isForEffect
            ? [s.effects[this._attributeName], s.old.effects[this._attributeName]]
            : [s[this._attributeName], s.old[this._attributeName]];
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

    private checkChangeConsideringBounds(s: Sprite): CheckResult {
        const [current, old] = this._getAttr(s);
        switch (this._attributeName) {
            case "x":
                return this.checkBoundedChange(current, old, this.change, -240, 240);
            case "y":
                return this.checkBoundedChange(current, old, this.change, -180, 180);
            case "layerOrder":
                return this.checkBoundedChange(current, old, this.change, 1, Number.MAX_VALUE);
            case "direction":
                return this.checkCyclicChange(current, old, this.change, -180, 180);
            case "size": // TODO this should probably be changed
                return this._change.applySingle(current, old);
            case "volume":
                throw new NotYetImplementedException(); // TODO: I don't now the details of this one
            case "color":
                return this._change.applySingle(current, old);
            // TODO: the following would be correct according to the scratch wiki
            //  but the change is not divided by 2 and also the color is not even bounded by 1900
            // return this.checkCyclicChange(current, old, typeof (this.change) == "number" ? this.change / 2 : this.change, 0, 100);
            case "fisheye":
                return this.checkBoundedChange(current, old, this.change, -100, 1073741723);
            case "brightness":
                return this.checkBoundedChange(current, old, this.change, -100, 100);
            case "ghost":
                return this.checkBoundedChange(current, old, this.change, 0, 100);
            case "pixelate": //if set to -5 the actual value apparently is 5
                return this.checkBoundedChange(current, old, this.change, 0, Number.MAX_VALUE);
            case "mosaic": //if set to -5 the actual value apparently is 5
                return this.checkBoundedChange(current, old, this.change, 0, 5105);
            case "whirl": //TODO
                // return this.checkBoundedChange(current, old, change, ?, 1.94967423051954E+40);
                return this._change.applySingle(current, old);
            default:
                throw new Error(this._attributeName + " should have been dealt with.");
        }
    }

    private checkCyclicChange(current: number, old: number, changeOp: NumberOrChangeOp, min: number, max: number): CheckResult {
        const change = ModelUtil.returnNumberIfPossible(changeOp, null);
        if (change == null) {
            // Overflow can happen here but if this is considered any value is possible if op is not "=" or "!="
            return this._change.applySingle(current, old);
        }
        let expected = old + change;
        if (expected > max) {
            expected = min + expected - max;
        } else if (expected < min) {
            expected = max + expected - min;
        }
        const reason = {current: current, old: old, expected, theoreticalChange: old + change, min: min, max: max};
        return this.negated != (current === expected) ? pass() : fail(reason);
    }

    private checkBoundedChange(current: number, old: number, changeOp: NumberOrChangeOp, min: number, max: number): CheckResult {
        const reason: Record<string, unknown> = {"current": current, "old": old, "change": current - old};
        if (changeOp === "+") {
            return this.negated != (current > old || current >= max) ? pass() : fail(reason);
        }
        if (changeOp === "-") {
            return this.negated != (current < old || current <= min) ? pass() : fail(reason);
        }
        const change = ModelUtil.returnNumberIfPossible(changeOp, null);
        if (change != null) {
            const result = change > 0
                ? current >= Math.min(max, old + change)
                : current <= Math.max(min, old + change)
            ;
            return this.negated != result ? pass() : fail({
                ...reason,
                expectedForCurrent: Math.min(Math.max(min, old + change), max),
                unBoundedExpectedValue: old + change,
                min: min,
                max: max
            });
        }
        return this._change.applySingle(current, old);
    }

    public static convertArgs(args: ArgType[]): InputErrorCodes[] {
        let message: InputErrorCodes;
        if (ModelUtil.isOperatorEqOrNeq(args, 2)) {
            message = "";
        } else if (ModelUtil.isEffectOrNumberAttribute(args[1])) {
            message = ModelUtil.parseIntAndUpdate(args, 2);
            if (message != "") {
                message = isValidChangeOperator(args[2]) ? "" : "NeitherNumberNorChange";
            }
        } else {
            message = "invalidChangeForAttribute";
        }
        return [
            couldBeSpriteName(args[0]),
            ModelUtil.isAnAttributeOrEffectMessage(args[1]),
            message
        ];
    }
}
