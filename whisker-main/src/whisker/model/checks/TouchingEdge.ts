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
    protected constructor(edgeLabel: string, json: C, validate: (json: C) => C) {
        super(edgeLabel, json, validate);
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
}

const name1 = "TouchingEdge" as const;

export interface TouchingEdgeJSON extends ICheckJSON {
    name: typeof name1;
    args: TouchingEdgeArgs;
}

export const TouchingEdgeJSON = ICheckJSON.extend({
    name: z.literal(name1),
    args: TouchingEdgeArgs,
});

export class TouchingEdge extends AbstractTouchingEdge<TouchingEdgeJSON> {
    constructor(edgeLabel: string, json: OptionalName<TouchingEdgeJSON>) {
        super(edgeLabel, {...json, name: name1}, TouchingEdgeJSON.parse.bind(TouchingEdgeJSON));
    }

    protected _getCheck(): (sprite: Sprite) => boolean {
        return (sprite: Sprite) => sprite.visible && sprite.isTouchingEdge();
    }
}

const name2 = "TouchingHorizEdge" as const;

export interface TouchingHorizEdgeJSON extends ICheckJSON {
    name: typeof name2;
    args: TouchingEdgeArgs;
}

export const TouchingHorizEdgeJSON = ICheckJSON.extend({
    name: z.literal(name2),
    args: TouchingEdgeArgs,
});


export class TouchingHorizEdge extends AbstractTouchingEdge<TouchingHorizEdgeJSON> {
    constructor(edgeLabel: string, json: OptionalName<TouchingHorizEdgeJSON>) {
        super(edgeLabel, {...json, name: name2}, TouchingHorizEdgeJSON.parse.bind(TouchingHorizEdgeJSON));
    }

    protected _getCheck(): (sprite: Sprite) => boolean {
        return (sprite: Sprite) => sprite.visible && sprite.isTouchingHorizEdge();
    }
}

const name3 = "TouchingVerticalEdge" as const;

export interface TouchingVerticalEdgeJSON extends ICheckJSON {
    name: typeof name3;
    args: TouchingEdgeArgs;
}

export const TouchingVerticalEdgeJSON = ICheckJSON.extend({
    name: z.literal(name3),
    args: TouchingEdgeArgs,
});

export class TouchingVerticalEdge extends AbstractTouchingEdge<TouchingVerticalEdgeJSON> {
    constructor(edgeLabel: string, json: OptionalName<TouchingVerticalEdgeJSON>) {
        super(edgeLabel, {...json, name: name3}, TouchingVerticalEdgeJSON.parse.bind(TouchingVerticalEdgeJSON));
    }

    protected _getCheck(): (sprite: Sprite) => boolean {
        return (sprite: Sprite) => sprite.visible && sprite.isTouchingVerticalEdge();
    }
}
