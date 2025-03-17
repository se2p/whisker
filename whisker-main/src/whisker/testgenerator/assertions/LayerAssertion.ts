import {generateEqualityAssertion, js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";
import uid from "scratch-vm/src/util/uid";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";
import {SubVMBlock} from "../../../types/ScratchVMBlock";

export class LayerAssertion extends WhiskerAssertion {

    private readonly _layer: number;

    constructor(target: RenderedTarget, layer: number, cloneIndex?: number) {
        super(target, cloneIndex);
        this._layer = layer;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.layer == this._layer;
            }
        }

        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} has layer ${this._layer}`;
    }

    toJavaScript(): string {
        if (this._target.isOriginal) {
            return js`t.assert.equal(${this.getTargetAccessor()}.layerOrder, ${this._layer}, "Expected ${this.getTargetName()} to be at layer ${this._layer}");`;
        } else {
            return js`t.assert.equal(${this.getTargetAccessor()}.getLayerOrder(), ${this._layer}, "Expected ${this.getTargetName()} to be at layer ${this._layer}");`;
        }
    }

    toScratchBlocks(): ScratchScriptSnippet {
        const attributeBlockId = uid();
        const [assertEqualsBlock, assertEqualsBlockA, assertEqualsBlockB]
            = generateEqualityAssertion(attributeBlockId, this._layer.toString());

        const attributeBlock: SubVMBlock =
            {
                "id": attributeBlockId,
                "opcode": "bbt_attributeOf",
                "inputs": {},
                "fields": {
                    "ATTRIBUTE": {
                        "name": "ATTRIBUTE",
                        "value": "layer"
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

    static createFactory(): AssertionFactory<LayerAssertion> {
        return new (class implements AssertionFactory<LayerAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): LayerAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new LayerAssertion(targetState.target, targetState.layer, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
