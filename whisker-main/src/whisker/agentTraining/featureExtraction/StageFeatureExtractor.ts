import VirtualMachine from "scratch-vm/src/virtual-machine";
import RenderedTarget from "scratch-vm/src/sprites/rendered-target";
import {FeatureGroup} from "./FeatureExtraction";
import {FeatureExtractionUtil} from "./FeatureExtractionUtil";

export class StageFeatureExtractor {

    /**
     * Extracts features related to the stage.
     * @param vm The VirtualMachine instance containing runtime data.
     * @param stage The stage rendered target hosting the stage logic.
     */
    public static getFeatures(vm: VirtualMachine, stage: RenderedTarget): FeatureGroup {
        const stageFeatures: FeatureGroup = new Map();
        FeatureExtractionUtil.addVariableFeatures(stage, stageFeatures);
        FeatureExtractionUtil.addCostumeFeature(stage, stageFeatures);
        this._addMouseFeatures(vm, stageFeatures);
        return stageFeatures;
    }


    /**
     * Adds mouse-related features to the given stageFeatures map if the VirtualMachine contains mouse features.
     * This method extracts the current mouse coordinates, maps them into a normalized range,
     * and includes them in the features.
     *
     * @param vm The VirtualMachine instance containing runtime and mouse data.
     * @param stageFeatures A map to which the mouse features (Mouse-X and Mouse-Y) will be added.
     */
    private static _addMouseFeatures(vm: VirtualMachine, stageFeatures: Map<string, number>) {
        if (this._containsMouseFeatures(vm)) {
            const [stageWidth, stageHeight] = vm.runtime.renderer.getNativeSize();
            const scratchX = vm.runtime.ioDevices.mouse.getScratchX();
            const scratchY = vm.runtime.ioDevices.mouse.getScratchY();
            const x = FeatureExtractionUtil.mapValueIntoRange(scratchX, -stageWidth / 2, stageWidth / 2);
            const y = FeatureExtractionUtil.mapValueIntoRange(scratchY, -stageHeight / 2, stageHeight / 2);
            stageFeatures.set("Mouse-X", x);
            stageFeatures.set('Mouse-Y', y);
        }
    }


    /**
     * Determines if the Scratch program interacts with the mouse.
     * @param vm The Scratch-VM describing the Scratch state.
     * @returns True if the program interacts with the mouse.
     */
    private static _containsMouseFeatures(vm: VirtualMachine): boolean {
        for (const t of vm.runtime.targets) {
            for (const blockId of Object.keys(t.blocks._blocks)) {
                const block = t.blocks.getBlock(blockId);
                switch (t.blocks.getOpcode(block)) {
                    case 'sensing_mousex':
                    case 'sensing_mousey':
                    case 'pen_down':
                        return true;
                    case 'sensing_touchingobject': {
                        const touchingMenuBlock = t.blocks.getBlock(block['inputs'].TOUCHINGOBJECTMENU.block);
                        const field = t.blocks.getFields(touchingMenuBlock);
                        const value = field.VARIABLE ? field.VARIABLE.value : field.TOUCHINGOBJECTMENU.value;

                        // Target senses Mouse
                        if (value == "_mouse_") {
                            return true;
                        }
                        break;
                    }
                    case 'motion_goto': {
                        // GoTo MousePointer block
                        const goToMenu = t.blocks.getBlock(block['inputs'].TO.block);
                        if (goToMenu.fields.TO && goToMenu.fields.TO.value === '_mouse_') {
                            return true;
                        }
                        break;
                    }
                    case 'sensing_distanceto': {
                        const distanceMenuBlock = t.blocks.getBlock(block.inputs.DISTANCETOMENU.block);
                        const field = t.blocks.getFields(distanceMenuBlock);
                        if (field['DISTANCETOMENU'] && field['DISTANCETOMENU'].value == "_mouse_") {
                            return true;
                        }
                        break;
                    }

                    case 'motion_pointtowards': {
                        const towards = t.blocks.getBlock(block.inputs.TOWARDS.block);
                        if (towards.fields.TOWARDS && towards.fields.TOWARDS.value === '_mouse_')
                            return true;
                        break;
                    }
                }
            }
        }
        return false;
    }
}
