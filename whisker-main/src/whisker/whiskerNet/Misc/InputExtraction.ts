import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";
import Cast from "scratch-vm/src/util/cast";
import {ScratchInterface} from "../../scratch/ScratchInterface";
import {Container} from "../../utils/Container";
import {Pair} from "../../utils/Pair";
import * as twgl from 'twgl.js';
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {ScratchPosition} from "../../scratch/ScratchPosition";


export class InputExtraction {

    private static whiteColorOffset = 0;

    private static CLONE_THRESHOLD = 5;

    /**
     * Extracts input features from the current Scratch state.
     * @param vm the Scratch-VM describing the Scratch state.
     * @returns the extracted input features.
     */
    static extractFeatures(vm: VirtualMachine): InputFeatures {
        const inputFeatures: InputFeatures = new Map<string, FeatureGroup>();
        const cloneRecord = new Map<string, number>();
        for (const target of vm.runtime.targets) {
            if ('blocks' in target && target.visible) {
                if (target.isStage) {
                    const stageFeatures = this._extractStageFeatures(vm, target);
                    if (stageFeatures.size > 0) {
                        inputFeatures.set("Stage", stageFeatures);
                    }
                } else {
                    const spriteFeatures = this._extractSpriteFeatures(target, vm);
                    if (target.isOriginal) {
                        inputFeatures.set(target.sprite.name, spriteFeatures);
                    } else {
                        const cloneID = this.getCloneIdentifier(target);
                        const parentSprite = target.sprite.name;
                        // Only allow a limited number of clones per sprite to avoid input feature explosion.
                        if (!cloneRecord.has(parentSprite) || cloneRecord.get(parentSprite) < this.CLONE_THRESHOLD) {
                            inputFeatures.set(cloneID, spriteFeatures);
                            if (!cloneRecord.has(parentSprite)) {
                                cloneRecord.set(parentSprite, 0);
                            }
                            cloneRecord.set(parentSprite, cloneRecord.get(parentSprite) + 1);
                        }
                    }
                }
            }
        }
        return inputFeatures;
    }

    /**
     * Generates a unique ID for clones.
     * @param target the target clone for which we need an identifier
     * @returns unique id for the given target clone.
     */
    public static getCloneIdentifier(target: RenderedTarget): string {
        return `${target.sprite.name}Clone${target.cloneID}`;
    }

    /**
     * Extracts Stage and general features shared across the whole Scratch program and normalises them into the
     * range[-1, 1].
     * @param target the Scratch Stage.
     * @param vm the Scratch-VM describing the Scratch state.
     * @returns Mapping of feature to normalised value.
     */
    private static _extractStageFeatures(vm: VirtualMachine, target: RenderedTarget): FeatureGroup {
        const stageFeatures = new Map<string, number>();
        for (const variable of Object.values(target.variables)) {
            if (typeof variable['value'] === 'number') {
                stageFeatures.set(`VAR${variable['name']}`, InputExtraction._normaliseUnknownBounds(variable['value'], 10));
            }
        }

        // Check if we add the mouse position to our input features.
        let mouse = false;
        for (const t of vm.runtime.targets) {
            for (const blockId of Object.keys(t.blocks._blocks)) {
                const block = t.blocks.getBlock(blockId);
                switch (t.blocks.getOpcode(block)) {
                    case 'sensing_mousex':
                    case 'sensing_mousey':
                    case 'pen_down':
                        mouse = true;
                        break;
                    case 'sensing_touchingobject': {
                        const touchingMenuBlock = t.blocks.getBlock(block['inputs'].TOUCHINGOBJECTMENU.block);
                        const field = t.blocks.getFields(touchingMenuBlock);
                        const value = field.VARIABLE ? field.VARIABLE.value : field.TOUCHINGOBJECTMENU.value;

                        // Target senses Mouse
                        if (value == "_mouse_") {
                            mouse = true;
                        }
                        break;
                    }
                    case 'motion_goto': {
                        // GoTo MousePointer block
                        const goToMenu = t.blocks.getBlock(block['inputs'].TO.block);
                        if (goToMenu.fields.TO && goToMenu.fields.TO.value === '_mouse_') {
                            mouse = true;
                        }
                        break;
                    }
                    case 'sensing_distanceto': {
                        const distanceMenuBlock = t.blocks.getBlock(block.inputs.DISTANCETOMENU.block);
                        const field = t.blocks.getFields(distanceMenuBlock);
                        const value = field.DISTANCETOMENU.value;
                        if (value == "_mouse_") {
                            mouse = true;
                        }
                        break;
                    }

                    case 'motion_pointtowards': {
                        const towards = t.blocks.getBlock(block.inputs.TOWARDS.block);
                        if (towards.fields.TOWARDS && towards.fields.TOWARDS.value === '_mouse_')
                            mouse = true;
                        break;
                    }
                }
            }
        }

        if (mouse) {
            const [stageWidth, stageHeight] = vm.runtime.renderer.getNativeSize();
            const scratchX = vm.runtime.ioDevices.mouse.getScratchX();
            const scratchY = vm.runtime.ioDevices.mouse.getScratchY();
            const x = this.mapValueIntoRange(scratchX, -stageWidth / 2, stageWidth / 2);
            const y = this.mapValueIntoRange(scratchY, -stageHeight / 2, stageHeight / 2);
            stageFeatures.set("Mouse-X", x);
            stageFeatures.set('Mouse-Y', y);
        }
        return stageFeatures;
    }

    /**
     * Extracts sprite features and normalises them into the range [-1, 1].
     * @param target the RenderTarget object representing the sprite from which features will be extracted.
     * @param vm describing the current state of the Scratch program.
     * @return Mapping of feature to normalised value.
     */
    // TODO: Only add features that actually change over time ---> Analyse Scratch Code.
    // TODO: Add effects as features.
    private static _extractSpriteFeatures(target: RenderedTarget, vm: VirtualMachine): FeatureGroup {
        const spriteFeatures = new Map<string, number>();
        const [stageWidth, stageHeight] = vm.runtime.renderer.getNativeSize();

        // Extract Coordinates and normalize
        const spritePosition = ScratchInterface.getPositionOfTarget(target);
        const x = this.mapValueIntoRange(spritePosition.x, -stageWidth / 2, stageWidth / 2);
        const y = this.mapValueIntoRange(spritePosition.y, -stageHeight / 2, stageHeight / 2);
        spriteFeatures.set("X", x);
        spriteFeatures.set("Y", y);

        // Extract direction of Sprite
        if (target.rotationStyle === 'all around') {
            const direction = this.mapValueIntoRange(target.direction, -180, 180);
            spriteFeatures.set("Dir", direction);
        }

        // Extract the size of the Sprite
        const [minBound, upperBound] = InputExtraction._getSizeBounds(target);
        const normalisedSize = InputExtraction.mapValueIntoRange(target.size, minBound, upperBound);
        spriteFeatures.set('Size', normalisedSize);

        // Extract variables
        for (const variable of Object.values(target.variables)) {
            if (typeof variable['value'] === 'number') {
                spriteFeatures.set(`VAR${variable['name']}`, InputExtraction._normaliseUnknownBounds(variable['value'], 10));
            }
        }

        // If we have a path to a goal extract the signed x and y distance to the next wayPoint as input.
        if (Container.pathToGoal) {
            const distanceToWaypoint = this.getDistanceToNextWaypoint(5, 75, target);
            // Only add as input if we are close enough to a waypoint and actually have a path to follow.
            if (distanceToWaypoint) {
                spriteFeatures.set("DISTNextWaypointX", distanceToWaypoint[0]);
                spriteFeatures.set("DISTNextWaypointY", distanceToWaypoint[1]);
            }
        }

        // Collect additional information based on the behaviour of the target
        for (const blockId of Object.keys(target.blocks._blocks)) {
            const block = target.blocks.getBlock(blockId);
            switch (target.blocks.getOpcode(block)) {

                // Check if the target interacts with another target.
                case "sensing_touchingobjectmenu":
                    for (const sensedTarget of vm.runtime.targets) {
                        if (sensedTarget.sprite.name === block.fields.TOUCHINGOBJECTMENU.value) {
                            const distances = this.calculateDistancesSigned(target.x, sensedTarget.x, target.y, sensedTarget.y,
                                stageWidth, stageHeight);
                            if (sensedTarget.isOriginal) {
                                spriteFeatures.set(`DIST${sensedTarget.sprite.name}X`, distances.dx);
                                spriteFeatures.set(`DIST${sensedTarget.sprite.name}Y`, distances.dy);
                            } else {
                                spriteFeatures.set(`DIST${this.getCloneIdentifier(sensedTarget)}X`, distances.dx);
                                spriteFeatures.set(`DIST${this.getCloneIdentifier(sensedTarget)}Y`, distances.dy);
                            }
                        }
                    }
                    break;

                // Check if the target interacts with a color on the screen or on a target.
                case "sensing_touchingcolor": {
                    const sensedColor = target.blocks.getBlock(block.inputs.COLOR.block).fields.COLOUR.value;
                    const sourcePosition = new ScratchPosition(target.x, target.y);
                    const stageDiameter = ScratchInterface.getStageDiameter();
                    const colorPosition = ScratchInterface.findColorWithinRadius(sensedColor, 5,
                        stageDiameter, sourcePosition);
                    if (colorPosition) {
                        const distance = sourcePosition.distanceTo(colorPosition) / stageDiameter;
                        spriteFeatures.set(`DIST${sensedColor}`, distance);
                    }
                    break;
                }

                // Check if the target is capable of switching his costume.
                case "looks_switchcostumeto": {
                    const costumeValue = target.currentCostume;
                    const numberOfCostumes = target.sprite.costumes_.length;
                    // Only add the costume number if there are indeed multiple costumes.
                    if (numberOfCostumes > 1) {
                        const costumeNormalized = this.mapValueIntoRange(costumeValue, 0, numberOfCostumes - 1);
                        spriteFeatures.set("Costume", costumeNormalized);
                    }
                    break;
                }
            }
        }
        return spriteFeatures;
    }

    /**
     * Gets the upper and lower bound of a sprite's size. Attention this value might change when costumes are switched!
     * @param target the target for which the bounds should be extracted.
     * @return tuple [minSize, maxSize] representing the current sprite's size bounds.
     */
    private static _getSizeBounds(target: RenderedTarget): [number, number] {
        const runtime = target.runtime;
        const renderer = runtime.renderer;
        const costumeSize = renderer.getCurrentSkinSize(target.drawableID);
        const origW = costumeSize[0];
        const origH = costumeSize[1];
        const minScale = Math.min(1, Math.max(5 / origW, 5 / origH));
        const maxScale = Math.min(
            (1.5 * runtime.constructor.STAGE_WIDTH) / origW,
            (1.5 * runtime.constructor.STAGE_HEIGHT) / origH
        );
        const min = Math.round(minScale * 100);
        const max = Math.round(maxScale * 100);
        return [min, max];
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
        dx = dx / stageWidth;

        // Calculate the normalised distance of the y-Dimension
        let dy = Math.abs(y1 - y2);
        if (y1 > y2)
            dy *= -1;
        dy = dy / stageHeight;

        // Clamp within the stage
        dx = Math.max(-1, Math.min(dx, 1));
        dy = Math.max(-1, Math.min(dy, 1));

        return {dx, dy};
    }

    /**
     * Normalises values that have unknown bounds into the range [-1, 1]
     * @param value the value to normalise.
     * @param constant used to stretch the value.
     * @return the normalised value in the range [-1, 1]
     */
    private static _normaliseUnknownBounds(value: number, constant = 1): number {
        let normalisationValue = Math.abs(value) / (Math.abs(value) + constant);
        if (value < 0) {
            normalisationValue *= -1;
        }
        return normalisationValue;
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
        const rangeFinderAngles = [0, 90, 180, -90];
        const rangeFinderDistances = {};
        // Check for each rangeFinder if it can detect an angle. We have 6 sensors attached to our source Sprite:
        // Front (0), Left (-90), Right (90) and Back (180)
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

            // As long as we are within the canvas boundaries; have not found the color and have not reached our
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
     * Assigns a given angel to the corresponding rangefinder position.
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
        const mappedValue = (value - input_start) / (input_end - input_start) * (output_end - output_start) + output_start;
        return Math.max(-1, Math.min(1, mappedValue));
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
            return undefined;
        }

        const xSigned = playerPosition.x < wayPointToReach.x ? absoluteX : -absoluteX;
        const ySigned = playerPosition.y < wayPointToReach.y ? absoluteY : -absoluteY;
        const wayPointDistanceX = this.mapValueIntoRange(xSigned, -distanceThreshold, distanceThreshold);
        const wayPointDistanceY = this.mapValueIntoRange(ySigned, -distanceThreshold, distanceThreshold);
        return [wayPointDistanceX, wayPointDistanceY];
    }
}


/**
 * A feature group found within a hosting sprite or the stage. Maps feature to the extracted values.
 */
export type FeatureGroup = Map<string, number>;

/**
 * Input features are mapped from the hosting sprite to the extracted {@link FeatureGroup}.
 */
export type InputFeatures = Map<string, FeatureGroup>;

