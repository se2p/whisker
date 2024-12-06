import {AbstractCheck, Check, ICheckJSON, OptionalName, SpriteName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {z} from "zod";

export type TouchingEdgeArgs = [
    /**
     * The sprite name.
     */
    pSpriteName: SpriteName,
];

const TouchingEdgeArgs = z.tuple([
    SpriteName,
]);

abstract class AbstractTouchingEdge<C extends TouchingEdgeJSON | TouchingHorizEdgeJSON | TouchingVerticalEdgeJSON> extends AbstractCheck<C> {
    protected constructor(edgeLabel: string, json: C) {
        super(edgeLabel, json);
    }

    /**
     * Get a method to check whether a sprite is touching an edge.
     * @param t Test driver.
     * @param cu Listener for checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): Check {
        const [pSpriteName] = this.args;
        const negated = this.negated;
        const edgeLabel = this._edgeLabel;
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        const check = this._getCheck();
        const eventString = this.getEventString();
        cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            return !negated == check(sprite);
        });
        return () => {
            const sprites = t.getSprite(spriteName).getClones(true);
            const anyTouchingEdge = sprites.some(check);
            return !negated == anyTouchingEdge;
        };
    }

    protected abstract _getCheck(): (sprite: Sprite) => boolean;

    protected override _contradicts(_that: C): boolean {
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

export class TouchingEdge extends AbstractTouchingEdge<TouchingEdgeJSON> {
    constructor(edgeLabel: string, json: OptionalName<TouchingEdgeJSON>) {
        super(edgeLabel, {...json, name: touchingEdgeName});
    }

    protected _validate(checkJSON: TouchingEdgeJSON): TouchingEdgeJSON {
        return TouchingEdgeJSON.parse(checkJSON) as TouchingEdgeJSON;
    }

    protected _getCheck(): (sprite: Sprite) => boolean {
        return (sprite: Sprite) => sprite.visible && sprite.isTouchingEdge();
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
    constructor(edgeLabel: string, json: OptionalName<TouchingHorizEdgeJSON>) {
        super(edgeLabel, {...json, name: touchingHorizEdgeName});
    }

    protected _validate(checkJSON: TouchingHorizEdgeJSON): TouchingHorizEdgeJSON {
        return TouchingHorizEdgeJSON.parse(checkJSON) as TouchingHorizEdgeJSON;
    }

    protected _getCheck(): (sprite: Sprite) => boolean {
        return (sprite: Sprite) => sprite.visible && sprite.isTouchingHorizEdge();
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
    constructor(edgeLabel: string, json: OptionalName<TouchingVerticalEdgeJSON>) {
        super(edgeLabel, {...json, name: touchingVerticalEdgeName});
    }

    protected _validate(checkJSON: TouchingVerticalEdgeJSON): TouchingVerticalEdgeJSON {
        return TouchingVerticalEdgeJSON.parse(checkJSON) as TouchingVerticalEdgeJSON;
    }

    protected _getCheck(): (sprite: Sprite) => boolean {
        return (sprite: Sprite) => sprite.visible && sprite.isTouchingVerticalEdge();
    }
}
