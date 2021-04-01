import VirtualMachine from "scratch-vm/src/virtual-machine";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";

export class InputExtraction {

    /**
     * Extracts pieces of information from all sprites of the given Scratch project.
     * @param vm the Scratch VM
     * @return Returns a 2-dim Matrix where each row presents a Sprite
     *         and the columns the extracted information of the Sprite
     */
    static extractSpriteInfo(vm: VirtualMachine): number[][] {
        const spriteInfos: number[][] = [];
        let i = 0;
        for (const target of vm.runtime.targets) {
            if (target.sprite.name !== "Stage" && target.hasOwnProperty('sprite')) {
                //spriteInfos.push(this._extractInfoFromSprite(target));
                spriteInfos[i] = this._extractInfoFromSprite(target);
                i++;
            }
        }
        return spriteInfos;
    }

    /**
     * Extracts the pieces of information of the given sprite and normalises in the range [-1, 1]
     * @param sprite the sprite from which information is gathered
     * @return 1-dim array with the columns representing the gathered pieces of information
     */
    static _extractInfoFromSprite(sprite: RenderedTarget): number[] {
        const spriteInfo = []

        // stageWidth and stageHeight used for normalisation
        const stageWidth = sprite.renderer._nativeSize[0] / 2.;
        const stageHeight = sprite.renderer._nativeSize[1] / 2.;
        spriteInfo.push(sprite.x / stageWidth);
        spriteInfo.push(sprite.y / stageHeight)

        if (sprite.sprite.costumes_.length > 1) {
            spriteInfo.push(sprite.currentCostume / sprite.sprite.costumes_.length)
        }
        return spriteInfo;
    }
}

