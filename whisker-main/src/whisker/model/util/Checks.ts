import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "./CheckUtility";
import {Util} from "./Util";
import Sprite from "../../../vm/sprite";

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

export class Checks {
    /**
     * Get a method for checking if a key was pressed or not pressed.
     * @param t Instance of the test driver.
     * @param cs Listener for the checks.
     * @param key Name of the key.
     * @param negated Whether this check is negated.
     */
    static getKeyDownCheck(t: TestDriver, cs: CheckUtility, negated: boolean, key: string): () => boolean {
        cs.registerKeyCheck(key);
        return () => {
            if (cs.isKeyDown(key)) {
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
        Util.checkSpriteExistence(t, spriteName);
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
        let sprite = Util.checkSpriteExistence(t, spriteName);
        let variable = sprite.getVariable(varName);

        if (variable == undefined) {
            throw new Error("Variable not found: " + varName);
        }
        if (comparison != "==" && comparison != "=" && comparison != ">" && comparison != ">="
            && comparison != "<" && comparison != "<=") {
            throw new Error("Comparison not known: " + comparison);
        }
        return () => {
            let sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            let variable = sprite.getVariable(varName);

            let result;
            try {
                result = Util.compare(variable.value, varValue, comparison);
            } catch (e) {
                e.message = e.message + spriteName + "." + varName;
                throw e;
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
        Util.checkAttributeExistence(t, spriteName, attrName);
        if (comparison != "==" && comparison != "=" && comparison != ">" && comparison != ">=" && comparison != "<"
            && comparison != "<=") {
            throw new Error("Comparison not known: " + comparison);
        }
        const currentValueEval = "sprite." + attrName;
        const oldValueEval = "sprite.old." + attrName;
        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            const value = eval(currentValueEval);
            const oldValue = eval(oldValueEval);

            let result;
            try {
                result = Util.compare(value, oldValue, comparison);
            } catch (e) {
                e.message = e.message + spriteName + "." + attrName;
                throw e;
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
    static getFunctionCheck(t: TestDriver, negated: boolean, f): () => boolean {
        try {
            eval(f);
        } catch (e) {
            throw new Error("Function cannot be evaluated:\n" + e);
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
     * @param cs Listener for the checks.
     * @param spriteName1 Name of the first sprite.
     * @param spriteName2 Name of the second sprite.
     * @param negated Whether this check is negated.
     */
    static getSpriteTouchingCheck(t: TestDriver, cs: CheckUtility, negated: boolean, spriteName1: string,
                                  spriteName2: string): () => boolean {
        Util.checkSpriteExistence(t, spriteName1);
        Util.checkSpriteExistence(t, spriteName2);
        cs.registerTouching(spriteName1, spriteName2);
        return () => {
            const areTouching = cs.areTouching(spriteName1, spriteName2);
            if (areTouching) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Get a method whether a sprite touches a color.

     * @param t Instance of the test driver.
     * @param cs Listener for the checks.
     * @param spriteName Name of the sprite.
     * @param r RGB red color value.
     * @param g RGB green color value.
     * @param b RGB blue color value.
     * @param negated Whether this check is negated.
     */
    static getSpriteColorTouchingCheck(t: TestDriver, cs: CheckUtility, negated: boolean, spriteName: string,
                                       r: number, g: number, b: number): () => boolean {
        Util.checkSpriteExistence(t, spriteName);
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
            throw new Error("RGB ranges not correct.");
        }
        cs.registerColor(spriteName, r, g, b);

        return () => {
            if (cs.isTouchingColor(spriteName, r, g, b)) {
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
        Util.checkSpriteExistence(t, spriteName);
        // todo eval the output (could also contain variables)
        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            if (sprite.sayText.indexOf(eval(output)) != -1) {
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
        const sprite = Util.checkSpriteExistence(t, spriteName);
        const variable = sprite.getVariable(varName);
        if (variable == undefined) {
            throw new Error("Variable " + varName + " is not defined on sprite " + spriteName + ".");
        }
        return () => {
            const sprite = Util.checkSpriteExistence(t, spriteName);
            const variable = sprite.getVariable(varName);
            let result;

            try {
                result = Util.testChange(variable.old.value, variable.value, change);
            } catch (e) {
                e.message = e.message + " for " + spriteName + "." + varName;
                throw e;
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
        Util.checkAttributeExistence(t, spriteName, attrName);
        const currentValueEval = "sprite." + attrName;
        const oldValueEval = "sprite.old." + attrName;

        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            const newValue = eval(currentValueEval);
            const oldValue = eval(oldValueEval);

            if (Checks.cannotMoveOnEdge(sprite, attrName, newValue, oldValue, change)) {
                return !negated;
            }

            let result;
            try {
                result = Util.testChange(oldValue, newValue, change);
            } catch (e) {
                e.message = e.message + " for " + spriteName + "." + attrName;
                throw e;
            }
            if (result) {
                return !negated;
            }
            return negated;
        }
    }

    private static cannotMoveOnEdge(sprite: Sprite, attrName: string, newValue: number, oldValue: number, change: string): boolean {
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
}
