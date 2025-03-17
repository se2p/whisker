import {generateEqualityAssertion, js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";
import uid from "scratch-vm/src/util/uid";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";
import {SubVMBlock} from "../../../types/ScratchVMBlock";

export class CostumeAssertion extends WhiskerAssertion {

    private readonly _costume: number;

    constructor(target: RenderedTarget, costume: number, cloneIndex?: number) {
        super(target, cloneIndex);
        this._costume = costume;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.costume == this._costume;
            }
        }

        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} has costume ${this._costume}`;
    }

    toJavaScript(): string {
        return js`t.assert.equal(${this.getTargetAccessor()}.currentCostume, ${this._costume}, "Expected ${this.getTargetName()} to have costume ${this._costume}");`;
    }

    toScratchBlocks(): ScratchScriptSnippet {
        const attributeBlockId = uid();
        const [assertEqualsBlock, assertEqualsBlockA, assertEqualsBlockB]
            = generateEqualityAssertion(attributeBlockId, (this._costume + 1).toString());

        const attributeBlock: SubVMBlock =
            {
                "id": attributeBlockId,
                "opcode": "bbt_attributeOf",
                "inputs": {},
                "fields": {
                    "ATTRIBUTE": {
                        "name": "ATTRIBUTE",
                        "value": "costume #"
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

    static createFactory(): AssertionFactory<CostumeAssertion> {
        return new (class implements AssertionFactory<CostumeAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): CostumeAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new CostumeAssertion(targetState.target, targetState.costume, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
