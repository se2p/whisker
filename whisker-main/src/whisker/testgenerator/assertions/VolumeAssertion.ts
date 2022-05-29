import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";

export class VolumeAssertion extends WhiskerAssertion {

    private readonly _volume: number;

    constructor (target: RenderedTarget, volume: number, cloneIndex?: number) {
        super(target, cloneIndex);
        this._volume = volume;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        for (const targetState of Object.values(state)) {
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
        return `t.assert.equal(${this.getTargetAccessor()}.volume, ${this._volume}, "Expected ${this.getTargetName()} to have volume ${this._volume}");`;
    }

    static createFactory() : AssertionFactory<VolumeAssertion>{
        return new (class implements AssertionFactory<VolumeAssertion> {
            createAssertions(state: Map<string, Record<string, any>>): VolumeAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    assertions.push(new VolumeAssertion(targetState.target, targetState.volume, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
