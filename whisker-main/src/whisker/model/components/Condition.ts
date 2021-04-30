import TestDriver from "../../../test/test-driver";
import {ConditionState} from "../util/ConditionState";
import {ModelEdge} from "./ModelEdge";

/** Type for finding the correct condition function, defining the event. */
export enum ConditionName {
    Key = "Key", // args: key name
    Click = "Click", // args: sprite name
    VarTest = "VarTest", // args: sprite name, variable name, comparison (=,>,<...), value to compare to
    AttrTest = "AttrTest", // args: sprite name, attribute name, comparison (=,>,<...), value to compare to
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
    let negated = false;
    if (condString.startsWith("!")) {
        negated = true;
        condString = condString.substr(1, condString.length);
    }

    const parts = condString.split(":");

    if (parts.length < 2) {
        throw new Error("Edge condition not correctly formatted. ':' missing.");
    }
    return new Condition(parts[0], negated, parts.splice(1, parts.length));
}

/**
 * Defining an edge condition.
 */
export class Condition {
    private readonly name: ConditionName;
    private readonly condition: (...state) => boolean;
    private readonly args: any[];

    readonly negated: boolean;
    private conditionState: ConditionState;

    /**
     * Get a condition instance. Checks the number of arguments for a condition type.
     * @param name Type name of the condition.
     * @param negated Whether the condition is negated.
     * @param args The arguments for the condition to check later on.
     */
    constructor(name: ConditionName, negated: boolean, args: any[]) {
        this.name = name;
        this.args = args;
        this.negated = negated;

        let testArgs = function (length) {
            let error = new Error("Not enough arguments for condition " + name + ".");
            if (args.length !== length) {
                throw error;
            }

            for (let i = 0; i < length; i++) {
                if (args[i] == undefined) {
                    throw error;
                }
            }
        }

        // Get the condition by the name given.
        switch (this.name) {
            case ConditionName.Key:
                testArgs(1);
                this.condition = Condition.checkKeyCondition(negated, this.args[0]);
                break;
            case ConditionName.Click:
                testArgs(1);
                this.condition = Condition.checkClickCondition(negated, this.args[0]);
                break;
            case ConditionName.SpriteColor:
                testArgs(4);
                this.condition = Condition.checkSpriteColorCond(negated, this.args[0], this.args[1], this.args[2], this.args[3]);
                break;
            case ConditionName.SpriteTouching:
                testArgs(2);
                this.condition = Condition.checkSpriteTouchingCond(negated, this.args[0], this.args[1]);
                break;
            case ConditionName.VarTest:
                testArgs(4);
                this.condition = Condition.checkVariableCondition(negated, this.args[0], this.args[1], this.args[2], this.args[3]);
                break;
            case ConditionName.AttrTest:
                testArgs(4);
                this.condition = Condition.checkAttrCondition(negated, this.args[0], this.args[1], this.args[2], this.args[3]);
                break;
            case ConditionName.Function:
                testArgs(1);
                this.condition = this.args[0]; // todo eval and negated
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
                break;
            case ConditionName.Key:
                this.conditionState.registerKeyCheck(this.args[0]);
                break;
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
            case ConditionName.AttrTest:
                this._checkSpriteExistence(testDriver, this.args[0]);
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
        if (this.negated) {
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
     * @param negated Whether this condition is negated.
     */
    private static checkKeyCondition(negated: boolean, key: string):
        (testDriver: TestDriver, conditionState: ConditionState) => boolean {
        // console.log("registering condition: key test ", key);
        return function (testDriver: TestDriver, conditionState: ConditionState): boolean {
            if (conditionState.isKeyDown(key) && testDriver.isKeyDown(key)) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Check whether a click is on a sprite.
     * @param spriteName Name of the sprite.
     * @param negated Whether this condition is negated.
     */
    private static checkClickCondition(negated: boolean, spriteName: string): (testDriver: TestDriver) => boolean {
        // console.log("registering condition: click ", x, y);
        return function (testDriver: TestDriver): boolean {
            // todo get input click cooridantes and test them with the boundaries of the sprite?
            return !negated;
        }
    }

    /**
     *  Method for checking if an edge condition is fulfilled for a value of a variable.
     *
     * @param spriteName Name of the sprite having the variable.
     * @param varName Name of the variable.
     * @param comparison Mode of comparison, e.g. =, <, >, <=, >=
     * @param varValue Value to compare to the variable's current value.
     * @param negated Whether this condition is negated.
     */
    private static checkVariableCondition(negated: boolean, spriteName: string, varName: string, comparison: string,
                                          varValue: string): (testDriver: TestDriver) => boolean {
        // console.log("registering condition: var test ", spriteName, varName, comparison, varValue);
        return function (testDriver: TestDriver): boolean {
            let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            let variable = sprite.getVariable(varName);
            let result = Condition.compare(comparison, variable.value, varValue);
            if (result) {
                return !negated;
            } else {
                return negated;
            }
        }
    }

    /**
     *  Method for checking if an edge condition is fulfilled for a value of a variable.
     *
     * @param spriteName Name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param comparison  Mode of comparison, e.g. =, <, >, <=, >=
     * @param varValue Value to compare to the variable's current value.
     * @param negated Whether this condition is negated.
     */
    private static checkAttrCondition(negated: boolean, spriteName: string, attrName: string, comparison: string,
                                      varValue: string): (testDriver: TestDriver) => boolean {
        // console.log("registering condition: attr test ", spriteName, attrName, comparison, varValue);
        return function (testDriver: TestDriver): boolean {
            let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            const value = eval('sprite.' + attrName);
            const oldValue = eval('sprite.old.' + attrName);

            let result = Condition.compare(comparison, value, oldValue);
            if (result) {
                return !negated
            }
            return negated;
        }
    }

    private static compare(comparison, value1, value2) {
        if (comparison == "=") {
            return value1 == value2;
        }
        // todo other comparison modes
        return false;
    }

    /**
     * Check whether the sprites with the given names are touching.
     *
     * @param spriteName1 Name of the first sprite.
     * @param spriteName2 Name of the second sprite.
     * @param negated Whether this condition is negated.
     */
    private static checkSpriteTouchingCond(negated: boolean, spriteName1: string, spriteName2: string):
        (testDriver: TestDriver, conditionState: ConditionState) => boolean {
        return function (testDriver: TestDriver, conditionState: ConditionState): boolean {
            const areTouching = conditionState.areTouching(spriteName1, spriteName2);
            if (areTouching) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Check whether a sprite touches a color.
     * @param spriteName Name of the sprite.
     * @param r RGB red color value.
     * @param g RGB green color value.
     * @param b RGB blue color value.
     * @param negated Whether this condition is negated.
     */
    private static checkSpriteColorCond(negated: boolean, spriteName: string, r: number, g: number, b: number):
        (testDriver: TestDriver, conditionState: ConditionState) => boolean {
        return function (testDriver: TestDriver, conditionState: ConditionState): boolean {
            if (conditionState.isTouchingColor(spriteName, r, g, b)) {
                return !negated;
            }
            return negated;
        }
    }

    // todo condition when the background image changes to a certain image
    // todo condition when getting message
    // todo condition volume > some value
    // todo output test
}
