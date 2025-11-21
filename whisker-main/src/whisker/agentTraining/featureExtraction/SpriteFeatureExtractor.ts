import VirtualMachine from "scratch-vm/src/virtual-machine";
import RenderedTarget from "scratch-vm/src/sprites/rendered-target";
import {FeatureGroup} from "./FeatureExtraction";
import {ScratchInterface} from "../../scratch/ScratchInterface";
import {FeatureExtractionUtil} from "./FeatureExtractionUtil";
import {ScratchPosition} from "../../scratch/ScratchPosition";

export class SpriteFeatureExtractor {

    /**
     * Extracts features related to the given sprite.
     * @param vm The VirtualMachine instance containing runtime data.
     * @param sprite The sprite rendered target to extract features from.
     */
    public static getFeatures(vm: VirtualMachine, sprite: RenderedTarget): FeatureGroup {
        const spriteFeatures: FeatureGroup = new Map();
        this._addPositionFeatures(vm, sprite, spriteFeatures);
        FeatureExtractionUtil.addCostumeFeature(sprite, spriteFeatures);
        FeatureExtractionUtil.addVariableFeatures(sprite, spriteFeatures);
        this._addDistanceToColourFeatures(sprite, spriteFeatures);
        return spriteFeatures;
    }

    /**
     * Adds position features (x, y) of a given sprite to the specified feature group.
     * Computes the normalized position of the sprite within the stage boundaries.
     *
     * @param vm The virtual machine instance that contains the runtime and renderer.
     * @param sprite The sprite whose position features are to be added.
     * @param spriteFeatures The feature group to which the position features will be added.
     */
    private static _addPositionFeatures(vm: VirtualMachine, sprite: RenderedTarget, spriteFeatures: FeatureGroup) {
        const [stageWidth, stageHeight] = vm.runtime.renderer.getNativeSize();
        const spritePosition = ScratchInterface.getPositionOfTarget(sprite);
        const x = FeatureExtractionUtil.mapValueIntoRange(spritePosition.x, -stageWidth / 2, stageWidth / 2);
        const y = FeatureExtractionUtil.mapValueIntoRange(spritePosition.y, -stageHeight / 2, stageHeight / 2);
        spriteFeatures.set("X", x);
        spriteFeatures.set("Y", y);
    }

    /**
     * Checks if the sprite contains a block that tests if it is touching a color. If this is the case,
     * we add the normalized distance between the sprite and the color as a feature to the feature map.
     *
     * @param sprite The sprite whose distance to colors on the screen we want to infer.
     * @param spriteFeatures The feature group to which the distance to various colors on the screen will be added.
     */
    private static _addDistanceToColourFeatures(sprite: RenderedTarget, spriteFeatures: FeatureGroup) {
        const distToColorBlocks = FeatureExtractionUtil.getBlocksWithOpcode(sprite, "sensing_touchingcolor");
        for (const block of distToColorBlocks) {
            const sensedColor = sprite.blocks.getBlock(block['inputs'].COLOR.block).fields.COLOUR.value;
            const sourcePosition = new ScratchPosition(sprite.x, sprite.y);
            const stageDiameter = ScratchInterface.getStageDiameter();
            const colorPosition = ScratchInterface.findColorWithinRadius(sensedColor, 5, stageDiameter, sourcePosition);
            if (colorPosition) {
                const distance = sourcePosition.distanceTo(colorPosition) / stageDiameter;
                spriteFeatures.set(`DIST${sensedColor}`, distance);
            }
        }
    }
}
