import {TestDriverMock} from "../mocks/TestDriverMock";
import {SpriteMock} from "../mocks/SpriteMock";
import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {ArgType} from "../../../../src/whisker/model/util/schema";
import {SpriteColor} from "../../../../src/whisker/model/checks/SpriteColor";


describe('SpriteColor tests', () => {
    const graphID = "graphID";
    const tdMock = new TestDriverMock();
    tdMock.currentSprites = [new SpriteMock("apple").sprite];
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
            expect(() => new SpriteColor('label', {negated: true, args: ["apple", r, g, b]}))
                .toThrowError();
        });

        it.each(colorsWrongBounds)('getKeyDownThrowsForColors(%d, %d, %d) throws RGBRangeError', (r: number, g: number, b: number) => {
            expect(() => new SpriteColor('label', {negated: true, args: ["apple", r, g, b]}))
                .toThrowError();
        });
    });

    test('cu.registerOnMoveEvent() is called with correct params', () => {
        const fn = jest.fn();
        const cu = getDummyCheckUtility();
        cu.registerOnMoveEvent = fn;
        const kiwi = new SpriteMock("kiwi");
        tdMock.currentSprites = SpriteMock.toSpriteArray([
            new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("apple"), kiwi
        ]);
        const c = new SpriteColor('label', {args: ["apple", 255, 0, 0]});
        c.registerComponents(tdMock.getTestDriver(), cu, graphID);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it.each([true, false])('returned function depends on touchingColor (negated: %s)', (negated: boolean) => {
        const kiwi = new SpriteMock("kiwi");
        tdMock.currentSprites = SpriteMock.toSpriteArray([
            new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("apple"), kiwi
        ]);
        kiwi.touchingColor = true;
        const c = new SpriteColor('label', {negated: negated, args: ["kiwi", 255, 128, 64]});
        c.registerComponents(tdMock.getTestDriver(), dummyCU, graphID);
        let result = c.check();
        expect(result.passed).toEqual(!negated);
        kiwi.touchingColor = false;
        tdMock.nextStep();
        result = c.check();
        expect(result.passed).toEqual(negated);
    });
});
