import {generateEqualityAssertion, js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";
import uid from "scratch-vm/src/util/uid";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";
import {SubVMBlock} from "../../../types/ScratchVMBlock";

export class DirectionAssertion extends WhiskerAssertion {

    private readonly _direction: number;

    constructor(target: RenderedTarget, direction: number, cloneIndex?: number) {
        super(target, cloneIndex);
        this._direction = direction;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.direction == this._direction;
            }
        }

        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} has direction ${this._direction}`;
    }

    toJavaScript(): string {
        return js`t.assert.withinRange(${this.getTargetAccessor()}.direction, ${this._direction}, 1, "Expected ${this.getTargetName()} to face in direction ${this._direction} +-1");`;
    }

    toScratchBlocks(): ScratchScriptSnippet {
        const attributeBlockId = uid();
        const [assertEqualsBlock, assertEqualsBlockA, assertEqualsBlockB]
            = generateEqualityAssertion(attributeBlockId, this._direction.toString());

        const attributeBlock: SubVMBlock =
            {
                "id": attributeBlockId,
                "opcode": "bbt_attributeOf",
                "inputs": {},
                "fields": {
                    "ATTRIBUTE": {
                        "name": "ATTRIBUTE",
                        "value": "direction"
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

    static createFactory(): AssertionFactory<DirectionAssertion> {
        return new (class implements AssertionFactory<DirectionAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): DirectionAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new DirectionAssertion(targetState.target, targetState.direction, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
