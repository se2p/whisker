import TestDriver from "../../../test/test-driver";
import {Input} from "../../../vm/inputs";

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
    private readonly condition: (state) => boolean;
    private readonly args = [];

    constructor(name: ConditionName, ...args: any) {
        this.name = name;
        this.args = args;

        // check args length
        if (this.args.length == 0
            || this.args.length != 2 && (this.name == ConditionName.SpriteTouching || this.name == ConditionName.Click)
            || this.args.length != 4 && (this.name == ConditionName.SpriteColor || this.name == ConditionName.VarTest)) {
            throw new Error("Not enough arguments for the condition.");
        }

        // Get the condition by the name given.
        switch (this.name) {
            case ConditionName.Key:
                this.condition = checkKeyEvent(this.args[0]);
                break;
            case ConditionName.Click:
                this.condition = checkClickEvent(this.args[0], this.args[1]);
                break;
            case ConditionName.SpriteColor:
                this.condition = checkSpriteColorEvent(this.args[0], this.args[1], this.args[2], this.args[3]);
                break;
            case ConditionName.SpriteTouching:
                this.condition = checkSpriteTouchingEvent(this.args[0], this.args[1]);
                break;
            case ConditionName.VarTest:
                this.condition = checkVarTestEvent(this.args[0], this.args[1], this.args[2], this.args[3]);
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
        return this.condition(testDriver);
    }

    /**
     * Get the name of the condition event.
     */
    getConditionName(): ConditionName {
        return this.name;
    }
}

/**
 * Method for checking if an edge condition is fulfilled with a key event. Todo needs duration or not?
 * @param key Name of the key.
 */
export function checkKeyEvent(key: string): (testDriver: TestDriver) => boolean {
    return function (testDriver: TestDriver): boolean {
        let inputs = testDriver.vmWrapper.inputs.inputs;
        if (inputs.length > 0) {

            // try to find the input equal to the string
            for (let i = 0; i < inputs.length; i++) {
                if (inputs[i]._data.key === Input.scratchKeyToKeyString(key)) {
                    return true;
                }
            }
            return false;
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
export function checkClickEvent(x: number, y: number): (testDriver: TestDriver) => boolean {
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
export function checkVarTestEvent(spriteName: string, varName: string, comparison: string, varValue: string) {
    // console.log("registering condition: var test ", spriteName, varName, comparison, varValue);
    return function (testDriver: TestDriver): boolean {
        let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];

        if (sprite == undefined) {
            throw new Error("Sprite not found: " + spriteName);
        }
        let variable = sprite.getVariable(varName);

        if (variable == undefined) {
            throw new Error("Variable not found: " + varName);
        }

        if (comparison == "=") {
            return variable.value == varValue;
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
export function checkSpriteTouchingEvent(spriteName1: string, spriteName2: string) {
    return function (testDriver: TestDriver): boolean {
        let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName1))[0];
        let result = sprite.isTouchingSprite(spriteName2);
        if (result) {
            console.log("touched");
        }
        return result;
    }
}

/**
 * Check whether a sprite touches a color.
 * @param spriteName Name of the sprite.
 * @param r RGB red color value.
 * @param g RGB green color value.
 * @param b RGB blue color value.
 */
export function checkSpriteColorEvent(spriteName: string, r: number, g: number, b: number) {
    return function (testDriver: TestDriver): boolean {
        let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName))[0];
        let result = sprite.isTouchingColor([r, g, b]);
        if (result) {
            console.log("color matched");
        }
        return result;
    }
}
