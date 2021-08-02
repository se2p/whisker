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
            const sprites = t.getSprites(sprite => sprite.name == spriteName, false);
            let anyTouchingMouse = false;
            for (let i = 0; i < sprites.length; i++) {
                if (sprites[i].visible && t.isMouseDown() && sprites[i].isTouchingMouse()) {
                    anyTouchingMouse = true;
                    break;
                }
            }
            return !negated == anyTouchingMouse;
        }
    }

    /**
     * Get a method for checking whether a variable has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeID Id of the parent edge of the check.
     * @param spriteNameRegex Regex describing the name of the sprite having the variable.
     * @param varNameRegex Regex describing the name of the variable.
     * @param comparison Mode of comparison, e.g. =, <, >, <=, >=
     * @param varValue Value to compare to the variable's current value.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getVariableComparisonCheck(t: TestDriver, cu: CheckUtility, edgeID: string, negated: boolean,
                                      caseSensitive: boolean, spriteNameRegex: string,
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

        cu.registerVarEvent(variableName, eventString, edgeID, check);
        return check;
    }

    /**
     * Get a method for checking whether a sprite's attribute has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeID Id of the parent edge of the check.
     * @param spriteNameRegex Regex describing the name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param comparison  Mode of comparison, e.g. =, <, >, <=, >=
     * @param varValue Value to compare to the variable's current value.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getAttributeComparisonCheck(t: TestDriver, cu: CheckUtility, edgeID: string, negated: boolean, caseSensitive: boolean,
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
            CheckGenerator.attributeCompOnMove(cu, edgeID, negated, sprite.name, spriteNameRegex, attrName, comparison,
                varValue);
        } else if (attrName == "size" || attrName == "direction" || attrName == "effect" || attrName == "visible"
            || attrName == "currentCostumeName" || attrName == "rotationStyle") {
            CheckGenerator.attributeCompOnVisual(cu, edgeID, negated, sprite.name, spriteNameRegex, attrName, comparison,
                varValue);
        }

        // without movement
        return () => {
            const sprites = t.getSprites(sprite => sprite.name == spriteName, false);
            let anyCompCorrect = false;
            try {
                for (let i = 0; i < sprites.length; i++) {
                    if (ModelUtil.compare(sprites[i][attrName], varValue, comparison)) {
                        anyCompCorrect = true;
                        break;
                    }
                }
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }

            return !negated == anyCompCorrect;
        }
    }

    private static attributeCompOnVisual(cu: CheckUtility, edgeID: string, negated: boolean, spriteName: string,
                                         spriteNameRegex: string, attrName: string, comparison: string,
                                         varValue: string) {
        let eventString;
        if (attrName == "currentCostumeName") {
            eventString = CheckUtility.getEventString(CheckName.AttrComp, negated, spriteNameRegex, "costume",
                comparison, varValue);
        } else {
            eventString = CheckUtility.getEventString(CheckName.AttrComp, negated, spriteNameRegex, attrName,
                comparison, varValue);
        }

        cu.registerOnVisualChange(spriteName, eventString, edgeID, (sprite) => {
            try {
                return !negated == ModelUtil.compare(sprite[attrName], varValue, comparison);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
        });
    }

    private static attributeCompOnMove(cu: CheckUtility, edgeID: string, negated: boolean, spriteName: string,
                                       spriteNameRegex: string, attrName: string, comparison: string,
                                       varValue: string) {
        const eventString = CheckUtility.getEventString(CheckName.AttrComp, negated, spriteNameRegex, attrName,
            comparison, varValue);

        cu.registerOnMoveEvent(spriteName, eventString, edgeID, (sprite) => {
            try {
                return !negated == ModelUtil.compare(sprite[attrName], varValue, comparison);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
        });
    }

    /**
     * Get a method checking another method.
     * @param t Instance of the test driver.
     * @param cu Listener for checks.
     * @param edgeID Id of the parent edge of the check.
     * @param caseSensitive Whether the sprite and variable names are case sensitive.
     * @param negated Whether it should be negated.
     * @param f the function as a string.
     */
    static getFunctionCheck(t: TestDriver, cu: CheckUtility, edgeID: string, negated: boolean, caseSensitive: boolean,
                            f: string): () => boolean {
        let fun;

        if (f == "true" && negated || f == "false" && !negated) {
            return () => {
                return false;
            };
        } else if (f == "true" && !negated || f == "false" && negated) {
            return () => {
                return true;
            };
        }

        try {
            fun = eval(f);
        } catch (e) {
            throw getFunctionEvalError(e);
        }

        let {varDependencies, attrDependencies} = ModelUtil.getDependencies(f);
        let eventString = CheckUtility.getEventString(CheckName.Function, negated, f);
        this.setupDependencies(cu, eventString, edgeID, varDependencies, attrDependencies, () => {
            return !negated == fun(t);
        });
        return () => {
            return !negated == fun(t);
        };
    }

    private static setupDependencies(cu: CheckUtility, eventString: string, edgeID: string, varDependencies,
                                     attrDependencies, predicate: (...sprite) => boolean) {
        if (varDependencies.length > 0) {
            varDependencies.forEach(({spriteName, varName}) => {
                cu.registerVarEvent(varName, eventString, edgeID, predicate);
            })
        }
        if (attrDependencies.length > 0) {
            attrDependencies.forEach(({spriteName, attrName}) => {
                if (attrName == "x" || attrName == "y") {
                    cu.registerOnMoveEvent(spriteName, eventString, edgeID, predicate);
                } else if (attrName == "size" || attrName == "direction" || attrName == "effect" || attrName == "visible"
                    || attrName == "currentCostumeName" || attrName == "rotationStyle") {
                    cu.registerOnVisualChange(spriteName, eventString, edgeID, predicate)
                }
            })
        }
    }

    /**
     * Get a method checking whether two sprites are touching.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeID Id of the parent edge of the check.
     * @param spriteName1Regex  Regex describing the name of the first sprite.
     * @param spriteName2Regex  Regex describing the name of the second sprite.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getSpriteTouchingCheck(t: TestDriver, cu: CheckUtility, edgeID: string, negated: boolean, caseSensitive: boolean,
                                  spriteName1Regex: string, spriteName2Regex: string): () => boolean {
        const spriteName1 = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteName1Regex).name;
        const spriteName2 = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteName2Regex).name;

        const eventString = CheckUtility.getEventString(CheckName.SpriteTouching, negated, spriteName1Regex,
            spriteName2Regex);
        // on movement check sprite touching other sprite, sprite is given by movement event caller and
        // isTouchingSprite is checking all clones with spriteName2
        cu.registerOnMoveEvent(spriteName1, eventString, edgeID, (sprite) => {
            return !negated == sprite.isTouchingSprite(spriteName2);
        });

        // only test touching if the sprite did not move as otherwise the model was already notified and test it,
        // also test clones of spriteName1
        return () => {
            const sprites = t.getSprites(s => s.name == spriteName1, false);
            let anyTouchingSprite = false;
            for (let i = 0; i < sprites.length; i++) {
                if (sprites[i].visible && sprites[i].isTouchingSprite(spriteName2)) {
                    anyTouchingSprite = true;
                    break;
                }
            }
            return !negated == anyTouchingSprite;
        }
    }

    /**
     * Get a method whether a sprite touches a color.

     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeID Id of the parent edge of the check.
     * @param spriteNameRegex  Regex describing the name of the sprite.
     * @param r RGB red color value.
     * @param g RGB green color value.
     * @param b RGB blue color value.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getSpriteColorTouchingCheck(t: TestDriver, cu: CheckUtility, edgeID: string, negated: boolean, caseSensitive: boolean,
                                       spriteNameRegex: string, r: number, g: number, b: number): () => boolean {
        const spriteName = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex).name;
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
            throw getRGBRangeError();
        }
        const eventString = CheckUtility.getEventString(CheckName.SpriteColor, negated, spriteNameRegex, r, g, b);
        // on movement check sprite color
        cu.registerOnMoveEvent(spriteName, eventString, edgeID, (sprite) => {
            return !negated == sprite.isTouchingColor([r, g, b]);
        });

        // only test touching if the sprite did not move as otherwise the model was already notified and test it
        // also test clones of spriteName
        return () => {
            const sprites = t.getSprites(s => s.name == spriteName, false);
            let anyTouchingColor = false;
            for (let i = 0; i < sprites.length; i++) {
                if (sprites[i].visible && sprites[i].isTouchingColor([r, g, b])) {
                    anyTouchingColor = true;
                    break;
                }
            }
            return !negated == anyTouchingColor;
        }
    }

    /**
     * Get a method checking whether a sprite has the given output included in their sayText.
     * @param t Instance of the test driver.
     * @param cu  Listener for the checks.
     * @param edgeID Id of the parent edge of the check.
     * @param spriteNameRegex  Regex describing the name of the sprite.
     * @param output Output to say.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getOutputOnSpriteCheck(t: TestDriver, cu: CheckUtility, edgeID: string, negated: boolean, caseSensitive: boolean,
                                  spriteNameRegex: string, output: string): () => boolean {
        const spriteName = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex).name;
        const expression = ModelUtil.getExpressionForEval(t, caseSensitive, output).expr;

        const eventString = CheckUtility.getEventString(CheckName.Output, negated, spriteNameRegex, output);
        cu.registerOutput(spriteName, eventString, edgeID, (sprite) => {
            return !negated == (sprite.sayText && sprite.sayText.indexOf(eval(expression)(t)) != -1);
        })
        return () => {
            const sprites = t.getSprites(sprite => sprite.name == spriteName, false);
            let anySayText = false;
            for (let i = 0; i < sprites.length; i++) {
                if (sprites[i].sayText) {
                    let sayText = !caseSensitive ? sprites[i].sayText.toLowerCase() : sprites[i].sayText;
                    if (sayText.indexOf(eval(expression)(t)) != -1) {
                        anySayText = true;
                        break;
                    }
                }
            }
            return !negated == anySayText;
        }
    }

    /**
     * Get a method checking whether a variable value of a sprite changed.
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeID Id of the parent edge of the check.
     * @param spriteNameRegex Regex describing the name of the sprite having the variable.
     * @param varNameRegex Regex describing the name of the variable.
     * @param change For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same-.
     * "+=" for increase or staying the same."-=" for decrease or staying the same. For a numerical
     * change by an exact value '+<number>' or '<number>' or '-<number>'.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getVariableChangeCheck(t: TestDriver, cu: CheckUtility, edgeID: string, negated: boolean, caseSensitive: boolean,
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

        cu.registerVarEvent(variableName, eventString, edgeID, check);
        return check;
    }

    /**
     * Get a method checking whether an attribute of a sprite changed.
     * Attributes: checks, x, y, pos , direction, visible, size, currentCostume, this.volume, layerOrder, sayText;
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeID Id of the parent edge of the check.
     * @param spriteNameRegex  Regex describing the name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param change For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same-.
     * "+=" for increase or staying the same."-=" for decrease or staying the same. For a numerical
     * change by an exact value '+<number>' or '<number>' or '-<number>'.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getAttributeChangeCheck(t: TestDriver, cu: CheckUtility, edgeID: string, negated: boolean, caseSensitive: boolean,
                                   spriteNameRegex: string, attrName: string, change): () => boolean {
        if (attrName == "costume" || attrName == "currentCostume") {
            attrName = "currentCostumeName";
        }
        const sprite = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex);
        const spriteName = sprite.name;
        ModelUtil.checkAttributeExistence(t, sprite, attrName);

        if (attrName == "x" || attrName == "y") {
            CheckGenerator.registerOnMoveAttrChange(cu, edgeID, negated, sprite, spriteNameRegex, attrName, change);
        } else if (attrName == "size" || attrName == "direction" || attrName == "effect" || attrName == "visible"
            || attrName == "currentCostumeName" || attrName == "rotationStyle") {
            CheckGenerator.registerOnVisualAttrChange(cu, edgeID, negated, sprite, spriteNameRegex, attrName, change);
        }

        return () => {
            const sprites = t.getSprites(sprite => sprite.name == spriteName, false);
            let anyChangeCorrect = false;
            try {
                for (let i = 0; i < sprites.length; i++) {
                    if (ModelUtil.testChange(sprites[i].old[attrName], sprites[i][attrName], change)) {
                        anyChangeCorrect = true;
                        break;
                    }
                }
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }

            return !negated == anyChangeCorrect;
        }
    }

    private static registerOnVisualAttrChange(cu: CheckUtility, edgeID: string, negated: boolean, sprite,
                                              spriteNameRegex: string, attrName: string, change) {
        const spriteName = sprite.name;
        let eventString;
        if (attrName == "currentCostumeName") {
            eventString = CheckUtility.getEventString(CheckName.AttrChange, negated, spriteNameRegex, "costume", change);
        } else {
            eventString = CheckUtility.getEventString(CheckName.AttrChange, negated, spriteNameRegex, attrName, change);
        }
        cu.registerOnVisualChange(spriteName, eventString, edgeID, (sprite) => {
            try {
                return !negated == ModelUtil.testChange(sprite.old[attrName], sprite[attrName], change);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
        });
    }

    private static registerOnMoveAttrChange(cu: CheckUtility, edgeID: string, negated: boolean, sprite,
                                            spriteNameRegex: string, attrName: string, change) {
        const spriteName = sprite.name;
        const eventString = CheckUtility.getEventString(CheckName.AttrChange, negated, spriteNameRegex, attrName, change);
        cu.registerOnMoveEvent(spriteName, eventString, edgeID, (sprite) => {
            try {
                return !negated == ModelUtil.testChange(sprite.old[attrName], sprite[attrName], change);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
        });
    }

    /**
     * Get a method checking whether the background of the stage changed.
     * @param t Instance of the test driver.
     * @param cu Listener for checks.
     * @param edgeID Id of the parent edge of the check.
     * @param newBackground Name of the new background.
     * @param negated Whether this check is negated.
     */
    static getBackgroundChangeCheck(t: TestDriver, cu: CheckUtility, edgeID: string, negated: boolean,
                                    newBackground: string): () => boolean {
        return CheckGenerator.getAttributeComparisonCheck(t, cu, edgeID, negated, false, "Stage",
            "costume", "=", newBackground)
    }

    /**
     * Get a method checking whether an expression such as "$(Cat.x) > 25" is fulfilled.
     * @param t Instance of the test driver.
     * @param cu Listener for checks.
     * @param edgeID Id of the parent edge of the check.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     * @param expr The expression string.
     */
    static getExpressionCheck(t: TestDriver, cu: CheckUtility, edgeID: string, negated: boolean, caseSensitive: boolean,
                              expr: string) {
        let {
            expr: expression,
            varDependencies,
            attrDependencies
        } = ModelUtil.getExpressionForEval(t, caseSensitive, expr);

        let eventString = CheckUtility.getEventString(CheckName.Expr, negated, expr);
        this.setupDependencies(cu, eventString, edgeID, varDependencies, attrDependencies, () => {
            return !negated == eval(expression)(t);
        });
        return () => {
            return !negated == eval(expression)(t);
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
     * @param edgeID Id of the parent edge of the check.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     * @param spriteNameRegex Regex defining the sprite name.
     */
    static getTouchingEdgeCheck(t: TestDriver, cu: CheckUtility, edgeID: string, negated: boolean, caseSensitive: boolean,
                                spriteNameRegex: string) {
        const spriteName = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex).name;
        const eventString = CheckUtility.getEventString(CheckName.TouchingEdge, negated, spriteNameRegex);

        cu.registerOnMoveEvent(spriteName, eventString, edgeID, (sprite) => {
            return !negated == sprite.isTouchingEdge();
        })

        return () => {
            const sprites = t.getSprites(sprite => sprite.name == spriteName, false);
            let anyTouchingEdge = false;
            for (let i = 0; i < sprites.length; i++) {
                if (sprites[i].visible && sprites[i].isTouchingEdge()) {
                    anyTouchingEdge = true;
                    break;
                }
            }
            return !negated == anyTouchingEdge;
        }
    }
}
