import {CheckUtility} from "../../../../src/whisker/model/util/CheckUtility";
import {CheckGenerator} from "../../../../src/whisker/model/util/CheckGenerator";
import Sprite from "../../../../src/vm/sprite";
import TestDriver from "../../../../src/test/test-driver";
import {SpriteNotFoundError} from "../../../../src/whisker/model/util/ModelError";

class TestDriverMock {
    public currentSprites: Record<string, Sprite> = {};
    public stage: Sprite = null;
    public isMouseDown = true;

    public getTestDriver(): TestDriver {
        return {
            getSprites: (filter: ((s: Sprite) => boolean)) => Object.values(this.currentSprites).filter(filter),
            getStage: () => this.stage,
            isMouseDown: () => this.isMouseDown
        } as unknown as TestDriver;
    }
}

class SpriteMock {
    public name: string;
    public isOriginal = true;
    public isTouchingMouse = true;
    public visible = true;

    constructor(name: string) {
        this.name = name;
    }

    getSprite() {
        return {
            name: this.name,
            isOriginal: this.isOriginal,
            visible: this.visible,
            isTouchingMouse: () => this.isTouchingMouse
        } as unknown as Sprite;
    }
}

describe('CheckGenerator', () => {
    describe('getKeyDownCheck()', () => {
        const pressedKeys: Record<string, boolean> = {
            "a": true,
            "b": false,
            "c": true,
        };
        const cu = {
            isKeyDown: (key: string) => pressedKeys[key] == true
        } as unknown as CheckUtility;

        test('Has the correct return type', () => {
            const result = CheckGenerator.getKeyDownCheck(null, cu, false, "a");
            expect(typeof result).toEqual(typeof (() => false));
        });

        test('Returned Function evaluates to the correct values', () => {
            const result = CheckGenerator.getKeyDownCheck(null, cu, false, "a");
            pressedKeys["a"] = true;
            expect(result()).toEqual(true);
            pressedKeys["a"] = false;
            expect(result()).toEqual(false);
        });
    });

    describe('getSpriteClickedCheck', () => {
        const tdMock = new TestDriverMock();
        const t = tdMock.getTestDriver();
        test('throws exception when no sprite exists', () => {
            tdMock.currentSprites = {};
            expect(() => {
                CheckGenerator.getSpriteClickedCheck(t, false, false, "banana");
            }).toThrow(SpriteNotFoundError);
        });

        test('throws exception when correct sprite does not exist', () => {
            const apple = new SpriteMock("apple");
            tdMock.currentSprites = {"apple": apple.getSprite()};
            expect(() => {
                CheckGenerator.getSpriteClickedCheck(t, false, false, "banana");
            }).toThrow(SpriteNotFoundError);
        });

        test('Has the correct return type', () => {
            const apple = new SpriteMock("apple");
            tdMock.currentSprites = {"apple": apple.getSprite()};
            const result = CheckGenerator.getSpriteClickedCheck(t, false, false, "apple");
            expect(typeof result).toEqual(typeof (() => false));
        });

        it.each([true, false])('returns correct sprite if possible (negated: %s)', (negated: boolean) => {
            const apple = new SpriteMock("apple");
            tdMock.currentSprites = {"apple": apple.getSprite()};
            tdMock.isMouseDown = true;
            apple.isTouchingMouse = true;
            const result = CheckGenerator.getSpriteClickedCheck(t, negated, false, "apple");
            expect(result()).toEqual(!negated);
            apple.isTouchingMouse = false;
            expect(result()).toEqual(negated);
        });
    });
});
