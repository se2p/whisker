import {AbstractCheck, Check, Comparison, ICheckJSON, OptionalName, SpriteName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";

export type NbrOfClonesArgs = [
    /**
     * The sprite name.
     */
    pSpriteName: SpriteName,

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

abstract class AbstractNbrOfClones<C extends NbrOfClonesJSON | NbrOfVisibleClonesJSON> extends AbstractCheck<C> {
    private readonly _visible: boolean;

    protected constructor(edgeLabel: string, json: C) {
        super(edgeLabel, json);
        this._visible = json.name === "NbrOfVisibleClones";
    }

    /**
     * Get a method to check how many clones of a sprite are there.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _grahpID: string): Check {
        const [pSpriteName, comparison, nbr] = this.args;
        const negated = this.negated;

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


    protected override _contradicts(that: C): boolean {
        const [thisName, , thisNbr] = this.args;
        const [thatName, , thatNbr] = that.args;

        if (thisName !== thatName) {
            return false;
        }

        let thisComp = this.args[1];
        let thatComp = that.args[1];

        if (this.negated) {
            thisComp = this._getInvertedCompOp(thisComp);
        }

        if (that.negated) {
            thatComp = this._getInvertedCompOp(thatComp);
        }

        return this._checkComparison(thisComp, thatComp, thisNbr, thatNbr);
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
    constructor(edgeLabel: string, json: OptionalName<NbrOfClonesJSON>) {
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
    constructor(edgeLabel: string, json: OptionalName<NbrOfVisibleClonesJSON>) {
        super(edgeLabel, {...json, name: nbrOfVisibleClonesName});
    }

    protected _validate(checkJSON: NbrOfVisibleClonesJSON): NbrOfVisibleClonesJSON {
        return NbrOfVisibleClonesJSON.parse(checkJSON) as NbrOfVisibleClonesJSON;
    }
}
