import Sprite from "../../../../src/vm/sprite";
import TestDriver from "../../../../src/test/test-driver";
import {SpriteMock} from "./SpriteMock";

export class TestDriverMock {
    public stage: Sprite;
    public isMouseDown: boolean;
    public totalStepsExecuted = 0;
    public mousePos = {x: 0, y: 0};
    public inputImmediate: (...args: any[]) => void;
    public typeText: (text: string) => void;
    public mouseDown: (value: boolean) => void;
    public clickStage: () => void;
    public clickSprite: (name: string, steps: number) => void;
    public _currentSprites: Sprite[];

    constructor(currentSprites: SpriteMock[] = [], steps = 0, isMouseDown = true) {
        this.currentSprites = SpriteMock.toSpriteArray(currentSprites);
        this.isMouseDown = isMouseDown;
        this.totalStepsExecuted = steps;
    }

    get currentSprites(): Sprite[] {
        return this._currentSprites;
    }

    set currentSprites(value: Sprite[]) {
        this._currentSprites = value;
        this.stage = this._currentSprites.filter(s => s.isStage)[0];
    }

    public nextStep(): void {
        ++this.totalStepsExecuted;
    }

    public getTestDriver(): TestDriver {
        return {
            getSprites: (filter: ((s: Sprite) => boolean) = s => true, skipStage = true) => {
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
            getMousePos: () => this.mousePos
        } as unknown as TestDriver;
    }
}

export function getDummyTestDriver(): TestDriver {
    return new TestDriverMock().getTestDriver();
}
