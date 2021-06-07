import VirtualMachine from "scratch-vm/src/virtual-machine";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";
import Cast from "scratch-vm/src/util/cast";
import {List} from "../utils/List";

const twgl = require('twgl.js');


export class InputExtraction {

    /**
     * Extracts pieces of information from all Sprites of the given Scratch project.
     * @param vm the Scratch VM.
     * @return Returns a map where each sprite maps to the extracted information map of the specific sprite.
     */
    static extractSpriteInfo(vm: VirtualMachine): Map<string, Map<string, number>> {
        // The position of a clone in the cloneMap determines its unique identifier.
        const cloneMap = this.assignCloneIds(vm);
        // Go through each sprite and collect input features from them.
        const spriteMap = new Map<string, Map<string, number>>();
        for (const target of vm.runtime.targets) {
            if (!target.isStage && target.hasOwnProperty('blocks')) {
                const spriteFeatures = this._extractInfoFromSprite(target, cloneMap, vm);
                if (target.isOriginal) {
                    spriteMap.set(target.sprite.name, spriteFeatures);
                } else {
                    const distanceID = this.distanceFromOrigin(target);
                    const cloneID = cloneMap.get(target.sprite.name).findElement(distanceID);
                    spriteMap.set(target.sprite.name + "Clone" + cloneID, spriteFeatures);
                }
            }
        }
        return spriteMap;
    }

    /**
     * Assign each clone an ID which is determined by its distance to the origin on the stage
     * This sorting criterion is chosen arbitrarily but enables us to uniquely identify clones.
     * @param vm the VM of the given Scratch-Project
     * @return A map mapping each original sprite having clones to a list of its clone distances.
     */
    private static assignCloneIds(vm: VirtualMachine): Map<string, List<number>> {
        const cloneMap = new Map<string, List<number>>();
        for (const target of vm.runtime.targets) {
            // Get the original and traverse through the clones
            if (target.isOriginal) {
                const cloneDistances = new List<number>();
                for (const clone of target.sprite.clones) {
                    // Check again for clones since the original itself is also saved in the clones list
                    if (!clone.isOriginal) {
                        cloneDistances.add(this.distanceFromOrigin(clone));
                    }
                }
                // Sort the found cloneDistances and save them in the cloneMap.
                cloneDistances.sort((a, b) => a - b);
                cloneMap.set(target.sprite.name, cloneDistances);
            }
        }
        return cloneMap;
    }

    /**
     * Extracts the pieces of information of the given target and normalises in the range [-1, 1]
     * @param target the RenderTarget (-> Sprite) from which information is gathered
     * @param vm the Scratch-VM of the given project
     * @param cloneMap The position of a clone in the cloneMap determines its unique identifier.
     * @return 1-dim array with the columns representing the gathered pieces of information
     */
    private static _extractInfoFromSprite(target: RenderedTarget, cloneMap: Map<string, List<number>>,
                                          vm: VirtualMachine): Map<string, number> {
        const spriteFeatures = new Map<string, number>();
        // stageWidth and stageHeight used for normalisation
        const stageWidth = target.renderer._nativeSize[0];
        const stageHeight = target.renderer._nativeSize[1];

        // Collect Coordinates and normalize
        let x = target.x / (stageWidth / 2.);
        let y = target.y / (stageHeight / 2.);

        // Clamp within the stage
        x = Math.max(-1, Math.min(x, 1))
        y = Math.max(-1, Math.min(y, 1))

        spriteFeatures.set("X-Position", x);
        spriteFeatures.set("Y-Position", y);

        // Collect direction of Sprite
        spriteFeatures.set("Direction", target.direction/180);

        // Collect additional information based on the behaviour of the target
        for (const blockId of Object.keys(target.blocks._blocks)) {
            const block = target.blocks.getBlock(blockId);
            switch (target.blocks.getOpcode(block)) {

                // Check if the target interacts with another target.
                case "sensing_touchingobjectmenu":
                    for (const sensingTarget of vm.runtime.targets) {
                        if (sensingTarget.sprite.name === block.fields.TOUCHINGOBJECTMENU.value) {
                            const distances = this.calculateDistancesSigned(target.x, sensingTarget.x, target.y, sensingTarget.y,
                                stageWidth, stageHeight);
                            if (target.isOriginal) {
                                spriteFeatures.set("DistanceTo" + sensingTarget.sprite.name + "-X", distances.dx);
                                spriteFeatures.set("DistanceTo" + sensingTarget.sprite.name + "-Y", distances.dy);
                            } else {
                                const distanceId = this.distanceFromOrigin(sensingTarget);
                                const cloneId = cloneMap.get(sensingTarget.sprite.name).findElement(distanceId);
                                spriteFeatures.set("DistanceTo" + sensingTarget.sprite.name + "Clone" + cloneId + "-X", distances.dx);
                                spriteFeatures.set("DistanceTo" + sensingTarget.sprite.name + "Clone" + cloneId + "-Y", distances.dy);
                            }
                        }
                    }
                    break;

                // Check if the target interacts with a color on the screen or on a target.
                case "sensing_touchingcolor": {
                    const sensedColor = target.blocks.getBlock(block.inputs.COLOR.block).fields.COLOUR.value;
                    const distances = this.calculateColorDistance(target, sensedColor);
                    // We only want to add distances if we found the color within the scan radius.
                    if (distances.dx && distances.dy) {
                        spriteFeatures.set("DistanceTo" + sensedColor + "-X", distances.dx);
                        spriteFeatures.set("DistanceTo" + sensedColor + "-Y", distances.dy);
                    }
                    break;
                }

                // Check if the target is capable of switching his costume.
                    //TODO: Clump into [-1,1] range. Currently set in range [0,1]
                case "looks_switchcostumeto":
                    spriteFeatures.set("Costume", target.currentCostume / target.sprite.costumes_.length);
                    break;
            }
        }
        return spriteFeatures;
    }

    /**
     * Calculates the distance in x and y direction of two positions on the stage and normalizes it in the range of
     * [-1, 1]. The sign is determined by the relative position of the coordinates;
     * the negative sign means x1 is left of x2 and y1 is below y2
     * the positive sign means x1 is right of x2 and y1 is atop y2
     * @param x1 the first x-coordinate
     * @param x2 the second x-coordinate
     * @param y1 the first y-coordinate
     * @param y2 the second y-coordinate
     * @param stageWidth the width of the stage; used for normalization
     * @param stageHeight the height of the stage; used for normalization
     */
    private static calculateDistancesSigned(x1: number, x2: number, y1: number, y2: number,
                                            stageWidth: number, stageHeight: number): { dx: number, dy: number } {
        // Calculate the normalised distance of the x-Dimension
        let dx = Math.abs(x1 - x2);
        if (x1 > x2)
            dx *= -1;
        if (Math.sign(x1) === Math.sign(x2))
            dx /= (stageWidth / 2.);
        else {
            dx /= stageWidth;
        }

        // Calculate the normalised distance of the y-Dimension
        let dy = Math.abs(y1 - y2);
        if (y1 > y2)
            dy *= -1;
        if (Math.sign(y1) === Math.sign(y2))
            dy /= (stageHeight / 2.);
        else {
            dy /= stageHeight;
        }

        // Clamp within the stage
        dx = Math.max(-1, Math.min(dx, 1))
        dy = Math.max(-1, Math.min(dy, 1))

        return {dx, dy};
    }

    /**
     * Calculates the distance between a sprite and a sensed color using an ever increasing scan radius.
     * @param sprite the source sprite
     * @param sensedColor the color we are searching for in hex representation
     */
    private static calculateColorDistance(sprite: RenderedTarget, sensedColor: string): { dx: number, dy: number } {
        // Gather the sensed color of the block and transform it in the [r,g,b] format
        const color3b = Cast.toRgbColorList(sensedColor);

        // Collect all touchable objects which might carry the sensed color
        const renderer = sprite.runtime.renderer;
        const touchableObjects = [];
        for (let index = renderer._visibleDrawList.length - 1; index >= 0; index--) {
            const id = renderer._visibleDrawList[index];
            if (id !== sprite.drawableID) {
                const drawable = renderer._allDrawables[id];
                touchableObjects.push({
                    id,
                    drawable
                });
            }
        }

        // Scan an ever increasing radius around the source sprite and check if we found an object carrying the
        // sensed color. We stop if the radius is greater than maxRadius.
        const point = twgl.v3.create();
        const color = new Uint8ClampedArray(4);
        let r = sprite.size + 1;
        let rPrev = 1;
        let rIncrease = 1;
        const maxRadius = Math.sqrt(
            Math.pow((renderer._xRight - renderer._xLeft), 2) +
            Math.pow((renderer._yTop - renderer._yBottom), 2)
        );
        while (r < maxRadius) {
            const coordinates = [];
            for (const x of [-r, r]) {
                for (let y = -r; y <= r; y++) {
                    coordinates.push([x, y]);
                }
            }
            for (const y of [-r, r]) {
                for (let x = -r; x <= r; x++) {
                    coordinates.push([x, y]);
                }
            }
            for (const c of coordinates) {
                const x = c[0];
                const y = c[1];
                point[0] = sprite.x + x;
                point[1] = sprite.y + y;
                renderer.constructor.sampleColor3b(point, touchableObjects, color);

                // Check if we found an object carrying the correct color.
                if (this.isColorMatching(color, color3b)) {
                    return this.calculateDistancesSigned(sprite.x, point[0], sprite.y, point[1],
                        sprite.renderer._nativeSize[0], sprite.renderer._nativeSize[1]);
                }
            }
            // Increase the scan radius in a recursive fashion.
            rIncrease += rPrev;
            rPrev = (rIncrease / 5);
            r += (rIncrease / 2);
        }
        // At this point we didn't find the color
        return {dx: undefined, dy: undefined};
    }

    /**
     * Check if color1 matches color2.
     * @param color1 the first color
     * @param color2 the second color
     */
    private static isColorMatching(color1: Uint8ClampedArray, color2: Uint8ClampedArray): boolean {
        return (color1[0] & 0b11111000) === (color2[0] & 0b11111000) &&
            (color1[1] & 0b11111000) === (color2[1] & 0b11111000) &&
            (color1[2] & 0b11110000) === (color2[2] & 0b11110000);
    }

    /**
     * Calculate the distance of a sprite from the origin (0,0) of the Stage.
     * @param sprite the sprite to calculate the distance from
     * @return distance from stage origin
     */
    private static distanceFromOrigin(sprite: RenderedTarget): number {
        return Math.sqrt(Math.pow(sprite.x, 2) + Math.pow(sprite.y, 2));
    }
}

