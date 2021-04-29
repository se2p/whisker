import TestDriver from "../../../test/test-driver";
import {ConditionState} from "../util/ConditionState";
import {ModelEdge} from "./ModelEdge";

/** Type for finding the correct condition function, defining the event. */
export enum ConditionName {
    Key = "Key", // args: key name
    Click = "Click", // args: sprite name
    VarTest = "VarTest", // args: sprite name, variable name, comparison (=,>,<...), value to compare to
    SpriteTouching = "SpriteTouching", // two sprites touching each other, args: two sprite names
    SpriteColor = "SpriteColor", // sprite touching a color, args: sprite name, red, green, blue values
    Function = "Function" // args: js test function as a string
}


/**
 * Evaluate the conditions for the given edge.
 * @param newEdge Edge with the given condition.
 * @param condString String representing the conditions.
 */
export function setUpCondition(newEdge: ModelEdge, condString: string) {
    const conditions = condString.split(",");

    try {
        conditions.forEach(cond => {
            newEdge.addCondition(getCondition(cond));
        })
    } catch (e) {
        throw new Error("Edge '" + newEdge.id + "': " + e.message);
    }
}

/**
 * Converts a single condition for an edge into a function that can be evaluated. Single condition could be f.e.
 * 'Key:space'.
 * @param condString String part on the edge of the xml file that is the condition.
 */
export function getCondition(condString): Condition {
    // negation
    let isANegation = false;
    if (condString.startsWith("!")) {
        isANegation = true;
        condString = condString.substr(1, condString.length);
    }

    const parts = condString.split(":");

    if (parts.length < 2) {
        throw new Error("Edge condition not correctly formatted. ':' missing.");
    }

    switch (parts[0]) {
        case ConditionName.Key:
            return new Condition(ConditionName.Key, isANegation, parts[1].toLowerCase());
        case ConditionName.Click:
            return new Condition(ConditionName.Click, isANegation, parts[1]);
        case ConditionName.VarTest:
            return new Condition(ConditionName.VarTest, isANegation, parts[1], parts[2], parts[3], parts[4]);
        case ConditionName.SpriteTouching:
            return new Condition(ConditionName.SpriteTouching, isANegation, parts[1], parts[2]);
        case ConditionName.SpriteColor:
            return new Condition(ConditionName.SpriteColor, isANegation, parts[1], parts[2], parts[3], parts[4]);
        default:
            throw new Error("Edge condition type not recognized or missing.");
    }
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

        let argsError = function () {
            return "Not enough arguments for condition " + name + ".";
        }

        // todo refactor
        // Get the condition by the name given.
        switch (this.name) {
            case ConditionName.Key:
                if (this.args.length != 1 || args[0] == undefined) throw new Error(argsError());
                this.condition = this._checkKeyEvent(this.args[0]);
                break;
            case ConditionName.Click:
                if (this.args.length != 1 || args[0] == undefined) throw new Error(argsError());
                this.condition = this._checkClickEvent(this.args[0]);
                break;
            case ConditionName.SpriteColor:
                if (this.args.length != 4 || args[0] == undefined || args[1] == undefined
                    || args[2] == undefined || args[3] == undefined) {
                    throw new Error(argsError());
                }
                this.condition = this._checkSpriteColorEvent(this.args[0], this.args[1], this.args[2], this.args[3]);
                break;
            case ConditionName.SpriteTouching:
                if (this.args.length != 2 || args[0] == undefined|| args[1] == undefined) throw new Error(argsError());
                this.condition = this._checkSpriteTouchingEvent(this.args[0], this.args[1]);
                break;
            case ConditionName.VarTest:
                if (this.args.length != 4 || args[0] == undefined || args[1] == undefined
                    || args[2] == undefined || args[3] == undefined) {
                    throw new Error(argsError());
                }
                this.condition = this._checkVarTestEvent(this.args[0], this.args[1], this.args[2], this.args[3]);
                break;
            case ConditionName.Function:
                if (this.args.length != 1 || args[0] == undefined) throw new Error(argsError());
                this.condition = this.args[0]; // todo
                break;
            default:
                throw new Error("Condition type not recognized.");
        }
    }

    /**
     * Register the condition state.
     */
    registerConditionState(conditionState: ConditionState) {
        this.conditionState = conditionState;
        switch (this.name) {
            case ConditionName.SpriteTouching:
                this.conditionState.registerTouching(this.args[0], this.args[1]);
                break;
            case ConditionName.SpriteColor:
                this.conditionState.registerColor(this.args[0], this.args[1], this.args[2], this.args[3]);
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
     * Check existences of sprites, existences of variables and ranges of arguments.
     */
    testConditionsForErrors(testDriver: TestDriver) {
        // console.log("Testing condition: " + this.name + this.args);
        switch (this.name) {
            case ConditionName.SpriteTouching:
                this._checkSpriteExistence(testDriver, this.args[0]);
                this._checkSpriteExistence(testDriver, this.args[1]);
                break;
            case ConditionName.SpriteColor:
                this._checkSpriteExistence(testDriver, this.args[0]);
                let r = this.args[1];
                let g = this.args[2];
                let b = this.args[3];

                if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
                    throw new Error("RGB ranges not correct.");
                }
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
            case ConditionName.Function:
                try {
                    eval(this.args[0]);
                } catch (e) {
                    throw new Error("Condition Function cannot be evaluated:\n" + e);
                }
        }
    }

    /**
     * Get the arguments for the condition.
     */
    getArgs() {
        return this.args;
    }

    /**
     * Get a compact representation for this condition for edge tracing.
     */
    toString() {
        let result = this.name + "(";

        if (this.args.length == 1) {
            result = result + this.args[0];
        } else {
            result = result + this.args.concat();
        }

        result = result + ")";
        if (this.isANegation) {
            result = result + " (negated)";
        }
        return result;
    }

    /**
     * Check the existence of a sprite.
     * @param testDriver Instance of the test driver.
     * @param spriteName Name of the sprite.
     */
    private _checkSpriteExistence(testDriver, spriteName: string) {
        let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
        if (sprite == undefined) {
            throw new Error("Sprite not existing with name: " + this.args[0]);
        }
    }

    /**
     * Method for checking if an edge condition is fulfilled with a key event. Todo needs duration or not?
     * @param key Name of the key.
     */
    private _checkKeyEvent(key: string): (testDriver: TestDriver) => boolean {
        // console.log("registering condition: key test ", key);
        let isANegation = this.isANegation;
        return function (testDriver: TestDriver): boolean {
            if (testDriver.isKeyDown(key)) {
                return !isANegation;
            }
            return isANegation;
        }
    }

    /**
     * Check whether a click is on a sprite.
     * @param spriteName Name of the sprite.
     */
    private _checkClickEvent(spriteName: string): (testDriver: TestDriver) => boolean {
        // console.log("registering condition: click ", x, y);
        return function (testDriver: TestDriver): boolean {
            // todo get input click cooridantes and test them with the boundaries of the sprite?
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
    private _checkVarTestEvent(spriteName: string, varName: string, comparison: string, varValue: string):
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
    private _checkSpriteTouchingEvent(spriteName1: string, spriteName2: string):
        (testDriver: TestDriver, conditionState: ConditionState) => boolean {
        let isANegation = this.isANegation;
        return function (testDriver: TestDriver, conditionState: ConditionState): boolean {
            const areTouching = conditionState.areTouching(spriteName1, spriteName2);
            if (areTouching) {
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
    private _checkSpriteColorEvent(spriteName: string, r: number, g: number, b: number):
        (testDriver: TestDriver, conditionState: ConditionState) => boolean {
        let isANegation = this.isANegation;
        return function (testDriver: TestDriver, conditionState: ConditionState): boolean {
            if (conditionState.isTouchingColor(spriteName, r, g, b)) {
                return !isANegation;
            }
            return isANegation;
        }
    }

    // todo condition when the background image changes to a certain image
    // todo condition when getting message
    // todo condition volume > some value
    // todo attribute test
    // todo output test
}
