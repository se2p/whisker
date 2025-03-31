import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";
import uid from "scratch-vm/src/util/uid";
import {SubVMBlock} from "../../../types/ScratchVMBlock";

export class TouchingEdgeAssertion extends WhiskerAssertion {

    private readonly _touching: boolean;

    constructor(target: RenderedTarget, touching: boolean, cloneIndex?: number) {
        super(target, cloneIndex);
        this._touching = touching;
    }

    //evaluate(state: Map<string, AssertionTargetState>): boolean {
    //    for (const targetState of state.values()) {
    //        if (targetState.target === this._target) {
    //            return targetState.touchingEdge === this._touching;
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
            return `assert ${this.getTargetName()} is touching the edge`;
        } else {
            return `assert ${this.getTargetName()} is not touching the edge`;
        }
    }

    toJavaScript(): string {
        if (this._touching) {
            return js`t.assert.ok(${this.getTargetAccessor()}.isTouchingEdge(), "Expected ${this.getTargetName()} to touch edge");`;
        } else {
            return js`t.assert.not(${this.getTargetAccessor()}.isTouchingEdge(), "Expected ${this.getTargetName()} not to touch edge");`;
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
                        "block": isTouchingBlockId,
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
                        "value": "_edge_"
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

    //static createFactory() : AssertionFactory<TouchingEdgeAssertion>{
    //    return new (class implements AssertionFactory<TouchingEdgeAssertion> {
    //        createAssertions(state: Map<string, AssertionTargetState>): TouchingEdgeAssertion[] {
    //            const assertions = [];
    //            for (const targetState of state.values()) {
    //                if (targetState.target.isStage) {
    //                    continue;
    //                }
    //                assertions.push(new TouchingEdgeAssertion(targetState.target, targetState.touchingEdge, targetState.cloneIndex));
    //            }
    //
    //            return assertions;
    //        }
    //    })();
    //}

    // TODO: Not working right now, see comment in AssertionObserver
    static createFactory(): AssertionFactory<TouchingEdgeAssertion> {
        return new (class implements AssertionFactory<TouchingEdgeAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): TouchingEdgeAssertion[] {
                return [];
            }
        })();
    }
}
