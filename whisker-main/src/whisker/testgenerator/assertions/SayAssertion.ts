import {escaped, generateEqualityAssertion, js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";
import uid from "scratch-vm/src/util/uid";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";
import {SubVMBlock} from "../../../types/ScratchVMBlock";

export class SayAssertion extends WhiskerAssertion {

    private readonly _text: string;

    constructor(target: RenderedTarget, text: string, cloneIndex?: number) {
        super(target, cloneIndex);
        this._text = text;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.bubbleState === this._text;
            }
        }

        return false;
    }

    toString(): string {
        if (this._text) {
            return `assert ${this.getTargetName()} is saying "${this._text}"`;
        } else {
            return `assert ${this.getTargetName()} is not saying anything`;
        }
    }

    toJavaScript(): string {
        if (this._text) {
            return js`t.assert.equal(${this.getTargetAccessor()}.sayText, "${this.getValue()}", "Expected ${this.getTargetName()} to say ${this.getValue()}");`;
        } else {
            return js`t.assert.not(${this.getTargetAccessor()}.sayText, "Expected ${this.getTargetName()} not to say anything");`;
        }
    }

    toScratchBlocks(): ScratchScriptSnippet {
        const attributeBlockId = uid();
        const [assertEqualsBlock, assertEqualsBlockA, assertEqualsBlockB]
            = generateEqualityAssertion(attributeBlockId, this._text);

        const attributeBlock: SubVMBlock =
            {
                "id": attributeBlockId,
                "opcode": "bbt_attributeOf",
                "inputs": {},
                "fields": {
                    "ATTRIBUTE": {
                        "name": "ATTRIBUTE",
                        "value": "saying text"
                    },
                    "SPRITE": {
                        "name": "SPRITE",
                        "value": this._target.id
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": assertEqualsBlock.id,
                "shadow": false,
                "breakpoint": false
            };

        return {
            blocks: [assertEqualsBlock, assertEqualsBlockA, assertEqualsBlockB, attributeBlock],
            first: assertEqualsBlock,
            last: assertEqualsBlock
        };
    }

    private getValue(): string {
        return escaped(this._text);
    }

    static createFactory(): AssertionFactory<SayAssertion> {
        return new (class implements AssertionFactory<SayAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): SayAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new SayAssertion(targetState.target, targetState.bubbleState, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
