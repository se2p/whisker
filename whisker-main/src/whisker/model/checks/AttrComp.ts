import {AbstractCheck, Check, Comparison, ICheckJSON, OptionalName, SpriteName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ArgType} from "../util/schema";
import {ModelUtil} from "../util/ModelUtil";
import {ComparisonNotKnownError, ErrorForAttribute} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";

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
    constructor(edgeLabel: string, json: OptionalName<AttrCompJSON>) {
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
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): Check {
        // eslint-disable-next-line prefer-const
        let [pSpriteName, attrName, comparison, attrValue] = this.args;
        const edgeLabel = this._edgeLabel;
        const negated = this.negated;

        if (attrName == "costume" || attrName == "currentCostume") {
            attrName = "currentCostumeName";
        }
        const spriteName = ModelUtil.getStageOrSprite(t, pSpriteName).name;
        ModelUtil.checkAttributeExistence(t, spriteName, attrName);

        if (comparison != "==" && comparison != "=" && comparison != ">" && comparison != ">=" && comparison != "<"
            && comparison != "<=") {
            throw new ComparisonNotKnownError(comparison);
        }

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
        const eventString = this.getEventString();

        cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, (sprite) => {
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
        const eventString = this.getEventString();

        cu.registerOnVisualChange(spriteName, eventString, edgeLabel, graphID, (sprite) => {
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
        const eventString = this.getEventString();

        cu.registerOutput(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            try {
                return !negated == ModelUtil.compare(sprite[attrName], attrValue, comparison);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
        });
    }

    override get dependsOnSayText(): boolean {
        return this.args[1] === "sayText";
    }

    override getEventString(): string {
        // eslint-disable-next-line prefer-const
        let [pSpriteName, attrName, comparison, value] = this.args;
        attrName = attrName == "currentCostume" ? "costume" : attrName; // FIXME: why the case distinction? Without it, the override could be deleted...
        let string = this.negated ? "!" + this.name : this.name;
        for (const arg of  [pSpriteName, attrName, comparison, value]) {
            string += ":" + arg;
        }
        return string;
    }
}
