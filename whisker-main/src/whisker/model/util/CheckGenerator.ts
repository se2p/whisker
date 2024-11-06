import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "./CheckUtility";
import {ModelUtil} from "./ModelUtil";
import {
    ComparisonNotKnownError,
    ErrorForAttribute,
    ErrorForVariable,
    FunctionEvalError,
    RGBRangeError
} from "./ModelError";
import {Randomness} from "../../utils/Randomness";
import {ArgType, CheckName} from "../components/Check";
import Sprite from "../../../vm/sprite";
import Variable from "../../../vm/variable";

// todo functions for clones
// todo functions for counting check "wiederhole 10 mal"
// todo check plays a sound...
// todo check when getting message
// todo key check for 'any key' test

function unsafeRead(s: Sprite, property: ArgType): string {
    return (s as any)[String(property)];
}

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
    static getKeyDownCheck(t: TestDriver, cu: CheckUtility, negated: boolean, key: ArgType): () => boolean {
        return () => {
            return !negated == cu.isKeyDown(String(key));
        };
    }

    /**
     * Get a method for checking whether a sprite was clicked.
     * @param t Instance of the test driver.
     * @param pSpriteName The name of the sprite.
     * @param negated Whether this check is negated.
     */
    static getSpriteClickedCheck(t: TestDriver, negated: boolean, pSpriteName: ArgType): () => boolean {
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        return () => {
            const sprites = t.getSprites((sprite: Sprite) => sprite.name === spriteName, false);
            const anyTouchingMouse = sprites.some((s: Sprite) => s.visible && t.isMouseDown() && s.isTouchingMouse());
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
     * @param pSpriteName The name of the sprite having the variable.
     * @param varName The name of the variable.
     * @param comparison Mode of comparison, e.g. =, <, >, <=, >=
     * @param varValue Value to compare to the variable's current value.
     * @param negated Whether this check is negated.
     */
    static getVariableComparisonCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string,
                                      negated: boolean, pSpriteName: ArgType,
                                      varName: ArgType, comparison: ArgType, varValue: ArgType): () => boolean {
        const {
            sprite: foundSprite,
            variable: foundVar
        } = ModelUtil.checkVariableExistence(t, ModelUtil.checkSpriteExistence(t, pSpriteName), varName);
        const spriteName = foundSprite.name;
        const variableName = foundVar.name;
        const eventString = CheckUtility.getEventString(CheckName.VarComp, negated, pSpriteName, varName,
            comparison, varValue);

        if (comparison != "==" && comparison != "=" && comparison != ">" && comparison != ">="
            && comparison != "<" && comparison != "<=") {
            throw new ComparisonNotKnownError(comparison);
        }

        function check() {
            const sprite = t.getSprites((sprite: Sprite) => sprite.name.includes(spriteName), false)[0];
            const variable = sprite.getVariable(variableName);
            try {
                return !negated == ModelUtil.compare(variable.value, varValue, comparison);
            } catch (e) {
                throw new ErrorForVariable(pSpriteName, varName, e);
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
     * @param pSpriteName The name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param comparison  Mode of comparison, e.g. =, <, >, <=, >=
     * @param attrValue Value to compare to the attribute's current value.
     * @param negated Whether this check is negated.
     */
    static getAttributeComparisonCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string,
                                       negated: boolean, pSpriteName: ArgType,
                                       attrName: ArgType, comparison: ArgType, attrValue: ArgType): () => boolean {
        if (attrName == "costume" || attrName == "currentCostume") {
            attrName = "currentCostumeName";
        }
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        ModelUtil.checkAttributeExistence(t, spriteName, attrName);

        if (comparison != "==" && comparison != "=" && comparison != ">" && comparison != ">=" && comparison != "<"
            && comparison != "<=") {
            throw new ComparisonNotKnownError(comparison);
        }

        // on movement listener
        if (attrName == "x" || attrName == "y") {
            CheckGenerator._attributeCompOnMove(cu, edgeLabel, graphID, negated, spriteName, pSpriteName, attrName,
                comparison, String(attrValue));
        } else if (["size", "direction", "effect", "visible", "currentCostumeName", "rotationStyle"].includes(attrName as string)) {
            CheckGenerator._attributeCompOnVisual(cu, edgeLabel, graphID, negated, spriteName, pSpriteName, attrName as string,
                comparison, attrValue);
        } else if (attrName == "sayText") {
            CheckGenerator._attributeCompOnOutput(cu, edgeLabel, graphID, negated, spriteName, pSpriteName,
                attrName, comparison, attrValue);
        }

        // without movement
        return () => {
            const sprites: Sprite[] = t.getSprites((s: Sprite) => s.name == spriteName, false)[0].getClones(true);
            try {
                for (const s of sprites) {
                    if (ModelUtil.compare(unsafeRead(s, attrName), attrValue, comparison)) {
                        return !negated;
                    }
                }
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
            return negated;
        };
    }

    private static _attributeCompOnVisual(cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                          spriteName: string, pSpriteName: ArgType, attrName: string,
                                          comparison: string, attrValue: ArgType): void {
        let eventString: string;
        if (attrName == "currentCostumeName") {
            eventString = CheckUtility.getEventString(CheckName.AttrComp, negated, pSpriteName, "costume",
                comparison, attrValue);
        } else {
            eventString = CheckUtility.getEventString(CheckName.AttrComp, negated, pSpriteName, attrName,
                comparison, attrValue);
        }

        cu.registerOnVisualChange(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            try {
                return !negated == ModelUtil.compare(unsafeRead(sprite, attrName), attrValue, comparison);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
        });
    }

    private static _attributeCompOnMove(cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                        spriteName: string, pSpriteName: ArgType, attrName: string,
                                        comparison: string, attrValue: string): void {
        const eventString = CheckUtility.getEventString(CheckName.AttrComp, negated, pSpriteName, attrName,
            comparison, attrValue);
        cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            try {
                return !negated == ModelUtil.compare(unsafeRead(sprite, attrName), attrValue, comparison);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
        });
    }

    private static _attributeCompOnOutput(cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                          spriteName: string, pSpriteName: ArgType, attrName: string,
                                          comparison: string, attrValue: ArgType): void {
        const eventString = CheckUtility.getEventString(CheckName.AttrComp, negated, pSpriteName, attrName,
            comparison, attrValue);
        cu.registerOutput(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            try {
                return !negated == ModelUtil.compare(unsafeRead(sprite, attrName), attrValue, comparison);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
        });
    }

    /**
     * Get a method checking another method.
     * @param t Instance of the test driver.
     * @param cu Listener for checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param negated Whether it should be negated.
     * @param pF the function as a string.
     */
    static getFunctionCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                            pF: ArgType): () => boolean {
        let fun: (t: TestDriver) => boolean;
        const f = String(pF);

        if (f == "true" && negated || f == "false" && !negated) {
            return () => {
                return false;
            };
        }

        if (f == "true" && !negated || f == "false" && negated) {
            return () => {
                return true;
            };
        }

        try {
            fun = eval(f);
        } catch (e) {
            throw new FunctionEvalError(e);
        }

        const dependencies = ModelUtil.getDependencies(f);
        const eventString = CheckUtility.getEventString(CheckName.Function, negated, f);
        this._setupDependencies(cu, eventString, edgeLabel, graphID, dependencies.varDependencies,
            dependencies.attrDependencies, () => {
                return !negated == fun(t);
            });
        return () => {
            return !negated == fun(t);
        };
    }

    private static _setupDependencies(cu: CheckUtility, eventString: string, edgeLabel: string, graphID: string,
                                      varDependencies: { spriteName: string, varName: string }[],
                                      attrDependencies: { spriteName: string, attrName: string }[],
                                      predicate: (...sprite: Sprite[]) => boolean) {
        varDependencies.forEach(dependency => {
            cu.registerVarEvent(dependency.varName, eventString, edgeLabel, graphID, predicate);
        });

        attrDependencies.forEach(({spriteName, attrName}) => {
            if (attrName == "x" || attrName == "y") {
                cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, predicate);
            } else if (["size", "direction", "effect", "visible", "currentCostumeName", "rotationStyle"].includes(attrName)) {
                cu.registerOnVisualChange(spriteName, eventString, edgeLabel, graphID, predicate);
            } else if (attrName == "sayText") {
                cu.registerOutput(spriteName, eventString, edgeLabel, graphID, predicate);
            }
        });
    }

    /**
     * Get a method checking whether two sprites are touching.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param pSpriteName1 The name of the first sprite.
     * @param pSpriteName2 The name of the second sprite.
     * @param negated Whether this check is negated.

     */
    static getSpriteTouchingCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                  pSpriteName1: ArgType, pSpriteName2: ArgType): () => boolean {
        const spriteName1 = ModelUtil.checkSpriteExistence(t, pSpriteName1).name;
        const spriteName2 = ModelUtil.checkSpriteExistence(t, pSpriteName2).name;

        const eventString = CheckUtility.getEventString(CheckName.SpriteTouching, negated, pSpriteName1,
            pSpriteName2);
        // on movement check sprite touching other sprite, sprite is given by movement event caller and
        // isTouchingSprite is checking all clones with spriteName2
        cu.registerOnMoveEvent(spriteName1, eventString, edgeLabel, graphID, (sprite) => {
            return !negated == sprite.isTouchingSprite(spriteName2);
        });

        // only test touching if the sprite did not move as otherwise the model was already notified and test it,
        // also test clones of spriteName1
        return () => {
            const sprites = t.getSprites((s: Sprite) => s.name === spriteName1, false);
            const anyTouchingSprite = sprites.some((s: Sprite) => s.visible && s.isTouchingSprite(spriteName2));
            return !negated == anyTouchingSprite;
        };
    }

    /**
     * Get a method whether a sprite touches a color.

     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param pSpriteName The name of the sprite.
     * @param pR RGB red color value.
     * @param pG RGB green color value.
     * @param pB RGB blue color value.
     * @param negated Whether this check is negated.
     */
    static getSpriteColorTouchingCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string,
                                       negated: boolean, pSpriteName: ArgType,
                                       pR: ArgType, pG: ArgType, pB: ArgType): () => boolean {
        const r = ModelUtil.testNumber(pR);
        const g = ModelUtil.testNumber(pG);
        const b = ModelUtil.testNumber(pB);
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
            throw new RGBRangeError();
        }
        const eventString = CheckUtility.getEventString(CheckName.SpriteColor, negated, pSpriteName, r, g, b);
        // on movement check sprite color
        cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            return !negated == sprite.isTouchingColor([r, g, b]);
        });

        // only test touching if the sprite did not move as otherwise the model was already notified and test it
        // also test clones of spriteName
        return () => {
            const sprites = t.getSprites((s: Sprite) => s.name === spriteName, false);
            const anyTouchingColor = sprites.some((s: Sprite) => s.visible && s.isTouchingColor([r, g, b]));
            return !negated == anyTouchingColor;
        };
    }

    /**
     * Get a method checking whether a sprite has the given output included in their sayText.
     * @param t Instance of the test driver.
     * @param cu  Listener for the checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param pSpriteName The name of the sprite.
     * @param output Output to say.
     * @param negated Whether this check is negated.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    static getOutputOnSpriteCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                  caseSensitive: boolean, pSpriteName: ArgType, output: ArgType): () => boolean {
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        const expression = ModelUtil.getExpressionForEval(t, caseSensitive, output).expr;

        const eventString = CheckUtility.getEventString(CheckName.Output, negated, pSpriteName, output);
        cu.registerOutput(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            const sayText = !caseSensitive ? sprite.sayText?.toLowerCase() : sprite.sayText;
            return !negated == (sayText && sayText.includes(eval(expression)(t)));
        });
        return () => {
            const sprites = t.getSprites((sprite: Sprite) => sprite.name === spriteName, false);
            const anySayText = sprites
                .some((s: Sprite) => {
                    if (!s.sayText) {
                        return false;
                    }

                    const sayText = !caseSensitive ? s.sayText.toLowerCase() : s.sayText;
                    return sayText.includes(eval(expression)(t));
                });
            return !negated == anySayText;
        };
    }

    /**
     * Get a method checking whether a variable value of a sprite changed.
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param edgeLabel Label of the parent edge of the check.
     * @param graphID ID of the parent graph of the check.
     * @param pSpriteName The name of the sprite having the variable.
     * @param varName The name of the variable.
     * @param change For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same-.
     * "+=" for increase or staying the same."-=" for decrease or staying the same. For a numerical
     * change by an exact value '+<number>' or '<number>' or '-<number>'.
     * @param negated Whether this check is negated.
     */
    static getVariableChangeCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                  pSpriteName: ArgType, varName: ArgType, change: ArgType): () => boolean {
        let sprite = ModelUtil.checkSpriteExistence(t, pSpriteName);
        const {
            sprite: foundSprite,
            variable: foundVar
        } = ModelUtil.checkVariableExistence(t, sprite, varName);
        sprite = foundSprite;
        const spriteName = sprite.name;
        const variableName = foundVar.name;
        const eventString = CheckUtility.getEventString(CheckName.VarChange, negated, pSpriteName, varName, change);

        function check(): boolean {
            const sprite: Sprite = t.getSprites((sprite: Sprite) => sprite.name.includes(spriteName), false)[0];
            const variable: Variable = sprite.getVariable(variableName);
            try {
                return !negated == ModelUtil.testChange(variable.old.value, variable.value, change);
            } catch (e) {
                throw new ErrorForVariable(pSpriteName, varName, e);
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
     * @param pSpriteName The name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param change For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same-.
     * "+=" for increase or staying the same."-=" for decrease or staying the same. For a numerical
     * change by an exact value '+<number>' or '<number>' or '-<number>'.
     * @param negated Whether this check is negated.
     */
    static getAttributeChangeCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                   pSpriteName: ArgType, attrName: ArgType, change: ArgType): () => boolean {
        if (attrName == "costume" || attrName == "currentCostume") {
            attrName = "currentCostumeName";
        }
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        ModelUtil.checkAttributeExistence(t, spriteName, attrName);

        // The attribute sayText cannot be used as an AttributeChange predicate with any other operand than =, as it
        // is not a numerical value and e.g. an increase (+) on a string is not desired to be representable. An
        // AttributeChange predicate with sayText fails in the execution with e.g.
        // -> Error: Sprite1.sayText: Is not a numerical value to compare: Hello!
        // Therefore, no instrumentation is done here for the sayText attribute.
        if (attrName == "x" || attrName == "y") {
            CheckGenerator._registerOnMoveAttrChange(cu, edgeLabel, graphID, negated, spriteName, pSpriteName,
                attrName, change);
        } else if (attrName == "size" || attrName == "direction" || attrName == "effect" || attrName == "visible"
            || attrName == "currentCostumeName" || attrName == "rotationStyle") {
            CheckGenerator._registerOnVisualAttrChange(cu, edgeLabel, graphID, negated, spriteName, pSpriteName,
                attrName, change);
        }

        return () => {
            const sprites = t.getSprite(spriteName).getClones(true);
            try {
                for (const s of sprites) {
                    if (ModelUtil.testChange(s.old[attrName], s[attrName], change)) {
                        return !negated;
                    }
                }
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
            return negated;
        };
    }

    private static _registerOnVisualAttrChange(cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                               spriteName: string, pSpriteName: ArgType, attrName: string, change: ArgType) {
        let eventString: string;
        if (attrName == "currentCostumeName") {
            eventString = CheckUtility.getEventString(CheckName.AttrChange, negated, pSpriteName, "costume", change);
        } else {
            eventString = CheckUtility.getEventString(CheckName.AttrChange, negated, pSpriteName, attrName, change);
        }
        cu.registerOnVisualChange(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            try {
                return !negated == ModelUtil.testChange(unsafeRead(sprite.old, attrName), unsafeRead(sprite, attrName), change);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
            }
        });
    }

    private static _registerOnMoveAttrChange(cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                             spriteName: string, pSpriteName: ArgType, attrName: string, change: ArgType) {
        const eventString = CheckUtility.getEventString(CheckName.AttrChange, negated, pSpriteName, attrName, change);
        cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            try {
                return !negated == ModelUtil.testChange(unsafeRead(sprite.old, attrName), unsafeRead(sprite, attrName), change);
            } catch (e) {
                throw new ErrorForAttribute(pSpriteName, attrName, e);
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
                                    newBackground: ArgType): () => boolean {
        // without movement
        return () => {
            const stage = t.getStage();
            try {
                if (ModelUtil.compare(stage["currentCostumeName"], newBackground, "=")) {
                    return !negated;
                }
            } catch (e) {
                // should not even happen...
                throw new ErrorForAttribute("Stage", "costume", e);
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
     * @param expr The expression string.
     */
    static getExpressionCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string,
                              negated: boolean, expr: ArgType): () => boolean {
        const e = ModelUtil.getExpressionForEval(t, false/*TODO caseSensitive Flag here*/, expr);
        const eventString = CheckUtility.getEventString(CheckName.Expr, negated, expr);
        const check: () => boolean = () => !negated == eval(e.expr)(t);
        this._setupDependencies(cu, eventString, edgeLabel, graphID, e.varDependencies, e.attrDependencies, check);
        return check;
    }

    /**
     * Get a method that checks whether a random number is greater than the probability given. For randomness...
     * @param t Instance of the test driver.
     * @param negated Whether this check is negated.
     * @param probability The probability e.g. 0.5.
     */
    static getProbabilityCheck(t: TestDriver, negated: boolean, probability: ArgType): () => boolean {
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
    static getTimeElapsedCheck(t: TestDriver, negated: boolean, timeInMS: ArgType): () => boolean {
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
    static getTimeBetweenCheck(t: TestDriver, negated: boolean, timeInMS: ArgType): (steps: number) => boolean {
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
    static getTimeAfterEndCheck(t: TestDriver, negated: boolean, timeInMS: ArgType):
        (stepsSinceLastTransition: number, stepsSinceEnd: number) => boolean {
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
     * @param pSpriteName The sprite name.
     * @param clonesVisible Whether the clones have to be visible.
     * @param comparison Mode of comparison, e.g. =, <, >, <=, >=
     * @param nbr Number of clones.
     */
    static getNumberOfClonesCheck(t: TestDriver, negated: boolean, clonesVisible: boolean,
                                  pSpriteName: ArgType, comparison: ArgType, nbr: ArgType): () => boolean {
        const toCheckNbr = ModelUtil.testNumber(nbr);
        const sprite = ModelUtil.checkSpriteExistence(t, pSpriteName);
        const spriteName = sprite.name;

        if (comparison != "==" && comparison != "=" && comparison != ">" && comparison != ">=" && comparison != "<"
            && comparison != "<=") {
            throw new ComparisonNotKnownError(comparison);
        }

        let spriteCondition: (sprite: Sprite) => boolean;
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
     * @param pSpriteName The sprite name.
     * @param verticalEdge Whether the vertical edges should be considered for the check.
     * @param horizEdge Whether the horizontal edges should be considered for the check.
     * */
    static getTouchingEdgeCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                                pSpriteName: ArgType, verticalEdge = true, horizEdge = true): () => boolean {
        if (!verticalEdge && !horizEdge) {
            throw new Error("Check touching edge not valid. Either vertical, horizontal or both.");
        }
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;

        let check = (sprite: Sprite) =>
            sprite.visible && sprite.isTouchingEdge();
        let eventString = CheckUtility.getEventString(CheckName.TouchingEdge, negated, pSpriteName);
        if (!verticalEdge) {
            check = (sprite: Sprite) => sprite.visible && sprite.isTouchingHorizEdge();
            eventString = CheckUtility.getEventString(CheckName.TouchingHorizEdge, negated, pSpriteName);
        } else if (!horizEdge) {
            check = sprite => sprite.visible && sprite.isTouchingVerticalEdge();
            eventString = CheckUtility.getEventString(CheckName.TouchingVerticalEdge, negated, pSpriteName);
        }

        cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            return !negated == check(sprite);
        });
        return () => {
            const sprites = t.getSprite(spriteName).getClones(true);
            const anyTouchingEdge = sprites.some(check);
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
     * @param pSpriteName The sprite name.
     * @param attrName Attribute name, x or y.
     */
    static getRandomValueCheck(t: TestDriver, cu: CheckUtility, edgeLabel: string, graphID: string, negated: boolean,
                               pSpriteName: ArgType, attrName: ArgType): () => boolean {
        if (attrName != "x" && attrName != "y") {
            throw new Error("Random value check only implemented for x and y value at the moment...");
        }
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        const oldValues: unknown[] = [];

        // updates value on move
        const check = (sprite: Sprite) => {
            // ignore it the value did not change
            if (oldValues.length && oldValues.length > 0 && oldValues[oldValues.length - 1] == sprite[attrName]) {
                return !negated;
            }
            //TODO: fix this code. Here the value is ignored if it stays the same but in the check below it can only be
            // a not random value if the last three consecutive entries in the list are the same which is made impossible
            // by the three lines above

            if (oldValues.length && oldValues.length > 1 && oldValues.indexOf(sprite[attrName]) > oldValues.length - 3) {
                oldValues.push(sprite[attrName]);
                return negated;
            }
            oldValues.push(sprite[attrName]);
            return !negated;
        };
        const eventString = CheckUtility.getEventString(CheckName.RandomValue, negated, pSpriteName, attrName);
        cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, check);

        return () => {
            const sprites = t.getSprite(spriteName).getClones(true);
            if (sprites.length > 1) {
                return !negated;
            }
            const currentValue = oldValues[oldValues.length - 1];

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
