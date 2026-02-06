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
import {ArgType, Position} from "./schema";
import {attributeNames, AttrName, effectNames} from "../checks/CheckTypes";
import {STAGE_NAME} from "../../../assembler/utils/selectors";
import {approxEq, approxGt, approxLt, EPSILON, Interval} from "../checks/Comparison";
import {CheckResult, fail, pass, Reason} from "../checks/CheckResult";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";
import {OracleModel} from "../components/AbstractModel";
import {ICheckJSON} from "../checks/AbstractCheck";
import {Optional} from "../../utils/Optional";

export interface Dependencies {
    varDependencies: { spriteName: string, varName: string }[],
    attrDependencies: { spriteName: string, attrName: string }[]
}

export interface Expression extends Dependencies {
    expr: string
}

export const MOUSE_NAME = "_mouse_";

export type MultiMap<K, V> = Map<K, Set<V>>;

type ScratchBaseTypes = number | string | boolean
type ScratchRoundInputType = ScratchBaseTypes | ScratchBaseTypes[];
export type XYBounds = { x: { min: number, max: number }, y: { min: number, max: number } };

type DirectionSubType = {
    direction: number,
    rotationStyle: string
};

const DEFAULT_CYCLIC_DELTA = 3.0;
const _graphStorage: Map<string, Map<string, unknown>> = new Map<string, Map<string, unknown>>();
const _modelMap: Map<string, OracleModel> = new Map<string, OracleModel>();
const _clonesCreated: Map<number, Set<string>> = new Map<number, Set<string>>();

export function addToMultiMap<K, V>(map: MultiMap<K, V>, key: K, value: V): void {
    const set = map.get(key);
    if (set) {
        set.add(value);
    } else {
        map.set(key, new Set([value]));
    }
}

export function getXYBounds(s: Sprite): XYBounds {
    return {x: s.getRangeOfX(), y: s.getRangeOfY()};
}

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

export function checkDirectionWithinDelta(sprite: DirectionSubType, expected: number, delta = DEFAULT_CYCLIC_DELTA, useMode = false): boolean {
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
    const result = {expr: `(t, $, $$, $MU) => ${code}`, varDependencies: [], attrDependencies: []};
    const $ = (s: string, a: string, c: boolean) =>
        getValueForSubExpression(t, s, a, c, result);
    const $$ = get$$Function(graphId);
    try {
        // fill dependencies and check if the expression works
        eval(`($, $$, $MU) => ${code}`)($, $$, new DependencyMU(result, t));
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
    const $MU = new ModelUtil(t, log, clone);
    return eval(expression)(t, $, $$, $MU);
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
export function getDistance(pos1: Position, pos2: Position): number {
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

function clamp(value: number, bounds: Interval): number {
    return Math.max(Math.min(value, bounds.max), bounds.min);
}

export function movedCorrectAmountOfSteps(s: Sprite, expected: number,
                                          bounds: XYBounds = null, reason: Reason = null): boolean {
    if (bounds === null) {
        bounds = getXYBounds(s);
    }
    const actual = getMovedSteps(s);
    const expectedAbsDist = Math.abs(expected);
    // The floating point operations cause some slight offset of 0.xyz -> epsilon to accept a slightly wrong value.
    // With epsilon of 0.9, a difference of moving one step more than expected is not correct anymore.
    const distanceCorrect = approxEq(actual, expectedAbsDist, 0.9);
    const isCloseToBounds = s.x - expectedAbsDist <= bounds.x.min || s.x + expectedAbsDist >= bounds.x.max
        || s.y - expectedAbsDist <= bounds.y.min || s.y + expectedAbsDist >= bounds.y.max;
    const forward = expected >= 0;
    const movedDirection = getExpectedDirectionForSprite1LookingAtSprite2(s.old, s);
    const oldMovedForwards = checkDirectionWithinDelta(s.old, movedDirection);
    const directionCorrect = forward || !oldMovedForwards;
    const correct = directionCorrect && (distanceCorrect || isCloseToBounds);
    if (reason) {
        reason["actualDistance"] = numberToReasonString(actual);
        reason["expectedDistance"] = numberToReasonString(expected);
        reason["oldDir"] = numberToReasonString(s.old.direction);
        reason["movedDir"] = numberToReasonString(movedDirection);
        reason["x"] = numberToReasonString(s.x);
        reason["oldX"] = numberToReasonString(s.old.x);
        reason["y"] = numberToReasonString(s.y);
        reason["oldY"] = numberToReasonString(s.old.y);
    }

    return correct;
}

export function flipDirectionHorizontally(direction: number): number {
    return (direction < 0 ? -180 : 180) - direction;
}

export function flipDirectionVertically(direction: number): number {
    return -direction;
}

type CheckLike = Optional<ICheckJSON, "negated">;

export function checkToString(check: CheckLike, dictionary: (key: string) => string = null, maxLength = 40): string {
    if (dictionary === null) {
        dictionary = (key) => key;
    }
    const negated = check["negated"] ? "!" : "";
    const argToString: (a: ArgType) => string | number | boolean | null =
        a => typeof a === "object"
            ? Object.values(a).some(v => v !== null) ? JSON.stringify(a) : null
            : (typeof a === "string" && a.length > maxLength ? a.substring(0, maxLength - 3) + "..." : a);
    const args = check.args.map(argToString).filter(a => a != null).map(dictionary).join(',');
    return `${negated}${dictionary(check.name)}(${args})`;
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
            if (attribute === "pos") {
                dependencies.attrDependencies.push({spriteName: sprite.name, attrName: "x"});
                dependencies.attrDependencies.push({spriteName: sprite.name, attrName: "y"});
            } else {
                dependencies.attrDependencies.push({spriteName: sprite.name, attrName: attribute});
            }
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

export function hexToRgb(hexString: string): [number, number, number] {
    // If necessary, remove the prefix "#" or "0x" from the string to retain just the hex digits.
    hexString = hexString.replace(/^(#|0x)/, "");
    const r = parseInt(hexString.substring(0, 2), 16);
    const g = parseInt(hexString.substring(2, 4), 16);
    const b = parseInt(hexString.substring(4, 6), 16);
    return [r, g, b];
}

export function toScratchString(value: ScratchRoundInputType): string {
    if (!Array.isArray(value)) {
        return value.toString();
    }

    const strings = value.map(v => toScratchString(v));
    const delim = strings.some(s => s.length !== 1) ? " " : "";
    // ["a", "b", "c"] → "abc"
    // ["a", "foo", "bar"] → "a foo bar"
    return strings.join(delim);
}

export function toScratchNumber(value: ScratchRoundInputType): number {
    const res: number = typeof value == "string" || typeof value == "boolean" || typeof value == "number"
        ? Number(value)
        : Number(toScratchString(value));
    return Number.isNaN(res) ? 0 : res;
}

export function toScratchBoolean(value: ScratchRoundInputType): boolean {
    return !(value === 0 || value === "0" || String(value).toLowerCase() === "false" || value === "" || value === false);
}

export function isConsideredNumber(value: ScratchRoundInputType): boolean {
    return !Number.isNaN(Number(value));
}

export function scratchCmp(left: ScratchRoundInputType, right: ScratchRoundInputType, comp: "<" | "==" | ">", epsilon = EPSILON): boolean {
    const compareNum = isConsideredNumber(left) && isConsideredNumber(right);
    const leftValue = compareNum ? toScratchNumber(left) : toScratchString(left).toLowerCase();
    const rightValue = compareNum ? toScratchNumber(right) : toScratchString(right).toLowerCase();
    switch (comp) {
        case "<":
            return approxLt(leftValue, rightValue, epsilon);
        case "==":
            return approxEq(leftValue, rightValue, epsilon);
        case ">":
            return approxGt(leftValue, rightValue, epsilon);
        default:
            throw new NonExhaustiveCaseDistinction(comp);
    }
}

export function scratchStringContains(value: ScratchRoundInputType, substring: ScratchRoundInputType): boolean {
    return toScratchString(value).toLowerCase()
        .includes(toScratchString(substring).toLowerCase());
}

export function scratchListContains(list: ScratchBaseTypes[], element: ScratchRoundInputType): boolean {
    return list.some(e => scratchCmp(e, element, "=="));
}

export function scratchOpMod(left: ScratchRoundInputType, right: ScratchRoundInputType): number {
    const leftNum = toScratchNumber(left);
    const rightNum = toScratchNumber(right);
    const modResult = leftNum % rightNum;
    if (leftNum >= 0 && rightNum >= 0 || leftNum <= 0 && rightNum <= 0) {
        return modResult;
    }
    if (leftNum < 0) {
        return modResult - rightNum;
    }
    return modResult === 0 ? 0 : -modResult;
}

export function scratchCalc(left: ScratchRoundInputType, right: ScratchRoundInputType, operator: "+" | "-" | "*" | "/" | "%"): number {
    switch (operator) {
        case "-":
            return toScratchNumber(left) - toScratchNumber(right);
        case "+":
            return toScratchNumber(left) + toScratchNumber(right);
        case "*":
            return toScratchNumber(left) * toScratchNumber(right);
        case "/":
            return toScratchNumber(left) / toScratchNumber(right);
        case "%":
            return scratchOpMod(left, right);
    }
}

export function getBounds(s: Sprite, t: TestDriver, attr: AttrName): Interval {
    switch (attr) {
        case "x":
            return {...s.getRangeOfX()};
        case "y":
            return {...s.getRangeOfY()};
        case "size":
            return {...s.getRangeOfSize()};
        case "layerOrder":
            return {min: 1, max: currentMaxLayer(t)};
        case "direction":
            return {min: -180, max: 180};
        case "volume":
            return {min: 0, max: 100};
        case "currentCostume":
            return {min: 0, max: s.getCostumeCount()};
        // the wiki states bounds for effects but the actual value of the effects has no bounds
        default:
            return null;
    }
}

class ModelUtil {
    private readonly _log: Reason;
    private readonly _counters: Record<string, number>;
    private readonly _testDriver: TestDriver;
    private readonly _clone: Sprite | null;

    constructor(testDriver: TestDriver, log: Reason = {}, clone: Sprite | null = null) {
        this._testDriver = testDriver;
        this._log = log;
        this._counters = {
            "<": 0,
            "==": 0,
            ">": 0,
            "+": 0,
            "-": 0,
            "*": 0,
            "/": 0,
            "%": 0,
            "dist": 0,
        };
        this._clone = clone;
    }

    public cmp(op1: ScratchRoundInputType, op2: ScratchRoundInputType, comp: "<" | "==" | ">", epsilon = EPSILON): boolean {
        if (isConsideredNumber(op1) && isConsideredNumber(op2)) {
            this._log[`cmp_${comp}_${++this._counters[comp]}`] = Math.abs(toScratchNumber(op1) - toScratchNumber(op2));
        }
        return scratchCmp(op1, op2, comp, epsilon);
    }

    public calc(left: ScratchRoundInputType, right: ScratchRoundInputType, operator: "+" | "-" | "*" | "/" | "%"): number {
        const result = scratchCalc(left, right, operator);
        this._log[`calc_${operator}_${++this._counters[operator]}`] = result;
        return result;
    }

    public stepsCorrect(s: Sprite, expected: number): boolean {
        return movedCorrectAmountOfSteps(s, expected, null, this._log);
    }

    public toStr(input: ScratchRoundInputType): string {
        return toScratchString(input);
    }

    public log(key: string, value: unknown) {
        this._log[key] = value;
    }

    public xCordEqual(s1: string, s2: string) {
        return this.cmp(this._getTarget(s1).x, this._getTarget(s2).x, "==");
    }

    public yCordEqual(s1: string, s2: string) {
        return this.cmp(this._getTarget(s1).y, this._getTarget(s2).y, "==");
    }

    public posEqual(s1: string, s2: string) {
        const t1 = this._getTarget(s1);
        const t2 = this._getTarget(s2);
        return this.cmp(t1.x, t2.x, "==") && this.cmp(t1.y, t2.y, "==");
    }

    public attrChange(spriteName: string, attr: AttrName, expected: number, epsilon = EPSILON): boolean {
        const sprite: Sprite = this._getSprite(spriteName);
        const before = sprite.old[attr];
        const after = sprite[attr];
        return this.cmp(this.calc(after, before, "-"), expected, "==", epsilon);
    }

    public glidingChange(spriteName: string, attr: "x" | "y", expected: number, epsilon = EPSILON): boolean {
        if (Number.isNaN(expected)) {
            return true; // target is probably not available
        }
        const sprite: Sprite = this._getSprite(spriteName);
        const before = sprite.old[attr];
        const after = sprite[attr];
        const dif = after - before;
        this.log('sprite.x', sprite.x);
        this.log('sprite.y', sprite.y);
        this.log(`${attr}Change`, dif);
        this.log(`d(expected,actual)`, Math.abs(dif - expected));
        return approxEq(dif, expected, epsilon);
    }

    public attrComp(spriteName: string, attr: AttrName, expected: ScratchRoundInputType): boolean {
        const s = this._getSprite(spriteName);
        const actual = s[attr];
        this.log("value", actual);
        this.log("expected", expected);
        if (attr === "direction") {
            return checkDirectionWithinDelta(s, expected as number);
        }
        const bound = getBounds(s, this._testDriver, attr);
        return this.cmp(actual, expected, "==")
            || (bound !== null) && this.cmp(clamp(actual, bound), clamp(toScratchNumber(expected), bound), "==");
    }

    public dist(spriteName: string, other: string): number {
        const dist = getDistance(this._getTarget(spriteName), this._getTarget(other));
        this._log[`dist_${++this._counters["dist"]}`] = dist;
        return dist;
    }

    public colorTouchColor(sprite: string, color1: [number, number, number], color2: [number, number, number]): boolean {
        const s = this._getSprite(sprite);
        return s.isColorTouchingColor(color1, color2) || s.isColorTouchingColor(color2, color1);
    }

    public touchingObj(sprite: string, obj: string): boolean {
        if (obj === "_edge_") {
            return this._getSprite(sprite).isTouchingEdge();
        }
        if (obj === MOUSE_NAME) {
            return this._getSprite(sprite).isTouchingMouse();
        }
        return this._getSprite(sprite).isTouchingSprite(obj);
    }

    public touchColor(sprite: string, color: [number, number, number]): boolean {
        return this._getSprite(sprite).isTouchingColor(color);
    }

    private _getTarget(s: string): Position {
        if (s === MOUSE_NAME) {
            return this._testDriver.getMousePos();
        }
        return this._getSprite(s);
    }

    private _getSprite(s: string): Sprite {
        return getSprite(this._testDriver, s, this._clone);
    }
}

class DependencyMU extends ModelUtil {
    private readonly _dependencies: Dependencies;

    constructor(dependencies: Dependencies, testDriver: TestDriver, log: Reason = {}, clone: Sprite | null = null) {
        super(testDriver, log, clone);
        this._dependencies = dependencies;
    }

    public override dist(spriteName: string, other: string): number {
        this._add(spriteName, "x", "y");
        this._add(other, "x", "y");
        return super.dist(spriteName, other);
    }

    public override stepsCorrect(s: Sprite, expected: number): boolean {
        this._add(s.name, "x", "y");
        return super.stepsCorrect(s, expected);
    }

    public override attrComp(spriteName: string, attr: AttrName, expected: ScratchRoundInputType): boolean {
        this._dependencies.attrDependencies.push({spriteName, attrName: attr});
        return super.attrComp(spriteName, attr, expected);
    }

    public override attrChange(spriteName: string, attr: AttrName, expected: number, epsilon: number = EPSILON): boolean {
        this._dependencies.attrDependencies.push({spriteName, attrName: attr});
        return super.attrChange(spriteName, attr, expected, epsilon);
    }

    public override xCordEqual(s1: string, s2: string): boolean {
        this._add(s1, "x");
        this._add(s2, "x");
        return super.xCordEqual(s1, s2);
    }

    public override yCordEqual(s1: string, s2: string): boolean {
        this._add(s1, "y");
        this._add(s2, "y");
        return super.xCordEqual(s1, s2);
    }

    public override posEqual(s1: string, s2: string): boolean {
        this._add(s1, "x", "y");
        this._add(s2, "x", "y");
        return super.posEqual(s1, s2);
    }

    public override glidingChange(spriteName: string, attr: "x" | "y", expected: number, epsilon: number = EPSILON): boolean {
        this._add(spriteName, attr);
        return super.glidingChange(spriteName, attr, expected, epsilon);
    }

    public override colorTouchColor(sprite: string, color1: [number, number, number], color2: [number, number, number]): boolean {
        this._add(sprite, "x", "y", "visible", "direction");
        return super.colorTouchColor(sprite, color1, color2);
    }

    public override touchingObj(sprite: string, obj: string): boolean {
        this._add(sprite, "x", "y", "visible", "direction");
        this._add(obj, "x", "y", "visible", "direction");
        return super.touchingObj(sprite, obj);
    }

    public override touchColor(sprite: string, color: [number, number, number]): boolean {
        this._add(sprite, "x", "y", "visible", "direction");
        return super.touchColor(sprite, color);
    }

    private _add(spriteName: string, ...attrNames: AttrName[]): void {
        if (spriteName !== MOUSE_NAME && spriteName !== "_edge_") {
            attrNames.forEach(attrName => this._dependencies.attrDependencies.push({spriteName, attrName}));
        }
    }
}
