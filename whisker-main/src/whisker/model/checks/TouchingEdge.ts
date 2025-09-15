import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {Optional} from "../../utils/Optional";
import {any, CheckResult, fail, pass, result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";
import {checkSpriteExistence} from "../util/ModelUtil";

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

type TTouchingEdge =
    | TouchingEdge
    | TouchingHorizEdge
    | TouchingVerticalEdge
    ;

abstract class AbstractTouchingEdge<
    J extends TTouchingEdgeJSON = TTouchingEdgeJSON,
    C extends TTouchingEdge = TTouchingEdge,
> extends AbstractCheck<J, CheckFun0> {
    protected constructor(edgeLabel: string, json: Optional<J, "negated">) {
        super(edgeLabel, json);
    }

    override get dependsOnSayText(): boolean {
        return false;
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(TouchingEdgeArgs.safeParse(args));
    }

    /**
     * Get a method to check whether a sprite is touching an edge.
     * @param t Instance of the test driver for checking if a sprite or its clones is touching an edge.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const [pSpriteName] = this._args;
        const negated = this.negated;
        const spriteName = checkSpriteExistence(t, pSpriteName).name;
        const touchingEdgeCheck = this._getCheck();
        this._registerOnMoveEvent(spriteName, (sprite) =>
            result(touchingEdgeCheck(sprite).passed, {}, negated));

        return () => {
            const sprites = t.getSprite(spriteName).getClones(true);
            return any(touchingEdgeCheck, negated, sprites);
        };
    }

    protected abstract _getCheck(): (sprite: Sprite) => CheckResult;

    protected override _contradicts(_that: AbstractTouchingEdge): boolean {
        return false;
    }
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

export class TouchingEdge extends AbstractTouchingEdge<TouchingEdgeJSON, TouchingEdge> {
    constructor(edgeLabel: string, json: SlimCheckJSON<TouchingEdgeJSON>) {
        super(edgeLabel, {...json, name: touchingEdgeName});
    }

    protected _validate(checkJSON: TouchingEdgeJSON): TouchingEdgeJSON {
        return TouchingEdgeJSON.parse(checkJSON) as TouchingEdgeJSON;
    }

    protected _getCheck(): (sprite: Sprite) => CheckResult {
        return (sprite: Sprite) => {
            if (!sprite.visible) {
                return fail({message: `Expected sprite "${sprite.name}" to be visible`});
            }

            if (!sprite.isTouchingEdge()) {
                return fail({message: `Expected sprite "${sprite.name}" to touch an edge`});
            }

            return pass();
        };
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


export class TouchingHorizEdge extends AbstractTouchingEdge<TouchingHorizEdgeJSON, TouchingHorizEdge> {
    constructor(edgeLabel: string, json: SlimCheckJSON<TouchingHorizEdgeJSON>) {
        super(edgeLabel, {...json, name: touchingHorizEdgeName});
    }

    protected _validate(checkJSON: TouchingHorizEdgeJSON): TouchingHorizEdgeJSON {
        return TouchingHorizEdgeJSON.parse(checkJSON) as TouchingHorizEdgeJSON;
    }

    protected _getCheck(): (sprite: Sprite) => CheckResult {
        return (sprite: Sprite) => {
            if (!sprite.visible) {
                return fail({message: `Expected sprite "${sprite.name}" to be visible`});
            }

            if (!sprite.isTouchingHorizEdge()) {
                return fail({message: `Expected sprite "${sprite.name}" to touch a horizontal edge`});
            }

            return pass();
        };
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

export class TouchingVerticalEdge extends AbstractTouchingEdge<TouchingVerticalEdgeJSON, TouchingVerticalEdge> {
    constructor(edgeLabel: string, json: SlimCheckJSON<TouchingVerticalEdgeJSON>) {
        super(edgeLabel, {...json, name: touchingVerticalEdgeName});
    }

    protected _validate(checkJSON: TouchingVerticalEdgeJSON): TouchingVerticalEdgeJSON {
        return TouchingVerticalEdgeJSON.parse(checkJSON) as TouchingVerticalEdgeJSON;
    }

    protected _getCheck(): (sprite: Sprite) => CheckResult {
        return (sprite: Sprite) => {
            if (!sprite.visible) {
                return fail({message: `Expected sprite "${sprite.name}" to be visible`});
            }

            if (!sprite.isTouchingVerticalEdge()) {
                return fail({message: `Expected sprite "${sprite.name}" to touch a vertical edge`});
            }

            return pass();
        };
    }
}
