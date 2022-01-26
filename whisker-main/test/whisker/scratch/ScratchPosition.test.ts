import {ScratchPosition} from "../../../src/whisker/scratch/ScratchPosition";
import {expect} from "@jest/globals";

describe("ScratchPosition Test", () => {

    let position: ScratchPosition;

    beforeEach(() => {
        position = new ScratchPosition(1, 1);
    });

    test("Test distanceTo", () => {
        const otherPosition = new ScratchPosition(-6, 1);
        expect(position.distanceTo(otherPosition)).toBe(7);
    });

    test("Test goInDirection", () => {
        const degree = 180;
        const distance = 5;
        const movedPoint = position.goInDirection(degree, distance);
        expect(movedPoint.x).toBe(-4);
        expect(movedPoint.y).toBe(1);
    });

    test("Test goInDirectionTilted", () => {
        const degree = 180;
        const distance = 5;
        const movedPoint = position.goInDirectionTilted(degree, distance);
        expect(movedPoint.x).toBe(1);
        expect(movedPoint.y).toBe(-4);
    });

    test("Test clone", () => {
        const clone = position.clone();
        expect(clone.x).toBe(position.x);
        expect(clone.y).toBe(position.y);
        expect(clone === position).toBeFalsy();
    });

    test("Test equals", () => {
        const otherPosition = new ScratchPosition(1, 0);
        const clone = position.clone();
        expect(position.equals(otherPosition)).toBeFalsy();
        expect(position.equals(clone)).toBeTruthy();
    });

    test("Test toString", () => {
        expect(position.toString()).toBe(`ScratchPosition(${position.x}/${position.y})`);
    });
});
