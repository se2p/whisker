import {generateEqualityAssertion, js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";
import uid from "scratch-vm/src/util/uid";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";
import {SubVMBlock} from "../../../types/ScratchVMBlock";

export class VolumeAssertion extends WhiskerAssertion {

    private readonly _volume: number;

    constructor(target: RenderedTarget, volume: number, cloneIndex?: number) {
        super(target, cloneIndex);
        this._volume = volume;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.volume == this._volume;
            }
        }

        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} has volume ${this._volume}`;
    }

    toJavaScript(): string {
        return js`t.assert.equal(${this.getTargetAccessor()}.volume, ${this._volume}, "Expected ${this.getTargetName()} to have volume ${this._volume}");`;
    }

    toScratchBlocks(): ScratchScriptSnippet {
        const attributeBlockId = uid();
        const [assertEqualsBlock, assertEqualsBlockA, assertEqualsBlockB]
            = generateEqualityAssertion(attributeBlockId, this._volume.toString());

        const attributeBlock: SubVMBlock =
            {
                "id": attributeBlockId,
                "opcode": "bbt_attributeOf",
                "inputs": {},
                "fields": {
                    "ATTRIBUTE": {
                        "name": "ATTRIBUTE",
                        "value": "volume"
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

    static createFactory(): AssertionFactory<VolumeAssertion> {
        return new (class implements AssertionFactory<VolumeAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): VolumeAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    assertions.push(new VolumeAssertion(targetState.target, targetState.volume, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
