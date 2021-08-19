import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";
import Cast from "scratch-vm/src/util/cast";
import {List} from "../utils/List";
import {ScratchInterface} from "../scratch/ScratchInterface";
import VMWrapper from "../../vm/vm-wrapper"
import {Container} from "../utils/Container";
import {Pair} from "../utils/Pair";

const twgl = require('twgl.js');


export class InputExtraction {

    private static whiteColorOffset = 0;

    /**
     * Extracts pieces of information from all Sprites of the given Scratch project.
     * @param vmWrapper the Scratch VM-Wrapper.
     * @param generator determines if we extract spriteInformation for the generator
     * @return Returns a map where each sprite maps to the extracted information map of the specific sprite.
     */
    static extractSpriteInfo(vmWrapper: VMWrapper): Map<string, Map<string, number>> {
        // The position of a clone in the cloneMap determines its unique identifier.
        const cloneMap = this.assignCloneIds(vmWrapper);
        // Go through each sprite and collect input features from them.
        const spriteMap = new Map<string, Map<string, number>>();
        for (const target of vmWrapper.vm.runtime.targets) {
            if (!target.isStage && target.hasOwnProperty('blocks')) {
                const spriteFeatures = this._extractInfoFromSprite(target, cloneMap, vmWrapper);
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
     * @param vmWrapper the VM-Wrapper of the given Scratch-Project
     * @return A map mapping each original sprite having clones to a list of its clone distances.
     */
    private static assignCloneIds(vmWrapper: VMWrapper): Map<string, List<number>> {
        const cloneMap = new Map<string, List<number>>();
        for (const target of vmWrapper.vm.runtime.targets) {
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
     * @param vmWrapper the Scratch VM-Wrapper of the given project
     * @param cloneMap The position of a clone in the cloneMap determines its unique identifier.
     * generator we add features which might not be informative yet. This helps us to avoid over-speciation.
     * @return 1-dim array with the columns representing the gathered pieces of information
     */
    private static _extractInfoFromSprite(target: RenderedTarget, cloneMap: Map<string, List<number>>, vmWrapper: VMWrapper): Map<string, number> {
        const spriteFeatures = new Map<string, number>();
        const stageBounds = vmWrapper.getStageSize();


        // Collect Coordinates and normalize
        const spritePosition = ScratchInterface.getPositionOfTarget(target);
        const x = this.mapValueIntoRange(spritePosition.x, -stageBounds.width / 2, stageBounds.width / 2);
        const y = this.mapValueIntoRange(spritePosition.y, -stageBounds.height / 2, stageBounds.height / 2);
        spriteFeatures.set("X-Position", x);
        spriteFeatures.set("Y-Position", y);

        // Collect direction of Sprite
        const direction = this.mapValueIntoRange(target.direction, -180, 180);
        spriteFeatures.set("Direction", direction);

        // If we have a path to a goal extract the signed x and y distance to the next wayPoint as input.
        if (Container.pathToGoal) {
            const distanceToWaypoint = this.getDistanceToNextWaypoint(5, 75, target);
            // Only add as input if we are close enough to a waypoint and actually have a path to follow.
            if (distanceToWaypoint) {
                spriteFeatures.set("DistanceToNextWaypoint-X", distanceToWaypoint.getFirst());
                spriteFeatures.set("DistanceToNextWaypoint-Y", distanceToWaypoint.getSecond());
            }
        }

        // Collect additional information based on the behaviour of the target
        for (const blockId of Object.keys(target.blocks._blocks)) {
            const block = target.blocks.getBlock(blockId);
            switch (target.blocks.getOpcode(block)) {

                // Check if the target interacts with another target.
                case "sensing_touchingobjectmenu":
                    for (const sensingTarget of vmWrapper.vm.runtime.targets) {
                        if (sensingTarget.sprite.name === block.fields.TOUCHINGOBJECTMENU.value) {
                            const distances = this.calculateDistancesSigned(target.x, sensingTarget.x, target.y, sensingTarget.y,
                                stageBounds.width, stageBounds.height);
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
                    // Only active nodes whose rangeFinder sensed something.
                    const distances = this.calculateColorDistanceRangeFinder(target, sensedColor);
                    for (const direction in distances) {
                        spriteFeatures.set(`Distance-${direction}-To-${sensedColor}`, distances[direction]);
                    }
                }
                    break;

                // Check if the target is capable of switching his costume.
                case "looks_switchcostumeto": {
                    const costumeValue = target.currentCostume;
                    const numberOfCostumes = target.sprite.costumes_.length;
                    const costumeNormalized = this.mapValueIntoRange(costumeValue, 0, numberOfCostumes - 1);
                    spriteFeatures.set("Costume", costumeNormalized);
                    break;
                }
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
        const targetPosition = ScratchInterface.getPositionOfTarget(target);
        const rangeFinderAngles = [0, 45, 90, 180, -45, -90]
        const rangeFinderDistances = {};
        // Check for each rangeFinder if it can detect an angle. We have 6 sensors attached to our source Sprite:
        // Front (0), Front-Left (-45), Front-Right (45), Left (-90), Right (90) and Back (180)
        for (const angle of rangeFinderAngles) {
            // Adjust the currently selected rangeFinder to the pointing direction of the source sprite.
            const adjustedAngle = target.direction + angle;
            let found = false;

            // We use a resolution of 3 which means we scan every third pixel in the given direction and have a
            // maximum sensor range of 100.
            const resolution = 3;
            const maxScanRange = 100;

            // Fetch the sensor location to offset the first scanned point.
            // -1 to make sure the sensor is on top of the target.
            const distanceToTargetBoundary = ScratchInterface.getSafetyDistanceFromTarget(target, -1);
            const sensorLocation = targetPosition.goInDirectionTilted(adjustedAngle, distanceToTargetBoundary);
            let scannedPixel = sensorLocation.clone();
            let currentScanRange = 0;

            // As long as we are within the canvas boundaries; have not found the color and have not reach our
            // maximum scanning range, we keep searching
            while (ScratchInterface.isPointWithinCanvas(scannedPixel) && !found && currentScanRange < maxScanRange) {
                // Get color of current point on the canvas
                point[0] = scannedPixel.x;
                point[1] = scannedPixel.y;
                renderer.constructor.sampleColor3b(point, touchableObjects, color);

                // If we found the color we calculate its distance from our sensor and stop for the current sensor.
                if (ScratchInterface.isColorMatching(color, color3b)) {
                    const distance = Math.sqrt(Math.pow(sensorLocation.x - point[0], 2) + Math.pow(sensorLocation.y - point[1], 2));
                    const distanceNormalized = this.mapValueIntoRange(distance, 0, maxScanRange);
                    found = true;
                    const rangeFinder = this.assignRangeFinder(angle);
                    rangeFinderDistances[rangeFinder] = distanceNormalized;
                }

                // Move the scannedPixel in a straight line to the next scannedPixel according to the chosen resolution
                // We use a by 90° tilted coordinate system as in most games the y-Axis is the FRONT moving direction.
                scannedPixel = scannedPixel.goInDirectionTilted(adjustedAngle, resolution);
                currentScanRange += resolution;
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
     * Calculate the distance of a sprite from the origin (0,0) of the Stage.
     * @param sprite the sprite to calculate the distance from
     * @return distance from stage origin
     */
    private static distanceFromOrigin(sprite: RenderedTarget): number {
        return Math.sqrt(Math.pow(sprite.x, 2) + Math.pow(sprite.y, 2));
    }

    /**
     * Maps a given value in the input space onto the corresponding value of the output space.
     * @param value the value which should be mapped onto the output space
     * @param input_start the first value of the input_space
     * @param input_end the last value of the input_space
     * @param output_start the first value of the output_space
     * @param output_end the last value of the output_space
     * @returns number corresponding to the mapped value from input to output space.
     */
    private static mapValueIntoRange(value: number, input_start: number, input_end: number,
                                     output_start = -1, output_end = 1) {
        return (value - input_start) / (input_end - input_start) * (output_end - output_start) + output_start
    }

    /**
     * Calculates the distance to the closest waypoint given the specified wayPointStepSize
     * @param wayPointStepSize determines the step size indicating at which waypoints we are looking at.
     * @param distanceThreshold determines the maximum distance to our target. We limit the distance to effectively
     * normalize.
     * @param target the target which has to follow the waypoints
     * @returns Pair<number> with the normalized and signed x and y distances.
     */
    private static getDistanceToNextWaypoint(wayPointStepSize: number, distanceThreshold: number, target: RenderedTarget): Pair<number> {
        // If we have no path we cannot find the closest wayPoint.
        if (!Container.pathToGoal) {
            return undefined;
        }
        // Only look at every <wayPointStepSize> waypoint and get the next (+1) closest waypoint.
        const playerPosition = ScratchInterface.getPositionOfTarget(target);
        const waypoints = Container.pathToGoal.filter((_, index) => index % wayPointStepSize === 0 && index > 0);
        const waypointDistances = waypoints.map(waypoint => waypoint.distanceTo(playerPosition));
        const indexOfNearestWaypoint = waypointDistances.indexOf(Math.min(...waypointDistances));
        const wayPointToReach = waypoints[indexOfNearestWaypoint + 1];

        // Normalize the distance to the waypoint including a sign indicating the relative position to the target
        const absoluteX = Math.abs(wayPointToReach.x - playerPosition.x);
        const absoluteY = Math.abs(wayPointToReach.y - playerPosition.y);

        // At this point we are way off the path, hence we do not include the waypoint as input.
        if (absoluteX > distanceThreshold || absoluteY > distanceThreshold) {
            return undefined
        }

        const xSigned = playerPosition.x < wayPointToReach.x ? absoluteX : -absoluteX;
        const ySigned = playerPosition.y < wayPointToReach.y ? absoluteY : -absoluteY;
        const wayPointDistanceX = this.mapValueIntoRange(xSigned, -distanceThreshold, distanceThreshold);
        const wayPointDistanceY = this.mapValueIntoRange(ySigned, -distanceThreshold, distanceThreshold);
        return new Pair<number>(wayPointDistanceX, wayPointDistanceY);
    }
}

