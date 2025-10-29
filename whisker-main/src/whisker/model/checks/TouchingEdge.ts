import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {Optional} from "../../utils/Optional";
import {CheckResult, result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";


export type TouchingEdgeArgs = [
    /**
     * The sprite name.
     */
    spriteName: SpriteName,
];

const TouchingEdgeArgs = z.tuple([
    SpriteName,
]);

type TTouchingEdgeJSON =
    | TouchingEdgeJSON
    | TouchingHorizEdgeJSON
    | TouchingVerticalEdgeJSON
    ;

abstract class AbstractTouchingEdge<J extends TTouchingEdgeJSON = TTouchingEdgeJSON> extends PureCheck<J, CheckFun0> {
    protected constructor(edgeLabel: string, json: Optional<J, "negated">) {
        super(edgeLabel, json);
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(TouchingEdgeArgs.safeParse(args));
    }

    /**
     * Get a method to check whether a sprite is touching an edge.
     * @param t Instance of the test driver for checking if a sprite or its clones is touching an edge.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const sprite = this._checkSpriteExistence(this._args[0]);
        const spriteName = sprite.name;
        this._registerOnMoveEvent(spriteName);
        return this._getCheck(sprite);
    }

    protected override _contradicts(_that: AbstractTouchingEdge): boolean {
        return false;
    }

    protected abstract _getCheck(sprite: Sprite): () => CheckResult;
}

const touchingEdgeName = "TouchingEdge" as const;

export interface TouchingEdgeJSON extends ICheckJSON {
    name: typeof touchingEdgeName;
    args: TouchingEdgeArgs;
}

export const TouchingEdgeJSON = ICheckJSON.extend({
    name: z.literal(touchingEdgeName),
    args: TouchingEdgeArgs,
});

export class TouchingEdge extends AbstractTouchingEdge<TouchingEdgeJSON> {
    constructor(edgeLabel: string, json: SlimCheckJSON<TouchingEdgeJSON>) {
        super(edgeLabel, {...json, name: touchingEdgeName});
    }

    protected _validate(checkJSON: TouchingEdgeJSON): TouchingEdgeJSON {
        return TouchingEdgeJSON.parse(checkJSON) as TouchingEdgeJSON;
    }

    protected _getCheck(sprite: Sprite): () => CheckResult {
        return () => result(sprite.isTouchingEdge(), {}, this.negated);
    }
}

const touchingHorizEdgeName = "TouchingHorizEdge" as const;

export interface TouchingHorizEdgeJSON extends ICheckJSON {
    name: typeof touchingHorizEdgeName;
    args: TouchingEdgeArgs;
}

export const TouchingHorizEdgeJSON = ICheckJSON.extend({
    name: z.literal(touchingHorizEdgeName),
    args: TouchingEdgeArgs,
});


export class TouchingHorizEdge extends AbstractTouchingEdge<TouchingHorizEdgeJSON> {
    constructor(edgeLabel: string, json: SlimCheckJSON<TouchingHorizEdgeJSON>) {
        super(edgeLabel, {...json, name: touchingHorizEdgeName});
    }

    protected _validate(checkJSON: TouchingHorizEdgeJSON): TouchingHorizEdgeJSON {
        return TouchingHorizEdgeJSON.parse(checkJSON) as TouchingHorizEdgeJSON;
    }

    protected _getCheck(sprite: Sprite): () => CheckResult {
        return () => result(sprite.isTouchingHorizEdge(), {}, this.negated);
    }
}

const touchingVerticalEdgeName = "TouchingVerticalEdge" as const;

export interface TouchingVerticalEdgeJSON extends ICheckJSON {
    name: typeof touchingVerticalEdgeName;
    args: TouchingEdgeArgs;
}

export const TouchingVerticalEdgeJSON = ICheckJSON.extend({
    name: z.literal(touchingVerticalEdgeName),
    args: TouchingEdgeArgs,
});

export class TouchingVerticalEdge extends AbstractTouchingEdge<TouchingVerticalEdgeJSON> {
    constructor(edgeLabel: string, json: SlimCheckJSON<TouchingVerticalEdgeJSON>) {
        super(edgeLabel, {...json, name: touchingVerticalEdgeName});
    }

    protected _validate(checkJSON: TouchingVerticalEdgeJSON): TouchingVerticalEdgeJSON {
        return TouchingVerticalEdgeJSON.parse(checkJSON) as TouchingVerticalEdgeJSON;
    }

    protected _getCheck(sprite: Sprite): () => CheckResult {
        return () => result(sprite.isTouchingVerticalEdge(), {}, this.negated);
    }
}
