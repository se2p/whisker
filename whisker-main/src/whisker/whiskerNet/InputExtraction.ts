import VirtualMachine from "scratch-vm/src/virtual-machine";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";
import Cast from "scratch-vm/src/util/cast";
import {List} from "../utils/List";
import {ScratchHelperFunctions} from "../scratch/ScratchHelperFunctions";
import {ScratchPosition} from "../scratch/ScratchPosition";

const twgl = require('twgl.js');


export class InputExtraction {

    private static whiteColorOffset = 0;

    /**
     * Extracts pieces of information from all Sprites of the given Scratch project.
     * @param vm the Scratch VM.
     * @param generator determines if we extract spriteInformation for the generator
     * @return Returns a map where each sprite maps to the extracted information map of the specific sprite.
     */
    static extractSpriteInfo(vm: VirtualMachine, generator=false): Map<string, Map<string, number>> {
        // The position of a clone in the cloneMap determines its unique identifier.
        const cloneMap = this.assignCloneIds(vm);
        // Go through each sprite and collect input features from them.
        const spriteMap = new Map<string, Map<string, number>>();
        for (const target of vm.runtime.targets) {
            if (!target.isStage && target.hasOwnProperty('blocks')) {
                const spriteFeatures = this._extractInfoFromSprite(target, cloneMap, vm, generator);
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
     * @param generator Determines if the function was called from a chromosome generator. When called by the
     * generator we add features which might not be informative yet. This helps us to avoid over-speciation.
     * @return 1-dim array with the columns representing the gathered pieces of information
     */
    private static _extractInfoFromSprite(target: RenderedTarget, cloneMap: Map<string, List<number>>,
                                          vm: VirtualMachine, generator = false): Map<string, number> {
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
        spriteFeatures.set("Direction", target.direction / 180);

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
                    if(generator){
                        // If called by the generator set up the rangeFinder sensor nodes.
                        const rangeFinderAngles = [0, 45, 90, 180, -45, -90]
                        for(const angle of rangeFinderAngles){
                            const direction = this.assignRangeFinder(angle);
                            spriteFeatures.set(`Distance-${direction}-To-${sensedColor}`, 0);
                        }
                    }
                    else {
                        // If not called by the generator we only active nodes whose rangeFinder sensed something.
                        const distances = this.calculateColorDistanceRangeFinder(target, sensedColor);
                        for (const direction in distances) {
                            spriteFeatures.set(`Distance-${direction}-To-${sensedColor}`, distances[direction]);
                        }
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
     * For sensing colors, we simulate 6 rangefinder sensors which are placed on the bounds of our source Sprite.
     * The rangefinders are mounted
     *  - in front: 0 degree
     *  - in front-left: -45 degree
     *  - in front-right: 45 degree
     *  - on the left: -90 degree
     *  - on the right: 90 degree
     *  - at the back: 180 degree
     * of our sprite and scan for a color in a straight line with a given resolution. If they find a color, the
     * distance to that color is calculated and normalized.
     * @param target the source target
     * @param sensedColor the color we are searching for in hex representation
     */
    private static calculateColorDistanceRangeFinder(target: RenderedTarget, sensedColor: string): Record<string, number> {
        // Gather the sensed color of the block and transform it in the [r,g,b] format
        const color3b = Cast.toRgbColorList(sensedColor);

        // It feels like in the beginning the stage is not loaded and thus everything is blank white colored.
        // Give Scratch/Whisker some time to display the stage by excluding white color for the first few rounds.
        if (sensedColor === '#ffffff' && this.whiteColorOffset < 5) {
            this.whiteColorOffset++;
            return {};
        }

        // Collect all touchable objects which might carry the sensed color
        const renderer = target.runtime.renderer;
        const touchableObjects = [];
        for (let index = renderer._visibleDrawList.length - 1; index >= 0; index--) {
            const id = renderer._visibleDrawList[index];
            if (id !== target.drawableID) {
                const drawable = renderer._allDrawables[id];
                touchableObjects.push({
                    id,
                    drawable
                });
            }
        }

        // Simulate 6 rangefinder sensors calculating the distance to the color in question if found.
        const point = twgl.v3.create();
        const color = new Uint8ClampedArray(4);

        // Gather required constants
        const stageWidth = target.renderer._nativeSize[0];
        const stageHeight = target.renderer._nativeSize[1];
        const normalizingFactor = Math.sqrt(Math.pow(stageWidth, 2) + Math.pow(stageHeight, 2));
        const rangeFinderAngles = [0, 45, 90, 180, -45, -90]
        const rangeFinderDistances = {};
        // Check for each rangeFinder if it can detect an angle. We have 6 sensors attached to our source Sprite:
        // Front (0), Front-Left (-45), Front-Right (45), Left (-90), Right (90) and Back (180)
        for (const angle of rangeFinderAngles) {
            // Adjust the currently selected rangeFinder to the pointing direction of the source sprite.
            const adjustedAngle = target.direction + angle;
            const radians = adjustedAngle / 180 * Math.PI;
            let found = false;

            // We use a resolution of 5 which means we scan every fifth pixel in the given direction.
            const resolution = 5;

            // Fetch the sensor location to offset the first scanned point.
            const sensorLocation = this.getSensorLocation(angle, target);
            let x = sensorLocation.x + resolution;
            let y = sensorLocation.y + resolution;

            // As long as we are within the canvas boundaries and have not found the color, we keep searching
            while (ScratchHelperFunctions.isPointWithinCanvas(new ScratchPosition(x,y)) && !found) {
                // Get color of current point on the canvas
                point[0] = x;
                point[1] = y;
                renderer.constructor.sampleColor3b(point, touchableObjects, color);

                // If we found the color we calculate its distance from our sensor and stop for the current sensor.
                if (ScratchHelperFunctions.isColorMatching(color, color3b)) {
                    const distance = Math.sqrt(Math.pow(target.x - point[0], 2) + Math.pow(target.y - point[1], 2));
                    const distanceNormalized = distance / normalizingFactor;
                    found = true;
                    const rangeFinder = this.assignRangeFinder(angle);
                    rangeFinderDistances[rangeFinder] = distanceNormalized;
                }

                // Sin and Cos switched since the axis in which the sprite moves usually is tilted by 90 degree.
                // This is a typical pattern in games.
                x += Math.sin(radians) * resolution;
                y += Math.cos(radians) * resolution;
            }
        }
        return rangeFinderDistances;
    }

    /**
     * Assings a given angel to the corresponding rangefinder position.
     * @param angle the angle for which a range finder should be fetched.
     * @returns string defining the position of the rangefinder.
     */
    private static assignRangeFinder(angle: number): string {
        switch (angle) {
            case 0:
                return "Front";
            case 45:
                return "FrontRight";
            case 90:
                return "Right";
            case 180:
                return "Back";
            case -90:
                return "Left";
            case -45:
                return "FrontLeft";
            default:
                return "BadAngle";
        }
    }

    /**
     * Fetch the position of the sensor in coordinates. The rangefinder sensors are not mounted on top of the source
     * Sprite as this might lead to a color being sensed on top of the source sprite itself. Thus, sensors are
     * mounted on the edges of the bounding box.
     * @param angle the angle defining which sensor's position we are looking for.
     * @param target the source target onto which the sensors are mounted.
     * @return {number, number} determining the position on the Canvas/Stage where the sensor is located.
     */
    private static getSensorLocation(angle: number, target: RenderedTarget): { x: number, y: number } {
        const boundingBox = target.getBounds()
        let x: number;
        let y: number;
        switch (angle) {
            case 0:
                x = boundingBox.right;
                y = target.y;
                break;
            case 45:
                x = boundingBox.right;
                y = boundingBox.bottom;
                break;
            case 90:
                x = target.x;
                y = boundingBox.bottom;
                break;
            case 180:
                x = boundingBox.left
                y = target.y
                break;
            case -45:
                x = boundingBox.right;
                y = boundingBox.top;
                break;
            case -90:
                x = target.x;
                y = boundingBox.top;
                break;
            default:
                x = target.x;
                y = target.y;
        }
        return {x, y};
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

