import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";
import uid from "scratch-vm/src/util/uid";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";
import {SubVMBlock} from "../../../types/ScratchVMBlock";

export class VisibilityAssertion extends WhiskerAssertion {

    private readonly _visibility: boolean;

    constructor(target: RenderedTarget, visibility: boolean, cloneIndex?: number) {
        super(target, cloneIndex);
        this._visibility = visibility;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.visible == this._visibility;
            }
        }

        return false;
    }

    toString(): string {
        if (this._visibility) {
            return `assert ${this.getTargetName()} is visible`;
        } else {
            return `assert ${this.getTargetName()} is not visible`;
        }
    }

    toScratchBlocks(): ScratchScriptSnippet {
        const assertConditionBlockId = uid();
        const conditionBlockId = uid();

        const assertBlock: SubVMBlock =
            {
                "id": assertConditionBlockId,
                "opcode": this._visibility ? "bbt_assertCondition" : "bbt_assertConditionFalse",
                "inputs": {
                    "CONDITION": {
                        "name": "CONDITION",
                        "block": conditionBlockId,
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

        const conditionBlock: SubVMBlock =
            {
                "id": conditionBlockId,
                "opcode": "bbt_isSpriteVisible",
                "inputs": {},
                "fields": {
                    "SPRITE": {
                        "name": "SPRITE",
                        "value": this._target.id
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": assertConditionBlockId,
                "shadow": false,
                "breakpoint": false
            };

        return {
            blocks: [assertBlock, conditionBlock],
            first: assertBlock,
            last: assertBlock
        };
    }

    toJavaScript(): string {
        if (this._visibility) {
            return js`t.assert.ok(${this.getTargetAccessor()}.visible, "Expected ${this.getTargetName()} to be visible");`;
        } else {
            return js`t.assert.not(${this.getTargetAccessor()}.visible, "Expected ${this.getTargetName()} not to be visible");`;
        }
    }

    static createFactory(): AssertionFactory<VisibilityAssertion> {
        return new (class implements AssertionFactory<VisibilityAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): VisibilityAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new VisibilityAssertion(targetState.target, targetState.visible, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
