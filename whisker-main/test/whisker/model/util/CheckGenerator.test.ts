import {
    ComparisonNotKnownError,
    NotANumericalValueError,
    RGBRangeError,
    SpriteNotFoundError
} from "../../../../src/whisker/model/util/ModelError";
import {SpriteMock} from "../SpriteMock";
import {TestDriverMock} from "../TestDriverMock";
import {CheckUtilityMock, getDummyCheckUtility} from "../CheckUtilityMock";
import Sprite from "../../../../src/vm/sprite";
import {ArgType} from "../../../../src/whisker/model/util/schema";
import {Key} from "../../../../src/whisker/model/checks/Key";
import {Click} from "../../../../src/whisker/model/checks/Click";
import {CheckUtility} from "../../../../src/whisker/model/util/CheckUtility";
import {SpriteColor} from "../../../../src/whisker/model/checks/SpriteColor";
import {SpriteTouching} from "../../../../src/whisker/model/checks/SpriteTouching";
import {VarComp} from "../../../../src/whisker/model/checks/VarComp";
import {VarChange} from "../../../../src/whisker/model/checks/VarChange";
import {AttrComp} from "../../../../src/whisker/model/checks/AttrComp";
import {AttrChange} from "../../../../src/whisker/model/checks/AttrChange";
import {BackgroundChange} from "../../../../src/whisker/model/checks/BackgroundChange";
import {Output} from "../../../../src/whisker/model/checks/Output";
import {NbrOfClones, NbrOfVisibleClones} from "../../../../src/whisker/model/checks/NbrOfClones";
import {Probability} from "../../../../src/whisker/model/checks/Probability";
import {Randomness} from "../../../../src/whisker/utils/Randomness";
import {Expr} from "../../../../src/whisker/model/checks/Expr";
import {TimeElapsed} from "../../../../src/whisker/model/checks/TimeElapsed";
import {TimeBetween} from "../../../../src/whisker/model/checks/TimeBetween";
import {TimeAfterEnd} from "../../../../src/whisker/model/checks/TimeAfterEnd";
import {TouchingEdge, TouchingHorizEdge, TouchingVerticalEdge} from "../../../../src/whisker/model/checks/TouchingEdge";

describe('CheckGenerator', () => {

    const graphID = "graphID";

    describe('getKeyDownCheck()', () => {
        const cuMock = new CheckUtilityMock({"a": true, "b": false, "c": true,});
        const cu = cuMock.getCheckUtility();
        const keyCheck = new Key('label', {id: 'id', negated: false, args: ['a']});
        keyCheck.registerComponents(null, cu, graphID);

        test('Has the correct return type', () => {
            expect(typeof keyCheck.check).toEqual(typeof (() => false));
        });

        test('Returned Function evaluates to the correct values', () => {
            cuMock.pressedKeys["a"] = true;
            expect(keyCheck.check()).toEqual(true);
            cuMock.pressedKeys["a"] = false;
            expect(keyCheck.check()).toEqual(false);
        });
    });

    describe('getSpriteClickedCheck()', () => {
        const tdMock = new TestDriverMock();
        const t = tdMock.getTestDriver();
        const edgeLabel = 'edgeID';
        const clickCheck = new Click(edgeLabel, {id: 'id', negated: false, args: ['banana']});
        const cu = {
            addErrorOutput: jest.fn(),
        } as unknown as CheckUtility;
        clickCheck.registerComponents(t, cu, graphID);

        test('throws exception when no sprite exists', () => {
            tdMock.currentSprites = [];
            clickCheck.check();
            expect(cu.addErrorOutput).toHaveBeenCalledWith(edgeLabel, graphID, new SpriteNotFoundError('banana'));
        });

        test('throws exception when correct sprite does not exist', () => {
            const apple = new SpriteMock("apple");
            tdMock.currentSprites = [apple.sprite];
            clickCheck.check();
            expect(cu.addErrorOutput).toHaveBeenCalledWith(edgeLabel, graphID, new SpriteNotFoundError('banana'));
        });

        test('Has the correct return type', () => {
            const apple = new SpriteMock("apple");
            tdMock.currentSprites = [apple.sprite];
            expect(typeof clickCheck.check).toEqual(typeof (() => false));
        });

        it.each([true, false])('returns correct sprite if possible (negated: %s)', (negated: boolean) => {
            const apple = new SpriteMock("apple");
            const tdMock = new TestDriverMock();
            tdMock.currentSprites = SpriteMock.toSpriteArray([
                new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("kiwi"), apple
                // when adding new SpriteMock("pineapple") the test fails. This does not seem right -> potential bug
            ]);

            const clickCheck = new Click(edgeLabel, {id: 'id', negated, args: ['apple']});
            const cu = {
                addErrorOutput: jest.fn(),
            } as unknown as CheckUtility;
            clickCheck.registerComponents(tdMock.getTestDriver(), cu, graphID);

            tdMock.isMouseDown = true;
            apple.touchingMouse = true;
            expect(clickCheck.check()).toEqual(!negated);
            apple.touchingMouse = false;
            expect(clickCheck.check()).toEqual(negated);
            expect(cu.addErrorOutput).not.toHaveBeenCalled();
        });
    });

    describe('getSpriteColorTouchingCheck()', () => {
        const tdMock = new TestDriverMock();
        tdMock.currentSprites = [new SpriteMock("apple").sprite];
        const t = tdMock.getTestDriver();
        const dummyCU = getDummyCheckUtility();

        describe('Throws for wrong RGB values', () => {
            const colorsWrongBounds: [ArgType, ArgType, ArgType][] = [
                [-1, 10, 20], [10, -1, 20], [10, 20, -1],
                [256, 10, 42], [1, 1000, 13], [87, 128, 300],
            ];

            const colorsNaN: [ArgType, ArgType, ArgType][] = [
                [undefined, 1, 2], [1, undefined, 2], [3, 4, undefined],
                ["someString", 34, 123], [2, "test", 21], [12, 34, "fiftysix"]
            ];

            it.each(colorsNaN)('getKeyDownThrowsForColors(%d, %d, %d) throws NotANumericalValueError', (r: number, g: number, b: number) => {
                expect(() => new SpriteColor('label', {id: 'id', negated: true, args: ["apple", r, g, b]}))
                    .toThrowError();
            });

            it.each(colorsWrongBounds)('getKeyDownThrowsForColors(%d, %d, %d) throws RGBRangeError', (r: number, g: number, b: number) => {
                expect(() => new SpriteColor('label', {id: 'id', negated: true, args: ["apple", r, g, b]}))
                    .toThrowError();
            });
        });

        test('cu.registerOnMoveEvent() is called with correct params', () => {
            const fn = jest.fn();
            let check: (sprite: Sprite) => boolean;
            const cu = getDummyCheckUtility();
            cu.registerOnMoveEvent = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                      predicate: (sprite: Sprite) => boolean) => {
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
                check = predicate;
            };
            const kiwi = new SpriteMock("kiwi");
            tdMock.currentSprites = SpriteMock.toSpriteArray([
                new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("apple"), kiwi
            ]);
            const c = new SpriteColor('label', {id: 'id', negated: false, args: ["apple", 255, 0, 0]});
            c.registerComponents(tdMock.getTestDriver(), cu, graphID);
            expect(fn).toHaveBeenCalledTimes(1);
            expect(check(kiwi.sprite)).toEqual(true);
            kiwi.touchingColor = false;
            expect(check(kiwi.sprite)).toEqual(false);
        });

        test('Has the correct return type', () => {
            const c = new SpriteColor('label', {id: 'id', negated: false, args: ["apple", 0, 255, 0]});
            c.registerComponents(tdMock.getTestDriver(), dummyCU, graphID);
            expect(typeof c.check).toEqual(typeof (() => false));
        });

        it.each([true, false])('returned function depends on touchingColor (negated: %s)', (negated: boolean) => {
            const kiwi = new SpriteMock("kiwi");
            tdMock.currentSprites = SpriteMock.toSpriteArray([
                new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("apple"), kiwi
            ]);
            kiwi.touchingColor = true;
            const c = new SpriteColor('label', {id: 'id', negated: negated, args: ["kiwi", 255, 128, 64]});
            c.registerComponents(tdMock.getTestDriver(), dummyCU, graphID);
            expect(c.check()).toEqual(!negated);
            kiwi.touchingColor = false;
            expect(c.check()).toEqual(negated);
        });
    });

    describe('getSpriteTouchingCheck()', () => {
        const kiwi = new SpriteMock("kiwi");
        const apple = new SpriteMock("apple");
        const banana = new SpriteMock("banana");
        const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), kiwi, apple]);
        const t = tdMock.getTestDriver();
        const dummyCU = getDummyCheckUtility();

        test('cu.registerOnMoveEvent() is called with correct params', () => {
            const fn = jest.fn();
            let check: (sprite: Sprite) => boolean;
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                          predicate: (sprite: Sprite) => boolean) => {
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
                check = predicate;
            };
            const cu = cuMock.getCheckUtility();
            const c = new SpriteTouching("label", {id: 'id', negated: true, args: ["kiwi", "banana"]});
            c.registerComponents(t, cu, graphID);
            expect(fn).toHaveBeenCalledTimes(1);
            expect(check(kiwi.sprite)).toEqual(false);
            kiwi.touchingSprite = false;
            expect(check(kiwi.sprite)).toEqual(true);
        });

        test('Has the correct return type', () => {
            const c = new SpriteTouching("label", {id: 'id', negated: false, args: ["apple", "banana"]});
            c.registerComponents(t, dummyCU, graphID);
            expect(typeof c.check).toEqual(typeof (() => false));
        });

        it.each([true, false])('returned function depends on touchingSprite (negated: %s)', (negated: boolean) => {
            banana.touchingSprite = true;
            const c = new SpriteTouching("label", {id: 'id', negated: negated, args: ["banana", "kiwi"]});
            c.registerComponents(t, dummyCU, graphID);
            expect(c.check()).toEqual(!negated);
            banana.touchingSprite = false;
            expect(c.check()).toEqual(negated);
        });
    });

    describe('getVariableComparisonCheck', () => {
        const stage = new SpriteMock("_stage_");
        const kiwi = new SpriteMock("kiwi");
        const apple = new SpriteMock("apple");
        const banana = new SpriteMock("banana");
        const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), kiwi, apple, stage]);
        const t = tdMock.getTestDriver();
        const dummyCU = getDummyCheckUtility();
        apple.variables = [{name: "x", value: 2}];
        stage.variables = [{name: "x", value: 10}];
        tdMock.stage = stage.sprite;

        test('Has the correct return type', () => {
            const c = new VarComp('label', {id: 'id', negated: false, args: ["apple", "x", "<", "3"]});
            c.registerComponents(t, dummyCU, graphID);
            expect(typeof c.check).toEqual(typeof (() => false));
        });

        it.each(["someInvalidComparison", "<=>", "<>", "><"])('throws for comparison %s', (cmp: string) => {
            const c = new VarComp('label', {id: 'id', negated: false, args: ["apple", "x", cmp, "3"]});
            c.registerComponents(t, dummyCU, graphID);
            c.check();
            expect(dummyCU.addErrorOutput).toHaveBeenCalledWith('label', graphID, new ComparisonNotKnownError(cmp));
        });

        test('VarEvent is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnVarEvent = fn;
            const cu = cuMock.getCheckUtility();
            const c = new VarComp('label', {id: 'id', negated: false, args: ["apple", "x", "==", "2"]});
            c.registerComponents(t, cu, graphID);
            expect(fn).toHaveBeenLastCalledWith(apple.variables[0].name, "VarComp:apple:x:==:2", "label", graphID, c.check);
        });

        test('Check works for stage', () => {
            const c = new VarComp('label', {id: 'id', negated: false, args: ["_stage_", "x", "==", "10"]});
            c.registerComponents(t, dummyCU, graphID);
            const res = c.check;
            expect(res()).toEqual(true);
            stage.variables[0].value = 9;
            expect(res()).toEqual(false);
        });
    });

    describe('getVariableChangeCheck', () => {
        const dummyCU = getDummyCheckUtility();
        const stage = new SpriteMock("_stage_");
        const oldStage = new SpriteMock("_stage_");
        const apple = new SpriteMock("apple");
        const banana = new SpriteMock("banana");
        stage.variables = [{name: "Punkte", value: 9, old: {name: "Punkte", value: 10}}];
        stage.old = oldStage;
        apple.variables = [{name: "x", value: 2}];
        const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), apple, stage]);
        tdMock.stage = stage.sprite;
        const t = tdMock.getTestDriver();

        test('Has the correct return type', () => {
            const c = new VarChange('label', {id: 'id', negated: false, args: ["apple", "x", "+"]});
            c.registerComponents(t, dummyCU, graphID);
            expect(typeof c.check).toEqual(typeof (() => false));
        });

        test('VarEvent is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnVarEvent = fn;
            const cu = cuMock.getCheckUtility();
            const c = new VarChange('label', {id: 'id', negated: false, args: ["apple", "x", "+"]});
            c.registerComponents(t, cu, graphID);
            expect(fn).toHaveBeenLastCalledWith(apple.variables[0].name, "VarChange:apple:x:+", "label", graphID, c.check);
        });

        test('Check works for stage', () => {
            const c = new VarChange('label', {id: 'id', negated: false, args: ["_stage_", "Punkte", "-"]});
            c.registerComponents(t, dummyCU, graphID);
            expect(c.check()).toEqual(true);
            stage.variables = [{name: "Punkte", value: 10, old: {name: "Punkte", value: 9}}];
            expect(c.check()).toEqual(false);
        });
    });

    describe('getAttributeComparisonCheck', () => {
        const kiwi = new SpriteMock("kiwi");
        const apple = new SpriteMock("apple");
        const banana = new SpriteMock("banana");
        const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), kiwi, apple]);
        const t = tdMock.getTestDriver();
        const dummyCU = getDummyCheckUtility();
        kiwi.variables = [
            {name: "x", value: 2},
            {name: "size", value: 10},
            {name: "sayText", value: "this is some text"}
        ];
        kiwi.updateSprite();

        it.each(["someInvalidComparison", "<=>", "<>", "><"])('throws for comparison %s', (cmp: string) => {
            const c = new AttrComp('label', {id: 'id', negated: false, args: ["kiwi", "size", cmp, "3"]});
            c.registerComponents(t, dummyCU, graphID);
            c.check();
            expect(dummyCU.addErrorOutput).toHaveBeenCalledWith('label', graphID, new ComparisonNotKnownError(cmp));
        });

        test('Has the correct return type', () => {
            const c = new AttrComp('label', {id: 'id', negated: false, args: ["kiwi", "size", "<", "3"]});
            c.registerComponents(t, dummyCU, graphID);
            expect(typeof c.check).toEqual(typeof (() => false));
        });

        test('OnMoveEvent is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = fn;
            const cu = cuMock.getCheckUtility();
            const c = new AttrComp('label', {id: 'id', negated: false, args: ["kiwi", "x", "==", "7"]});
            c.registerComponents(t, cu, graphID);
            expect(fn).toHaveBeenLastCalledWith("kiwi", "AttrComp:kiwi:x:==:7", "label", graphID, expect.anything());
        });

        test('OnVisualChange is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnVisualChange = fn;
            const cu = cuMock.getCheckUtility();
            const c = new AttrComp('label', {id: 'id', negated: false, args: ["kiwi", "size", "<", "42"]});
            c.registerComponents(t, cu, graphID);
            expect(fn).toHaveBeenLastCalledWith("kiwi", "AttrComp:kiwi:size:<:42", "label", graphID, expect.anything());
        });

        test('Output is registered on CheckUtil for changing output', () => {
            let check: ((sprite: Sprite) => boolean);
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOutput = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                     predicate: (sprite: Sprite) => boolean) => {
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
                check = predicate;
            };
            const cu = cuMock.getCheckUtility();
            const c = new AttrComp('label', {id: 'id', negated: false, args: ["kiwi", "sayText", "==", "this is some text"]});
            c.registerComponents(t, cu, graphID);
            expect(fn).toHaveBeenLastCalledWith("kiwi", "AttrComp:kiwi:sayText:==:this is some text", "label", graphID, check);
            expect(check(kiwi.sprite)).toBe(true);
            kiwi.sayText = "the kiwi has nothing to say";
            kiwi.updateSprite();
            expect(check(kiwi.sprite)).toBe(false);
        });

        test('Output is registered on CheckUtil for changing coordinates', () => {
            const sprite = new SpriteMock("apple", [{name: "x", value: 31415}]);
            const tdMock = new TestDriverMock([sprite]);
            const t = tdMock.getTestDriver();
            let check: ((sprite: Sprite) => boolean);
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                          predicate: (sprite: Sprite) => boolean) => {
                check = predicate;
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
            };
            const cu = cuMock.getCheckUtility();
            const c = new AttrComp('label', {id: 'id', negated: false, args: ["apple", "x", "<=", "42"]});
            c.registerComponents(t, cu, graphID);
            expect(fn).toHaveBeenLastCalledWith("apple", "AttrComp:apple:x:<=:42", "label", graphID, check);
            expect(check(sprite.sprite)).toBe(false);
            sprite.variables = [{name: "x", value: 0}];
            sprite.updateSprite();
            expect(check(sprite.sprite)).toBe(true);
        });

        test('Output is registered on CheckUtil for changing visual', () => {
            const sprite = new SpriteMock("_stage_");
            sprite.currentCostumeName = "defaultStage";
            const tdMock = new TestDriverMock([sprite]);
            tdMock.stage = sprite.updateSprite();
            const t = tdMock.getTestDriver();
            const fn = jest.fn();
            let check: ((sprite: Sprite) => boolean);
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnVisualChange = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                             predicate: (sprite: Sprite) => boolean) => {
                check = predicate;
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
            };
            const cu = cuMock.getCheckUtility();
            const c = new AttrComp('label', {id: 'id', negated: true, args: ["_stage_", "currentCostume", "==", "win"]});
            c.registerComponents(t, cu, graphID);
            expect(fn).toHaveBeenLastCalledWith("_stage_", "!AttrComp:_stage_:costume:==:win", "label", graphID, check);
            expect(check(sprite.sprite)).toBe(true);
            sprite.currentCostumeName = "win";
            sprite.updateSprite();
            expect(check(sprite.sprite)).toBe(false);
        });

        it.each([false, true])('Returned function includes original sprite (negated: %s)', (negated) => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = fn;
            const cu = cuMock.getCheckUtility();
            kiwi.clones = [new SpriteMock("kiwi")];
            kiwi.clones[0].variables = [{name: "x", value: 4}];
            kiwi.clones[0].updateSprite();
            const c = new AttrComp('label', {id: 'id', negated, args: ["kiwi", "x", "<", "3"]});
            c.registerComponents(t, cu, graphID);
            expect(c.check()).toEqual(!negated);
        });

        it.each([false, true])('Returned function includes clones (negated: %s)', (negated) => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = fn;
            const cu = cuMock.getCheckUtility();
            kiwi.clones = [new SpriteMock("kiwi"), new SpriteMock("kiwi"), new SpriteMock("kiwi")];
            kiwi.clones[0].variables = [{name: "x", value: 4}];
            kiwi.clones[1].variables = [{name: "x", value: 8}];
            kiwi.clones[2].variables = [{name: "x", value: 16}];
            kiwi.clones.forEach(c => c.updateSprite());
            const c = new AttrComp('label', {id: 'id', negated, args: ["kiwi", "x", ">", "15"]});
            c.registerComponents(t, cu, graphID);
            expect(c.check()).toEqual(!negated);
        });
    });

    describe('getAttributeChangeCheck', () => {
        const dummyCU = getDummyCheckUtility();
        const stage = new SpriteMock("_stage_", [{
            name: "currentCostumeName",
            value: "win",
            old: {name: "currentCostumeName", value: "lose"}
        }]);
        const oldStage = new SpriteMock("_stage_", [{name: "currentCostumeName", value: "lose"}]);
        const apple = new SpriteMock("apple", [{name: "x", value: 2}, {name: "size", value: 10}]);
        apple.old = new SpriteMock("apple", [{name: "x", value: 42}, {name: "size", value: 20}]);
        const banana = new SpriteMock("banana");
        stage.old = oldStage;
        const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), apple, stage]);
        tdMock.stage = stage.sprite;
        const t = tdMock.getTestDriver();

        test('Has the correct return type', () => {
            const c = new AttrChange('label', {id: 'id', negated: false, args: ["apple", "x", "-"]});
            c.registerComponents(t, dummyCU, graphID);
            expect(typeof c.check).toEqual(typeof (() => false));
        });

        test('VarEvent is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cu = getDummyCheckUtility();
            let check: (sprite: Sprite) => boolean;
            cu.registerOnVisualChange = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                         predicate: (sprite: Sprite) => boolean) => {
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
                check = predicate;
            };
            const c = new AttrChange('label', {id: 'id', negated: false, args: ["apple", "size", "+"]});
            c.registerComponents(t, cu, graphID);
            expect(fn).toHaveBeenLastCalledWith(apple.name, "AttrChange:apple:size:+", "label", graphID, check);
            expect(check(apple.sprite)).toBe(false);
        });

        test('MoveEvent is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cu = getDummyCheckUtility();
            let check: (sprite: Sprite) => boolean;
            cu.registerOnMoveEvent = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                      predicate: (sprite: Sprite) => boolean) => {
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
                check = predicate;
            };
            const c = new AttrChange('label', {id: 'id', negated: false, args: ["apple", "x", "+"]});
            c.registerComponents(t, cu, graphID);
            expect(fn).toHaveBeenLastCalledWith(apple.name, "AttrChange:apple:x:+", "label", graphID, check);
            expect(check(apple.sprite)).toBe(false);
        });

        test('Check is not a constant function', () => {
            const c = new AttrChange('label', {id: 'id', negated: true, args: ["_stage_", "currentCostume", "=="]});
            c.registerComponents(t, dummyCU, graphID);
            expect(c.check()).toEqual(true);
            stage.variables = [{
                name: "currentCostumeName",
                value: "lose",
                old: {name: "currentCostumeName", value: "lose"}
            }];
            tdMock.currentSprites = SpriteMock.toSpriteArray([banana, new SpriteMock("bowl"), apple, stage]);
            expect(c.check()).toEqual(false);
        });
    });

    test('getBackgroundChangeCheck', () => {
        const dummyCU = getDummyCheckUtility();
        const stage = new SpriteMock("_stage_", [{name: "currentCostumeName", value: "win"}]);
        const tdMock = new TestDriverMock([stage]);
        tdMock.stage = stage.sprite;
        const t = tdMock.getTestDriver();
        const c = new BackgroundChange('label', {id: 'id', negated: false, args: ['win']});
        c.registerComponents(t, dummyCU, graphID);
        expect(c.check()).toEqual(true);
        stage.variables = [{name: "currentCostumeName", value: "lose"}];
        tdMock.currentSprites = SpriteMock.toSpriteArray([stage]);
        tdMock.stage = stage.sprite;
        expect(c.check()).toEqual(false);
    });

    describe('getOutputOnSpriteCheck()', () => {
        const dummyCU = getDummyCheckUtility();
        const banana = new SpriteMock("Banana");
        banana.sayText = "this is some text";
        const kiwi = new SpriteMock("kiwi");
        kiwi.sayText = "this is a text as well";
        const tdMock = new TestDriverMock([banana, kiwi]);
        const t = tdMock.getTestDriver();

        test('Generates check compares actual output correctly', () => {
            const c = new Output('label', {id: 'id', negated: false, args: ["Banana", "this is some text"]});
            c.registerComponents(t, dummyCU, graphID);
            expect(c.check()).toEqual(true);
            banana.sayText = "this is a different text";
            tdMock.currentSprites = [kiwi.updateSprite(), banana.updateSprite()];
            expect(c.check()).toEqual(false);
        });

        test('Correct predicate is registered at CheckUtility', () => {
            const cu = getDummyCheckUtility();
            const fn = jest.fn();
            let check: (sprite: Sprite) => boolean;
            cu.registerOutput = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                 predicate: (sprite: Sprite) => boolean) => {
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
                check = predicate;
            };
            const c = new Output('label', {id: 'id', negated: false, args: ["kiwi", "this is a text as well"]});
            c.registerComponents(t, cu, graphID);
            expect(fn).toHaveBeenCalledWith("kiwi", "Output:kiwi:this is a text as well", "label", graphID, check);
            expect(check(kiwi.sprite)).toEqual(true);
            kiwi.sayText = "this is a different text";
            tdMock.currentSprites = [kiwi.updateSprite(), banana.updateSprite()];
            expect(check(kiwi.sprite)).toEqual(false);
        });
    });

    describe('getNumberOfClonesCheck', () => {
        const banana = new SpriteMock("banana");
        banana.clones = [new SpriteMock("banana"), new SpriteMock("banana"), new SpriteMock("banana")];
        const apple = new SpriteMock("apple");
        apple.clones = [
            new SpriteMock("apple"), new SpriteMock("apple"), new SpriteMock("apple"),
            new SpriteMock("apple"), new SpriteMock("apple")
        ];
        const bowl = new SpriteMock("bowl");
        apple.clones[1].visible = false;
        banana.clones[0].visible = false;
        banana.clones[2].visible = false;
        const tdMock = new TestDriverMock([apple, banana, bowl, ...apple.clones, ...banana.clones]);
        const t = tdMock.getTestDriver();
        const table: [string, boolean, number][] = [
            ["banana", true, 2], ["banana", false, 4], ["apple", true, 5], ["apple", false, 6], ["bowl", false, 1]
        ];
        it.each(table)('counts correct amount of %s with visible necessary == %s',
            (name, visible, count) => {
                const c = new (visible ? NbrOfVisibleClones : NbrOfClones)('label', {id: 'id', negated: false, args: [name, "==", count]});
                c.registerComponents(t, null, graphID);
                expect(c.check()).toBe(true);
            });

        test('throws exception for invalid comparison', () => {
            const c = new NbrOfClones('label', {id: 'id', negated: true, args: ["banana", "<=>", 10]});
            const cu =getDummyCheckUtility();
            c.registerComponents(t, cu, graphID);
            expect(cu.addErrorOutput).toHaveBeenCalledWith('label', graphID, new ComparisonNotKnownError("<=>"));
        });
    });


    describe('getProbabilityCheck()', () => {
        const repetitions = 1000;
        test('probability of 1 negated "never" returns true', () => {
            const c = new Probability('label', {id: 'id', negated: true, args: [1]});
            c.registerComponents(null, null, graphID);

            for (let i = 0; i < repetitions; ++i) {
                if (c.check()) {
                    fail("with a probability of 0 the result of the function should not be true");
                }
            }
        });

        test('probability of 0 always returns false', () => {
            const c = new Probability('label', {id: 'id', negated: false, args: [0]});
            c.registerComponents(null, null, graphID);

            for (let i = 0; i < repetitions; ++i) {
                if (c.check()) {
                    fail("with a probability of 0 the result of the function should not be true");
                }
            }
        });

        test('probability of 0.1 returns false more often than true', () => {
            const c = new Probability('label', {id: 'id', negated: false, args: [0.1]});
            c.registerComponents(null, null, graphID);

            let trueCount = 0;
            let falseCount = 0;
            for (let i = 0; i < repetitions; ++i) {
                if (c.check()) {
                    ++trueCount;
                } else {
                    ++falseCount;
                }
            }
            expect(trueCount).toBeGreaterThan(0);
            expect(trueCount).toBeLessThan(falseCount / 5);
        });

        test('Calls Randomness.getInstance().nextDouble()', () => {
            jest.mock('../../../../src/whisker/utils/Randomness');
            let value = 0.75;
            Randomness.getInstance = jest.fn().mockReturnValue({
                nextDouble: () => value
            });
            const c = new Probability('label', {id: 'id', negated: false, args: [0.3414]});
            c.registerComponents(null, null, graphID);
            expect(c.check()).toBe(false);
            value = 0.1;
            expect(c.check()).toBe(true);
            value = 0.42;
            expect(c.check()).toBe(false);
        });
    });

    describe('getExpressionCheck()', () => {
        const boat = new SpriteMock("Boat", [{name: "x", value: 42}, {name: "speed", value: 100}]);
        const gate = new SpriteMock("Gate", [{name: "size", value: 3}]);
        const stage = new SpriteMock("_stage_", [{name: "direction", value: 140}, {name: "score", value: 10}]);
        const tdMock = new TestDriverMock([boat, gate, stage]);
        const cu = getDummyCheckUtility();
        tdMock.stage = stage.sprite;
        const t = tdMock.getTestDriver();
        const expr = "$('Boat', 'x').toString()+(-1*Math.sqrt($('Boat', 'speed', true))).toString() == '42-10' && 3*($('Gate', 'size')+2) < (2*($('_stage_', 'score', true)-1)+10)/1.5";

        test('returned check is correct', () => {
            const c = new Expr('label', {id: 'id', negated: false, args: [expr]});
            c.registerComponents(t, cu, graphID);
            expect(c.check()).toBe(true);
        });

        test('onMove dependencies are correct', () => {
            const cu = getDummyCheckUtility();
            const moveEvent = jest.fn();
            cu.registerOnMoveEvent = moveEvent;
            const c = new Expr('label', {id: 'id', negated: false, args: [expr]});
            c.registerComponents(t, cu, graphID);
            expect(moveEvent).toHaveBeenCalledTimes(1);
            expect(moveEvent).toHaveBeenCalledWith("Boat", "Expr:" + expr, "label", graphID, c.check);
        });

        test('variable dependencies are correct', () => {
            const cu = getDummyCheckUtility();
            const varEvent = jest.fn();
            cu.registerVarEvent = varEvent;
            const c = new Expr('label', {id: 'id', negated: false, args: [expr]});
            c.registerComponents(t, cu, graphID);
            expect(varEvent).toHaveBeenCalledTimes(2);
            expect(varEvent).toHaveBeenCalledWith("speed", "Expr:" + expr, "label", graphID, c.check);
            expect(varEvent).toHaveBeenCalledWith("score", "Expr:" + expr, "label", graphID, c.check);
        });

        test('onVisual dependencies are correct', () => {
            const cu = getDummyCheckUtility();
            const visualEvent = jest.fn();
            cu.registerOnVisualChange = visualEvent;
            const c = new Expr('label', {id: 'id', negated: false, args: [expr]});
            c.registerComponents(t, cu, graphID);
            expect(visualEvent).toHaveBeenCalledTimes(1);
            expect(visualEvent).toHaveBeenCalledWith("Gate", "Expr:" + expr, "label", graphID, c.check);
        });

        it.each([[false, false], [false, true], [true, false], [true, true]])(
            'Returns constant function for negated: %s, param: %s', (negated, value) => {
                const c = new Expr('label', {id: 'id', negated, args: [String(value)]});
                c.registerComponents(null, null, graphID);
                expect(c.check()).toBe(negated ? !value : value);
            });

        test('Can use TestDriver instead of $-function', () => {
            const apple = new SpriteMock("apple");
            const kiwi = new SpriteMock("kiwi");
            const tdMock = new TestDriverMock([apple, kiwi]);
            const cu = getDummyCheckUtility();
            const fn = "t.getSprites(s => s.name == 'apple').length == 1";
            const c = new Expr('label', {id: 'id', negated: false, args: [fn]});
            c.registerComponents(tdMock.getTestDriver(), cu, graphID);
            expect(c.check()).toBe(true);
            tdMock.currentSprites = [kiwi.sprite];
            expect(c.check()).toBe(false);
        });

        test('Registers correct predicate at CheckUtility', () => {
            const apple = new SpriteMock("apple", [{name: "sayText", value: "I am an apple"}]);
            const tdMock = new TestDriverMock([apple]);
            let check: ((sprite: Sprite) => boolean);
            const mock = jest.fn();
            const cu = getDummyCheckUtility();
            cu.registerOutput = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                 predicate: (sprite: Sprite) => boolean): void => {
                check = predicate;
                mock(spriteName, eventString, edgeLabel, graphID, predicate);
            };
            const fn = "t.getSprite('apple').sayText == 'I am an apple'";
            const c = new Expr('label', {id: 'id', negated: false, args: [fn]});
            c.registerComponents(tdMock.getTestDriver(), cu, graphID);
            expect(mock).toHaveBeenCalledWith("apple", "Expr:t.getSprite('apple').sayText == 'I am an apple'", "label", graphID, check);
            expect(check(apple.sprite)).toBe(true);
            apple.variables = [{name: "sayText", value: "I am definitely a pineapple"}];
            tdMock.currentSprites = [apple.updateSprite()];
            expect(check(apple.sprite)).toBe(false);
        });
    });

    test('getTimeElapsedCheck()', () => {
        const tdMock = new TestDriverMock();
        const t = tdMock.getTestDriver();
        t.vmWrapper.convertFromTimeToSteps = (steps: number) => steps / 10;
        const c = new TimeElapsed('label', {id: 'id', negated: false, args: [1230]});
        c.registerComponents(t, null, graphID);
        tdMock.totalStepsExecuted = 122;
        expect(c.check()).toBe(false);
        tdMock.totalStepsExecuted = 123;
        expect(c.check()).toBe(true);
        tdMock.totalStepsExecuted = 1000;
        expect(c.check()).toBe(true);
    });

    test('getTimeBetweenCheck()', () => {
        const tdMock = new TestDriverMock();
        const t = tdMock.getTestDriver();
        t.vmWrapper.convertFromTimeToSteps = (steps: number) => steps / 10;
        const c = new TimeBetween('label', {id: 'id', negated: false, args: [3760]});
        c.registerComponents(t, null, graphID);
        expect(c.check(375)).toBe(false);
        expect(c.check(376)).toBe(true);
        expect(c.check(12371298)).toBe(true);
    });

    describe('getTimeAfterEndCheck()', () => {
        const tdMock = new TestDriverMock();
        const t = tdMock.getTestDriver();
        t.vmWrapper.convertFromTimeToSteps = (steps: number) => steps / 100;
        const c = new TimeAfterEnd('label', {id: 'id', negated: false, args: [68800]});
        c.registerComponents(t, null, graphID);
        const table: [boolean, number, number, number][] = [
            [false, 0, 687, 123],
            [false, 213, 900, 456],
            [true, 312, 1000, 789],
            [true, 4538, 10000, 10]
        ];
        it.each(table)('getTimeAfterEndCheck returns %s for %s steps after end and %s total steps',
            (expected, afterEnd, total, sinceLastTransition) => {
                tdMock.totalStepsExecuted = total;
                expect(c.check(sinceLastTransition, afterEnd)).toBe(expected);
            });
    });

    describe('getTouchingEdgeCheck()', () => {
        const sprite = new SpriteMock("apple");
        sprite.visible = true;
        const tdMock = new TestDriverMock([sprite]);
        const t = tdMock.getTestDriver();
        const cu = getDummyCheckUtility();
        const label = "label";
        const negated = false;

        test('Touching only HorizontalEdgeCheck', () => {
            const c = new TouchingHorizEdge(label, {id: 'id', negated, args: [sprite.name]});
            c.registerComponents(t, cu, graphID);
            sprite.touchingVerticalEdge = true;
            sprite.touchingHorizontalEdge = false;
            expect(c.check()).toBe(false);
            sprite.touchingHorizontalEdge = true;
            expect(c.check()).toBe(true);
            sprite.touchingVerticalEdge = false;
            expect(c.check()).toBe(true);
        });

        test('Touching only VerticalEdgeCheck', () => {
            const c = new TouchingVerticalEdge(label, {id: 'id', negated, args: [sprite.name]});
            c.registerComponents(t, cu, graphID);
            sprite.touchingVerticalEdge = false;
            sprite.touchingHorizontalEdge = true;
            expect(c.check()).toBe(false);
            sprite.touchingVerticalEdge = true;
            expect(c.check()).toBe(true);
            sprite.touchingHorizontalEdge = false;
            expect(c.check()).toBe(true);
        });

        test('Touching any edge', () => {
            const c = new TouchingEdge(label, {id: 'id', negated, args: [sprite.name]});
            c.registerComponents(t, cu, graphID);
            sprite.touchingVerticalEdge = false;
            sprite.touchingHorizontalEdge = false;
            expect(c.check()).toBe(false);
            sprite.touchingVerticalEdge = true;
            expect(c.check()).toBe(true);
            sprite.touchingVerticalEdge = false;
            sprite.touchingHorizontalEdge = true;
            expect(c.check()).toBe(true);
            sprite.touchingVerticalEdge = true;
            expect(c.check()).toBe(true);
        });

        test('Predicate for CheckUtility is correct', () => {
            let check: ((sprite: Sprite) => boolean);
            const cu = getDummyCheckUtility();
            const fn = jest.fn();
            cu.registerOnMoveEvent = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                      predicate: (sprite: Sprite) => boolean): void => {
                fn();
                check = predicate;
            };
            const c = new TouchingEdge(label, {id: 'id', negated, args: [sprite.name]});
            c.registerComponents(t, cu, graphID);
            sprite.touchingVerticalEdge = false;
            sprite.touchingHorizontalEdge = false;
            expect(fn).toHaveBeenCalledTimes(1);
            expect(check(sprite.sprite)).toBe(false);
            sprite.touchingHorizontalEdge = true;
            sprite.touchingVerticalEdge = true;
            expect(check(sprite.sprite)).toBe(true);
            sprite.visible = false;
            sprite.updateSprite();
            expect(check(sprite.sprite)).toBe(false);
        });
    });
});
