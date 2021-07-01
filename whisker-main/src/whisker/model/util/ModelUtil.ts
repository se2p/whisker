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

    private static getRegexParts(caseSensitive: boolean, regex: string) {
        if (regex.indexOf("/") == -1) {
            return [regex, caseSensitive ? "" : "i"];
        }

        let firstPart = regex.substring(1, regex.length);
        let secondSlashIndex = firstPart.indexOf("/");
        if (secondSlashIndex == -1) {
            return [firstPart, caseSensitive ? "" : "i"];
        }
        firstPart = firstPart.substring(0, secondSlashIndex);
        let flags = regex.substring(secondSlashIndex + 2, regex.length);
        if (!caseSensitive && flags == "") {
            flags = "i";
        }
        return [firstPart, flags];
    }

    /**
     * Check the existence of a sprite.
     * @param testDriver Instance of the test driver.
     * @param caseSensitive Whether the names should be checked with case sensitivity or not.
     * @param spriteNameRegex Name of the sprite.
     */
    static checkSpriteExistence(testDriver: TestDriver, caseSensitive: boolean, spriteNameRegex: string): Sprite {
        if (spriteNameRegex.indexOf("Stage") != -1 || spriteNameRegex.indexOf("stage") != -1) {
            return testDriver.getStage();
        }
        let regexParts = ModelUtil.getRegexParts(caseSensitive, spriteNameRegex);
        // console.log(regexParts);

        const regex = new RegExp(regexParts[0], regexParts[1]);
        let sprite = testDriver.getSprites(s => {
            if (caseSensitive) {
                return s.isOriginal && s.name.match(regex);
            } else {
                return s.isOriginal && s.name.toLowerCase().match(regex);
            }
        })[0];
        if (!sprite) {
            throw getSpriteNotFoundError(spriteNameRegex);
        }
        return sprite;
    }

    /**
     * Check the existence of a variable on an existing sprite.
     * @param t Instance of the test driver.
     * @param caseSensitive Whether the names should be checked with case sensitivity or not.
     * @param sprite Sprite instance.
     * @param variableNameRegex Name of the variable.
     */
    static checkVariableExistence(t: TestDriver, caseSensitive: boolean, sprite: Sprite, variableNameRegex: string):
        { sprite: Sprite, variable: Variable } {
        let regexParts = ModelUtil.getRegexParts(caseSensitive, variableNameRegex);

        function getVariable(variable) {
            if (caseSensitive) {
                return variable.name.match(regex);
            } else {
                return variable.name.toLowerCase().match(regex);
            }
        }
        const regex = new RegExp(regexParts[0], regexParts[1]);
        let variable = sprite.getVariables(getVariable)[0];

        if (variable) {
            return {sprite, variable};
        }

        // The variable is not defined on the sprite, search for the same variable name on other sprites and
        // take that one....
        let sprites = t.getSprites(() => true, false);
        for (let i = 0; i < sprites.length; i++) {
            let sprite = sprites[i];
            variable = sprite.getVariables(getVariable)[0];
            if (variable) {
                return {sprite, variable};
            }
        }

        // There is no variable with that regex name on any sprite...
        throw getVariableNotFoundError(variableNameRegex, sprite.name);
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
        oldValue = this.testNumber(oldValue);
        newValue = this.testNumber(newValue);

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
    static testNumber(value): number {
        if (!((value != null) && (value !== '') && !isNaN(Number(value.toString())))) {
            throw getNotANumericalValueError(value);
        }
        return Number(value.toString());
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
        value1 = this.testNumber(value1);
        value2 = this.testNumber(value2);

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
        let name = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteName).name;
        return "const sprite" + index + " = t.getSprites(sprite => sprite.name.includes('" + name + "'), false)[0];\n"
            + "if (sprite" + index + " == undefined) {\n    throw getSpriteNotFoundError('" + spriteName + "');\n}\n";
    }

    private static getVariableString(t: TestDriver, caseSensitive: boolean, index, spriteName: string, varName: string) {
        let sprite = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteName);
        let name = ModelUtil.checkVariableExistence(t, caseSensitive, sprite, varName).variable.name;
        return "const variable" + index + " = sprite" + index + ".getVariable('" + name + "', false).value;\n if" +
            " (variable" + index
            + " == undefined) {\n   throw getVariableNotFoundError('" + varName + "');\n}\n";
    }

    private static isAnAttribute(attrName: string) {
        return attrName === "effects" || attrName === "x" || attrName === "y" || attrName === "pos"
            || attrName === "direction" || attrName === "visible" || attrName === "size"
            || attrName === "currentCostume" || attrName === "volume" || attrName === "layerOrder"
            || attrName === "sayText" || attrName.startsWith('old');
    }

    /**
     * Returns a function needing a test driver instance that evaluates the expression by getting the correct
     * sprites and their attributes or values and combining the original expression parts.
     * @param t Instance of the test driver.
     * @param caseSensitive Whether the names of sprites and variables should be tested case sensitive.
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


        if (toEval.indexOf("\n") != -1) {
            throw getExpressionEnterError();
        }

        let expression = this._getExpression(t, caseSensitive, toEval);

        // test it beforehand
        try {
            eval(expression)(t);
        } catch (e) {
            throw e;
        }

        return expression;
    }

    private static _getExpression(t: TestDriver, caseSensitive: boolean, toEval: string): string {
        let startIndex;
        let endIndex;
        let expression = "return ";
        let inits = "(t) => {\n";
        let subexpression;
        let index = 0;

        let spriteMap: { [key: string]: number } = {};

        while ((startIndex = toEval.indexOf(this.EXPR_START)) != -1) {
            endIndex = toEval.indexOf(this.EXPR_END);

            if (endIndex == -1) {
                throw getExpressionEndTagMissingError();
            } else if (startIndex + 2 >= endIndex - 1) {
                throw getEmptyExpressionError();
            }

            let fillerBetween = toEval.substring(0, startIndex);
            if (fillerBetween == "=" || (fillerBetween.endsWith("=") && !fillerBetween.endsWith("=="))) {
                fillerBetween += "=";
            }
            expression += fillerBetween;

            subexpression = toEval.substring(startIndex + 2, endIndex);
            toEval = toEval.substring(endIndex + 1, toEval.length);
            let pointIndex = subexpression.indexOf(".");
            let spriteName = subexpression.substring(0, pointIndex);
            let attrName = subexpression.substring(pointIndex + 1, subexpression.length);

            if (spriteMap[spriteName] == undefined) {
                let spriteString = this.getSpriteString(t, caseSensitive, index, spriteName);
                spriteMap[spriteName] = index;
                inits += spriteString;
                index++;
            }

            if (this.isAnAttribute(attrName)) {
                expression += "sprite" + spriteMap[spriteName] + "." + attrName;
            } else {
                inits += this.getVariableString(t, caseSensitive, spriteMap[spriteName], spriteName, attrName);
                expression += "variable" + spriteMap[spriteName];
            }

        }
        // rest of the toEval
        expression += toEval;
        expression = inits + expression + ";\n}";
        return expression;
    }
}
