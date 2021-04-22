import TestDriver from "../../../test/test-driver";
import {Input} from "../../../vm/inputs";
import {ConditionState} from "../util/ConditionState";

/** Type for finding the correct condition function, defining the event. */
export enum ConditionName {
    Key = "Key",
    Click = "Click",
    VarTest = "VarTest",
    SpriteTouching = "SpriteTouching", // two sprites touching each other
    SpriteColor = "SpriteColor", // sprite touching a color
    Function = "Function"
}

/**
 * Defining an edge condition.
 */
export class Condition {
    private readonly name: ConditionName;
    private readonly condition: (...state) => boolean;
    private readonly args = [];

    readonly isANegation: boolean;
    private conditionState: ConditionState;

    /**
     * Get a condition instance. Checks the number of arguments for a condition type.
     * @param name Type name of the condition.
     * @param isANegation Whether the condition is negated.
     * @param args The arguments for the condition to check later on.
     */
    constructor(name: ConditionName, isANegation: boolean, ...args: any) {
        this.name = name;
        this.args = args;
        this.isANegation = isANegation;

        // check args length
        if (this.args.length == 0
            || this.args.length != 2 && (this.name == ConditionName.SpriteTouching || this.name == ConditionName.Click)
            || this.args.length != 4 && (this.name == ConditionName.SpriteColor || this.name == ConditionName.VarTest)) {
            throw new Error("Not enough arguments for the condition.");
        }

        // Get the condition by the name given.
        switch (this.name) {
            case ConditionName.Key:
                this.condition = this._checkKeyEvent(this.args[0]);
                break;
            case ConditionName.Click:
                this.condition = this._checkClickEvent(this.args[0], this.args[1]);
                break;
            case ConditionName.SpriteColor:
                this.condition = this._checkSpriteColorEvent(this.args[0], this.args[1], this.args[2], this.args[3]);
                break;
            case ConditionName.SpriteTouching:
                this.condition = this._checkSpriteTouchingEvent(this.args[0], this.args[1]);
                break;
            case ConditionName.VarTest:
                this.condition = this._checkVarTestEvent(this.args[0], this.args[1], this.args[2], this.args[3]);
                break;
            case ConditionName.Function:
                this.condition = this.args[0]; // todo
                break;
            default:
                throw new Error("Condition type not recognized.");
        }
    }

    /**
     * Check the edge condition.
     * @param testDriver Instance of the test driver.
     */
    check(testDriver: TestDriver): boolean {
        return this.condition(testDriver, this.conditionState);
    }

    /**
     * Get the name of the condition event.
     */
    getConditionName(): ConditionName {
        return this.name;
    }

    /**
     * Check existences of sprites, existences of variables and ranges of arguments. Also register the condition at
     * the condition state saver.
     * @param testDriver Instance of the test driver.
     * @param conditionState State saver of the conditions.
     */
    registerAndTestConditions(testDriver: TestDriver, conditionState: ConditionState) {
        this.conditionState = conditionState;

        // console.log("Testing condition: " + this.name + this.args);
        switch (this.name) {
            case ConditionName.SpriteTouching:
                this._checkSpriteExistence(testDriver, this.args[0]);
                this._checkSpriteExistence(testDriver, this.args[1]);
                this.conditionState.registerTouching(this.args[0], this.args[1]);
                break;
            case ConditionName.SpriteColor:
                this._checkSpriteExistence(testDriver, this.args[0]);
                let r = this.args[1];
                let g = this.args[2];
                let b = this.args[3];

                if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
                    throw new Error("RGB ranges not correct.");
                }
                this.conditionState.registerColor(this.args[0], this.args[1], this.args[2], this.args[3]);
                break;
            case ConditionName.Click:
                // todo check coordinate range or sprite existence?
                break;
            case ConditionName.VarTest:
                this._checkSpriteExistence(testDriver, this.args[0]);
                let sprite = testDriver.getSprites(sprite => sprite.name.includes(this.args[0]), false)[0];
                let variable = sprite.getVariable(this.args[1]);

                if (variable == undefined) {
                    throw new Error("Variable not found: " + this.args[1]);
                }
                // todo test whether comparison is something known =,<,>, >=, <= ??
                break;
        }
    }

    /**
     * Get the arguments for the condition.
     */
    getArgs() {
        return this.args;
    }

    /**
     * Check the existence of a sprite.
     * @param testDriver Instance of the test driver.
     * @param spriteName Name of the sprite.
     */
    _checkSpriteExistence(testDriver: TestDriver, spriteName: string) {
        let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
        if (sprite == undefined) {
            throw new Error("Sprite not existing with name: " + this.args[0]);
        }
    }

    /**
     * Method for checking if an edge condition is fulfilled with a key event. Todo needs duration or not?
     * @param key Name of the key.
     */
    _checkKeyEvent(key: string): (testDriver: TestDriver) => boolean {
        // console.log("registering condition: key test ", key);
        let isANegation = this.isANegation;
        return function (testDriver: TestDriver): boolean {
            let inputs = testDriver.vmWrapper.inputs.inputs;
            if (inputs.length > 0) {

                // try to find the input equal to the string
                for (let i = 0; i < inputs.length; i++) {
                    if (inputs[i]._data.key === Input.scratchKeyToKeyString(key)) {
                        return !isANegation;
                    }
                }
                return isANegation;
            } else {
                // console.log("inputs empty") todo why
            }
            return false;
        }
    }

    /**
     * Check whether a click is on the coordinate x and y. // todo maybe on sprite instead?
     * @param x X coordinate.
     * @param y Y coordinate.
     */
    _checkClickEvent(x: number, y: number): (testDriver: TestDriver) => boolean {
        // console.log("registering condition: click ", x, y);
        return function (testDriver: TestDriver): boolean {
            return false;
        }
    }

    /**
     *  Method for checking if an edge condition is fulfilled for a value of a variable.
     *
     * @param spriteName Name of the sprite having the variable.
     * @param varName Name of the variable.
     * @param comparison Mode of comparison, e.g. =, <, >, <=, >=
     * @param varValue Value to compare to the variable's current value.
     */
    _checkVarTestEvent(spriteName: string, varName: string, comparison: string, varValue: string):
        (testDriver: TestDriver) => boolean {
        // console.log("registering condition: var test ", spriteName, varName, comparison, varValue);
        let isANegation = this.isANegation;
        return function (testDriver: TestDriver): boolean {
            let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            let variable = sprite.getVariable(varName);

            if (variable == undefined) {
                throw new Error("Variable not found: " + varName);
            }

            if (comparison == "=") {
                if (variable.value == varValue) {
                    return !isANegation;
                } else {
                    return isANegation;
                }
            }
            return false;
        }
    }

    /**
     * Check whether the sprites with the given names are touching.
     *
     * @param spriteName1 Name of the first sprite.
     * @param spriteName2 Name of the second sprite.
     */
    _checkSpriteTouchingEvent(spriteName1: string, spriteName2: string):
        (testDriver: TestDriver, conditionState: ConditionState) => boolean {
        let isANegation = this.isANegation;
        return function (testDriver: TestDriver, conditionState: ConditionState): boolean {
            const areTouching = conditionState.areTouching(spriteName1, spriteName2);
            if (areTouching) {
                console.log("MARKER: Touching " + spriteName1 + " " + spriteName2);
                return !isANegation;
            }
            return isANegation;
        }
    }

    /**
     * Check whether a sprite touches a color.
     * @param spriteName Name of the sprite.
     * @param r RGB red color value.
     * @param g RGB green color value.
     * @param b RGB blue color value.
     */
    _checkSpriteColorEvent(spriteName: string, r: number, g: number, b: number):
        (testDriver: TestDriver, conditionState: ConditionState) => boolean {
        let isANegation = this.isANegation;
        return function (testDriver: TestDriver, conditionState: ConditionState): boolean {
            if (conditionState.isTouchingColor(spriteName, r, g, b)) {
                console.log("MARKER: Color " + spriteName);
                return !isANegation;
            }
            return isANegation;
        }
    }
}
