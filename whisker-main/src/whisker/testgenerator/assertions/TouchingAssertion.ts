import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";
import uid from "scratch-vm/src/util/uid";
import {SubVMBlock} from "../../../types/ScratchVMBlock";

export class TouchingAssertion extends WhiskerAssertion {

    private readonly _otherTarget: string;
    private readonly _touching: boolean;

    constructor(target: RenderedTarget, otherTarget: string, touching: boolean, cloneIndex?: number) {
        super(target, cloneIndex);
        this._otherTarget = otherTarget;
        this._touching = touching;
    }

    //evaluate(state: Map<string, AssertionTargetState>): boolean {
    //    for (const targetState of state.values()) {
    //        if (targetState.target === this._target) {
    //            return targetState.touching[this._otherTarget] === this._touching;
    //        }
    //    }
    //
    //    return true;
    //}

    // TODO: Not working right now, see comment in AssertionObserver
    evaluate(state: Map<string, AssertionTargetState>): boolean {
        return true;
    }

    toString(): string {
        if (this._touching) {
            return `assert ${this.getTargetName()} is touching ${this._otherTarget}`;
        } else {
            return `assert ${this.getTargetName()} is not touching ${this._otherTarget}`;
        }
    }

    toJavaScript(): string {
        if (this._touching) {
            return js`t.assert.ok(${this.getTargetAccessor()}.isTouchingSprite("${this._otherTarget}"), "Expected ${this.getTargetName()} to touch ${this._otherTarget}");`;
        } else {
            return js`t.assert.not(${this.getTargetAccessor()}.isTouchingSprite("${this._otherTarget}"), "Expected ${this.getTargetName()} not to touch ${this._otherTarget}");`;
        }
    }

    toScratchBlocks(): ScratchScriptSnippet {
        const assertConditionBlockId = uid();
        const isTouchingBlockId = uid();

        const assertConditionBlock: SubVMBlock =
            {
                "id": assertConditionBlockId,
                "opcode": this._touching ? "bbt_assertCondition" : "bbt_assertConditionFalse",
                "inputs": {
                    "CONDITION": {
                        "name": "CONDITION",
                        "block": isTouchingBlockId
                    }
                },
                "fields": {},
                "next": null,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        const isTouchingBlock: SubVMBlock =
            {
                "id": isTouchingBlockId,
                "opcode": "bbt_isTouching",
                "inputs": {},
                "fields": {
                    "A": {
                        "name": "A",
                        "value": this._target.id.toString()
                    },
                    "B": {
                        "name": "B",
                        "value": this._otherTarget
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": assertConditionBlockId,
                "shadow": false,
                "breakpoint": false
            };

        return {
            blocks: [assertConditionBlock, isTouchingBlock],
            first: assertConditionBlock,
            last: assertConditionBlock
        };
    }

    //static createFactory() : AssertionFactory<TouchingAssertion>{
    //    return new (class implements AssertionFactory<TouchingAssertion> {
    //        createAssertions(state: Map<string, AssertionTargetState>): TouchingAssertion[] {
    //            const assertions = [];
    //            for (const targetState of state.values()) {
    //                if (targetState.target.isStage) {
    //                    continue;
    //                }
    //                for (const [spriteName, value] of Object.entries(targetState.touching)) {
    //                    assertions.push(new TouchingAssertion(targetState.target, spriteName, value as boolean, targetState.cloneIndex));
    //                }
    //            }
    //
    //            return assertions;
    //        }
    //    })();
    //}

    // TODO: Not working right now, see comment in AssertionObserver
    static createFactory(): AssertionFactory<TouchingAssertion> {
        return new (class implements AssertionFactory<TouchingAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): TouchingAssertion[] {
                return [];
            }
        })();
    }
}
