import VirtualMachine from "scratch-vm/src/virtual-machine";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";
import {List} from "../utils/List";

export class InputExtraction {

    private static sprites = new List<RenderedTarget>()

    /**
     * Extracts pieces of information from all sprites of the given Scratch project.
     * @param vm the Scratch VM
     * @return Returns a 2-dim Matrix where each row presents a Sprite
     *         and the columns the extracted information of the Sprite
     */
    static extractSpriteInfo(vm: VirtualMachine): number[][] {
        // Collect all available sprites in the first round.
        if (this.sprites.isEmpty())
            this._collectSprites(vm);

        // Go through each sprite and collect inputs from them.
        const spriteInfos: number[][] = [];
        let i = 0;
        for (const sprite of this.sprites) {
            if (sprite.sprite.name !== "Stage" && sprite.hasOwnProperty('sprite')) {
                spriteInfos[i] = this._extractInfoFromSprite(sprite);
                i++;
            }
        }
        return spriteInfos;
    }

    /**
     * Collects the available sprites of the Scratch-VM and stores them in the sprites List
     * @param vm the Scratch-VM to collect input features from
     */
    private static _collectSprites(vm: VirtualMachine): void {
        for (const target of vm.runtime.targets) {
            this.sprites.add(target);
        }
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

        // Collect Coordinates
        spriteInfo.push(sprite.x / stageWidth);
        spriteInfo.push(sprite.y / stageHeight);

        // Collect the currently selected costume if the given sprite can change its costume
        if (sprite.sprite.costumes_.length > 1) {
            spriteInfo.push(sprite.currentCostume / sprite.sprite.costumes_.length)
        }

        // Collect additional information based on the behaviour of the sprite
        for (const blockId of Object.keys(sprite.blocks._blocks)) {
            const block = sprite.blocks.getBlock(blockId)
            switch (sprite.blocks.getOpcode(block)) {
                // Sprite checks if it touches another sprite
                case "sensing_touchingobjectmenu":
                    spriteInfo.push(this._calculateDistanceBetweenSprites(sprite, block.fields.TOUCHINGOBJECTMENU.value))
            }
        }
        return spriteInfo;
    }

    /**
     * Calculates the distance between two sprites
     * @param sprite1 the source sprite
     * @param target2 the name of the target sprite
     */
    private static _calculateDistanceBetweenSprites(sprite1: RenderedTarget, target2: string): number {
        // Search the object in the Sprite List
        let sprite2: RenderedTarget
        for (const sprite of this.sprites) {
            if (sprite.sprite.name === target2)
                sprite2 = sprite;
        }

        // Calculate the distance between the two sprites.
        const normFactor = Math.sqrt(
            Math.pow(sprite1.renderer._nativeSize[0], 2) + Math.pow(sprite1.renderer._nativeSize[1], 2));
        const dx = sprite1.x - sprite2.x;
        const dy = sprite1.y - sprite2.y;
        return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) / normFactor;
    }
}

