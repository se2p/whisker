import {Container} from "../utils/Container";
import {ScratchPosition} from "./ScratchPosition";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";
import Cast from "scratch-vm/src/util/cast";
import Arrays from "../utils/Arrays";

const twgl = require('twgl.js');


export class ScratchInterface {

    public static getPositionOfTarget(target: RenderedTarget): ScratchPosition {
        return new ScratchPosition(target.x, target.y);
    }

    public static getBoundsOfTarget(target: RenderedTarget): { left: number, right: number, top: number, bottom: number } {
        return target.getBounds();
    }

    public static getWidthOfTarget(target: RenderedTarget): number {
        const bounds = this.getBoundsOfTarget(target);
        return Math.abs(bounds.right - bounds.left);
    }

    public static getHeightOfTarget(target: RenderedTarget): number {
        const bounds = this.getBoundsOfTarget(target);
        return Math.abs(bounds.top - bounds.bottom);
    }

    public static getSafetyDistanceFromTarget(target: RenderedTarget, safetySpace: number): number {
        return Math.hypot(this.getWidthOfTarget(target), this.getHeightOfTarget(target)) / 2 + safetySpace;
    }

    public static getMousePosition(): ScratchPosition {
        const mouse = Container.vmWrapper.vm.runtime.ioDevices[`mouse`];
        return new ScratchPosition(mouse._x, mouse._y);
    }

    public static setMousePosition(position: ScratchPosition): void {
        const mouse = Container.vmWrapper.vm.runtime.ioDevices[`mouse`];
        mouse._x = position.x;
        mouse._y = position.y;
    }

    /**
     * Check if color1 matches color2.
     * @param color1 the first color
     * @param color2 the second color
     */
    public static isColorMatching(color1: Uint8ClampedArray, color2: Uint8ClampedArray): boolean {
        return (color1[0] & 0b11111000) === (color2[0] & 0b11111000) &&
            (color1[1] & 0b11111000) === (color2[1] & 0b11111000) &&
            (color1[2] & 0b11110000) === (color2[2] & 0b11110000);
    }

    public static getColorFromHex(hexCode: string): Uint8ClampedArray {
        return Cast.toRgbColorList(hexCode);
    }

    public static getColorAtPosition(position: ScratchPosition, excludeTarget: RenderedTarget = undefined): Uint8ClampedArray {
        // Collect all touchable objects which might carry the sensed color
        const renderer = Container.vmWrapper.vm.runtime.renderer;
        const touchableObjects = [];
        for (let index = renderer._visibleDrawList.length - 1; index >= 0; index--) {
            const id = renderer._visibleDrawList[index];
            // We might want to exclude a target and by that see through it and gather the color behind it.
            if (!excludeTarget || id !== excludeTarget.drawableID) {
                const drawable = renderer._allDrawables[id];
                touchableObjects.push({id, drawable});
            }
        }
        const color = new Uint8ClampedArray(4);
        const point = twgl.v3.create();
        point[0] = position.x;
        point[1] = position.y;
        Container.vm.renderer.constructor.sampleColor3b(point, touchableObjects, color);
        return color;
    }

    public static findColorWithinRadius(color: string, samplingResolution = 5, maxRadius = 600,
                                        startingPoint = new ScratchPosition(0, 0)): ScratchPosition {
        const targetColor = this.getColorFromHex(color);
        let radius = 1;
        const searchAngles = Arrays.range(0, 360, 10);
        while (radius < maxRadius) {
            for (const angle of searchAngles) {
                const scratchPoint = startingPoint.goInDirection(angle, radius);
                const colorAtPosition = this.getColorAtPosition(scratchPoint);
                if (this.isColorMatching(targetColor, colorAtPosition) && this.isPointWithinCanvas(scratchPoint)) {
                    return scratchPoint;
                }
            }
            radius += samplingResolution;
        }
        // At this point we didn't find the color
        return undefined;
    }

    /**
     * Check if the given point (x/y) lies within the bounds of the Scratch Canvas/Stage.
     * @param point the ScratchPosition to be checked if its located on top of the Canvas/Stage.
     * @returns boolean determining if the given point lies within the Scratch Canvas/Stage.
     */
    public static isPointWithinCanvas(point: ScratchPosition): boolean {
        const stageWidth = Container.vmWrapper.getStageSize().width;
        const stageHeight = Container.vmWrapper.getStageSize().height;
        return Math.abs(point.x) < stageWidth / 2 && Math.abs(point.y) < stageHeight / 2;
    }
}

/**
 * A ScratchProgram is an object that holds all the necessary data required to initialise a Scratch VM which can then
 * be executed.
 */
export interface ScratchProgram {
    name?: string,
    extensions: [],
    meta: Record<string, unknown>,
    monitors: [],
    targets: RenderedTarget[]
}
