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
     * @param spriteName Sprite's name.
     * @param attrName Name of the attribute e.g. x.
     */
    static checkAttributeExistence(testDriver: TestDriver, spriteName: string, attrName: string) {
        if (!this.isAnAttribute(attrName)) {
            throw getAttributeNotFoundError(attrName, spriteName);
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

        if (change != "" && change != "+=" && change.startsWith("+") && change.length > 1) {
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
        if (value1 == undefined || value2 == undefined) {
            throw new Error("comparison with undefined value");
        }
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
        return this.testAttributeName(attrName) ||
            (attrName.startsWith('old.') && this.testAttributeName(attrName.substring(4)));
    }

    private static testAttributeName(attrName: string) {
        // currentCostume and costume both get the name of the current costume.
        return attrName === "effects" || attrName === "x" || attrName === "y" || attrName === "pos"
            || attrName === "direction" || attrName === "visible" || attrName === "size"
            || attrName === "currentCostume" || attrName === "costume" || attrName === "currentCostumeName"
            || attrName === "volume" || attrName === "layerOrder"
            || attrName === "sayText" || attrName == "rotationStyle";
    }

    /**
     * Returns a function needing a test driver instance that evaluates the expression by getting the correct
     * sprites and their attributes or values and combining the original expression parts.
     * @param t Instance of the test driver.
     * @param caseSensitive Whether the names of sprites and variables should be tested case sensitive.
     * @param toEval Expression to evaluate and make into a function.
     */
    static getExpressionForEval(t: TestDriver, caseSensitive: boolean, toEval: string):
        {
            expr: string, varDependencies: { spriteName: string, varName: string }[],
            attrDependencies: { spriteName: string, attrName: string }[]
        } {
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

            let expr;
            if (!caseSensitive) {
                expr = "(t) => {return " + toEval.toLowerCase() + "}";
            } else {
                expr = "(t) => {return " + toEval + "}";
            }
            return {
                expr: expr,
                varDependencies: [],
                attrDependencies: []
            };
        }

        if (toEval.indexOf("\n") != -1) {
            throw getExpressionEnterError();
        }

        let {expr, varDependencies, attrDependencies} = this._getExpression(t, caseSensitive, toEval);

        // all texts in "" to lower case
        if (!caseSensitive) {
            expr = ModelUtil.toLowerCaseTexts(expr);
        }

        // test it beforehand
        try {
            eval(expr)(t);
        } catch (e) {
            throw e;
        }

        return {
            expr: expr,
            varDependencies: varDependencies,
            attrDependencies: attrDependencies
        };
    }

    private static toLowerCaseTexts(expr: string) {
        // all texts in "" to lower case
        let temp = expr.split("\"");
        if (temp.length > 2) {
            // (0) return => (1) "Hello (2) "
            expr = temp[0];
            for (let i = 1; i < temp.length; i++) {
                if (i % 2 == 0) {
                    expr += temp[i].toLowerCase();
                } else {
                    expr += temp[i];
                }
            }
        }
        return expr;
    }

    private static _getExpression(t: TestDriver, caseSensitive: boolean, toEval: string):
        {
            expr: string, varDependencies: { spriteName: string, varName: string }[],
            attrDependencies: { spriteName: string, attrName: string }[]
        } {
        let startIndex;
        let endIndex;
        let expression = "return ";
        let inits = "(t) => {\n";
        let subexpression;
        let index = 0;
        let varDependencies = [];
        let attrDependencies = [];

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
                attrDependencies.push({spriteName, attrName});
                expression += "sprite" + spriteMap[spriteName] + "." + attrName;
            } else {
                varDependencies.push({spriteName, varName: attrName});
                inits += this.getVariableString(t, caseSensitive, spriteMap[spriteName], spriteName, attrName);
                expression += "variable" + spriteMap[spriteName];
            }

        }
        // rest of the toEval
        expression += toEval;
        expression = inits + expression + ";\n}";
        return {
            expr: expression,
            varDependencies: varDependencies,
            attrDependencies: attrDependencies
        };
    }

    /**
     * Get all dependencies in a js function given as a string. A dependency is a sprite
     * @param functionCode
     */
    static getDependencies(functionCode: string):
        {
            varDependencies: { spriteName: string, varName: string }[],
            attrDependencies: { spriteName: string, attrName: string }[]
        } {
        if (functionCode.indexOf('getSprite') == -1) {
            return {varDependencies: [], attrDependencies: []};
        }

        let attrDependencies: { [key: string]: string[] } = {};
        let varDependencies: { [key: string]: string[] } = {};
        const spriteGetter = /(?:let\s)?([A-Za-z0-9]+)\s?=\s?t.getSprite\(['"]([A-Za-z0-9]+)['"]\);/g;
        let spriteLines = functionCode.match(spriteGetter);

        // from  bound variable name to sprite name
        let allSprites: { [key: string]: string } = {};

        // there are lines as let apple = t.getSprite("Apple");
        if (spriteLines != null) {
            const nameGetter = /(?:let\s)?([A-Za-z0-9]+)\s?=\s?t.getSprite\(['"]([A-Za-z0-9]+)['"]\)/i;
            for (let i = 0; i < spriteLines.length; i++) {
                let names = spriteLines[i].match(nameGetter);
                allSprites[names[1]] = names[2];
                attrDependencies[names[2]] = [];
                varDependencies[names[2]] = [];
            }
        }

        // Attribute used with getSprite
        const spriteWithAttrGetter = /t.getSprite\(['"](\w+)['"]\)\.(?!getVariable)(\w+)(\s|;|\n)?/g;
        let spriteAndAttr = functionCode.match(spriteWithAttrGetter);
        if (spriteAndAttr != null) {
            const spriteAndAttrGetter2 = /t.getSprite\(['"](\w+)['"]\)\.(?!getVariable)(\w+)(\s|;|\n)?/;
            for (let i = 0; i < spriteAndAttr.length; i++) {
                let match = spriteAndAttr[i].match(spriteAndAttrGetter2);
                if (attrDependencies[match[1]] == undefined) {
                    attrDependencies[match[1]] = [match[2]];
                } else {
                    attrDependencies[match[1]].push(match[2]);
                }
            }
        }

        // Variable used with getSprite
        const spriteWithVarGetter = /t.getSprite\(['"](\w+)['"]\)\.getVariable\(['"](\w+)['"]\)/g;
        let spriteAndVar = functionCode.match(spriteWithVarGetter);
        if (spriteAndVar != null) {
            const detailedGetter = /t.getSprite\(['"](\w+)['"]\)\.getVariable\(['"](\w+)['"]\)/;
            for (let i = 0; i < spriteAndVar.length; i++) {
                let match = spriteAndVar[i].match(detailedGetter);
                if (varDependencies[match[1]] == undefined) {
                    varDependencies[match[1]] = [match[2]];
                } else {
                    varDependencies[match[1]].push(match[2]);
                }
            }
        }

        const variableGetter = "\\.getVariable\\(['\"](\\w+)['\"]\\)";
        const variableNameGetter = /.getVariable\(['"](\w+)['"]\)/;
        for (let allSpritesKey in allSprites) {
            // get all variables of this sprite used
            const regex = new RegExp(allSpritesKey + variableGetter, "g");
            let matches = functionCode.match(regex);
            if (matches != null) {
                for (let i = 0; i < matches.length; i++) {
                    let name = matches[i].match(variableNameGetter);
                    varDependencies[allSprites[allSpritesKey]].push(name[1]);
                }
            }
        }

        const attributeGetter = "\\.(?!getVariable)(\\w+)";
        for (let allSpritesKey in allSprites) {
            // get all variables of this sprite used
            const regex = new RegExp(allSpritesKey + attributeGetter, "g");
            let matches = functionCode.match(regex);
            if (matches != null) {
                for (let i = 0; i < matches.length; i++) {
                    let name = matches[i].substring(matches[i].indexOf(".") + 1, matches[i].length);
                    attrDependencies[allSprites[allSpritesKey]].push(name);
                }
            }
        }

        let newAttrDep = [];
        let newVarDep = [];

        for (let spriteName in attrDependencies) {
            let attributes = new Set(attrDependencies[spriteName]);
            attributes.forEach(x => {
                newAttrDep.push({spriteName, attrName: x});

            });
        }
        for (const spriteName in varDependencies) {
            let variables = new Set(varDependencies[spriteName]);
            variables.forEach(x => {
                newVarDep.push({spriteName, varName: x});
            });
        }

        return {attrDependencies: newAttrDep, varDependencies: newVarDep};
    }
}
