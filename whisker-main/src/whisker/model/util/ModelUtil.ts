import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {
    geExprEvalError,
    getAttributeNotFoundError,
    getChangeComparisonNotKnownError,
    getComparisonNotKnownError,
    getEmptyExpressionError,
    getExpressionEndTagMissingError,
    getExpressionEnterError,
    getNotANumericalValueError,
    getSpriteNotFoundError,
    getVariableNotFoundError
} from "./ModelError";
import Variable from "../../../vm/variable";

export abstract class ModelUtil {

    /**
     * Check the existence of a sprite.
     * @param testDriver Instance of the test driver.
     * @param caseSensitive Whether the names should be checked with case sensitivity or not.
     * @param spriteName Name of the sprite.
     */
    static checkSpriteExistence(testDriver: TestDriver, caseSensitive: boolean, spriteName: string): Sprite {
        let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
        if (sprite) {
            return sprite;
        }

        if (caseSensitive) {
            throw getSpriteNotFoundError(spriteName);
        } else {
            spriteName = spriteName.toLowerCase();
            sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            if (sprite == undefined) {
                throw getSpriteNotFoundError(spriteName);
            }
            return sprite;
        }
    }

    /**
     * Check the existence of a variable on an existing sprite.
     * @param t Instance of the test driver.
     * @param caseSensitive Whether the names should be checked with case sensitivity or not.
     * @param sprite Sprite instance.
     * @param variableName Name of the variable.
     */
    static checkVariableExistence(t: TestDriver, caseSensitive: boolean, sprite: Sprite, variableName: string): Variable {
        let variable = sprite.getVariable(variableName, false);

        if (variable) {
            return variable;
        }

        // variable with this name not found
        if (caseSensitive) {
            throw getVariableNotFoundError(variableName, sprite.name);
        } else {
            variableName = variableName.toLowerCase();
            variable = sprite.getVariable(variableName, false);
            if (!variable) {
                throw getVariableNotFoundError(variableName, sprite.name);
            }
            return variable;
        }
    }

    /**
     * Check the attribute name.
     * @param testDriver Instance of the test driver.
     * @param sprite Sprite instance.
     * @param attrName Name of the attribute e.g. x.
     */
    static checkAttributeExistence(testDriver: TestDriver, sprite: Sprite, attrName: string) {
        try {
            eval("sprite." + attrName);
        } catch (e) {
            throw getAttributeNotFoundError(attrName, sprite.name);
        }
    }

    /**
     * Test whether a value changed.
     * @param oldValue Old value.
     * @param newValue New value.
     * @param change For increase '+' or '++'. For decrease '-' or '--'. For no change '=' or '=='. "+=" for
     * increase or staying the same."-=" for decrease or staying the same. For a numerical
     * change by an exact value '+<number>' or '<number>' or '-<number>'.
     * "+=" for increase or staying the same."-=" for decrease or staying the same.
     */
    static testChange(oldValue, newValue, change) {
        if (oldValue == undefined || newValue == undefined || change == undefined) {
            throw new Error("Undefined value.");
        }

        if (change == '=' || change == '==') {
            return oldValue == newValue;
        }
        this.testNumber(oldValue);
        this.testNumber(newValue);

        oldValue = Number(oldValue.toString());
        newValue = Number(newValue.toString())

        if (change != "" && change.startsWith("+") && change.length > 1) {
            change = change.substring(1, change.length);
        }

        if (!isNaN(Number(change.toString()))) {
            return oldValue + Number(change) === newValue;
        }

        switch (change) {
            case '+':
            case '++':
                return oldValue < newValue;
            case '-':
            case '--':
                return oldValue > newValue;
            case '+=':
                return oldValue <= newValue;
            case '-=':
                return oldValue >= newValue;
            default:
                throw getChangeComparisonNotKnownError(change);
        }
    }

    /**
     * Test whether a value is a number.
     */
    static testNumber(value) {
        if (!((value != null) && (value !== '') && !isNaN(Number(value.toString())))) {
            throw getNotANumericalValueError(value);
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


    static readonly EXPR_START = "$(";
    static readonly EXPR_END = ")";

    private static getSpriteString(t: TestDriver, caseSensitive: boolean, index: number, spriteName: string) {
        spriteName = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteName).name;
        return "const sprite" + index + " = t.getSprites(sprite => sprite.name.includes('" + spriteName + "'), false)[0];\n"
            + "if (sprite" + index + " == undefined) {\n    throw getSpriteNotFoundError('" + spriteName + "');\n}\n";
    }

    private static getVariableString(t: TestDriver, caseSensitive: boolean, index, spriteName: string, varName: string) {
        let sprite = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteName);
        varName = ModelUtil.checkVariableExistence(t, caseSensitive, sprite, varName).name;
        return "const variable" + index + " = sprite" + index + ".getVariable('" + varName + "', false).value;\n if" +
            " (variable" + index
            + " == undefined) {\n   throw getVariableNotFoundError('" + varName + "');\n}\n";
    }

    private static isAnAttribute(attrName) {
        return attrName === "effects" || attrName === "x" || attrName === "y" || attrName === "pos"
            || attrName === "direction" || attrName === "visible" || attrName === "size"
            || attrName === "currentCostume" || attrName === "volume" || attrName === "layerOrder"
            || attrName === "sayText";
    }

    /**
     * Returns a function needing a test driver instance that evaluates the expression by getting the correct
     * sprites and their attributes or values and combining the original expression parts.
     * @param t Instance of the test driver.
     * @param toEval Expression to evaluate and make into a function.
     */
    static getExpressionForEval(t: TestDriver, caseSensitive: boolean, toEval: string): string {
        // todo Umlaute werden gekillt -> ß ist nicht normal dargestellt, sondern als irgendein Sonderzeichen
        if (toEval.indexOf((this.EXPR_START)) == -1) {
            if (!toEval.startsWith("'")) {
                toEval = "'" + toEval + "'";
            } else if (!toEval.endsWith("'")) {
                toEval = toEval + "'";
            }

            try {
                eval(toEval);
            } catch (e) {
                throw geExprEvalError(e);
            }
            return "(t) => {return " + toEval + "}";
        }

        let startIndex;
        let endIndex;

        if (toEval.indexOf("\n") != -1) {
            throw getExpressionEnterError();
        }

        let expression = "return ";
        let inits = "(t) => {\n";
        let subexpression;
        let index = 0;

        while ((startIndex = toEval.indexOf(this.EXPR_START)) != -1) {
            endIndex = toEval.indexOf(this.EXPR_END);

            if (endIndex == -1) {
                throw getExpressionEndTagMissingError();
            } else if (startIndex + 2 >= endIndex - 1) {
                throw getEmptyExpressionError();
            }

            expression += toEval.substring(0, startIndex);

            subexpression = toEval.substring(startIndex + 2, endIndex);
            toEval = toEval.substring(endIndex + 1, toEval.length);
            let parts = subexpression.split(".");

            let spriteString = this.getSpriteString(t, caseSensitive, index, parts[0]);
            inits += spriteString;

            if (this.isAnAttribute(parts[1])) {
                expression += "sprite" + index + "." + parts[1];
            } else {
                inits += this.getVariableString(t, caseSensitive, index, parts[0], parts[1]);
                expression += "variable" + index;
            }

            index++;
        }
        // rest of the toEval
        expression += toEval;
        expression = inits + expression + ";\n}";

        // test it beforehand
        try {
            eval(expression)(t);
        } catch (e) {
            throw e;
        }

        return expression;
    }
}
