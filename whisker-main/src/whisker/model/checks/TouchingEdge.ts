import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {Optional} from "../../utils/Optional";
import {any, CheckResult, pass, fail} from "./CheckResult";
import TestDriver from "../../../test/test-driver";

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

    /**
     * Get a method to check whether a sprite is touching an edge.
     * @param t Instance of the test driver for checking if a sprite or its clones is touching an edge.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        const [pSpriteName] = this._args;
        const negated = this.negated;
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        const touchingEdgeCheck = this._getCheck();
        cu.registerOnMoveEvent(spriteName, this._self(), graphID, (sprite) => {
            return (negated !== touchingEdgeCheck(sprite).passed) ? pass() : fail("(reason unknown)");
        });

        const edge = {
            [touchingEdgeName]: "an edge",
            [touchingHorizEdgeName]: "a horizontal edge",
            [touchingVerticalEdgeName]: "a vertical edge",
        }[this.name];

        return () => {
            const sprites = t.getSprite(spriteName).getClones(true);
            const reason = `Expected sprite "${spriteName}" not to touch ${edge}`;
            return any(touchingEdgeCheck, negated, reason, sprites);
        };
    }

    protected abstract _self(): C;

    protected abstract _getCheck(): (sprite: Sprite) => CheckResult;

    protected override _contradicts(_that: AbstractTouchingEdge): boolean {
        return false;
    }

    override get dependsOnSayText(): boolean {
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
                return fail(`Expected sprite "${sprite.name}" to be visible`);
            }

            if (!sprite.isTouchingEdge()) {
                return fail(`Expected sprite "${sprite.name}" to touch an edge`);
            }

            return pass();
        };
    }

    protected _self(): TouchingEdge {
        return this;
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
                return fail(`Expected sprite "${sprite.name}" to be visible`);
            }

            if (!sprite.isTouchingHorizEdge()) {
                return fail(`Expected sprite "${sprite.name}" to touch a horizontal edge`);
            }

            return pass();
        };
    }

    protected _self(): TouchingHorizEdge {
        return this;
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
                return fail(`Expected sprite "${sprite.name}" to be visible`);
            }

            if (!sprite.isTouchingVerticalEdge()) {
                return fail(`Expected sprite "${sprite.name}" to touch a vertical edge`);
            }

            return pass();
        };
    }

    protected _self(): TouchingVerticalEdge {
        return this;
    }
}
