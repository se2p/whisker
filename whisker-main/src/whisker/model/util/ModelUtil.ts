import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {
    AttributeNotFoundError,
    EmptyExpressionError,
    ExpressionSyntaxError,
    ExprEvalError,
    NotANumericalValueError,
    RGBRangeError,
    SpriteNotFoundError,
    VariableNotFoundError
} from "./ModelError";
import Variable from "../../../vm/variable";
import {ArgType} from "./schema";
import {attributeNames, effectNames} from "../checks/CheckTypes";
import {STAGE_NAME} from "../../../assembler/utils/selectors";
import {approxEq} from "../checks/Comparison";
import {CheckResult, pass, Reason, result} from "../checks/CheckResult";
import {OracleModel} from "../components/AbstractModel";
import {addToMultiMap} from "./CheckUtility";

export interface Dependencies {
    varDependencies: { spriteName: string, varName: string }[],
    attrDependencies: { spriteName: string, attrName: string }[]
}

export interface Expression extends Dependencies {
    expr: string
}

export const MOUSE_NAME = "_mouse_";


const DEFAULT_CYCLIC_DELTA = 3.0;
const _graphStorage: Map<string, Map<string, unknown>> = new Map<string, Map<string, unknown>>();
const _modelMap: Map<string, OracleModel> = new Map<string, OracleModel>();
const _clonesCreated: Map<number, Set<string>> = new Map<number, Set<string>>();

/**
 * Check the existence of a sprite.
 * @param testDriver Instance of the test driver.
 * @param pSpriteName Name of the sprite.
 */
export function checkSpriteExistence(testDriver: TestDriver, pSpriteName: ArgType): Sprite {
    const spriteNames = Array.isArray(pSpriteName) ? pSpriteName : [String(pSpriteName)];
    const correctName = spriteNames.find(name => testDriver.getSprite(name));
    if (correctName === undefined) {
        throw new SpriteNotFoundError(String(pSpriteName));
    }
    return testDriver.getSprite(correctName);
}

/**
 * Check the existence of a variable on an existing sprite.
 * @param t Instance of the test driver.
 * @param sprite Sprite instance.
 * @param pVariableName Name of the variable.
 */
export function checkVariableExistence(t: TestDriver, sprite: Sprite, pVariableName: ArgType):
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
export function checkAttributeExistence(testDriver: TestDriver, spriteName: string, pAttrName: ArgType): void {
    const attrName = String(pAttrName);
    if (!_isAnAttribute(attrName)) {
        throw new AttributeNotFoundError(spriteName, attrName);
    }
}

/**
 * Test whether a value is a number.
 */
export function testNumber(value: ArgType): number {
    const result = returnNumberIfPossible(value);
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
export function returnNumberIfPossible(value: ArgType, defaultValue: number | null = null): number | null {
    if (value == null || value === '' || isNaN(Number(value))) {
        return defaultValue;
    }
    return Number(value.toString());
}

export function isAnAttribute(attrName: string): boolean {
    // currentCostume and costume both get the name of the current costume.
    return (attributeNames as readonly string[]).includes(attrName);
}

/**
 * Checks if the given string is the name of an effect of a sprite
 * @param effectName The name of the effect
 * @return true if {@linkcode effectName} is a valid name for an effect
 * */
export function isAnEffect(effectName: ArgType): boolean {
    return (effectNames as readonly ArgType[]).includes(effectName);
}

/**
 * Calls {@link getExpectedDirectionForSprite1LookingAtTarget} with the x and y coordinates of s2
 * @param s1 Sprite looking at another sprite
 * @param s2 some sprite
 */
export function getExpectedDirectionForSprite1LookingAtSprite2(s1: Sprite, s2: Sprite): number {
    return getExpectedDirectionForSprite1LookingAtTarget(s1, s2.x, s2.y);
}

/**
 * Calculates the direction of sprite s1 if it points at some target coordinates. The rotation style does not matter,
 * since s1.direction changes independent on the graphic visible on screen.
 *
 * @param s1 Sprite looking at something
 * @param x x-coordinate of the target
 * @param y y-coordinate of the target
 */
export function getExpectedDirectionForSprite1LookingAtTarget(s1: Sprite, x: number, y: number): number {
    const xDif = x - s1.x;
    const yDif = y - s1.y;
    if (xDif == 0) {
        return yDif > 0 ? 0 : 180;
    }
    const expectedDegrees = (360 + (Math.atan2(yDif, xDif) * 180.0) / Math.PI) % 360;
    return (expectedDegrees < 270 ? 90 : 450) - expectedDegrees;
}

export function checkDirectionWithinDelta(sprite: Sprite, expected: number, delta = DEFAULT_CYCLIC_DELTA, useMode = false): boolean {
    if (!useMode || sprite.rotationStyle == "all round") {
        return checkCyclicValueWithinDelta(sprite.direction, expected, -180, 180, delta);
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
export function checkCyclicValueWithinDelta(actual: number, expected: number, min: number, max: number, delta = DEFAULT_CYCLIC_DELTA): boolean {
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
 * @param graphId Id of the graph containing the check with an expression
 */
export function getExpressionForEval(t: TestDriver, pToEval: ArgType, graphId: string): Expression {
    // todo Umlaute werden gekillt -> ß ist nicht normal dargestellt, sondern als irgendein Sonderzeichen
    const code = String(pToEval);
    const result = {expr: `(t, $, $$) => ${code}`, varDependencies: [], attrDependencies: []};
    const $ = (s: string, a: string, c: boolean) =>
        getValueForSubExpression(t, s, a, c, result);
    const $$ = get$$Function(graphId);
    try {
        // fill dependencies and check if the expression works
        eval(`($, $$) => ${code}`)($, $$);
    } catch (e: unknown) {
        if (e instanceof SyntaxError) {
            throw new ExpressionSyntaxError(e.message);
        }
        if (e instanceof EmptyExpressionError || e instanceof SpriteNotFoundError
            || e instanceof VariableNotFoundError || e instanceof AttributeNotFoundError) {
            throw e;
        }
        throw new ExprEvalError(e, code);
    }
    return result;
}

export function getStorageValue(graphId: string, key: string): unknown {
    return _graphStorage.get(graphId).get(key);
}

export function setStorageValue(graphId: string, key: string, value: unknown): unknown {
    return _graphStorage.get(graphId).set(key, value);
}

export function initialiseStorage(graphId: string, value: Map<string, unknown>): void {
    _graphStorage.set(graphId, value);
}

export function evaluateExpression(t: TestDriver, expression: string, graphId: string, log: Reason = {}, clone: Sprite = null): unknown {
    const $ = (spriteName: string, attribute: string, custom: boolean) =>
        getValueForSubExpression(t, spriteName, attribute, custom, undefined, log, clone);
    const $$ = get$$Function(graphId, log);
    return eval(expression)(t, $, $$);
}

/**
 * Get all dependencies in a js function given as a string. A dependency is a sprite
 * @param functionCode
 */
export function getDependencies(functionCode: string): Dependencies {
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

export function getNumberFunction(text: ArgType, t: TestDriver, graphId: string): () => number {
    const asNumber = returnNumberIfPossible(text);
    if (asNumber == null) {
        const func = getExpressionForEval(t, text, graphId).expr;
        return () => testNumber(Number(evaluateExpression(t, func, graphId)));
    } else {
        return () => asNumber;
    }
}

/**
 * Calculate the Euclidean distance between two points.
 * @param pos1 The first point.
 * @param pos2 The second point.
 * @return The distance between the two points.
 */
export function getDistance(pos1: { x: number, y: number }, pos2: { x: number, y: number }): number {
    const a = pos1.x - pos2.x;
    const b = pos1.y - pos2.y;
    return Math.hypot(a, b);
}

/**
 * Calculates the distance the sprite has moved since the last step.
 *
 * @param sprite Moving sprite.
 * @return The distance the sprite has moved since the last step.
 */
export function getMovedSteps(sprite: Sprite): number {
    return getDistance(sprite, sprite.old);
}

export function numberToReasonString(num: number, digits = 1): string {
    return typeof num !== "number" || Number.isInteger(num) ? String(num) : num.toFixed(digits);
}

export function movedCorrectAmountOfSteps(s: Sprite, expected: number, negated = false): CheckResult {
    const actual = getMovedSteps(s);
    const forward = expected >= 0;
    const movedDirection = getExpectedDirectionForSprite1LookingAtSprite2(s.old, s);
    const oldMovedForwards = checkDirectionWithinDelta(s.old, movedDirection);
    const directionCorrect = forward || !oldMovedForwards;
    // The floating point operations cause some slight offset of 0.xyz -> epsilon to accept a slightly wrong value.
    // With epsilon of 0.9, a difference of moving one step more than expected is not correct anymore.
    const correct = directionCorrect && approxEq(actual, Math.abs(expected), 0.9);
    return result(correct, {
        actualDistance: numberToReasonString(actual),
        expectedDistance: numberToReasonString(expected),
        oldDirection: numberToReasonString(s.old.direction),
        movedDirection: numberToReasonString(movedDirection),
        x: numberToReasonString(s.x),
        y: numberToReasonString(s.y),
    }, negated);
}

export function flipDirectionHorizontally(direction: number): number {
    return (direction < 0 ? -180 : 180) - direction;
}

export function flipDirectionVertically(direction: number): number {
    return -direction;
}

function _isAnAttribute(attrName: string): boolean {
    return isAnAttribute(attrName) ||
        (attrName.startsWith('old.') && isAnAttribute(attrName.substring(4)));
}

/**
 * The $$-function returned has two parameters. The first parameter is the key of the variable in the storage record.
 * If the second value is specified, the storage for the key is set to the given value. Otherwise the value
 * currently stored for the key is returned.
 * @param graphId Id of the graph for determining the storage.
 * @param log The log object for information on failed checks.
 */
function get$$Function(graphId: string, log: Reason = null): (key: string, value: unknown) => unknown {
    return (key: string, value?: unknown) => {
        const storage = _graphStorage.get(graphId);
        if (value === undefined) {
            const result = storage.get(key);
            if (log) {
                log[key] = String(result);
            }
            return result;
        }
        storage.set(key, value);
        return value;
    };
}

function getSprite(t: TestDriver, spriteName: string, clone: Sprite = null): Sprite {
    if (spriteName === STAGE_NAME) {
        return t.getStage();
    }
    return clone?.name === spriteName ? clone : t.getSprite(spriteName);
}

function getValueForSubExpression(t: TestDriver, spriteName: string, attribute: string,
                                  custom: boolean, dependencies: Dependencies = undefined,
                                  log: Reason = undefined, clone: Sprite = null): Sprite | Variable | string | string[] {
    if (!spriteName || spriteName == "") {
        throw new EmptyExpressionError();
    }
    const sprite: Sprite = getSprite(t, spriteName, clone);
    if (!sprite) {
        throw new SpriteNotFoundError(spriteName);
    }
    if (attribute == undefined) {
        if (log) {
            log[`$("${spriteName}")`] = `sprite id: ${sprite.id}`;
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
            log[`$(${spriteName}->${attribute})`] = String(variable.value);
        }
        return variable.value;
    } else {
        variable = sprite[attribute];
        if (!variable) {
            if (_isAnAttribute(attribute)) {
                // for whatever reason sometimes `variable = sprite[attribute];` does not work -> try this instead
                if (attribute.startsWith("old.")) {
                    variable = t.getSprite(spriteName).old[attribute.substring(4)];
                } else {
                    variable = t.getSprite(spriteName)[attribute];
                }
            } else {
                try {
                    // maybe custom flag was not specified by accident -> try custom variables
                    return getValueForSubExpression(t, spriteName, attribute, true, dependencies, log, clone);
                } catch (e) {
                    throw new AttributeNotFoundError(spriteName, attribute);
                }
            }
        }
        if (dependencies) {
            dependencies.attrDependencies.push({spriteName: sprite.name, attrName: attribute});
        }
        if (log) {
            log[`${spriteName}.${attribute}`] = String(variable);
        }
        return variable;
    }
}

export function currentMaxLayer(t: TestDriver): number {
    return Math.max(...t.getSprites().map((s: Sprite) => returnNumberIfPossible(s.layerOrder, -1)));
}

export function clearAllModels(): void {
    _modelMap.clear();
    _graphStorage.clear();
    _clonesCreated.clear();
}

export function doesModelExist(id: string): boolean {
    return _modelMap.has(id);
}

export function addModelToMap(model: OracleModel): void {
    _modelMap.set(model.id, model);
}

function _getModel(id: string): OracleModel {
    const model = _modelMap.get(id);
    if (!model) {
        throw new Error(`Model with id ${id} does not exist`);
    }
    return model;
}

export function stopModel(id: string): void {
    _getModel(id).stop();
}

export function markModelAsRestartable(id: string): boolean {
    const model = _modelMap.get(id);
    if (!model) {
        return true;
    }
    model.enableRestarting();
    return false;
}

export function restartModel(id: string, currentStep: number): void {
    _getModel(id).restart(currentStep);
}

export function registerCloneCreatedEvent(spriteName: string, step: number): void {
    addToMultiMap(_clonesCreated, step, spriteName);
}

export function wasCloneCreatedAroundStep(spriteName: string, step: number): CheckResult {
    let list = _clonesCreated.get(step);
    if (list && list.has(spriteName)) {
        return pass();
    }
    const message = list ? `there were only clones created for ${list}` : 'there was no clone created';
    list = _clonesCreated.get(step - 1);
    return list.has(spriteName) ? pass() : fail({message});
}

export function convertToRgbNumbers(pR: ArgType, pG: ArgType, pB: ArgType): [number, number, number] {
    const r = testNumber(pR);
    const g = testNumber(pG);
    const b = testNumber(pB);
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
        throw new RGBRangeError();
    }
    return [r, g, b];
}
