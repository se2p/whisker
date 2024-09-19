import Sprite from "../../../src/vm/sprite";
import TestDriver from "../../../src/test/test-driver";
import {SpriteMock} from "./SpriteMock";

export class TestDriverMock {
    public currentSprites: Record<string, Sprite>;
    public stage: Sprite;
    public isMouseDown: boolean;
    public totalStepsExecuted = 0;

    constructor(currentSprites: SpriteMock[] = [], steps = 0, stage: Sprite = null, isMouseDown = true) {
        this.currentSprites = SpriteMock.toSpriteMockMap(currentSprites);
        this.stage = stage;
        this.isMouseDown = isMouseDown;
        this.totalStepsExecuted = steps;
    }

    public getTestDriver(): TestDriver {
        return {
            vmWrapper: {convertFromTimeToSteps: i => i},
            getSprites: (filter: ((s: Sprite) => boolean), skipStage = true) => {
                return Object.values(this.currentSprites).filter(s => filter(s) && (s != this.stage || !skipStage));
            },
            getSprite: (key: string) => Object.values(this.currentSprites).find(s => s.name == key),
            getStage: () => this.stage,
            isMouseDown: () => this.isMouseDown,
            getTotalStepsExecuted: () => this.totalStepsExecuted,
        } as unknown as TestDriver;
    }


}
