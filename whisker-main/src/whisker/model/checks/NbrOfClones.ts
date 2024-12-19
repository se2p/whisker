import {AbstractCheck, CheckFun0, ICheckJSON, Optional, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";
import {ComparingCheck, ComparisonOp, contradicts} from "./comparisons";

export type NbrOfClonesArgs = [
    /**
     * The sprite name.
     */
    spriteName: SpriteName,

    /**
     * Mode of comparison, e.g. =, <, >, <=, >=
     */
    comparisonOp: ComparisonOp,

    /**
     * Number of clones.
     */
    nbr: number,
];

const NbrOfClonesArgs = z.tuple([
    SpriteName,
    ComparisonOp,
    z.coerce.number().nonnegative(),
]);

type TNbrOfClonesJSON =
    | NbrOfClonesJSON
    | NbrOfVisibleClonesJSON
    ;

type TNbrOfClones =
    | NbrOfClones
    | NbrOfVisibleClones
    ;

abstract class AbstractNbrOfClones<
    J extends TNbrOfClonesJSON = TNbrOfClonesJSON,
    C extends TNbrOfClones = TNbrOfClones
> extends AbstractCheck<J, CheckFun0> implements ComparingCheck {
    private readonly _visible: boolean;

    protected constructor(edgeLabel: string, json: Optional<J, "negated">) {
        super(edgeLabel, json);
        this._visible = json.name === "NbrOfVisibleClones";
    }

    get operator(): ComparisonOp {
        return this._args[1];
    }

    get value(): number {
        return this._args[2];
    }

    /**
     * Get a method to check how many clones of a sprite are there.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _grahpID: string): CheckFun0 {
        const [pSpriteName, comparison, nbr] = this._args;
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

    protected override _contradicts(that: AbstractNbrOfClones): boolean {
        const [thisName] = this._args;
        const [thatName] = that._args;

        if (thisName !== thatName) {
            return false;
        }

        return contradicts(this._self(), that._self());
    }

    protected abstract _self(): C;

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

export class NbrOfClones extends AbstractNbrOfClones<NbrOfClonesJSON, NbrOfClones> {
    constructor(edgeLabel: string, json: SlimCheckJSON<NbrOfClonesJSON>) {
        super(edgeLabel, {...json, name: nbrOfClonesName});
    }

    protected _self(): NbrOfClones {
        return this;
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

export class NbrOfVisibleClones extends AbstractNbrOfClones<NbrOfVisibleClonesJSON, NbrOfVisibleClones> {
    constructor(edgeLabel: string, json: SlimCheckJSON<NbrOfVisibleClonesJSON>) {
        super(edgeLabel, {...json, name: nbrOfVisibleClonesName});
    }

    protected _validate(checkJSON: NbrOfVisibleClonesJSON): NbrOfVisibleClonesJSON {
        return NbrOfVisibleClonesJSON.parse(checkJSON) as NbrOfVisibleClonesJSON;
    }

    protected _self(): NbrOfVisibleClones {
        return this;
    }
}
