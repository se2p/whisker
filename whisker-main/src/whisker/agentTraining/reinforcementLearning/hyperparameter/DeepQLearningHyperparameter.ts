import {RLHyperparameter} from "./RLHyperparameter";

export class DeepQLearningHyperparameter extends RLHyperparameter {

    private _targetUpdateFrequency: number;
    private _evaluationFrequency: number;

    get targetUpdateFrequency(): number {
        return this._targetUpdateFrequency;
    }

    set targetUpdateFrequency(value: number) {
        this._targetUpdateFrequency = value;
    }

    get evaluationFrequency(): number {
        return this._evaluationFrequency;
    }

    set evaluationFrequency(value: number) {
        this._evaluationFrequency = value;
    }
}
