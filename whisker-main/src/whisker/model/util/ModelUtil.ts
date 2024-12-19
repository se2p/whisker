import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {
    AttributeNotFoundError,
    ChangeComparisonNotKnownError,
    ComparisonNotKnownError,
    EmptyExpressionError,
    ExpressionSyntaxError,
    ExprEvalError,
    NotANumericalValueError,
    SpriteNotFoundError,
    VariableNotFoundError
} from "./ModelError";
import Variable from "../../../vm/variable";
import {ArgType} from "./schema";

import {ComparisonOp} from "../checks/comparisons";

export interface Dependencies {
    varDependencies: { spriteName: string, varName: string }[],
    attrDependencies: { spriteName: string, attrName: string }[]
}

export interface Expression extends Dependencies {
    expr: string
}

export type ParamType = string | number | boolean | string[];

export abstract class ModelUtil {

    /**
     * If {@link pSpriteName} == "_stage_" this method returns the stage, otherwise it calls {@link ModelUtil.checkSpriteExistence}
     * @param testDriver Instance of the test driver.
     * @param pSpriteName Name of the sprite or "_stage_" for the stage
     */
    static getStageOrSprite(testDriver: TestDriver, pSpriteName: ArgType): Sprite {
        if (pSpriteName == "_stage_") {
            return testDriver.getStage();
        }
        return this.checkSpriteExistence(testDriver, pSpriteName);
    }

    /**
     * Check the existence of a sprite.
     * @param testDriver Instance of the test driver.
     * @param pSpriteName Name of the sprite.
     */
    static checkSpriteExistence(testDriver: TestDriver, pSpriteName: ArgType): Sprite {
        const spriteNames = Array.isArray(pSpriteName) ? pSpriteName : [String(pSpriteName)];

        for (const name of spriteNames) {
            const sprite = testDriver.getSprite(name);

            if (sprite != null) {
                return sprite;
            }
        }

        throw new SpriteNotFoundError(String(pSpriteName));
    }

    /**
     * Check the existence of a variable on an existing sprite.
     * @param t Instance of the test driver.
     * @param sprite Sprite instance.
     * @param pVariableName Name of the variable.
     */
    static checkVariableExistence(t: TestDriver, sprite: Sprite, pVariableName: ArgType):
        { sprite: Sprite, variable: Variable } {
        const variableName = String(pVariableName);

        const getVariable = Array.isArray(pVariableName)
            ? (variable: { name: string; }) => pVariableName.some(varName => variable.name == varName)
            : (variable: { name: string; }) => variable.name == variableName;


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

        // There is no variable with that  name on any sprite...
        throw new VariableNotFoundError(variableName, sprite.name);
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
            throw new AttributeNotFoundError(spriteName, attrName);
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
        const result = this.returnNumberIfPossible(value);
        if (result == null) {
            throw new NotANumericalValueError(String(value));
        }
        return result;
    }

    /**
     * Returns the value as a number if possible or null otherwise.
     * @param value The value to be converted to a number
     * @return The input converted to a number
     */
    private static returnNumberIfPossible(value: ParamType): number | null {
        if (value == null || value === '' || isNaN(Number(value))) {
            return null;
        }
        return Number(value.toString());
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
     * @param pToEval Expression to evaluate and make into a function.
     */
    static getExpressionForEval(t: TestDriver, pToEval: ArgType): Expression {
        // todo Umlaute werden gekillt -> ß ist nicht normal dargestellt, sondern als irgendein Sonderzeichen
        const toEval = String(pToEval);
        const dependencies: Dependencies = {varDependencies: [], attrDependencies: []};
        const $ = (s: string, a: string, c: boolean) =>
            this.getValueForSubExpression(t, s, a, c, dependencies);
        try {
            // fill dependencies and check if the expression works
            eval(`($) => ${toEval}`)($);
        } catch (e: unknown) {
            if (e instanceof SyntaxError) {
                throw new ExpressionSyntaxError(e.message);
            }
            if (e instanceof EmptyExpressionError || e instanceof SpriteNotFoundError
                || e instanceof VariableNotFoundError || e instanceof AttributeNotFoundError) {
                throw e;
            }
            throw new ExprEvalError(e);
        }
        return {
            expr: `(t, $) => ${toEval}`,
            varDependencies: dependencies.varDependencies,
            attrDependencies: dependencies.attrDependencies
        };
    }

    private static getValueForSubExpression(t: TestDriver, spriteName: string, attribute: string,
                                            custom: boolean, dependencies: Dependencies = undefined): Sprite | Variable | string | string[] {
        if (!spriteName || spriteName == "") {
            throw new EmptyExpressionError();
        }
        const sprite: Sprite = spriteName == "_stage_" ? t.getStage() : t.getSprite(spriteName);
        if (!sprite) {
            throw new SpriteNotFoundError(spriteName);
        }
        if (attribute == undefined) {
            return sprite;
        }
        let variable: Variable | string;
        if (custom) {
            variable = sprite.getVariable(attribute);
            if (!variable) {
                throw new VariableNotFoundError(spriteName, attribute);
            }
            if (dependencies) {
                dependencies.varDependencies.push({spriteName: sprite.name, varName: variable.name});
            }
            return variable.value;
        } else {
            variable = sprite[attribute];
            if (!variable) {
                if (this._isAnAttribute(attribute)) {
                    // for whatever reason sometimes `variable = sprite[attribute];` does not work -> try this instead
                    variable = t.getSprite(spriteName)[attribute];
                } else {
                    try {
                        // maybe custom flag was not specified by accident -> try custom variables
                        return this.getValueForSubExpression(t, spriteName, attribute, true, dependencies);
                    } catch (e) {
                        throw new AttributeNotFoundError(spriteName, attribute);
                    }
                }
            }
            if (dependencies) {
                dependencies.attrDependencies.push({spriteName: sprite.name, attrName: attribute});
            }
            return variable;
        }
    }

    public static evaluateExpression(t: TestDriver, expression: string): unknown {
        const $ = (spriteName: string, attribute: string, custom: boolean) =>
            this.getValueForSubExpression(t, spriteName, attribute, custom);
        return eval(expression)(t, $);
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

    static getNumberFunction(text: ArgType, t: TestDriver): () => number {
        const asNumber = this.returnNumberIfPossible(text);
        if (asNumber == null) {
            const func = ModelUtil.getExpressionForEval(t, text).expr;
            return () => ModelUtil.testNumber(Number(ModelUtil.evaluateExpression(t, func)));
        } else {
            return () => asNumber;
        }
    }
}
