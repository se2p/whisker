import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";

export class VolumeAssertion extends WhiskerAssertion {

    private readonly _targetName: string;
    private readonly _volume: number;

    constructor (targetName: string, volume: number) {
        super();
        this._targetName = targetName;
        this._volume = volume;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        return `assert ${this._targetName} has volume ${this._volume}`;
    }
    toJavaScript(): string {
        return `t.assert.equal(t.getSprite("${this._targetName}").volume, ${this._volume}, "Expected ${this._targetName} to have volume ${this._volume}");`;
    }

    static createFactory() : AssertionFactory<VolumeAssertion>{
        return new (class implements AssertionFactory<VolumeAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): VolumeAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    assertions.push(new VolumeAssertion(targetState.name, targetState.volume));
                }

                return assertions;
            }
        })();
    }
}
