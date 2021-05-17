import TestDriver from "../../../test/test-driver";
import {ModelResult} from "../../../test-runner/test-result";
import {Effect} from "../components/Effect";
import {ModelEdge} from "../components/ModelEdge";

/**
 * For edge condition or effect checks that need to listen to the onMoved of a sprite or keys before a step.
 */
export class CheckUtility {
    private readonly testDriver: TestDriver;
    private checks: (() => void)[] = [];

    private touched: { [key: string]: boolean } = {};
    private colorTouched: { [key: string]: boolean } = {};
    private keyBeforeStep: { [key: string]: boolean } = {};

    private effectChecks: Effect[] = [];
    private failedChecks: Effect[] = [];

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
        let touchingString = CheckUtility.getTouchingString(spriteName1, spriteName2);

        if (!this.touched[touchingString]) {
            this.touched[touchingString] = false;

            this.testDriver.addModelSpriteMoved((sprite) => {
                if (sprite.name == spriteName1 && sprite.isTouchingSprite(spriteName2)) {
                    this.touched[touchingString] = true;
                }
            });
        }
    }

    /**
     * Registers a color touching check for a sprite with a RGB color value (as an array).
     * @param spriteName Name of the sprite that gets the check.
     * @param r RGB red value.
     * @param g RGB green value.
     * @param b RGB blue value.
     */
    registerColor(spriteName: string, r: number, g: number, b: number): void {
        let colorString = CheckUtility.getColorString(spriteName, r, g, b);

        if (!this.colorTouched[colorString]) {
            this.colorTouched[colorString] = false;

            this.testDriver.addModelSpriteMoved((sprite) => {
                if (sprite.name == spriteName && sprite.isTouchingColor([r, g, b])) {
                    this.colorTouched[colorString] = true;
                }
            });
        }
    }

    /**
     * Register a key for checking for activeness before a step.
     * @param keyName Name of the key.
     */
    registerKeyCheck(keyName: string) {
        if (!this.keyBeforeStep[keyName]) {
            this.keyBeforeStep[keyName] = false;

            this.checks.push(() => {
                if (this.testDriver.isKeyDown(keyName)) {
                    this.keyBeforeStep[keyName] = true;
                }
            })
        }
    }

    /**
     * Test the keys that are active before a step and save them.
     */
    testsBeforeStep() {
        this.checks.forEach(fun => {
            fun()
        });
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
        let combi1 = CheckUtility.getTouchingString(spriteName1, spriteName2);
        let combi2 = CheckUtility.getTouchingString(spriteName2, spriteName1);
        return (this.touched[combi1] || this.touched[combi2]
            || this.testDriver.getSprite(spriteName1).isTouchingSprite(spriteName2));
    }

    /**
     * Check whether a sprite is touching a color.
     */
    isTouchingColor(spriteName: string, r: number, g: number, b: number): boolean {
        return (this.colorTouched[CheckUtility.getColorString(spriteName, r, g, b)]
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

    /**
     * Register the effects of an edge in this listener to test them later on.
     * @param takenEdge The taken edge of a model.
     */
    registerEffectCheck(takenEdge: ModelEdge) {
        takenEdge.effects.forEach(effect => {
            this.effectChecks.push(effect);
        })
    }

    /**
     * Check the effects of an edge immediately and throw an error if they are not fulfilled. For the constraints model.
     * @param edge The taken edge of the constraints model.
     * @param modelResult To save errors into.
     */
    checkEffectsConstraint(edge: ModelEdge, modelResult: ModelResult) {
        let effects = edge.effects;
        let hadError = false;
        for (let i = 0; i < effects.length; i++) {
            if (!effects[i].check()) {
                let output = "Constraint failed! " + effects[i].toString();
                console.error(output, this.testDriver.getTotalStepsExecuted());
                modelResult.error.push(new Error(output));
                hadError = true;
            }
        }
        if (hadError) {
            throw new Error("Constraints failed!");
        }
    }

    /**
     * Check the registered effects of this step.
     */
    checkEffects(modelResult: ModelResult) {
        let doNotCheck = {};

        // check for contradictions in effects
        for (let i = 0; i < this.effectChecks.length - 1; i++) {

            for (let j = i + 1; j < this.effectChecks.length; j++) {
                if (this.effectChecks[i].contradicts(this.effectChecks[j])) {
                    doNotCheck[i] = true;
                    doNotCheck[j] = true;
                }
            }

            if (!doNotCheck[i]) {
                try {
                    if (!this.effectChecks[i].check()) {
                        this.failedChecks.push(this.effectChecks[i]);
                    }
                } catch (e) {
                    e.message = "Error in Model '" + this.effectChecks[i].edge.getModel().id + "'. Edge '"
                        + this.effectChecks[i].edge.id + "': " + e.message;
                    console.error(e);
                    this.failedChecks.push(this.effectChecks[i]);
                    modelResult.error.push(e);
                }
            }
        }

        // Get the contradicting edges and return them for outputs
        let contradictingEffects = [];
        for (let i = 0; i < this.effectChecks.length; i++) {
            if (doNotCheck[i]) {
                contradictingEffects.push(this.effectChecks[i]);
            }
        }
        this.effectChecks = [];
        return contradictingEffects;
    }

    /**
     * Check the failed effects of this step.
     */
    checkFailedEffects(modelResult: ModelResult) {
        if (!this.failedChecks || this.failedChecks.length == 0) {
            return;
        }

        function makeFailedOutput(testDriver, effect) {
            let edge = effect.edge;
            let output = "Effect failed! Model: '" + edge.getModel().id + "'. Edge: '" + edge.id + "'. Effect: "
                + effect.toString();
            console.error(output, testDriver.getTotalStepsExecuted());
            modelResult.error.push(new Error(output));
        }

        this.failedChecks.forEach(effect => {
            try {
                if (!effect.check()) {
                    makeFailedOutput(this.testDriver, effect);
                }
            } catch (e) {
                makeFailedOutput(this.testDriver, effect);
            }
        })
        this.failedChecks = [];
    }
}
