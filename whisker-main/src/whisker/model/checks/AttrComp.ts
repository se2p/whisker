import {AbstractCheck, CheckFun, Comparison, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ArgType} from "../util/schema";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForAttribute} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";

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
     * Mode of comparison, e.g. =, <, >, <=, >=
     */
    comparison: Comparison,

    /**
     * Value to compare to the attribute's current value.
     */
    attrValue: string | number,
];

const AttrCompArgs = z.tuple([
    SpriteName,
    z.string(),
    Comparison,
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

export class AttrComp extends AbstractCheck<AttrCompJSON> {
    constructor(edgeLabel: string, json: SlimCheckJSON<AttrCompJSON>) {
        super(edgeLabel, {...json, name});
    }

    protected _validate(checkJSON: AttrCompJSON): AttrCompJSON {
        return AttrCompJSON.parse(checkJSON) as AttrCompJSON;
    }

    /**
     * Get a method for checking whether a sprite's attribute has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): CheckFun {
        // eslint-disable-next-line prefer-const
        let [pSpriteName, attrName, comparison, attrValue] = this._args;
        const edgeLabel = this._edgeLabel;
        const negated = this._negated;

        if (attrName == "costume" || attrName == "currentCostume") {
            attrName = "currentCostumeName";
        }
        const spriteName = ModelUtil.getStageOrSprite(t, pSpriteName).name;
        ModelUtil.checkAttributeExistence(t, spriteName, attrName);

        // on movement listener
        if (attrName == "x" || attrName == "y") {
            this._attributeCompOnMove(cu, edgeLabel, graphID, negated, spriteName, pSpriteName, attrName,
                comparison, String(attrValue));
        } else if (["size", "direction", "effect", "visible", "currentCostumeName", "rotationStyle"].includes(attrName as string)) {
            this._attributeCompOnVisual(cu, edgeLabel, graphID, negated, spriteName, pSpriteName, attrName as string,
                comparison, attrValue);
        } else if (attrName == "sayText") {
            this._attributeCompOnOutput(cu, edgeLabel, graphID, negated, spriteName, pSpriteName,
                attrName, comparison, attrValue);
        }

        // without movement
        return () => {
            const sprites: Sprite[] = t.getSprites((s: Sprite) => s.name == spriteName, false)[0].getClones(true);
            try {
                for (const s of sprites) {
                    if (ModelUtil.compare(s[attrName], attrValue, comparison)) {
                        return !negated;
                    }
                }
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
            return negated;
        };
    }

    private _attributeCompOnMove(cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                 spriteName: string, pSpriteName: ArgType, attrName: string,
                                 comparison: Comparison, attrValue: string): void {
        cu.registerOnMoveEvent(spriteName, this, edgeLabel, graphID, (sprite) => {
            try {
                return !negated == ModelUtil.compare(sprite[attrName], attrValue, comparison);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
        });
    }

    private _attributeCompOnVisual(cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                   spriteName: string, pSpriteName: ArgType, attrName: string,
                                   comparison: Comparison, attrValue: ArgType): void {
        cu.registerOnVisualChange(spriteName, this, edgeLabel, graphID, (sprite) => {
            try {
                return !negated == ModelUtil.compare(sprite[attrName], attrValue, comparison);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
        });
    }

    private _attributeCompOnOutput(cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                   spriteName: string, pSpriteName: ArgType, attrName: string,
                                   comparison: Comparison, attrValue: ArgType): void {
        cu.registerOutput(spriteName, this, edgeLabel, graphID, (sprite) => {
            try {
                return !negated == ModelUtil.compare(sprite[attrName], attrValue, comparison);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
        });
    }

    override get dependsOnSayText(): boolean {
        return this._args[1] === "sayText";
    }

    protected override _contradicts(that: AttrComp): boolean {
        const [thisSpriteName, thisAttrName] = this._args;
        const [thatSpriteName, thatAttrName] = that._args;

        if (thisSpriteName !== thatSpriteName) {
            return false;
        }

        if (thisAttrName !== thatAttrName) {
            return false;
        }

        let thisComp = this._args[2];
        let thatComp = that._args[2];

        if (this._negated) {
            thisComp = this._getInvertedCompOp(thisComp);
        }

        if (that._negated) {
            thatComp = this._getInvertedCompOp(thatComp);
        }

        return this._checkComparison(thisComp, thatComp, this._args[3], that._args[3]);
    }

    private _getInvertedCompOp(comp: Comparison): Comparison {
        switch (comp) {
            case "=":
            case "==":
                return "!=";
            case "!=":
                return "==";
            case "<":
                return ">=";
            case ">":
                return "<=";
            case ">=":
                return "<";
            case "<=":
                return ">";
            default:
                throw new NonExhaustiveCaseDistinction(comp);
        }
    }

    private _checkComparison(comparison1: Comparison, comparison2: Comparison, pValue1: string | number, pValue2: string | number): boolean {
        const value1 = String(pValue1);
        const value2 = String(pValue2);

        if (comparison1 == "!=" || comparison2 == "!=") {
            return false;
        }

        // =
        if ((comparison1 == '=' || comparison1 == '==') && (comparison2 == '=' || comparison2 == '==')) {
            return value1 != value2;
        }

        if (comparison1 == '=' || comparison1 == '==') {
            return !eval(value1 + comparison2 + value2);
        }

        if (comparison2 == '=' || comparison2 == '==') {
            return !eval(value2 + comparison1 + value1);
        }

        // < and <, > and >, < and <=, <= and <=, >= and >, > and >=
        if (comparison1.startsWith(comparison2) || comparison2.startsWith(comparison1)) {
            return false;
        }

        return !eval(value2 + comparison1 + value1) || !eval(value1 + comparison2 + value2);
    }
}
