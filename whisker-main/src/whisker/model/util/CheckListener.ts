import TestDriver from "../../../test/test-driver";

/**
 * For edge condition or effect checks that need to listen to the onMoved of a sprite or keys before a step.
 */
export class CheckListener {
    private testDriver: TestDriver;
    private checks: ((sprite) => void)[] = [];
    private keyToCheck: string[] = [];

    private touched: { [key: string]: boolean } = {};
    private colorTouched: { [key: string]: boolean } = {};
    private keyBeforeStep: { [key: string]: boolean } = {};

    /**
     * Get an instance of a condition state saver.
     * @param testDriver Instance of the test driver.
     */
    constructor(testDriver: TestDriver) {
        this.testDriver = testDriver;
    }

    /**
     * Register a touching check for a sprite with another sprite. The check is also registered for the
     * other sprite as there have been inconsistencies.
     * @param spriteName1 Sprite's name that gets the condition check registered.
     * @param spriteName2 Name of the other sprite that the first needs to touch.
     */
    registerTouching(spriteName1: string, spriteName2: string): void {
        this._registerTouching(spriteName1, spriteName2);
        this._registerTouching(spriteName2, spriteName1);
    }

    private _registerTouching(spriteName1: string, spriteName2: string): void {
        let touchingString = CheckListener.getTouchingString(spriteName1, spriteName2);
        this.touched[touchingString] = false;

        let fun = (sprite) => {
            if (sprite.name == spriteName1 && sprite.isTouchingSprite(spriteName2)) {
                this.touched[touchingString] = true;
            }
        };

        this.checks.push(fun);
        this.testDriver.addModelSpriteMoved(fun);
    }

    /**
     * Registers a color touching check for a sprite with a RGB color value (as an array).
     * @param spriteName Name of the sprite that gets the check.
     * @param r RGB red value.
     * @param g RGB green value.
     * @param b RGB blue value.
     */
    registerColor(spriteName: string, r: number, g: number, b: number): void {
        let colorString = CheckListener.getColorString(spriteName, r, g, b);
        this.colorTouched[colorString] = false;

        let fun = (sprite) => {
            if (sprite.name == spriteName && sprite.isTouchingColor([r, g, b])) {
                this.colorTouched[colorString] = true;
            }
        };

        this.checks.push(fun);
        this.testDriver.addModelSpriteMoved(fun);
    }

    /**
     * Register a key for checking for activeness before a step.
     * @param keyName Name of the key.
     */
    registerKeyCheck(keyName: string) {
        this.keyBeforeStep[keyName] = false;

        if (this.keyToCheck.indexOf(keyName) == -1) {
            this.keyToCheck.push(keyName);
        }
    }

    /**
     * Test the keys that are active before a step and save them.
     */
    testKeys() {
        this.keyToCheck.forEach(keyName => {
            if (this.testDriver.isKeyDown(keyName)) {
                this.keyBeforeStep[keyName] = true;
            }
        })
    }

    /**
     * Reset the fulfilled checks of the last step.
     */
    reset() {
        for (const touchedKey in this.touched) {
            this.touched[touchedKey] = false;
        }
        for (const colorKey in this.colorTouched) {
            this.colorTouched[colorKey] = false;
        }
        for (const keyBeforeStepKey in this.keyBeforeStep) {
            this.keyBeforeStep[keyBeforeStepKey] = false;
        }
    }

    /**
     * Check whether two sprites touched in the current step and they did not in the last step.
     * @param spriteName1 Name of the first sprite.
     * @param spriteName2 Name of the second sprite.
     */
    areTouching(spriteName1: string, spriteName2: string): boolean {
        let combi1 = CheckListener.getTouchingString(spriteName1, spriteName2);
        let combi2 = CheckListener.getTouchingString(spriteName2, spriteName1);
        return (this.touched[combi1] || this.touched[combi2]
            && this.testDriver.getSprite(spriteName1).isTouchingSprite(spriteName2));
    }

    /**
     * Check whether a sprite is touching a color.
     */
    isTouchingColor(spriteName: string, r: number, g: number, b: number): boolean {
        return (this.colorTouched[CheckListener.getColorString(spriteName, r, g, b)]
            || this.testDriver.getSprite(spriteName).isTouchingColor([r, g, b]));
    }

    /**
     * Check whether a key was pressed at the beginning of the step.
     * @param keyName Name of the key.
     */
    isKeyDown(keyName: string) {
        if (this.areExcludingOnesActive(keyName))
            return false;

        return this._isKeyDown(keyName);
    }

    private _isKeyDown(keyName: string) {
        return this.keyBeforeStep[keyName] && this.testDriver.isKeyDown(keyName);
    }

    private static getTouchingString(sprite1: string, sprite2: string): string {
        return sprite1 + ":" + sprite2;
    }

    private static getColorString(spriteName: string, r: number, g: number, b: number): string {
        return spriteName + ":" + r + ":" + g + ":" + b;
    }

    private areExcludingOnesActive(keyName: string) {
        switch (keyName) {
            case "left arrow":
                return this._isKeyDown("right arrow");
            case "right arrow":
                return this._isKeyDown("left arrow");
            case "up arrow":
                return this._isKeyDown("down arrow");
            case "down arrow":
                return this._isKeyDown("up arrow");
        }
        return false;
    }
}
