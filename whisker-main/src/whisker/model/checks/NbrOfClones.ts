import {AbstractCheck, CheckFun, Comparison, ICheckJSON, Optional, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";

export type NbrOfClonesArgs = [
    /**
     * The sprite name.
     */
    spriteName: SpriteName,

    /**
     * Mode of comparison, e.g. =, <, >, <=, >=
     */
    comparison: Comparison,

    /**
     * Number of clones.
     */
    nbr: number,
];

const NbrOfClonesArgs = z.tuple([
    SpriteName,
    Comparison,
    z.coerce.number().nonnegative(),
]);

type TNbrOfClonesJSON =
    | NbrOfClonesJSON
    | NbrOfVisibleClonesJSON
    ;

abstract class AbstractNbrOfClones<J extends TNbrOfClonesJSON = TNbrOfClonesJSON> extends AbstractCheck<J> {
    private readonly _visible: boolean;

    protected constructor(edgeLabel: string, json: Optional<J, "negated">) {
        super(edgeLabel, json);
        this._visible = json.name === "NbrOfVisibleClones";
    }

    /**
     * Get a method to check how many clones of a sprite are there.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _grahpID: string): CheckFun {
        const [pSpriteName, comparison, nbr] = this._args;
        const negated = this._negated;

        const toCheckNbr = ModelUtil.testNumber(nbr);
        const sprite = ModelUtil.checkSpriteExistence(t, pSpriteName);
        const spriteName = sprite.name;

        const spriteCondition = this._visible
            ? (sprite: Sprite) => sprite.name == spriteName && sprite.visible
            : (sprite: Sprite) => sprite.name == spriteName;

        return () => {
            const sprites = t.getSprites(spriteCondition);
            return !negated == (ModelUtil.compare(sprites.length, toCheckNbr, comparison));
        };
    }


    protected override _contradicts(that: AbstractNbrOfClones): boolean {
        const [thisName, , thisNbr] = this._args;
        const [thatName, , thatNbr] = that._args;

        if (thisName !== thatName) {
            return false;
        }

        let thisComp = this._args[1];
        let thatComp = that._args[1];

        if (this._negated) {
            thisComp = this._getInvertedCompOp(thisComp);
        }

        if (that._negated) {
            thatComp = this._getInvertedCompOp(thatComp);
        }

        return this._checkComparison(thisComp, thatComp, thisNbr, thatNbr);
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

    override get dependsOnSayText(): boolean {
        return false;
    }
}

const nbrOfClonesName = "NbrOfClones" as const;

export interface NbrOfClonesJSON extends ICheckJSON {
    name: typeof nbrOfClonesName;
    args: NbrOfClonesArgs;
}

export const NbrOfClonesJSON = ICheckJSON.extend({
    name: z.literal(nbrOfClonesName),
    args: NbrOfClonesArgs,
});

export class NbrOfClones extends AbstractNbrOfClones<NbrOfClonesJSON> {
    constructor(edgeLabel: string, json: SlimCheckJSON<NbrOfClonesJSON>) {
        super(edgeLabel, {...json, name: nbrOfClonesName});
    }

    protected _validate(checkJSON: NbrOfClonesJSON): NbrOfClonesJSON {
        return NbrOfClonesJSON.parse(checkJSON) as NbrOfClonesJSON;
    }
}

const nbrOfVisibleClonesName = "NbrOfVisibleClones" as const;

export interface NbrOfVisibleClonesJSON extends ICheckJSON {
    name: typeof nbrOfVisibleClonesName;
    args: NbrOfClonesArgs;
}

export const NbrOfVisibleClonesJSON = ICheckJSON.extend({
    name: z.literal(nbrOfVisibleClonesName),
    args: NbrOfClonesArgs,
});

export class NbrOfVisibleClones extends AbstractNbrOfClones<NbrOfVisibleClonesJSON> {
    constructor(edgeLabel: string, json: SlimCheckJSON<NbrOfVisibleClonesJSON>) {
        super(edgeLabel, {...json, name: nbrOfVisibleClonesName});
    }

    protected _validate(checkJSON: NbrOfVisibleClonesJSON): NbrOfVisibleClonesJSON {
        return NbrOfVisibleClonesJSON.parse(checkJSON) as NbrOfVisibleClonesJSON;
    }
}
