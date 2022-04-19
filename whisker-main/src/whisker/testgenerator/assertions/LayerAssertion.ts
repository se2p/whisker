import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";

export class LayerAssertion extends WhiskerAssertion {

    private readonly _targetName: string;
    private readonly _layer: number;

    constructor (targetName: string, layer: number) {
        super();
        this._targetName = targetName;
        this._layer = layer;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        return `assert ${this._targetName} has layer ${this._layer}`;
    }
    toJavaScript(): string {
        return `// assert t.getSprite("${this._targetName}").layer == ${this._layer}`;
    }

    static createFactory() : AssertionFactory<LayerAssertion>{
        return new (class implements AssertionFactory<LayerAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): LayerAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    if (targetState.name === "Stage") {
                        continue;
                    }
                    assertions.push(new LayerAssertion(targetState.name, targetState.layer));
                }

                return assertions;
            }
        })();
    }
}
