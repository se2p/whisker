import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {ComparingCheck, Comparison, newComparison} from "./Comparison";
import {Optional} from "../../utils/Optional";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {ComparisonOp, NonNegativeNumber, parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";

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
    NonNegativeNumber,
]);

type TNbrOfClonesJSON =
    | NbrOfClonesJSON
    | NbrOfVisibleClonesJSON
    ;

abstract class AbstractNbrOfClones<
    J extends TNbrOfClonesJSON = TNbrOfClonesJSON,
> extends PureCheck<J, CheckFun0> implements ComparingCheck {
    private readonly _visible: boolean;
    private readonly _comparison: Comparison;

    protected constructor(edgeLabel: string, json: Optional<J, "negated">) {
        super(edgeLabel, json);
        this._visible = json.name === "NbrOfVisibleClones";
        this._comparison = newComparison(this);
    }

    get operator(): ComparisonOp {
        return this._args[1];
    }

    get value(): number {
        return this._args[2];
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(NbrOfClonesArgs.safeParse(args));
    }

    /**
     * Get a method to check how many clones of a sprite are there.
     * @param t Instance of the test driver to retrieve the number of clones of a sprite.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const sprite = this._checkSpriteExistence(this._args[0]);
        const spriteName = sprite.name;

        const spriteCondition = this._visible
            ? (sprite: Sprite) => sprite.name == spriteName && sprite.visible
            : (sprite: Sprite) => sprite.name == spriteName;

        return () => {
            const sprites = t.getSprites(spriteCondition);
            return this._comparison.apply(sprites.length);
        };
    }

    protected override _contradicts(that: AbstractNbrOfClones): boolean {
        const [thisName] = this._args;
        const [thatName] = that._args;

        if (thisName !== thatName) {
            return false;
        }

        return this._comparison.contradicts(that._comparison);
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
