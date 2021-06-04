import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "./CheckUtility";
import {ModelUtil} from "./ModelUtil";
import Sprite from "../../../vm/sprite";
import {
    getComparisonNotKnownError,
    getErrorForAttribute,
    getErrorForVariable,
    getFunctionEvalError,
    getRGBRangeError,
    getVariableNotFoundError
} from "./ModelError";

// todo functions for clones
// todo functions for counting check "wiederhole 10 mal"
// todo check plays a sound...
// todo check "pralle vom rand ab"
// todo check "richtung auf x setzen"
// todo check "gehe zu zufallsposition"
// todo check "drehe dich um ..."

// todo check when the background image changes to a certain image
// todo check when getting message
// todo check volume > some value

/**
 * Generates methods for different events (e.g. user inputs or sensorial Scratch events) based on a test driver and
 * its loaded Scratch program.
 */
export abstract class CheckGenerator {

    /**
     * Get a method for checking if a key was pressed or not pressed.
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param key Name of the key.
     * @param negated Whether this check is negated.
     */
    static getKeyDownCheck(t: TestDriver, cu: CheckUtility, negated: boolean, key: string): () => boolean {
        cu.registerKeyCheck(key);
        return () => {
            if (cu.isKeyDown(key)) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Get a method for checking whether a sprite was clicked.
     * @param t Instance of the test driver.
     * @param spriteName Name of the sprite.
     * @param negated Whether this check is negated.
     */
    static getSpriteClickedCheck(t: TestDriver, negated: boolean, spriteName: string): () => boolean {
        ModelUtil.checkSpriteExistence(t, spriteName);
        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            if (t.isMouseDown() && sprite.isTouchingMouse()) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Get a method for checking whether a variable has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver.
     * @param spriteName Name of the sprite having the variable.
     * @param varName Name of the variable.
     * @param comparison Mode of comparison, e.g. =, <, >, <=, >=
     * @param varValue Value to compare to the variable's current value.
     * @param negated Whether this check is negated.
     */
    static getVariableComparisonCheck(t: TestDriver, negated: boolean, spriteName: string, varName: string,
                                      comparison: string, varValue: string): () => boolean {
        let sprite = ModelUtil.checkSpriteExistence(t, spriteName);
        let variable = sprite.getVariable(varName);

        if (variable == undefined) {
            throw getVariableNotFoundError(varName, spriteName);
        }
        if (comparison != "==" && comparison != "=" && comparison != ">" && comparison != ">="
            && comparison != "<" && comparison != "<=") {
            throw getComparisonNotKnownError(comparison);
        }
        return () => {
            let sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            let variable = sprite.getVariable(varName);

            let result;
            try {
                result = ModelUtil.compare(variable.value, varValue, comparison);
            } catch (e) {
                throw getErrorForVariable(spriteName, varName, e.message);
            }
            if (result) {
                return !negated;
            } else {
                return negated;
            }
        }
    }

    /**
     * Get a method for checking whether a sprite's attribute has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver.
     * @param spriteName Name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param comparison  Mode of comparison, e.g. =, <, >, <=, >=
     * @param varValue Value to compare to the variable's current value.
     * @param negated Whether this check is negated.
     */
    static getAttributeComparisonCheck(t: TestDriver, negated: boolean, spriteName: string, attrName: string,
                                       comparison: string, varValue: string): () => boolean {
        ModelUtil.checkAttributeExistence(t, spriteName, attrName);
        if (comparison != "==" && comparison != "=" && comparison != ">" && comparison != ">=" && comparison != "<"
            && comparison != "<=") {
            throw getComparisonNotKnownError(comparison);
        }
        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            const value = sprite[attrName];
            const oldValue = sprite.old[attrName];

            let result;
            try {
                result = ModelUtil.compare(value, oldValue, comparison);
            } catch (e) {
                throw getErrorForAttribute(spriteName, attrName, e.message);
            }

            if (result) {
                return !negated
            }
            return negated;
        }
    }

    /**
     * Get a method checking another method.
     * @param t Instance of the test driver.
     * @param negated Whether it should be negated.
     * @param f the function as a string.
     */
    static getFunctionCheck(t: TestDriver, negated: boolean, f: string): () => boolean {
        try {
            eval(f);
        } catch (e) {
            throw getFunctionEvalError(e);
        }
        return () => {
            if (eval(f)) {
                return !negated;
            }
            return negated;
        };
    }

    /**
     * Get a method checking whether two sprites are touching.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param spriteName1 Name of the first sprite.
     * @param spriteName2 Name of the second sprite.
     * @param negated Whether this check is negated.
     */
    static getSpriteTouchingCheck(t: TestDriver, cu: CheckUtility, negated: boolean, spriteName1: string,
                                  spriteName2: string): () => boolean {
        ModelUtil.checkSpriteExistence(t, spriteName1);
        ModelUtil.checkSpriteExistence(t, spriteName2);
        cu.registerTouching(spriteName1, spriteName2);
        return () => {
            const areTouching = cu.areTouching(spriteName1, spriteName2);
            if (areTouching) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Get a method whether a sprite touches a color.

     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param spriteName Name of the sprite.
     * @param r RGB red color value.
     * @param g RGB green color value.
     * @param b RGB blue color value.
     * @param negated Whether this check is negated.
     */
    static getSpriteColorTouchingCheck(t: TestDriver, cu: CheckUtility, negated: boolean, spriteName: string,
                                       r: number, g: number, b: number): () => boolean {
        ModelUtil.checkSpriteExistence(t, spriteName);
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
            throw getRGBRangeError();
        }
        cu.registerColor(spriteName, r, g, b);

        return () => {
            if (cu.isTouchingColor(spriteName, r, g, b)) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Get a method checking whether a sprite has the given output included in their sayText.
     * @param t Instance of the test driver.
     * @param spriteName Name of the sprite.
     * @param output Output to say.
     * @param negated Whether this check is negated.
     */
    static getOutputOnSpriteCheck(t: TestDriver, negated: boolean, spriteName: string, output: string): () => boolean {
        ModelUtil.checkSpriteExistence(t, spriteName);
        let expression = ModelUtil.getExpressionForEval(t, output);

        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            if (sprite.sayText && sprite.sayText != "" && sprite.sayText.indexOf(eval(expression)(t)) != -1) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Get a method checking whether a variable value of a sprite changed.
     * @param t Instance of the test driver.
     * @param spriteName Name of the sprite having the variable.
     * @param varName Name of the variable.
     * @param change For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same-.
     * "+=" for increase or staying the same."-=" for decrease or staying the same.
     * @param negated Whether this check is negated.
     */
    static getVariableChangeCheck(t: TestDriver, negated: boolean, spriteName: string, varName: string, change: string):
        () => boolean {
        const sprite = ModelUtil.checkSpriteExistence(t, spriteName);
        const variable = sprite.getVariable(varName);
        if (variable == undefined) {
            throw getVariableNotFoundError(varName, spriteName);
        }
        return () => {
            const sprite = ModelUtil.checkSpriteExistence(t, spriteName);
            const variable = sprite.getVariable(varName);
            let result;

            try {
                result = ModelUtil.testChange(variable.old.value, variable.value, change);
            } catch (e) {
                throw getErrorForVariable(spriteName, varName, e.message);
            }
            if (result) {
                return !negated;
            }
            return negated;
        }
    }


    /**
     * Get a method checking whether an attribute of a sprite changed.
     * Attributes: checks, x, y, pos , direction, visible, size, currentCostume, this.volume, layerOrder, sayText;
     * @param t Instance of the test driver.
     * @param spriteName Name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param change For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same-.
     * "+=" for increase or staying the same."-=" for decrease or staying the same.
     * @param negated Whether this check is negated.
     */
    static getAttributeChangeCheck(t: TestDriver, negated: boolean, spriteName: string, attrName: string, change: string):
        () => boolean {
        ModelUtil.checkAttributeExistence(t, spriteName, attrName);
        const currentValueEval = "sprite." + attrName;
        const oldValueEval = "sprite.old." + attrName;

        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            const newValue = eval(currentValueEval);
            const oldValue = eval(oldValueEval);

            if (CheckGenerator.cannotMoveOnEdge(sprite, attrName, newValue, oldValue, change)) {
                return !negated;
            }

            let result;
            try {
                result = ModelUtil.testChange(oldValue, newValue, change);
            } catch (e) {
                throw getErrorForAttribute(spriteName, attrName, e.message);
            }
            if (result) {
                return !negated;
            }
            return negated;
        }
    }

    private static cannotMoveOnEdge(sprite: Sprite, attrName: string, newValue: number, oldValue: number,
                                    change: string): boolean {
        if ((attrName === "x" || attrName === "y") && sprite.isTouchingEdge() && newValue === oldValue
            && change != "=") {
            return ((change == '+' || change == '++') && newValue > 0)
                || ((change == '-' || change == '--') && newValue < 0);
        }
        return false;
    }

    /**
     * Get a method checking whether the background of the stage changed.
     * @param t Instance of the test driver.
     * @param newBackground Name of the new background.
     * @param negated Whether this check is negated.
     */
    static getBackgroundChangeCheck(t: TestDriver, negated: boolean, newBackground: string): () => boolean {
        return () => {
            // todo how to get the background
            const stage = t.getStage();
            // stage.
            return negated;
        }
    }

    /**
     * Get a method checking whether an expression such as "$(Cat.x) > 25" is fulfilled.
     * @param t Instance of the test driver.
     * @param negated Whether this check is negated.
     * @param expression The expression string.
     */
    static getExpressionCheck(t: TestDriver, negated: boolean, expression: string) {
        let toEval = ModelUtil.getExpressionForEval(t, expression);
        return () => {
            if (eval(toEval)(t)) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Get a method that checks whether a random number is greater than the probability given. For randomness...
     * @param t Instance of the test driver.
     * @param negated Whether this check is negated.
     * @param probability The probability e.g. 0.5.
     */
    static getProbabilityCheck(t: TestDriver, negated: boolean, probability: string) {
        ModelUtil.testNumber(probability);
        let prob = Number(probability.toString());

        return () => {
            if (Math.random() <= prob) {
                return !negated;
            }
            return negated;
        }
    }
}
