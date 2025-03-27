import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {
    AttributeNotFoundError,
    EmptyExpressionError,
    ExpressionSyntaxError,
    ExprEvalError,
    NotANumericalValueError,
    SpriteNotFoundError,
    VariableNotFoundError
} from "./ModelError";
import Variable from "../../../vm/variable";
import {ArgType} from "./schema";
import {AttributeNames, EffectNames} from "../checks/CheckTypes";

export interface Dependencies {
    varDependencies: { spriteName: string, varName: string }[],
    attrDependencies: { spriteName: string, attrName: string }[]
}

export interface Expression extends Dependencies {
    expr: string
}

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
        return ModelUtil.checkSpriteExistence(testDriver, pSpriteName);
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
        if (!ModelUtil._isAnAttribute(attrName)) {
            throw new AttributeNotFoundError(spriteName, attrName);
        }
    }

    /**
     * Test whether a value is a number.
     */
    static testNumber(value: ArgType): number {
        const result = ModelUtil.returnNumberIfPossible(value);
        if (result == null) {
            throw new NotANumericalValueError(String(value));
        }
        return result;
    }

    /**
     * Returns the value as a number if possible or null otherwise.
     * @param value The value to be converted to a number
     * @param defaultValue This value is returned when {@linkcode value} is not a number
     * @return The input converted to a number
     */
    public static returnNumberIfPossible(value: ArgType, defaultValue: number | null = null): number | null {
        if (value == null || value === '' || isNaN(Number(value))) {
            return defaultValue;
        }
        return Number(value.toString());
    }

    private static _isAnAttribute(attrName: string): boolean {
        return ModelUtil.isAnAttribute(attrName) ||
            (attrName.startsWith('old.') && ModelUtil.isAnAttribute(attrName.substring(4)));
    }

    public static isAnAttribute(attrName: string): boolean {
        // currentCostume and costume both get the name of the current costume.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return AttributeNames.includes(attrName);
    }

    /**
     * Checks if the given string is the name of an effect of a sprite
     * @param effectName The name of the effect
     * @return true if {@linkcode effectName} is a valid name for an effect
     * */
    public static isAnEffect(effectName: string): boolean {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return (EffectNames as string[]).includes(effectName);
    }

    /**
     * Calls {@link ModelUtil.getExpectedDirectionForSprite1LookingAtTarget} with the x and y coordinates of s2
     * @param s1 Sprite looking at another sprite
     * @param s2 some sprite
     */
    public static getExpectedDirectionForSprite1LookingAtSprite2(s1: Sprite, s2: Sprite): number {
        return ModelUtil.getExpectedDirectionForSprite1LookingAtTarget(s1, s2.x, s2.y);
    }

    /**
     * Calls {@link ModelUtil.getExpectedDirectionForSprite1LookingAtTarget} with the x and y coordinates of the mouse
     * @param s1 Sprite looking at another sprite
     * @param t Test-Driver for retrieving the coordinates of the mouse
     */
    public static getExpectedDirectionForSpriteLookingAtMouse(s1: Sprite, t: TestDriver): number {
        const {x, y} = t.getMousePos();
        return ModelUtil.getExpectedDirectionForSprite1LookingAtTarget(s1, x, y);

    }

    /**
     * Calculates the direction of sprite s1 if it points at some target coordinates. The rotation style does not matter,
     * since s1.direction changes independent on the graphic visible on screen.
     *
     * @param s1 Sprite looking at something
     * @param x x-coordinate of the target
     * @param y y-coordinate of the target
     */
    public static getExpectedDirectionForSprite1LookingAtTarget(s1: Sprite, x: number, y: number): number {
        const xDif = x - s1.x;
        const yDif = y - s1.y;
        if (xDif == 0) {
            return yDif > 0 ? 0 : 180;
        }
        const expectedDegrees = (360 + (Math.atan2(yDif, xDif) * 180.0) / Math.PI) % 360;
        return (expectedDegrees < 270 ? 90 : 450) - expectedDegrees;
    }

    public static checkDirectionWithinDelta(sprite: Sprite, expected: number, delta = 3.0, useMode = false): boolean {
        if (!useMode || sprite.rotationStyle == "all round") {
            return ModelUtil.checkCyclicValueWithinDelta(sprite.direction, expected, -180, 180, delta);
        }
        // mode is used -> for "do not rotate" any value is fine and otherwise the sign must be equal.
        // If either the expected or the actual direction = 0 then any direction is allowed.
        return sprite.rotationStyle == "do not rotate" || Math.sign(expected) * Math.sign(sprite.direction) >= 0;
    }

    /**
     * Checks if a value is within a delta range of the value it should be for cyclic values.
     * @param actual The actual value of the variable
     * @param expected The value the variable should have
     * @param min The lower bound
     * @param max The upper bound
     * @param delta Defines the range of valid values
     * @return true if the value is within the valid cyclic bound
     */
    public static checkCyclicValueWithinDelta(actual: number, expected: number, min: number, max: number, delta: number): boolean {
        const lowerBound = expected - delta;
        const upperBound = expected + delta;
        if (lowerBound <= min) {
            return actual <= upperBound || actual >= max - (min - lowerBound);
        } else if (upperBound >= max) {
            return actual >= lowerBound || actual <= min + (upperBound - max);
        }
        return lowerBound <= actual && actual <= upperBound;
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
            ModelUtil.getValueForSubExpression(t, s, a, c, dependencies);
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
                                            custom: boolean, dependencies: Dependencies = undefined,
                                            log: Record<string, string> = undefined): Sprite | Variable | string | string[] {
        if (!spriteName || spriteName == "") {
            throw new EmptyExpressionError();
        }
        const sprite: Sprite = spriteName == "_stage_" ? t.getStage() : t.getSprite(spriteName);
        if (!sprite) {
            throw new SpriteNotFoundError(spriteName);
        }
        if (attribute == undefined) {
            if (log) {
                log[`$("${spriteName}")`] = "sprite with that name";
            }
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
            if (log) {
                log[`$("${spriteName}", "${attribute}", true)`] = String(variable.value);
            }
            return variable.value;
        } else {
            variable = sprite[attribute];
            if (!variable) {
                if (ModelUtil._isAnAttribute(attribute)) {
                    // for whatever reason sometimes `variable = sprite[attribute];` does not work -> try this instead
                    variable = t.getSprite(spriteName)[attribute];
                } else {
                    try {
                        // maybe custom flag was not specified by accident -> try custom variables
                        return ModelUtil.getValueForSubExpression(t, spriteName, attribute, true, dependencies, log);
                    } catch (e) {
                        throw new AttributeNotFoundError(spriteName, attribute);
                    }
                }
            }
            if (dependencies) {
                dependencies.attrDependencies.push({spriteName: sprite.name, attrName: attribute});
            }
            if (log) {
                log[`$("${spriteName}", "${attribute}", false)`] = String(variable);
            }
            return variable;
        }
    }

    public static evaluateExpression(t: TestDriver, expression: string, log: Record<string, string> = {}): unknown {
        const $ = (spriteName: string, attribute: string, custom: boolean) =>
            ModelUtil.getValueForSubExpression(t, spriteName, attribute, custom, undefined, log);
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
        const asNumber = ModelUtil.returnNumberIfPossible(text);
        if (asNumber == null) {
            const func = ModelUtil.getExpressionForEval(t, text).expr;
            return () => ModelUtil.testNumber(Number(ModelUtil.evaluateExpression(t, func)));
        } else {
            return () => asNumber;
        }
    }
}
