import TestDriver from "../../../test/test-driver";
import {CheckListener} from "./CheckListener";
import {ProgramModel} from "../components/ProgramModel";
import {Util} from "./Util";

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
     * @param key Name of the key.
     * @param negated Whether this check is negated.
     */
    static getKeyDownCheck(negated: boolean, key: string):
        (testDriver: TestDriver, checkListener: CheckListener) => boolean {
        return function (testDriver: TestDriver, checkListener: CheckListener): boolean {
            if (checkListener.isKeyDown(key)) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Get a method for checking whether a sprite was clicked.
     * @param spriteName Name of the sprite.
     * @param negated Whether this check is negated.
     */
    static getSpriteClickedCheck(negated: boolean, spriteName: string): (testDriver: TestDriver) => boolean {
        return function (testDriver: TestDriver): boolean {
            if (testDriver.isMouseDown() && testDriver.getSprite(spriteName).isTouchingMouse()) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Get a method for checking whether a variable has a given comparison with a given value fulfilled.
     *
     * @param spriteName Name of the sprite having the variable.
     * @param varName Name of the variable.
     * @param comparison Mode of comparison, e.g. =, <, >, <=, >=
     * @param varValue Value to compare to the variable's current value.
     * @param negated Whether this check is negated.
     */
    static getVariableComparisonCheck(negated: boolean, spriteName: string, varName: string, comparison: string,
                                      varValue: string): (testDriver: TestDriver) => boolean {
        return function (testDriver: TestDriver): boolean {
            let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
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
     * @param spriteName Name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param comparison  Mode of comparison, e.g. =, <, >, <=, >=
     * @param varValue Value to compare to the variable's current value.
     * @param negated Whether this check is negated.
     */
    static getAttributeComparisonCheck(negated: boolean, spriteName: string, attrName: string, comparison: string,
                                       varValue: string): (testDriver: TestDriver) => boolean {
        return function (testDriver: TestDriver): boolean {
            let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            const value = eval('sprite.' + attrName);
            const oldValue = eval('sprite.old.' + attrName);

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
     * Get a method checking whether two sprites are touching.
     *
     * @param spriteName1 Name of the first sprite.
     * @param spriteName2 Name of the second sprite.
     * @param negated Whether this check is negated.
     */
    static getSpriteTouchingCheck(negated: boolean, spriteName1: string, spriteName2: string):
        (testDriver: TestDriver, checkListener: CheckListener) => boolean {
        return function (testDriver: TestDriver, checkListener: CheckListener): boolean {
            const areTouching = checkListener.areTouching(spriteName1, spriteName2);
            if (areTouching) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Get a method whether a sprite touches a color.
     * @param spriteName Name of the sprite.
     * @param r RGB red color value.
     * @param g RGB green color value.
     * @param b RGB blue color value.
     * @param negated Whether this check is negated.
     */
    static getSpriteColorTouchingCheck(negated: boolean, spriteName: string, r: number, g: number, b: number):
        (testDriver: TestDriver, checkListener: CheckListener) => boolean {
        return function (testDriver: TestDriver, checkListener: CheckListener): boolean {
            if (checkListener.isTouchingColor(spriteName, r, g, b)) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Get a method checking whether a sprite has the given output included in their sayText.
     * @param spriteName Name of the sprite.
     * @param output Output to say.
     * @param negated Whether this check is negated.
     */
    static getOutputOnSpriteCheck(negated: boolean, spriteName: string, output: string):
        (testDriver: TestDriver) => boolean {
        return function (testDriver: TestDriver) {
            let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];

            // todo eval the output (could also contain variables)
            if (sprite.sayText.indexOf(eval(output)) != -1) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Get a method checking whether a variable value of a sprite changed.
     * @param spriteName Name of the sprite having the variable.
     * @param varName Name of the variable.
     * @param change For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same-.
     * @param negated Whether this check is negated.
     */
    static getVariableChangeCheck(negated: boolean, spriteName: string, varName: string, change: string):
        (testDriver: TestDriver) => boolean {
        return function (testDriver: TestDriver) {
            let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
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
     * @param spriteName Name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param change For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same-.
     * @param negated Whether this check is negated.
     */
    static getAttributeChangeCheck(negated: boolean, spriteName: string, attrName: string, change: string):
        (testDriver: TestDriver) => boolean {
        return function (testDriver: TestDriver) {
            let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            const newValue = eval('sprite.' + attrName);
            const oldValue = eval('sprite.old.' + attrName);

            if ((attrName === "x" || attrName === "y") && sprite.isTouchingEdge() && newValue === oldValue
                && change != "=") {
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

    /**
     * Get a method checking whether the background of the stage changed.
     * @param newBackground Name of the new background.
     * @param negated Whether this check is negated.
     */
    static getBackgroundChangeCheck(negated: boolean, newBackground: string): (testDriver: TestDriver) => boolean {
        return function (testDriver: TestDriver) {
            // todo how to get the background
            let stage = testDriver.getStage();
            // stage.
            return negated;
        }
    }

    /**
     * Get a method starting a wait duration on the given model.
     * @param seconds Seconds to wait for.
     */
    static getWaitStarter(seconds: number):
        (testDriver: TestDriver, model: ProgramModel) => boolean {
        let milliseconds = seconds * 1000;
        let startTime = -1;
        return function (testDriver: TestDriver, model: ProgramModel) {
            // called again after the wait
            if (startTime != -1) {
                startTime = -1;
                return true;
            }

            startTime = testDriver.getRealRunTimeElapsed();
            // function for the main step of the model to evaluate whether to stop waiting
            let waitFunction = () => {
                let currentRealRunTime = testDriver.getRealRunTimeElapsed();
                return currentRealRunTime > startTime + milliseconds;
            }
            model.waitEffectStart(waitFunction);
            return false;
        };
    }
}
