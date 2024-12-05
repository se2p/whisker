import {AbstractCheck, Check, ICheckJSON, OptionalName, SpriteName} from "./AbstractCheck";
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

    protected constructor(edgeLabel: string, json: C, validate: (json: C) => C) {
        super(edgeLabel, json, validate);
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

const name1 = "NbrOfClones" as const;

export interface NbrOfClonesJSON extends ICheckJSON {
    name: typeof name1;
    args: NbrOfClonesArgs;
}

export const NbrOfClonesJSON = ICheckJSON.extend({
    name: z.literal(name1),
    args: NbrOfClonesArgs,
});

export class NbrOfClones extends AbstractNbrOfClones<NbrOfClonesJSON> {
    constructor(edgeLabel: string, json: OptionalName<NbrOfClonesJSON>) {
        super(edgeLabel, {...json, name: name1}, NbrOfClonesJSON.parse.bind(NbrOfClonesJSON));
    }
}

const name2 = "NbrOfVisibleClones" as const;

export interface NbrOfVisibleClonesJSON extends ICheckJSON {
    name: typeof name2;
    args: NbrOfClonesArgs;
}

export const NbrOfVisibleClonesJSON = ICheckJSON.extend({
    name: z.literal(name2),
    args: NbrOfClonesArgs,
});

export class NbrOfVisibleClones extends AbstractNbrOfClones<NbrOfVisibleClonesJSON> {
    constructor(edgeLabel: string, json: OptionalName<NbrOfVisibleClonesJSON>) {
        super(edgeLabel, {...json, name: name2}, NbrOfVisibleClonesJSON.parse.bind(NbrOfVisibleClonesJSON));
    }
}
