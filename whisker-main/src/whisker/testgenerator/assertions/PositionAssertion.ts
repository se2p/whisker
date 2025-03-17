import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";
import uid from "scratch-vm/src/util/uid";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";
import {SubVMBlock} from "../../../types/ScratchVMBlock";

export class PositionAssertion extends WhiskerAssertion {

    public static readonly TOLERANCE: number = 5;

    private readonly _x: number;
    private readonly _y: number;

    constructor(target: RenderedTarget, x: number, y: number, cloneIndex?: number) {
        super(target, cloneIndex);
        this._x = x;
        this._y = y;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.x == this._x && targetState.y == this._y;
            }
        }

        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} has position ${this._x}/${this._y}`;
    }

    toJavaScript(): string {
        return js`t.assert.withinRange(${this.getTargetAccessor()}.x, ${this._x}, ${PositionAssertion.TOLERANCE}, "Expected ${this.getTargetName()} to have x-position ${this._x} +-${PositionAssertion.TOLERANCE}");` + '\n' +
            js`  t.assert.withinRange(${this.getTargetAccessor()}.y, ${this._y}, ${PositionAssertion.TOLERANCE}, "Expected ${this.getTargetName()} to have y-position ${this._y} +-${PositionAssertion.TOLERANCE}");`;
    }

    toScratchBlocks(): ScratchScriptSnippet {

        const xPositionAssertion: ScratchScriptSnippet = this._generateAssertPositionWithinRangeSnippet('x');
        const yPositionAssertion: ScratchScriptSnippet = this._generateAssertPositionWithinRangeSnippet('y');

        xPositionAssertion.last.next = yPositionAssertion.first.id;
        yPositionAssertion.first.parent = xPositionAssertion.last.id;

        xPositionAssertion.blocks.push(...yPositionAssertion.blocks);
        xPositionAssertion.last = yPositionAssertion.last;

        return xPositionAssertion;
    }

    private _generateAssertPositionWithinRangeSnippet(dimension: 'x' | 'y'): ScratchScriptSnippet {

        const assertConditionBlockId = uid();
        const xyPositionBlockId = uid();
        const numberFuzzyEqualBlockId = uid();
        const numberShadowBlockId = uid();
        const numberPositionBlockId = uid();
        const numberToleranceBlockId = uid();

        const assertConditionBlock: SubVMBlock =
            {
                "id": assertConditionBlockId,
                "opcode": "bbt_assertCondition",
                "inputs": {
                    "CONDITION": {
                        "name": "CONDITION",
                        "block": numberFuzzyEqualBlockId,
                        "shadow": null
                    }
                },
                "fields": {},
                "next": null,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        const xyPositionBlock: SubVMBlock = {
            "id": xyPositionBlockId,
            "opcode": "bbt_attributeOf",
            "inputs": {},
            "fields": {
                "ATTRIBUTE": {
                    "name": "ATTRIBUTE",
                    "value": dimension === 'x' ? "x position" : "y position",
                },
                "SPRITE": {
                    "name": "SPRITE",
                    "value": this._target.id.toString()
                }
            },
            "next": null,
            "topLevel": false,
            "parent": numberFuzzyEqualBlockId,
            "shadow": false,
            "breakpoint": false
        };

        const numberFuzzyEqualBlock: SubVMBlock =
            {
                "id": numberFuzzyEqualBlockId,
                "opcode": "bbt_isNumberFuzzyEqual",
                "inputs": {
                    "A": {
                        "name": "A",
                        "block": xyPositionBlockId,
                        "shadow": numberShadowBlockId
                    },
                    "B": {
                        "name": "B",
                        "block": numberPositionBlockId,
                        "shadow": numberPositionBlockId
                    },
                    "TOLERANCE": {
                        "name": "TOLERANCE",
                        "block": numberToleranceBlockId,
                        "shadow": numberToleranceBlockId
                    }
                },
                "fields": {},
                "next": null,
                "topLevel": false,
                "parent": assertConditionBlockId,
                "shadow": false,
                "breakpoint": false
            };

        const numberShadowBlock: SubVMBlock =
            {
                "id": numberShadowBlockId,
                "opcode": "math_number",
                "inputs": {},
                "fields": {
                    "NUM": {
                        "name": "NUM",
                        "value": ""
                    }
                },
                "next": null,
                "topLevel": true,
                "parent": null,
                "shadow": true,
                "breakpoint": false
            };

        const numberPositionBlock: SubVMBlock =
            {
                "id": numberPositionBlockId,
                "opcode": "math_number",
                "inputs": {},
                "fields": {
                    "NUM": {
                        "name": "NUM",
                        "value": dimension === 'x' ? this._x.toString() : this._y.toString()
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": numberFuzzyEqualBlockId,
                "shadow": true,
                "breakpoint": false
            };

        const numberToleranceBlock: SubVMBlock =
            {
                "id": numberToleranceBlockId,
                "opcode": "math_number",
                "inputs": {},
                "fields": {
                    "NUM": {
                        "name": "NUM",
                        "value": PositionAssertion.TOLERANCE.toString()
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": numberFuzzyEqualBlockId,
                "shadow": true,
                "breakpoint": false
            };


        return {
            blocks: [assertConditionBlock, numberFuzzyEqualBlock,
                numberShadowBlock, xyPositionBlock, numberPositionBlock, numberToleranceBlock],
            first: assertConditionBlock,
            last: assertConditionBlock
        };
    }

    static createFactory(): AssertionFactory<PositionAssertion> {
        return new (class implements AssertionFactory<PositionAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): PositionAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new PositionAssertion(targetState.target, targetState.x, targetState.y, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
