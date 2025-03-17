import {generateEqualityAssertion, js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";
import uid from "scratch-vm/src/util/uid";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";
import {SubVMBlock} from "../../../types/ScratchVMBlock";

export class BackdropAssertion extends WhiskerAssertion {

    private readonly _backdrop: number;

    constructor(target: RenderedTarget, backdrop: number) {
        super(target);
        this._backdrop = backdrop;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.costume == this._backdrop;
            }
        }
        return false;
    }

    toString(): string {
        return `assert stage has backdrop ${this._backdrop}`;
    }

    toJavaScript(): string {
        return js`t.assert.equal(t.getStage().currentCostume, ${this._backdrop}, "Expected backdrop ${this._backdrop}");`;
    }

    toScratchBlocks(): ScratchScriptSnippet {
        const backdropBlockId = uid();
        const [assertEqualsBlock, assertEqualsBlockA, assertEqualsBlockB]
            = generateEqualityAssertion(backdropBlockId, (this._backdrop + 1).toString());

        const backdropBlock: SubVMBlock =
            {
                "id": backdropBlockId,
                "opcode": "looks_backdropnumbername",
                "inputs": {},
                "fields": {
                    "NUMBER_NAME": {
                        "name": "NUMBER_NAME",
                        "value": "number"
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": assertEqualsBlock.id,
                "shadow": false,
                "breakpoint": false
            };

        return {
            blocks: [assertEqualsBlock, assertEqualsBlockA, assertEqualsBlockB, backdropBlock],
            first: assertEqualsBlock,
            last: assertEqualsBlock
        };
    }

    static createFactory(): AssertionFactory<BackdropAssertion> {
        return new (class implements AssertionFactory<BackdropAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): BackdropAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (!targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new BackdropAssertion(targetState.target, targetState.costume));
                }

                return assertions;
            }
        })();
    }
}
