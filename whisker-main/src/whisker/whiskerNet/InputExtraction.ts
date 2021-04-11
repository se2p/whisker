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
        // Collect all available sprites. Note, that the number of sprites can change during the game!
        this.sprites.clear();
        this._collectSprites(vm);

        // Go through each sprite and collect input features from them.
        const spriteInfos: number[][] = [];
        for (const sprite of this.sprites) {
            const spriteInfo = this._extractInfoFromSprite(sprite)
            if (spriteInfo.length !== 0) {
                spriteInfos.push(spriteInfo)

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
            if (!target.isStage && target.hasOwnProperty('blocks')) {
                this.sprites.add(target);
            }
        }
    }

    /**
     * Extracts the pieces of information of the given sprite and normalises in the range [-1, 1]
     * @param sprite the sprite from which information is gathered
     * @return 1-dim array with the columns representing the gathered pieces of information
     */
    private static _extractInfoFromSprite(sprite: RenderedTarget): number[] {
        const spriteInfo = []

        // stageWidth and stageHeight used for normalisation
        const stageWidth = sprite.renderer._nativeSize[0] / 2.;
        const stageHeight = sprite.renderer._nativeSize[1] / 2.;

        // Collect Coordinates
        let x = sprite.x / stageWidth;
        let y = sprite.y / stageHeight;

        // Due to the size of the Sprite we might overshoot the Stage
        if (x < -1)
            x = -1;
        else if (x > 1)
            x = 1;

        if (y < -1)
            y = -1;
        else if (y > 1)
            y = 1;

        spriteInfo.push(x);
        spriteInfo.push(y);

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
                    for (const target of this.sprites) {
                        if (target.sprite.name === block.fields.TOUCHINGOBJECTMENU.value)
                            this._calculateDistanceBetweenSprites(sprite, target, spriteInfo)
                    }
            }
        }
        return spriteInfo;
    }

    /**
     * Calculates the distance between two sprites
     * @param sprite1 the source sprite
     * @param sprite2 the name of the target sprite
     * @param spriteInfo the vector onto which the distances are saved to
     */
    private static _calculateDistanceBetweenSprites(sprite1: RenderedTarget, sprite2: RenderedTarget,
                                                    spriteInfo: number[]): void {

        // Calculate the normalised distance vector of the x-Dimension including the sign
        // + means sprite1 is left of sprite 2 and vice versa for the - sign
        let dx = Math.abs(sprite1.x - sprite2.x);
        if (sprite1.x < sprite2.x)
            dx *= -1;
        if (Math.sign(sprite1.x) === Math.sign(sprite2.x))
            dx /= (sprite1.renderer._nativeSize[0] / 2.);
        else {
            dx /= sprite1.renderer._nativeSize[0];
        }

        // Due to the size of the Sprite we might overshoot the Stage
        if (dx < -1)
            dx = -1;
        else if (dx > 1)
            dx = 1;
        spriteInfo.push(dx);


        // Calculate the normalised distance vector of the y-Dimension including the sign
        // + means sprite1 is left of sprite 2 and vice versa for the - sign
        let dy = Math.abs(sprite1.y - sprite2.y);
        if (sprite1.y < sprite2.y)
            dy *= -1;
        if (Math.sign(sprite1.y) === Math.sign(sprite2.y))
            dy /= (sprite1.renderer._nativeSize[1] / 2.);
        else {
            dy /= sprite1.renderer._nativeSize[1];
        }

        // Due to the size of the Sprite we might overshoot the Stage
        if (dy < -1)
            dy = -1;
        else if (dy > 1)
            dy = 1;
        spriteInfo.push(dy);
    }
}

