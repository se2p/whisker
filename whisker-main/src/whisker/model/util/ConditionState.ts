import TestDriver from "../../../test/test-driver";
import Sprite from "../../../vm/sprite";

/**
 * For edge conditions that need to listen to the onMoved of a sprite this class saves all needed checks for a
 * sprite and updates the onMoved of that sprite. (onMoved only accepts one function). todo ask for change of onMoved?
 *
 * This class instance also tracks then the fulfilled checks of the registered onMoved checks.
 */
export class ConditionState {
    testDriver: TestDriver;
    sprites: { [key: string]: Sprite } = {};
    /** Saves the check functions for each sprite name. */
    checks: { [key: string]: [() => void] } = {};
    /** Saves the thrown/fulfilled checks for a sprite name. */
    conditionsThrown: { [key: string]: SpriteCondition } = {};

    /**
     * Get an instance of a condition state saver.
     * @param testDriver Instance of the test driver.
     */
    constructor(testDriver: TestDriver) {
        this.testDriver = testDriver;
        this.testDriver.getSprites().forEach(sprite => {
            this.sprites[sprite.name] = sprite;
            this.conditionsThrown[sprite.name] = new SpriteCondition();
        })
    }

    /**
     * Updates the onMoved of a sprite with all functions concatenated that are needed for that sprite.
     * @param sprite Instance of the sprite.
     */
    _updateOnMoved(sprite: Sprite) {
        let functions = this.checks[sprite.name];
        sprite.onMoved = () => {
            functions.forEach(fun => {
                fun();
            });
        };
    }

    /**
     * Register a touching condition check for a sprite with another sprite.
     * @param spriteName1 Sprite's name that gets the condition check registered.
     * @param spriteName2 Name of the other sprite that the first needs to touch.
     */
    registerTouching(spriteName1: string, spriteName2: string) {
        // function that adds the second sprite name to the touched sprites of the first one if it not already has
        // touched it.
        let fun = () => {
            if (this.sprites[spriteName1].isTouchingSprite(spriteName2)
                && this.conditionsThrown[spriteName1].spritesTouched.indexOf(spriteName2) == -1) {
                this.conditionsThrown[spriteName1].spritesTouched.push(spriteName2);
            }
        };

        // add it to the checks of that sprite and update onMoved
        if (this.checks[spriteName1]) {
            this.checks[spriteName1].push(fun);
        } else {
            this.checks[spriteName1] = [fun];
        }
        this._updateOnMoved(this.sprites[spriteName1]);
    }

    /**
     * Registers a color touching condition check for a sprite with a RGB color value (as an array).
     * @param spriteName Name of the sprite that gets the check.
     * @param r RGB red value.
     * @param g RGB green value.
     * @param b RGB blue value.
     */
    registerColor(spriteName: string, r: number, g: number, b: number) {
        // function that adds the color to the sprites touched colors if the sprite not already has  touched it.
        let fun = () => {
            const search = this.conditionsThrown[spriteName].colorsTouched.find(array =>
                array[0] == r && array[1] == g && array[2] == b);
            if (this.sprites[spriteName].isTouchingColor([r, g, b]) && !search) {
                this.conditionsThrown[spriteName].colorsTouched.push([r, g, b]);
            }
        };

        // add it to the checks of that sprite and update onMoved
        if (this.checks[spriteName]) {
            this.checks[spriteName].push(fun);
        } else {
            this.checks[spriteName] = [fun];
        }
        this._updateOnMoved(this.sprites[spriteName]);
    }

    /**
     * Reset the thrown conditions.
     */
    resetConditionsThrown() {
        this.testDriver.getSprites().forEach(sprite => {
            this.conditionsThrown[sprite.name] = new SpriteCondition();
        })
    }

    /**
     * Return the thrown events of a sprite.
     * @param spriteName Name of the sprite.
     */
    getSpriteCondition(spriteName: string) {
        return this.conditionsThrown[spriteName];
    }
}

/**
 * Saves the events that were thrown by the onMoved checks.
 */
export class SpriteCondition {
    spritesTouched: string[] = [];
    colorsTouched: number[][] = [];
}
