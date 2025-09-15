import {TestDriverMock} from "../mocks/TestDriverMock";
import {Click} from "../../../../src/whisker/model/checks/Click";
import {CheckUtility} from "../../../../src/whisker/model/util/CheckUtility";
import {SpriteNotFoundError} from "../../../../src/whisker/model/util/ModelError";
import {SpriteMock} from "../mocks/SpriteMock";


describe('Click tests', () => {
    const graphID = "graphID";
    const tdMock = new TestDriverMock();
    const t = tdMock.getTestDriver();
    const edgeLabel = 'edgeID';
    const clickCheck = new Click(edgeLabel, {args: ['banana']});
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

    it.each([true, false])('returns correct sprite if possible (negated: %s)', (negated: boolean) => {
        const apple = new SpriteMock("apple");
        const tdMock = new TestDriverMock();
        tdMock.currentSprites = SpriteMock.toSpriteArray([
            new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("kiwi"), apple, new SpriteMock("pineapple")
        ]);

        const clickCheck = new Click(edgeLabel, {negated, args: ['apple']});
        const cu = {
            addErrorOutput: jest.fn(),
        } as unknown as CheckUtility;
        clickCheck.registerComponents(tdMock.getTestDriver(), cu, graphID);

        tdMock.isMouseDown = true;
        apple.touchingMouse = true;
        expect(clickCheck.check().passed).toEqual(!negated);
        apple.touchingMouse = false;
        tdMock.nextStep();
        expect(clickCheck.check().passed).toEqual(negated);
        expect(cu.addErrorOutput).not.toHaveBeenCalled();
    });
});
