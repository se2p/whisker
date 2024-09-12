import Sprite from "../../../src/vm/sprite";
import TestDriver from "../../../src/test/test-driver";
import {SpriteMock} from "./SpriteMock";

export class TestDriverMock {
    public currentSprites: Record<string, Sprite>;
    public stage: Sprite;
    public isMouseDown: boolean;

    constructor(currentSprites: SpriteMock[] = [], stage: Sprite = null, isMouseDown = true) {
        this.currentSprites = SpriteMock.toSpriteMockMap(currentSprites);
        this.stage = stage;
        this.isMouseDown = isMouseDown;
    }

    public getTestDriver(): TestDriver {
        return {
            getSprites: (filter: ((s: Sprite) => boolean), skipStage = true) => {
                return Object.values(this.currentSprites).filter(s => filter(s) && (s != this.stage || !skipStage));
            },
            getSprite: (key: string) => Object.values(this.currentSprites).find(s => s.name == key),
            getStage: () => this.stage,
            isMouseDown: () => this.isMouseDown,
        } as unknown as TestDriver;
    }


}
