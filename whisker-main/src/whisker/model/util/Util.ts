import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";

export abstract class Util {

    /**
     * Check the existence of a sprite.
     * @param testDriver Instance of the test driver.
     * @param spriteName Name of the sprite.
     */
    static checkSpriteExistence(testDriver: TestDriver, spriteName: string): Sprite {
        let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
        if (sprite == undefined) {
            throw new Error("Sprite not existing with name '" + spriteName + "'");
        }
        return sprite;
    }

    /**
     * Check the attribute name.
     * @private
     */
    static checkAttributeExistence(testDriver: TestDriver, spriteName: string, attrName: string) {
        try {
            let sprite = Util.checkSpriteExistence(testDriver, spriteName);
            eval("sprite." + attrName);
        } catch (e) {
            throw new Error("Attribute " + attrName + " is not defined on sprite " + spriteName + ".");
        }
    }

    /**
     * Test whether a value changed.
     * @param oldValue Old value.
     * @param newValue New value.
     * @param change For increase '+' or '++'. For decrease '-' or '--'. For no change '=' or '=='.
     * "+=" for increase or staying the same."-=" for decrease or staying the same.
     */
    static testChange(oldValue, newValue, change) {
        if (oldValue == null) {
            throw new Error("Test change: old value not defined");
        }
        if (newValue == null) {
            throw new Error("Test change: new value not defined");
        }

        switch (change) {
            case '+':
            case '++':
                if (!this.testNumber(oldValue) || !this.testNumber(newValue)) {
                    throw new Error("Effect failed: not a numerical value in variable");
                }
                return oldValue < newValue;
            case '-':
            case '--':
                if (!this.testNumber(oldValue) || !this.testNumber(newValue)) {
                    throw new Error("Effect failed: not a numerical value in");
                }
                return oldValue > newValue;
            case '=':
            case'==':
                return oldValue == newValue;
            case '+=':
                if (!this.testNumber(oldValue) || !this.testNumber(newValue)) {
                    throw new Error("Effect failed: not a numerical value in variable");
                }
                return oldValue <= newValue;
            case '-=':
                if (!this.testNumber(oldValue) || !this.testNumber(newValue)) {
                    throw new Error("Effect failed: not a numerical value in variable");
                }
                return oldValue >= newValue;
            default:
                throw new Error("Value Change Testing: Mode of change not known.");
        }
    }

    /**
     * Test whether a value is a number.
     */
    static testNumber(value) {
        return ((value != null) && (value !== '') && !isNaN(Number(value.toString())));
    }

    /**
     * Compare to values to each other.
     * @param value1 Value on the left side of the comparison equation.
     * @param value2 Value on the right side of the comparison equation.
     * @param comparison Comparison mode, =|==, <, <=, >=, >
     */
    static compare(value1, value2, comparison) {
        if (comparison === "=" || comparison === "==") {
            if (value1 == "true") {
                value1 = true;
            } else if (value1 == "false") {
                value1 = false;
            }
            if (value2 == "true") {
                value2 = true;
            } else if (value2 == "false") {
                value2 = false;
            }
            return value1 == value2;
        }
        if (!this.testNumber(value1) || !this.testNumber(value2)) {
            throw new Error("Condition failed: not a numerical value in ");
        }
        if (comparison === ">") {
            return value1 > value2;
        } else if (comparison === "<") {
            return value1 < value2;
        } else if (comparison === "<=") {
            return value1 <= value2;
        } else if (comparison === ">=") {
            return value1 >= value2;
        }

        throw new Error("Value Comparison Testing: Mode of comparison not known.");
    }
}
