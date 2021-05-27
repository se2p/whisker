import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {
    getAttributeNotFoundError,
    getChangeComparisonNotKnownError,
    getComparisonNotKnownError,
    getNotNumericalValueError, getSpriteNotFoundError
} from "./ModelError";

export abstract class Util {

    /**
     * Check the existence of a sprite.
     * @param testDriver Instance of the test driver.
     * @param spriteName Name of the sprite.
     */
    static checkSpriteExistence(testDriver: TestDriver, spriteName: string): Sprite {
        let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
        if (sprite == undefined) {
            throw getSpriteNotFoundError(spriteName);
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
            throw getAttributeNotFoundError(attrName, spriteName);
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
            throw getNotNumericalValueError("null or undefined");
        }
        if (newValue == null) {
            throw getNotNumericalValueError("null or undefined");
        }

        if (change == '=' || change == '==') {
            return oldValue == newValue;
        }
        this.testNumber(oldValue);
        this.testNumber(newValue);

        switch (change) {
            case '+':
            case '++':
                return Number(oldValue.toString()) < Number(newValue.toString());
            case '-':
            case '--':
                return Number(oldValue.toString()) > Number(newValue.toString());
            case '+=':
                return Number(oldValue.toString()) <= Number(newValue.toString());
            case '-=':
                return Number(oldValue.toString()) >= Number(newValue.toString());
            default:
                throw getChangeComparisonNotKnownError(change);
        }
    }

    /**
     * Test whether a value is a number.
     */
    static testNumber(value) {
        if (!((value != null) && (value !== '') && !isNaN(Number(value.toString())))) {
            throw getNotNumericalValueError(value);
        }
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
        this.testNumber(value1);
        this.testNumber(value2);
        value1 = Number(value1.toString());
        value2 = Number(value2.toString());

        if (comparison === ">") {
            return value1 > value2;
        } else if (comparison === "<") {
            return value1 < value2;
        } else if (comparison === "<=") {
            return value1 <= value2;
        } else if (comparison === ">=") {
            return value1 >= value2;
        }

        throw getComparisonNotKnownError(comparison);
    }
}
