import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {
    AttributeNotFoundError,
    ChangeComparisonNotKnownError,
    ComparisonNotKnownError,
    EmptyExpressionError,
    ExpressionEndTagMissingError,
    ExpressionEnterError,
    ExprEvalError,
    NotANumericalValueError,
    SpriteNotFoundError,
    VariableNotFoundError
} from "./ModelError";
import Variable from "../../../vm/variable";
import {ArgType} from "../components/Check";

export interface Dependencies {
    varDependencies: { spriteName: string, varName: string }[],
    attrDependencies: { spriteName: string, attrName: string }[]
}

interface Expression extends Dependencies {
    expr: string
}

export type ParamType = string | number | boolean | string[];

export abstract class ModelUtil {

    private static _getRegexParts(caseSensitive: boolean, regex: string): string[] {
        if (!regex.includes("/")) {
            return [regex, caseSensitive ? "" : "i"];
        }

        let firstPart = regex.substring(1, regex.length);
        const secondSlashIndex = firstPart.indexOf("/");
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
     * @param pSpriteNameRegex Name of the sprite.
     */
    static checkSpriteExistence(testDriver: TestDriver, caseSensitive: boolean, pSpriteNameRegex: ArgType): Sprite {
        const spriteNameRegex = String(pSpriteNameRegex);
        if (spriteNameRegex.includes("Stage") || spriteNameRegex.includes("stage")) {
            return testDriver.getStage();
        }
        const regexParts = ModelUtil._getRegexParts(caseSensitive, spriteNameRegex);
        // logger.debug(regexParts);

        const regex = new RegExp(regexParts[0], regexParts[1]);
        const sprite = testDriver.getSprites((s: Sprite) => {
            if (caseSensitive) {
                return s.isOriginal && s.name.match(regex);
            } else {
                return s.isOriginal && s.name.toLowerCase().match(regex);
            }
        })[0];
        if (!sprite) {
            throw new SpriteNotFoundError(spriteNameRegex);
        }
        return sprite;
    }

    /**
     * Check the existence of a variable on an existing sprite.
     * @param t Instance of the test driver.
     * @param caseSensitive Whether the names should be checked with case sensitivity or not.
     * @param sprite Sprite instance.
     * @param pVariableNameRegex Name of the variable.
     */
    static checkVariableExistence(t: TestDriver, caseSensitive: boolean, sprite: Sprite, pVariableNameRegex: ArgType):
        { sprite: Sprite, variable: Variable } {
        const variableNameRegex = String(pVariableNameRegex);
        const regexParts = ModelUtil._getRegexParts(caseSensitive, variableNameRegex);

        function getVariable(variable: { name: string; }) {
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
        const sprites = t.getSprites(() => true, false);
        for (const sprite of sprites) {
            variable = sprite.getVariables(getVariable)[0];
            if (variable) {
                return {sprite, variable};
            }
        }

        // There is no variable with that regex name on any sprite...
        throw new VariableNotFoundError(variableNameRegex, sprite.name);
    }

    /**
     * Check the attribute name.
     * @param testDriver Instance of the test driver.
     * @param spriteName Sprite's name.
     * @param pAttrName Name of the attribute e.g. x.
     */
    static checkAttributeExistence(testDriver: TestDriver, spriteName: string, pAttrName: ArgType): void {
        const attrName = String(pAttrName);
        if (!this._isAnAttribute(attrName)) {
            throw new AttributeNotFoundError(attrName, spriteName);
        }
    }

    /**
     * Test whether a value changed.
     * @param oldValue Old value.
     * @param newValue New value.
     * @param pChange For increase '+' or '++'. For decrease '-' or '--'. For no change '=' or '=='. "+=" for
     * increase or staying the same."-=" for decrease or staying the same. For a numerical
     * change by an exact value '+<number>' or '<number>' or '-<number>'.
     * "+=" for increase or staying the same."-=" for decrease or staying the same.
     */
    static testChange(oldValue: string | string[] | null, newValue: string | string[] | null, pChange: ArgType): boolean {
        let change = String(pChange);
        if (oldValue == undefined || newValue == undefined || change == undefined) {
            throw new Error("Undefined value.");
        }

        if (change == '=' || change == '==') {
            return oldValue == newValue;
        }
        const oldValueNumber = this.testNumber(oldValue);
        const newValueNumber = this.testNumber(newValue);

        if (change != "" && change != "+=" && change.startsWith("+") && change.length > 1) {
            change = change.substring(1, change.length);
        }

        if (!isNaN(Number(change.toString()))) {
            return oldValueNumber + Number(change) === newValueNumber;
        }

        switch (change) {
            case '+':
            case '++':
                return oldValueNumber < newValueNumber;
            case '-':
            case '--':
                return oldValueNumber > newValueNumber;
            case '+=':
                return oldValueNumber <= newValueNumber;
            case '-=':
                return oldValueNumber >= newValueNumber;
            default:
                throw new ChangeComparisonNotKnownError(change);
        }
    }

    /**
     * Test whether a value is a number.
     */
    static testNumber(value: ParamType): number {
        if (value == null || value === '' || isNaN(Number(value))) {
            throw new NotANumericalValueError(String(value));
        }
        return Number(value.toString());
    }

    /**
     * Compare to values to each other.
     * @param value1 Value on the left side of the comparison equation.
     * @param value2 Value on the right side of the comparison equation.
     * @param comparison Comparison mode, =|==, <, <=, >=, >
     */
    static compare(value1: ParamType, value2: ParamType, comparison: ArgType): boolean {
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

        switch (comparison) {
            case ">":
                return value1 > value2;
            case "<":
                return value1 < value2;
            case "<=":
                return value1 <= value2;
            case ">=":
                return value1 >= value2;
            default:
                throw new ComparisonNotKnownError(comparison);
        }
    }

    static readonly EXPR_START = "$(";
    static readonly EXPR_END = ")";

    private static _getSpriteString(t: TestDriver, caseSensitive: boolean, index: number, spriteName: string): string {
        const name = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteName).name;
        return "const sprite" + index + " = t.getSprites(sprite => sprite.name.includes('" + name + "'), false)[0];\n"
            + "if (sprite" + index + " == undefined) {\n    throw new SpriteNotFoundError('" + spriteName + "');\n}\n";
    }

    private static _getVariableString(t: TestDriver, caseSensitive: boolean, index: number, spriteName: string, varName: string): string {
        const sprite = ModelUtil.checkSpriteExistence(t, caseSensitive, spriteName);
        const name = ModelUtil.checkVariableExistence(t, caseSensitive, sprite, varName).variable.name;
        return "const variable" + index + " = sprite" + index + ".getVariable('" + name + "', false).value;\n if" +
            " (variable" + index
            + " == undefined) {\n   throw new VariableNotFoundError('" + varName + "');\n}\n";
    }

    private static _isAnAttribute(attrName: string): boolean {
        return this._testAttributeName(attrName) ||
            (attrName.startsWith('old.') && this._testAttributeName(attrName.substring(4)));
    }

    private static _testAttributeName(attrName: string): boolean {
        // currentCostume and costume both get the name of the current costume.
        return [
            "effects",
            "x",
            "y",
            "pos",
            "direction",
            "visible",
            "size",
            "currentCostume",
            "costume",
            "currentCostumeName",
            "volume",
            "layerOrder",
            "sayText",
            "rotationStyle",
        ].includes(attrName);
    }

    /**
     * Returns a function needing a test driver instance that evaluates the expression by getting the correct
     * sprites and their attributes or values and combining the original expression parts.
     * @param t Instance of the test driver.
     * @param caseSensitive Whether the names of sprites and variables should be tested case-sensitive.
     * @param pToEval Expression to evaluate and make into a function.
     */
    static getExpressionForEval(t: TestDriver, caseSensitive: boolean, pToEval: ArgType): Expression {
        // todo Umlaute werden gekillt -> ß ist nicht normal dargestellt, sondern als irgendein Sonderzeichen
        let toEval = String(pToEval);
        if (!toEval.includes(this.EXPR_START)) {
            // TODO check if this should be more robust ("\"some wrong syntax'\"" as pToEval creates an error)
            if (!toEval.startsWith("'")) {
                toEval = "'" + toEval + "'";
            } else if (!toEval.endsWith("'")) {
                toEval = toEval + "'";
            }

            try {
                eval(toEval);
            } catch (e) {
                throw new ExprEvalError(e);
            }

            let expr: string;
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

        if (toEval.includes("\n")) {
            throw new ExpressionEnterError();
        }

        const expression = this._getExpression(t, caseSensitive, toEval);

        // all texts in "" to lower case
        if (!caseSensitive) {
            expression.expr = ModelUtil._toLowerCaseTexts(expression.expr);
        }

        // test it beforehand
        try {
            eval(expression.expr)(t);
        } catch (e) {
            throw new ExprEvalError(e);
        }

        return expression;
    }

    private static _toLowerCaseTexts(expr: string): string {
        // all texts in "" to lower case
        const temp = expr.split("\"");
        if (temp.length > 2) {
            // (0) return => (1) "Hello (2) "
            for (let i = 1; i < temp.length; i++) {
                if (i % 2 != 0) {
                    temp[i] = temp[i].toLowerCase();
                }
            }
            expr = temp.join("\"");
        }
        return expr;
    }

    private static _getExpression(t: TestDriver, caseSensitive: boolean, toEval: string): Expression {
        let startIndex: number;
        let endIndex: number;
        let expression = "return ";
        let inits = "(t) => {\n";
        let subexpression: string;
        let index = 0;
        const varDependencies: { spriteName: string, varName: string }[] = [];
        const attrDependencies: { spriteName: string, attrName: string }[] = [];

        const spriteMap: Record<string, number> = {};

        while ((startIndex = toEval.indexOf(this.EXPR_START)) != -1) {
            endIndex = toEval.indexOf(this.EXPR_END, startIndex);

            if (endIndex == -1) {
                throw new ExpressionEndTagMissingError();
            }

            if (startIndex + 2 >= endIndex - 1) {
                throw new EmptyExpressionError();
            }

            let fillerBetween = toEval.substring(0, startIndex);
            if (fillerBetween == "=" || (fillerBetween.endsWith("=") && !fillerBetween.endsWith("=="))) {
                fillerBetween += "=";
            }
            expression += fillerBetween;

            subexpression = toEval.substring(startIndex + 2, endIndex);
            toEval = toEval.substring(endIndex + 1, toEval.length);
            const pointIndex = subexpression.indexOf(".");
            const spriteName = subexpression.substring(0, pointIndex);
            const attrName = subexpression.substring(pointIndex + 1, subexpression.length);

            if (spriteMap[spriteName] == undefined) {
                const spriteString = this._getSpriteString(t, caseSensitive, index, spriteName);
                spriteMap[spriteName] = index;
                inits += spriteString;
                index++;
            }

            if (this._isAnAttribute(attrName)) {
                attrDependencies.push({spriteName, attrName});
                expression += "sprite" + spriteMap[spriteName] + "." + attrName;
            } else {
                varDependencies.push({spriteName, varName: attrName});
                inits += this._getVariableString(t, caseSensitive, spriteMap[spriteName], spriteName, attrName);
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
    static getDependencies(functionCode: string): Dependencies {
        if (!functionCode.includes('getSprite')) {
            return {varDependencies: [], attrDependencies: []};
        }

        const attrDependencies: Record<string, string[]> = {};
        const varDependencies: Record<string, string[]> = {};
        const spriteGetter = /(?:let\s)?([A-Za-z0-9]+)\s?=\s?t.getSprite\(['"]([A-Za-z0-9]+)['"]\);/g;
        const spriteLines = functionCode.match(spriteGetter);

        // from  bound variable name to sprite name
        const allSprites: Record<string, string> = {};

        // there are lines as let apple = t.getSprite("Apple");
        if (spriteLines != null) {
            const nameGetter = /(?:let\s)?([A-Za-z0-9]+)\s?=\s?t.getSprite\(['"]([A-Za-z0-9]+)['"]\)/i;
            for (let i = 0; i < spriteLines.length; i++) {
                const names = spriteLines[i].match(nameGetter);

                if (names === null) {
                    continue;
                }

                allSprites[names[1]] = names[2];
                attrDependencies[names[2]] = [];
                varDependencies[names[2]] = [];
            }
        }

        // Attribute used with getSprite
        // Todo make this Regex work with t.getSprite("...").getVariable("...")
        const spriteWithAttrGetter = /t.getSprite\(['"](\w+)['"]\)\.(?!getVariable)(\w+)(\s|;|\n)?/g;
        const spriteAndAttr = functionCode.match(spriteWithAttrGetter);
        if (spriteAndAttr != null) {
            const spriteAndAttrGetter2 = /t.getSprite\(['"](\w+)['"]\)\.(?!getVariable)(\w+)(\s|;|\n)?/;
            for (let i = 0; i < spriteAndAttr.length; i++) {
                const match = spriteAndAttr[i].match(spriteAndAttrGetter2);

                if (match === null) {
                    continue;
                }

                if (attrDependencies[match[1]] == undefined) {
                    attrDependencies[match[1]] = [match[2]];
                } else {
                    attrDependencies[match[1]].push(match[2]);
                }
            }
        }

        // Variable used with getSprite
        const spriteWithVarGetter = /t.getSprite\(['"](\w+)['"]\)\.getVariable\(['"](\w+)['"]\)/g;
        const spriteAndVar = functionCode.match(spriteWithVarGetter);
        if (spriteAndVar != null) {
            const detailedGetter = /t.getSprite\(['"](\w+)['"]\)\.getVariable\(['"](\w+)['"]\)/;
            for (let i = 0; i < spriteAndVar.length; i++) {
                const match = spriteAndVar[i].match(detailedGetter);

                if (match === null) {
                    continue;
                }

                if (varDependencies[match[1]] == undefined) {
                    varDependencies[match[1]] = [match[2]];
                } else {
                    varDependencies[match[1]].push(match[2]);
                }
            }
        }

        const variableGetter = "\\.getVariable\\(['\"](\\w+)['\"]\\)";
        const variableNameGetter = /.getVariable\(['"](\w+)['"]\)/;
        for (const allSpritesKey in allSprites) {
            // get all variables of this sprite used
            const regex = new RegExp(allSpritesKey + variableGetter, "g");
            const matches = functionCode.match(regex);
            if (matches != null) {
                for (let i = 0; i < matches.length; i++) {
                    const name = matches[i].match(variableNameGetter);

                    if (name === null) {
                        continue;
                    }

                    varDependencies[allSprites[allSpritesKey]].push(name[1]);
                }
            }
        }

        const attributeGetter = "\\.(?!getVariable)(\\w+)";
        for (const allSpritesKey in allSprites) {
            // get all variables of this sprite used
            const regex = new RegExp(allSpritesKey + attributeGetter, "g");
            const matches = functionCode.match(regex);
            if (matches != null) {
                for (let i = 0; i < matches.length; i++) {
                    const name = matches[i].substring(matches[i].indexOf(".") + 1, matches[i].length);
                    attrDependencies[allSprites[allSpritesKey]].push(name);
                }
            }
        }

        const newAttrDep: Dependencies['attrDependencies'] = [];
        const newVarDep: Dependencies['varDependencies'] = [];

        for (const spriteName in attrDependencies) {
            const attributes = new Set(attrDependencies[spriteName]);
            attributes.forEach(x => {
                newAttrDep.push({spriteName, attrName: x});

            });
        }
        for (const spriteName in varDependencies) {
            const variables = new Set(varDependencies[spriteName]);
            variables.forEach(x => {
                newVarDep.push({spriteName, varName: x});
            });
        }

        return {attrDependencies: newAttrDep, varDependencies: newVarDep};
    }
}
