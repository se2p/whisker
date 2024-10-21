import Sprite from "../../../src/vm/sprite";
import TestDriver from "../../../src/test/test-driver";
import {SpriteMock} from "./SpriteMock";

export class TestDriverMock {
    public currentSprites: Sprite[];
    public stage: Sprite;
    public isMouseDown: boolean;
    public totalStepsExecuted = 0;
    public inputImmediate: (...args: any[]) => void;
    public typeText: (text: string) => void;
    public mouseDown: (value: boolean) => void;
    public clickStage: () => void;
    public clickSprite: (name: string, steps: number) => void;

    constructor(currentSprites: SpriteMock[] = [], steps = 0, stage: Sprite = null, isMouseDown = true) {
        this.currentSprites = SpriteMock.toSpriteArray(currentSprites);
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
            inputImmediate: (...args: any[]) => this.inputImmediate(args),
            typeText: (text: string) => this.typeText(text),
            mouseDown: (value: boolean) => this.mouseDown(value),
            clickStage: () => this.clickStage(),
            clickSprite: (name: string, steps: number) => this.clickSprite(name, steps),
        } as unknown as TestDriver;
    }
}

export function getDummyTestDriver(): TestDriver {
    return new TestDriverMock().getTestDriver();
}
