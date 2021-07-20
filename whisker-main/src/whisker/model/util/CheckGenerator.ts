import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "./CheckUtility";
import {ModelUtil} from "./ModelUtil";
import {
    getComparisonNotKnownError,
    getErrorForAttribute,
    getErrorForVariable,
    getFunctionEvalError,
    getRGBRangeError
} from "./ModelError";
import {Randomness} from "../../utils/Randomness";
import {CheckName} from "../components/Check";

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
        return () => {
            return !negated == cu.isKeyDown(key);
        }
    }

    /**
     * Get a method for checking whether a sprite was clicked.
     * @param t Instance of the test driver.
     * @param spriteNameRegex Regex describing the name of the sprite.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getSpriteClickedCheck(t: TestDriver, negated: boolean, caseSensitive: boolean,
                                 spriteNameRegex: string): () => boolean {
        const spriteName = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex).name;
        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            return !negated == (t.isMouseDown() && sprite.isTouchingMouse());
        }
    }

    /**
     * Get a method for checking whether a variable has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param spriteNameRegex Regex describing the name of the sprite having the variable.
     * @param varNameRegex Regex describing the name of the variable.
     * @param comparison Mode of comparison, e.g. =, <, >, <=, >=
     * @param varValue Value to compare to the variable's current value.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getVariableComparisonCheck(t: TestDriver, cu: CheckUtility, negated: boolean, caseSensitive: boolean, spriteNameRegex: string,
                                      varNameRegex: string, comparison: string, varValue: string): () => boolean {
        let sprite = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex);
        const {
            sprite: foundSprite,
            variable: foundVar
        } = ModelUtil.checkVariableExistence(t, caseSensitive, sprite, varNameRegex);
        sprite = foundSprite;
        const spriteName = sprite.name;
        const variableName = foundVar.name;
        const eventString = CheckUtility.getEventString(CheckName.VarComp, negated, spriteNameRegex, varNameRegex,
            comparison, varValue)

        if (comparison != "==" && comparison != "=" && comparison != ">" && comparison != ">="
            && comparison != "<" && comparison != "<=") {
            throw getComparisonNotKnownError(comparison);
        }

        function check() {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            const variable = sprite.getVariable(variableName);
            try {
                return !negated == ModelUtil.compare(variable.value, varValue, comparison);
            } catch (e) {
                throw getErrorForVariable(spriteNameRegex, varNameRegex, e.message);
            }
        }

        cu.registerVarEvent(variableName, eventString, check);
        return check;
    }

    /**
     * Get a method for checking whether a sprite's attribute has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param spriteNameRegex Regex describing the name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param comparison  Mode of comparison, e.g. =, <, >, <=, >=
     * @param varValue Value to compare to the variable's current value.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getAttributeComparisonCheck(t: TestDriver, cu: CheckUtility, negated: boolean, caseSensitive: boolean,
                                       spriteNameRegex: string, attrName: string, comparison: string,
                                       varValue: string): () => boolean {
        if (attrName == "costume" || attrName == "currentCostume") {
            attrName = "currentCostumeName";
        }
        const sprite = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex);
        const spriteName = sprite.name;
        ModelUtil.checkAttributeExistence(t, sprite, attrName);

        if (comparison != "==" && comparison != "=" && comparison != ">" && comparison != ">=" && comparison != "<"
            && comparison != "<=") {
            throw getComparisonNotKnownError(comparison);
        }

        // on movement listener
        if (attrName == "x" || attrName == "y") {
            return CheckGenerator.attributeCompOnMove(t, cu, negated, sprite.name, spriteNameRegex, attrName, comparison,
                varValue);
        } else if (attrName == "size" || attrName == "direction" || attrName == "effect" || attrName == "visible"
            || attrName == "currentCostumeName" || attrName == "rotationStyle") {
            return CheckGenerator.attributeCompOnVisual(t, cu, negated, sprite.name, spriteNameRegex, attrName, comparison,
                varValue);
        }

        // without movement
        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            try {
                return !negated == ModelUtil.compare(sprite[attrName], varValue, comparison);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
        }
    }

    private static attributeCompOnVisual(t: TestDriver, cu: CheckUtility, negated: boolean, spriteName: string,
                                         spriteNameRegex: string, attrName: string, comparison: string,
                                         varValue: string): () => boolean {
        let eventString;
        if (attrName == "currentCostumeName") {
            eventString = CheckUtility.getEventString(CheckName.AttrComp, negated, spriteNameRegex, "costume",
                comparison, varValue);
        } else {
            eventString = CheckUtility.getEventString(CheckName.AttrComp, negated, spriteNameRegex, attrName,
                comparison, varValue);
        }

        cu.registerOnVisualChange(spriteName, eventString, (sprite) => {
            try {
                return !negated == ModelUtil.compare(sprite[attrName], varValue, comparison);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
        });

        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            try {
                return !negated == ModelUtil.compare(sprite[attrName], varValue, comparison);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
        }
    }

    private static attributeCompOnMove(t: TestDriver, cu: CheckUtility, negated: boolean, spriteName: string,
                                       spriteNameRegex: string, attrName: string, comparison: string,
                                       varValue: string): () => boolean {
        const eventString = CheckUtility.getEventString(CheckName.AttrComp, negated, spriteNameRegex, attrName,
            comparison, varValue);

        cu.registerOnMoveEvent(spriteName, eventString, (sprite) => {
            try {
                return !negated == ModelUtil.compare(sprite[attrName], varValue, comparison);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
        });

        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            try {
                return !negated == ModelUtil.compare(sprite[attrName], varValue, comparison);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
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
            return !negated == eval(f);
        };
    }

    /**
     * Get a method checking whether two sprites are touching.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param spriteName1Regex  Regex describing the name of the first sprite.
     * @param spriteName2Regex  Regex describing the name of the second sprite.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getSpriteTouchingCheck(t: TestDriver, cu: CheckUtility, negated: boolean, caseSensitive: boolean,
                                  spriteName1Regex: string, spriteName2Regex: string): () => boolean {
        const spriteName1 = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteName1Regex).name;
        const spriteName2 = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteName2Regex).name;

        const eventString = CheckUtility.getEventString(CheckName.SpriteTouching, negated, spriteName1Regex,
            spriteName2Regex);
        // on movement check sprite touching other sprite
        cu.registerOnMoveEvent(spriteName1, eventString, (sprite) => {
            return !negated == sprite.isTouchingSprite(spriteName2);
        });

        // only test touching if the sprite did not move as otherwise the model was already notified and test it
        return () => {
            const sprite = t.getSprite(spriteName1);
            return !negated == sprite.isTouchingSprite(spriteName2);
        }
    }

    /**
     * Get a method whether a sprite touches a color.

     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param spriteNameRegex  Regex describing the name of the sprite.
     * @param r RGB red color value.
     * @param g RGB green color value.
     * @param b RGB blue color value.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getSpriteColorTouchingCheck(t: TestDriver, cu: CheckUtility, negated: boolean, caseSensitive: boolean,
                                       spriteNameRegex: string, r: number, g: number, b: number): () => boolean {
        const spriteName = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex).name;
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
            throw getRGBRangeError();
        }
        const eventString = CheckUtility.getEventString(CheckName.SpriteColor, negated, spriteNameRegex, r, g, b);
        // on movement check sprite color
        cu.registerOnMoveEvent(spriteName, eventString, (sprite) => {
            return !negated == sprite.isTouchingColor([r, g, b]);
        });

        // only test touching if the sprite did not move as otherwise the model was already notified and test it
        return () => {
            const sprite = t.getSprite(spriteName);
            return !negated == sprite.isTouchingColor([r, g, b]);
        }
    }

    /**
     * Get a method checking whether a sprite has the given output included in their sayText.
     * @param t Instance of the test driver.
     * @param cu  Listener for the checks.
     * @param spriteNameRegex  Regex describing the name of the sprite.
     * @param output Output to say.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getOutputOnSpriteCheck(t: TestDriver, cu: CheckUtility, negated: boolean, caseSensitive: boolean,
                                  spriteNameRegex: string, output: string): () => boolean {
        const spriteName = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex).name;
        const expression = ModelUtil.getExpressionForEval(t, caseSensitive, output);

        const eventString = CheckUtility.getEventString(CheckName.Output, negated, spriteNameRegex, output);
        cu.registerOutput(spriteName, eventString, (sprite) => {
            return !negated == (sprite.sayText && sprite.sayText.indexOf(eval(expression)(t)) != -1);
        })
        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            return !negated == (sprite.sayText && sprite.sayText.indexOf(eval(expression)(t)) != -1);
        }
    }

    /**
     * Get a method checking whether a variable value of a sprite changed.
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param spriteNameRegex Regex describing the name of the sprite having the variable.
     * @param varNameRegex Regex describing the name of the variable.
     * @param change For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same-.
     * "+=" for increase or staying the same."-=" for decrease or staying the same. For a numerical
     * change by an exact value '+<number>' or '<number>' or '-<number>'.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getVariableChangeCheck(t: TestDriver, cu: CheckUtility, negated: boolean, caseSensitive: boolean,
                                  spriteNameRegex: string, varNameRegex: string, change): () => boolean {
        let sprite = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex);
        let {
            sprite: foundSprite,
            variable: foundVar
        } = ModelUtil.checkVariableExistence(t, caseSensitive, sprite, varNameRegex);
        sprite = foundSprite;
        const spriteName = sprite.name;
        const variableName = foundVar.name;
        const eventString = CheckUtility.getEventString(CheckName.VarChange, negated, spriteNameRegex, varNameRegex, change);

        function check() {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            const variable = sprite.getVariable(variableName);
            try {
                return !negated == ModelUtil.testChange(variable.old.value, variable.value, change);
            } catch (e) {
                throw getErrorForVariable(spriteNameRegex, varNameRegex, e.message);
            }
        }

        cu.registerVarEvent(variableName, eventString, check);
        return check;
    }

    /**
     * Get a method checking whether an attribute of a sprite changed.
     * Attributes: checks, x, y, pos , direction, visible, size, currentCostume, this.volume, layerOrder, sayText;
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param spriteNameRegex  Regex describing the name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param change For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same-.
     * "+=" for increase or staying the same."-=" for decrease or staying the same. For a numerical
     * change by an exact value '+<number>' or '<number>' or '-<number>'.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getAttributeChangeCheck(t: TestDriver, cu: CheckUtility, negated: boolean, caseSensitive: boolean,
                                   spriteNameRegex: string, attrName: string, change): () => boolean {
        if (attrName == "costume" || attrName == "currentCostume") {
            attrName = "currentCostumeName";
        }
        const sprite = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex);
        const spriteName = sprite.name;
        ModelUtil.checkAttributeExistence(t, sprite, attrName);

        if (attrName == "x" || attrName == "y") {
            return CheckGenerator.attributeChangeOnMove(t, cu, negated, sprite, spriteNameRegex, attrName, change);
        } else if (attrName == "size" || attrName == "direction" || attrName == "effect" || attrName == "visible"
            || attrName == "currentCostumeName" || attrName == "rotationStyle") {
            return CheckGenerator.attributeChangeOnVisual(t, cu, negated, sprite, spriteNameRegex, attrName, change);
        }

        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            try {
                return !negated == ModelUtil.testChange(sprite.old[attrName], sprite[attrName], change);
            } catch (e) {
                throw getErrorForAttribute(spriteName, attrName, e.message);
            }
        }
    }

    private static attributeChangeOnVisual(t: TestDriver, cu: CheckUtility, negated: boolean, sprite, spriteNameRegex: string,
                                           attrName: string, change): () => boolean {
        const spriteName = sprite.name;
        let eventString;
        if (attrName == "currentCostumeName") {
            eventString = CheckUtility.getEventString(CheckName.AttrChange, negated, spriteNameRegex, "costume", change);
        } else {
            eventString = CheckUtility.getEventString(CheckName.AttrChange, negated, spriteNameRegex, attrName, change);
        }
        cu.registerOnVisualChange(spriteName, eventString, (sprite) => {
            try {
                return !negated == ModelUtil.testChange(sprite.old[attrName], sprite[attrName], change);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
        });

        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            try {
                return !negated == ModelUtil.testChange(sprite.old[attrName], sprite[attrName], change);
            } catch (e) {
                throw getErrorForAttribute(spriteName, attrName, e.message);
            }
        }
    }

    private static attributeChangeOnMove(t: TestDriver, cu: CheckUtility, negated: boolean, sprite, spriteNameRegex: string,
                                         attrName: string, change): () => boolean {
        const spriteName = sprite.name;
        const eventString = CheckUtility.getEventString(CheckName.AttrChange, negated, spriteNameRegex, attrName, change);
        cu.registerOnMoveEvent(spriteName, eventString, (sprite) => {
            try {
                return !negated == ModelUtil.testChange(sprite.old[attrName], sprite[attrName], change);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
        });

        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            try {
                return !negated == ModelUtil.testChange(sprite.old[attrName], sprite[attrName], change);
            } catch (e) {
                throw getErrorForAttribute(spriteName, attrName, e.message);
            }
        }
    }

    /**
     * Get a method checking whether the background of the stage changed.
     * @param t Instance of the test driver.
     * @param cu Listener for checks.
     * @param newBackground Name of the new background.
     * @param negated Whether this check is negated.
     */
    static getBackgroundChangeCheck(t: TestDriver, cu: CheckUtility, negated: boolean, newBackground: string): () => boolean {
        return CheckGenerator.getAttributeComparisonCheck(t, cu, negated, false, "Stage",
            "costume", "=", newBackground)
    }

    /**
     * Get a method checking whether an expression such as "$(Cat.x) > 25" is fulfilled.
     * @param t Instance of the test driver.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     * @param expression The expression string.
     */
    static getExpressionCheck(t: TestDriver, negated: boolean, caseSensitive: boolean, expression: string) {
        let toEval = ModelUtil.getExpressionForEval(t, caseSensitive, expression);
        // todo get dependencies on attributes / variables and add listeners
        return () => {
            return !negated == eval(toEval)(t);
        }
    }

    /**
     * Get a method that checks whether a random number is greater than the probability given. For randomness...
     * @param t Instance of the test driver.
     * @param negated Whether this check is negated.
     * @param probability The probability e.g. 0.5.
     */
    static getProbabilityCheck(t: TestDriver, negated: boolean, probability: string) {
        const prob = ModelUtil.testNumber(probability);
        return () => {
            return !negated == (Randomness.getInstance().nextDouble() <= prob);
        }
    }

    /**
     * Get a method that checks whether enough time has elapsed since the test runner started the test.
     * @param t Instance of the test driver.
     * @param negated Whether this check is negated.
     * @param timeInMS Time in milliseconds.
     */
    static getTimeElapsedCheck(t: TestDriver, negated: boolean, timeInMS: string) {
        const time = ModelUtil.testNumber(timeInMS);
        const steps = t.vmWrapper.convertFromTimeToSteps(time);
        return () => {
            return !negated == (steps <= t.getTotalStepsExecuted());
        }
    }

    /**
     * Get a method that checks whether enough time has elapsed since the last edge transition in the current model.
     * @param t Instance of the test driver.
     * @param negated Whether this check is negated.
     * @param timeInMS Time in milliseconds.
     */
    static getTimeBetweenCheck(t: TestDriver, negated: boolean, timeInMS: string) {
        const time = ModelUtil.testNumber(timeInMS);
        const steps = t.vmWrapper.convertFromTimeToSteps(time);
        return (stepsSinceLastTransition) => {
            return !negated == (steps <= stepsSinceLastTransition);
        }
    }

    /**
     * Get a method that checks whether enough time has elapsed since the program ended.
     * @param t Instance of the test driver.
     * @param negated Whether this check is negated.
     * @param timeInMS Time in milliseconds.
     */
    static getTimeAfterEndCheck(t: TestDriver, negated: boolean, timeInMS: string) {
        const time = ModelUtil.testNumber(timeInMS);
        const steps = t.vmWrapper.convertFromTimeToSteps(time);
        return (stepsSinceLastTransition, stepsSinceEnd) => {
            return !negated == (steps <= (t.getTotalStepsExecuted() - stepsSinceEnd));
        }
    }

    /**
     * Get a method to check how many clones of a sprite are there.
     * @param t Instance of the test driver.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     * @param spriteNameRegex Regex defining the sprite name.
     * @param clonesVisible Whether the clones have to be visible.
     * @param comparison Mode of comparison, e.g. =, <, >, <=, >=
     * @param nbr Number of clones.
     */
    static getNumberOfClonesCheck(t: TestDriver, negated: boolean, caseSensitive: boolean, clonesVisible: boolean,
                                  spriteNameRegex: string, comparison: string, nbr: string) {
        const toCheckNbr = ModelUtil.testNumber(nbr);
        const sprite = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex);
        const spriteName = sprite.name;

        if (comparison != "==" && comparison != "=" && comparison != ">" && comparison != ">=" && comparison != "<"
            && comparison != "<=") {
            throw getComparisonNotKnownError(comparison);
        }

        let spriteCondition;
        if (!clonesVisible) {
            spriteCondition = sprite => sprite.name.includes(spriteName);
        } else {
            spriteCondition = sprite => sprite.name.includes(spriteName) && sprite.visible == true;
        }
        return () => {
            const sprites = t.getSprites(spriteCondition);
            return !negated == (ModelUtil.compare(sprites.length, toCheckNbr, comparison));
        }
    }

    /**
     * Get a method to check whether a sprite is touching an edge.
     * @param t Test driver.
     * @param cu Listener for checks.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     * @param spriteNameRegex Regex defining the sprite name.
     */
    static getTouchingEdgeCheck(t: TestDriver, cu: CheckUtility, negated: boolean, caseSensitive: boolean, spriteNameRegex: string) {
        const spriteName = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex).name;
        const eventString = CheckUtility.getEventString(CheckName.TouchingEdge, negated, spriteNameRegex);

        cu.registerOnMoveEvent(spriteName, eventString, (sprite) => {
            return !negated == sprite.isTouchingEdge();
        })

        return () => {
            const sprite = t.getSprites(sprite => sprite.name.includes(spriteName))[0];
            return !negated == sprite.isTouchingEdge();
        }
    }
}
