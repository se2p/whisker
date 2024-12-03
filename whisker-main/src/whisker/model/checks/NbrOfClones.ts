import {AbstractCheck, Check, ICheckJSON, SpriteName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {ComparisonNotKnownError} from "../util/ModelError";
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
    comparison: string,

    /**
     * Number of clones.
     */
    nbr: number,
];

const NbrOfClonesArgs = z.tuple([
    SpriteName,
    z.string(),
    z.coerce.number().nonnegative(),
]);

abstract class AbstractNbrOfClones<C extends NbrOfClonesJSON | NbrOfVisibleClonesJSON> extends AbstractCheck<C> {
    private readonly _visible: boolean;

    protected constructor(id: string, edgeLabel: string, negated: boolean, visible: boolean, name: "NbrOfClones" | "NbrOfVisibleClones", args: NbrOfClonesArgs) {
        super(id, edgeLabel, negated, name, args);
        this._visible = visible;
    }

    /**
     * Get a method to check how many clones of a sprite are there.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _grahpID: string): Check {
        const [pSpriteName, comparison, nbr] = this._args;
        const negated = this._negated;

        const toCheckNbr = ModelUtil.testNumber(nbr);
        const sprite = ModelUtil.checkSpriteExistence(t, pSpriteName);
        const spriteName = sprite.name;

        if (comparison != "==" && comparison != "=" && comparison != ">" && comparison != ">=" && comparison != "<"
            && comparison != "<=") {
            throw new ComparisonNotKnownError(comparison);
        }

        const spriteCondition = this._visible
            ? (sprite: Sprite) => sprite.name == spriteName && sprite.visible
            : (sprite: Sprite) => sprite.name == spriteName;

        return () => {
            const sprites = t.getSprites(spriteCondition);
            return !negated == (ModelUtil.compare(sprites.length, toCheckNbr, comparison));
        };
    }
}

const NAME1 = "NbrOfClones" as const;

export interface NbrOfClonesJSON extends ICheckJSON {
    name: typeof NAME1;
    args: NbrOfClonesArgs;
}

export const NbrOfClonesJSON = ICheckJSON.extend({
    name: z.literal(NAME1),
    args: NbrOfClonesArgs,
});

export class NbrOfClones extends AbstractNbrOfClones<NbrOfClonesJSON> {
    constructor(id: string, edgeLabel: string, negated: boolean, args: NbrOfClonesArgs) {
        super(id, edgeLabel, negated, false, NAME1, args);
    }
}

const NAME2 = "NbrOfVisibleClones" as const;

export interface NbrOfVisibleClonesJSON extends ICheckJSON {
    name: typeof NAME2;
    args: NbrOfClonesArgs;
}

export const NbrOfVisibleClonesJSON = ICheckJSON.extend({
    name: z.literal(NAME2),
    args: NbrOfClonesArgs,
});

export class NbrOfVisibleClones extends AbstractNbrOfClones<NbrOfVisibleClonesJSON> {
    constructor(id: string, edgeLabel: string, negated: boolean, args: NbrOfClonesArgs) {
        super(id, edgeLabel, negated, true, NAME2, args);
    }
}
