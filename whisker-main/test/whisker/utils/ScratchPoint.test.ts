import {ScratchPosition} from "../../../src/whisker/scratch/ScratchPosition";

describe("ScratchCoordinate-Tests", () => {

    let point: ScratchPosition;

    beforeEach(() => {
        point = new ScratchPosition(35, -90);
    });

    test("Equals", () => {
        const otherPoint = new ScratchPosition(35, -90);
        expect(point.equals(otherPoint)).toBeTruthy();
    });
});
