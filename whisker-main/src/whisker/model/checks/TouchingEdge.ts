import {AbstractCheck, Check, ICheckJSON, SpriteName} from "./AbstractCheck";
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
    protected constructor(id: string, edgeLabel: string, negated: boolean, name: typeof NAME1 | typeof NAME2 | typeof NAME3, args: TouchingEdgeArgs) {
        super(id, edgeLabel, negated, name, args);
    }

    /**
     * Get a method to check whether a sprite is touching an edge.
     * @param t Test driver.
     * @param cu Listener for checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): Check {
        const [pSpriteName] = this._args;
        const negated = this._negated;
        const edgeLabel = this._edgeLabel;
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        const check = this._getCheck();
        const eventString = this._getEventString();
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

    protected abstract _getEventString(): string;
}

const NAME1 = "TouchingEdge" as const;

export interface TouchingEdgeJSON extends ICheckJSON {
    name: typeof NAME1;
    args: TouchingEdgeArgs;
}

export const TouchingEdgeJSON = ICheckJSON.extend({
    name: z.literal(NAME1),
    args: TouchingEdgeArgs,
});

export class TouchingEdge extends AbstractTouchingEdge<TouchingEdgeJSON> {
    constructor(id: string, edgeLabel: string, negated: boolean, args: TouchingEdgeArgs) {
        super(id, edgeLabel, negated, NAME1, args);
    }

    protected _getCheck(): (sprite: Sprite) => boolean {
        return (sprite: Sprite) => sprite.visible && sprite.isTouchingEdge();
    }

    protected override _getEventString(): string {
        const [pSpriteName] = this._args;
        return CheckUtility.getEventString(NAME1, this._negated, pSpriteName);
    }
}

const NAME2 = "TouchingHorizEdge" as const;

export interface TouchingHorizEdgeJSON extends ICheckJSON {
    name: typeof NAME2;
    args: TouchingEdgeArgs;
}

export const TouchingHorizEdgeJSON = ICheckJSON.extend({
    name: z.literal(NAME2),
    args: TouchingEdgeArgs,
});


export class TouchingHorizEdge extends AbstractTouchingEdge<TouchingHorizEdgeJSON> {
    constructor(id: string, edgeLabel: string, negated: boolean, args: TouchingEdgeArgs) {
        super(id, edgeLabel, negated, NAME2, args);
    }

    protected _getCheck(): (sprite: Sprite) => boolean {
        return (sprite: Sprite) => sprite.visible && sprite.isTouchingHorizEdge();
    }

    protected override _getEventString(): string {
        const [pSpriteName] = this._args;
        return CheckUtility.getEventString(NAME2, this._negated, pSpriteName);
    }
}

const NAME3 = "TouchingVerticalEdge" as const;

export interface TouchingVerticalEdgeJSON extends ICheckJSON {
    name: typeof NAME3;
    args: TouchingEdgeArgs;
}

export const TouchingVerticalEdgeJSON = ICheckJSON.extend({
    name: z.literal(NAME3),
    args: TouchingEdgeArgs,
});

export class TouchingVerticalEdge extends AbstractTouchingEdge<TouchingVerticalEdgeJSON> {
    constructor(id: string, edgeLabel: string, negated: boolean, args: TouchingEdgeArgs) {
        super(id, edgeLabel, negated, NAME3, args);
    }

    protected _getCheck(): (sprite: Sprite) => boolean {
        return (sprite: Sprite) => sprite.visible && sprite.isTouchingVerticalEdge();
    }

    protected override _getEventString(): string {
        const [pSpriteName] = this._args;
        return CheckUtility.getEventString(NAME3, this._negated, pSpriteName);
    }
}
