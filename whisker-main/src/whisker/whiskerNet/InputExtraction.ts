import VirtualMachine from "scratch-vm/src/virtual-machine";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";

export class InputExtraction {

    /**
     * The sprites map saves for each sprite the extracted information vector.
     * Note that the size of the keys as well as the size of the information vector
     * may change during the execution of the project (-> whenever we encounter new sprites/clones).
     */
    public static sprites = new Map<string, number[]>()

    /**
     * Extracts pieces of information from all Sprites of the given Scratch project.
     * @param vm the Scratch VM.
     * @return Returns a map where each sprite maps to the extracted sprite feature vector.
     */
    // TODO: It might be necessary to not only distinguish original sprites but also cloned sprites.
    //  Currently if and only if two cloned sprites of the same parent Sprite occur in differing temporal orders,
    //  the inputNodes are not correctly assigned to the corresponding clones.
    static extractSpriteInfo(vm: VirtualMachine): Map<string, number[]> {
        // Clear the collectedSpriteVectors
        this.sprites.forEach((value, key) => this.sprites.set(key, []));

        // Go through each sprite and collect input features from them; we save them in the sprites Map.
        for (const target of vm.runtime.targets) {
            if (!target.isStage && target.hasOwnProperty('blocks')) {
                this._extractInfoFromSprite(target, vm)
            }
        }
        return this.sprites;
    }

    /**
     * Extracts the pieces of information of the given sprite and normalises in the range [-1, 1]
     * @param sprite the RenderTarget (-> Sprite) from which information is gathered
     * @param vm the Scratch-VM of the given project
     * @return 1-dim array with the columns representing the gathered pieces of information
     */
    private static _extractInfoFromSprite(sprite: RenderedTarget, vm: VirtualMachine): void {
        const spriteVector = []
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

        spriteVector.push(x);

        if (y < -1)
            y = -1;
        else if (y > 1)
            y = 1;

        spriteVector.push(y);

        // Collect the currently selected costume if the given sprite can change its costume
        if (sprite.sprite.costumes_.length > 1) {
            spriteVector.push(sprite.currentCostume / sprite.sprite.costumes_.length);
        }

        // Collect additional information based on the behaviour of the sprite
        for (const blockId of Object.keys(sprite.blocks._blocks)) {
            const block = sprite.blocks.getBlock(blockId)
            if (sprite.blocks.getOpcode(block) === "sensing_touchingobjectmenu") {
                for (const target of vm.runtime.targets) {
                    if (target.sprite.name === block.fields.TOUCHINGOBJECTMENU.value) {
                        this._calculateDistanceBetweenSprites(sprite, target, spriteVector)
                    }
                }
            }
        }

        // If we do not have a copy put the sprite vector into the right place of the sprite map
        if (sprite.isOriginal) {
            this.sprites.set(sprite.sprite.name, spriteVector)
        }
        // Otherwise, if we have a clone append the spriteVector of the clone to the sprite vector of the original
        else {
            const cloneAddedVector = this.sprites.get(sprite.sprite.name).concat(spriteVector)
            this.sprites.set(sprite.sprite.name, cloneAddedVector)
        }
    }

    /**
     * Calculates the distance between two sprites
     * @param sprite1 the source sprite
     * @param sprite2 the name of the target sprite
     * @param spriteVector the vector onto which the distances are saved to
     */
    private static _calculateDistanceBetweenSprites(sprite1: RenderedTarget, sprite2: RenderedTarget,
                                                    spriteVector: number[]): void {

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

        spriteVector.push(dx)


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

        spriteVector.push(dy)
    }
}

