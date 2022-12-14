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
// todo check when getting message
// todo key check for 'any key' test

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
        };
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
        };
    }

    /**
     * Get a method for checking whether a variable has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param spriteNameRegex Regex describing the name of the sprite having the variable.
     * @param varNameRegex Regex describing the name of the variable.
     * @param comparison Mode of comparison, e.g. =, <, >, <=, >=
     * @param varValue Value to compare to the variable's current value.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getVariableComparisonCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string,
                                      negated: boolean, caseSensitive: boolean, spriteNameRegex: string,
                                      varNameRegex: string, comparison: string, varValue: string): () => boolean {
        const {
            sprite: foundSprite,
            variable: foundVar
        } = ModelUtil.checkVariableExistence(t, caseSensitive, ModelUtil.checkSpriteExistence(t, caseSensitive,
            spriteNameRegex), varNameRegex);
        const spriteName = foundSprite.name;
        const variableName = foundVar.name;
        const eventString = CheckUtility.getEventString(CheckName.VarComp, negated, spriteNameRegex, varNameRegex,
            comparison, varValue);

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

        cu.registerVarEvent(variableName, eventString, edgeLabel, graphID, check);
        return check;
    }

    /**
     * Get a method for checking whether a sprite's attribute has a given comparison with a given value fulfilled.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param spriteNameRegex Regex describing the name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param comparison  Mode of comparison, e.g. =, <, >, <=, >=
     * @param attrValue Value to compare to the attributes's current value.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getAttributeComparisonCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string,
                                       negated: boolean, caseSensitive: boolean, spriteNameRegex: string,
                                       attrName: string, comparison: string, attrValue: string): () => boolean {
        if (attrName == "costume" || attrName == "currentCostume") {
            attrName = "currentCostumeName";
        }
        const spriteName = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex).name;
        ModelUtil.checkAttributeExistence(t, spriteName, attrName);

        if (comparison != "==" && comparison != "=" && comparison != ">" && comparison != ">=" && comparison != "<"
            && comparison != "<=") {
            throw getComparisonNotKnownError(comparison);
        }

        // on movement listener
        if (attrName == "x" || attrName == "y") {
            CheckGenerator.attributeCompOnMove(cu, edgeLabel, graphID, negated, spriteName, spriteNameRegex, attrName,
                comparison, attrValue);
        } else if (attrName == "size" || attrName == "direction" || attrName == "effect" || attrName == "visible"
            || attrName == "currentCostumeName" || attrName == "rotationStyle") {
            CheckGenerator.attributeCompOnVisual(cu, edgeLabel, graphID, negated, spriteName, spriteNameRegex, attrName,
                comparison, attrValue);
        } else if (attrName == "sayText") {
            CheckGenerator.attributeCompOnOutput(cu, edgeLabel, graphID, negated, spriteName, spriteNameRegex,
                attrName, comparison, attrValue);
        }

        // without movement
        return () => {
            const sprites = t.getSprite(spriteName).getClones(true);
            try {
                for (let i = 0; i < sprites.length; i++) {
                    if (ModelUtil.compare(sprites[i][attrName], attrValue, comparison)) {
                        return !negated;
                    }
                }
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
            return negated;
        };
    }

    private static attributeCompOnVisual(cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                         spriteName: string, spriteNameRegex: string, attrName: string,
                                         comparison: string, attrValue: string) {
        let eventString;
        if (attrName == "currentCostumeName") {
            eventString = CheckUtility.getEventString(CheckName.AttrComp, negated, spriteNameRegex, "costume",
                comparison, attrValue);
        } else {
            eventString = CheckUtility.getEventString(CheckName.AttrComp, negated, spriteNameRegex, attrName,
                comparison, attrValue);
        }

        cu.registerOnVisualChange(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            try {
                return !negated == ModelUtil.compare(sprite[attrName], attrValue, comparison);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
        });
    }

    private static attributeCompOnMove(cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                       spriteName: string, spriteNameRegex: string, attrName: string,
                                       comparison: string, attrValue: string) {
        const eventString = CheckUtility.getEventString(CheckName.AttrComp, negated, spriteNameRegex, attrName,
            comparison, attrValue);
        cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            try {
                return !negated == ModelUtil.compare(sprite[attrName], attrValue, comparison);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
        });
    }

    private static attributeCompOnOutput(cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                         spriteName: string, spriteNameRegex: string, attrName: string,
                                         comparison: string, attrValue: string) {
        const eventString = CheckUtility.getEventString(CheckName.AttrComp, negated, spriteNameRegex, attrName,
            comparison, attrValue);
        cu.registerOutput(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            try {
                return !negated == ModelUtil.compare(sprite[attrName], attrValue, comparison);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
        });
    }

    /**
     * Get a method checking another method.
     * @param t Instance of the test driver.
     * @param cu Listener for checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param caseSensitive Whether the sprite and variable names are case sensitive.
     * @param negated Whether it should be negated.
     * @param f the function as a string.
     */
    static getFunctionCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                            caseSensitive: boolean, f: string): () => boolean {
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
        this.setupDependencies(cu, eventString, edgeLabel, graphID, varDependencies, attrDependencies, () => {
            return !negated == fun(t);
        });
        return () => {
            return !negated == fun(t);
        };
    }

    private static setupDependencies(cu: CheckUtility, eventString: string, edgeLabel: string, graphID: string,
                                     varDependencies, attrDependencies, predicate: (...sprite) => boolean) {
        if (varDependencies.length > 0) {
            varDependencies.forEach(({spriteName, varName}) => {
                cu.registerVarEvent(varName, eventString, edgeLabel, graphID, predicate);
            });
        }
        if (attrDependencies.length > 0) {
            attrDependencies.forEach(({spriteName, attrName}) => {
                if (attrName == "x" || attrName == "y") {
                    cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, predicate);
                } else if (attrName == "size" || attrName == "direction" || attrName == "effect" || attrName == "visible"
                    || attrName == "currentCostumeName" || attrName == "rotationStyle") {
                    cu.registerOnVisualChange(spriteName, eventString, edgeLabel, graphID, predicate);
                } else if (attrName == "sayText") {
                    cu.registerOutput(spriteName, eventString, edgeLabel, graphID, predicate);
                }
            });
        }
    }

    /**
     * Get a method checking whether two sprites are touching.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param spriteName1Regex  Regex describing the name of the first sprite.
     * @param spriteName2Regex  Regex describing the name of the second sprite.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getSpriteTouchingCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                  caseSensitive: boolean, spriteName1Regex: string,
                                  spriteName2Regex: string): () => boolean {
        const spriteName1 = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteName1Regex).name;
        const spriteName2 = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteName2Regex).name;

        const eventString = CheckUtility.getEventString(CheckName.SpriteTouching, negated, spriteName1Regex,
            spriteName2Regex);
        // on movement check sprite touching other sprite, sprite is given by movement event caller and
        // isTouchingSprite is checking all clones with spriteName2
        cu.registerOnMoveEvent(spriteName1, eventString, edgeLabel, graphID, (sprite) => {
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
        };
    }

    /**
     * Get a method whether a sprite touches a color.

     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param spriteNameRegex  Regex describing the name of the sprite.
     * @param r RGB red color value.
     * @param g RGB green color value.
     * @param b RGB blue color value.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getSpriteColorTouchingCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string,
                                       negated: boolean, caseSensitive: boolean,
                                       spriteNameRegex: string, r: number, g: number, b: number): () => boolean {
        const spriteName = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex).name;
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
            throw getRGBRangeError();
        }
        const eventString = CheckUtility.getEventString(CheckName.SpriteColor, negated, spriteNameRegex, r, g, b);
        // on movement check sprite color
        cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, (sprite) => {
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
        };
    }

    /**
     * Get a method checking whether a sprite has the given output included in their sayText.
     * @param t Instance of the test driver.
     * @param cu  Listener for the checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param spriteNameRegex  Regex describing the name of the sprite.
     * @param output Output to say.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getOutputOnSpriteCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                  caseSensitive: boolean, spriteNameRegex: string, output: string): () => boolean {
        const spriteName = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex).name;
        const expression = ModelUtil.getExpressionForEval(t, caseSensitive, output).expr;

        const eventString = CheckUtility.getEventString(CheckName.Output, negated, spriteNameRegex, output);
        cu.registerOutput(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            let sayText = !caseSensitive ? sprite.sayText.toLowerCase() : sprite.sayText;
            return !negated == (sayText && sayText.indexOf(eval(expression)(t)) != -1);
        });
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
        };
    }

    /**
     * Get a method checking whether a variable value of a sprite changed.
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param spriteNameRegex Regex describing the name of the sprite having the variable.
     * @param varNameRegex Regex describing the name of the variable.
     * @param change For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same-.
     * "+=" for increase or staying the same."-=" for decrease or staying the same. For a numerical
     * change by an exact value '+<number>' or '<number>' or '-<number>'.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getVariableChangeCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                  caseSensitive: boolean, spriteNameRegex: string, varNameRegex: string,
                                  change): () => boolean {
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

        cu.registerVarEvent(variableName, eventString, edgeLabel, graphID, check);
        return check;
    }

    /**
     * Get a method checking whether an attribute of a sprite changed.
     * Attributes: checks, x, y, pos , direction, visible, size, currentCostume, this.volume, layerOrder, sayText
     * (only = allowed);
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param spriteNameRegex  Regex describing the name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param change For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same-.
     * "+=" for increase or staying the same."-=" for decrease or staying the same. For a numerical
     * change by an exact value '+<number>' or '<number>' or '-<number>'.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getAttributeChangeCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string,
                                   negated: boolean, caseSensitive: boolean,
                                   spriteNameRegex: string, attrName: string, change): () => boolean {
        if (attrName == "costume" || attrName == "currentCostume") {
            attrName = "currentCostumeName";
        }
        const spriteName = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex).name;
        ModelUtil.checkAttributeExistence(t, spriteName, attrName);

        // The attribute sayText cannot be used as an AttributeChange predicate with any other operand than =, as it
        // is not a numerical value and e.g. an increase (+) on a string is not desired to be representable. An
        // AttributeChange predicate with sayText fails in the execution with e.g.
        // -> Error: Sprite1.sayText: Is not a numerical value to compare: Hello!
        // Therefore no instrumentation is done here for the sayText attribute.
        if (attrName == "x" || attrName == "y") {
            CheckGenerator.registerOnMoveAttrChange(cu, edgeLabel, graphID, negated, spriteName, spriteNameRegex,
                attrName, change);
        } else if (attrName == "size" || attrName == "direction" || attrName == "effect" || attrName == "visible"
            || attrName == "currentCostumeName" || attrName == "rotationStyle") {
            CheckGenerator.registerOnVisualAttrChange(cu, edgeLabel, graphID, negated, spriteName, spriteNameRegex,
                attrName, change);
        }

        return () => {
            const sprites = t.getSprite(spriteName).getClones(true);
            try {
                for (let i = 0; i < sprites.length; i++) {
                    if (ModelUtil.testChange(sprites[i].old[attrName], sprites[i][attrName], change)) {
                        return !negated;
                    }
                }
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
            return negated;
        };
    }

    private static registerOnVisualAttrChange(cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                              spriteName: string, spriteNameRegex: string, attrName: string, change) {
        let eventString;
        if (attrName == "currentCostumeName") {
            eventString = CheckUtility.getEventString(CheckName.AttrChange, negated, spriteNameRegex, "costume", change);
        } else {
            eventString = CheckUtility.getEventString(CheckName.AttrChange, negated, spriteNameRegex, attrName, change);
        }
        cu.registerOnVisualChange(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            try {
                return !negated == ModelUtil.testChange(sprite.old[attrName], sprite[attrName], change);
            } catch (e) {
                throw getErrorForAttribute(spriteNameRegex, attrName, e.message);
            }
        });
    }

    private static registerOnMoveAttrChange(cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                            spriteName: string, spriteNameRegex: string, attrName: string, change) {
        const eventString = CheckUtility.getEventString(CheckName.AttrChange, negated, spriteNameRegex, attrName, change);
        cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, (sprite) => {
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
     * @param edgeLabel Label of the parent edge of the check.
     * @param newBackground Name of the new background.
     * @param negated Whether this check is negated.
     */
    static getBackgroundChangeCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, negated: boolean,
                                    newBackground: string): () => boolean {
        // without movement
        return () => {
            const stage = t.getStage();
            try {
                if (ModelUtil.compare(stage["currentCostumeName"], newBackground, "=")) {
                    return !negated;
                }
            } catch (e) {
                // should not even happen...
                throw getErrorForAttribute("Stage", "costume", e.message);
            }
            return negated;
        };
    }

    /**
     * Get a method checking whether an expression such as "$(Cat.x) > 25" is fulfilled.
     * @param t Instance of the test driver.
     * @param cu Listener for checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     * @param expr The expression string.
     */
    static getExpressionCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                              caseSensitive: boolean, expr: string) {
        let {
            expr: expression,
            varDependencies,
            attrDependencies
        } = ModelUtil.getExpressionForEval(t, caseSensitive, expr);

        let eventString = CheckUtility.getEventString(CheckName.Expr, negated, expr);
        this.setupDependencies(cu, eventString, edgeLabel, graphID, varDependencies, attrDependencies, () => {
            return !negated == eval(expression)(t);
        });
        return () => {
            return !negated == eval(expression)(t);
        };
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
        };
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
        };
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
        };
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
        };
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
        };
    }

    /**
     * Get a method to check whether a sprite is touching an edge.
     * @param t Test driver.
     * @param cu Listener for checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     * @param spriteNameRegex Regex defining the sprite name.
     * @param verticalEdge Whether the vertical edges should be considered for the check.
     * @param horizEdge Whether the horizontal edges should be considered for the check.
     * */
    static getTouchingEdgeCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                caseSensitive: boolean, spriteNameRegex: string, verticalEdge = true,
                                horizEdge = true) {
        if (!verticalEdge && !horizEdge) {
            throw new Error("Check touching edge not valid. Either vertical, horizontal or both.");
        }
        const spriteName = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex).name;

        let check = sprite => sprite.visible && sprite.isTouchingEdge();
        let eventString = CheckUtility.getEventString(CheckName.TouchingEdge, negated, spriteNameRegex);
        if (!verticalEdge) {
            check = sprite => sprite.visible && sprite.isTouchingHorizEdge();
            eventString = CheckUtility.getEventString(CheckName.TouchingHorizEdge, negated, spriteNameRegex);
        } else if (!horizEdge) {
            check = sprite => sprite.visible && sprite.isTouchingVerticalEdge();
            eventString = CheckUtility.getEventString(CheckName.TouchingVerticalEdge, negated, spriteNameRegex);
        }

        cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            return !negated == check(sprite);
        });
        return () => {
            const sprites = t.getSprite(spriteName).getClones(true);
            let anyTouchingEdge = false;
            for (let i = 0; i < sprites.length; i++) {
                if (check(sprites[i])) {
                    anyTouchingEdge = true;
                    break;
                }
            }
            return !negated == anyTouchingEdge;
        };
    }

    /**
     * Check whether a sprite is set to (pseudo) random x or y positions (new position on move event is not equal to
     * any of the last two positions). Checks only if only one rendered target of a sprite is visible.
     * @param t Instance of the test driver.
     * @param cu Listener for checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     * @param spriteNameRegex Regex defining the sprite name.
     * @param attrName Attribute name, x or y.
     */
    static getRandomValueCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                               caseSensitive: boolean, spriteNameRegex: string, attrName: string) {
        const spriteName = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteNameRegex).name;

        if (attrName != "x" && attrName != "y") {
            throw new Error("Random value check only implemented for x and y value at the moment...");
        }

        let oldValues = [];

        // updates value on move
        let check = (sprite) => {
            // ignore it the value did not change
            if (oldValues.length && oldValues.length > 0 && oldValues[oldValues.length - 1] == sprite[attrName]) {
                return !negated;
            }

            if (oldValues.length && oldValues.length > 1 && oldValues.indexOf(sprite[attrName]) > oldValues.length - 3) {
                oldValues.push(sprite[attrName]);
                return negated;
            }
            oldValues.push(sprite[attrName]);
            return !negated;
        };
        const eventString = CheckUtility.getEventString(CheckName.RandomValue, negated, spriteNameRegex, attrName);
        cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, check);

        return () => {
            const sprites = t.getSprite(spriteName).getClones(true);
            if (sprites.length > 1) {
                return !negated;
            }
            let currentValue = oldValues[oldValues.length - 1];

            // the current value is on the last index of the list (by on moved set), if the previous two are also
            // the same value it is not random
            if (oldValues.length > 2 && currentValue == oldValues[oldValues.length - 2]
                && currentValue == oldValues[oldValues.length - 3]) {
                return negated;
            }
            return !negated;
        };
    }
}
