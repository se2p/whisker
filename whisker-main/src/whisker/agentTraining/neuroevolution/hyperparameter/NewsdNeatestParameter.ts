import {ManyObjectiveNeatestParameter} from "./ManyObjectiveNeatestParameter";
import {NeatMutation} from "../operators/NeatMutation";

export class NewsdNeatestParameter extends ManyObjectiveNeatestParameter {

    /**
     * The maximum age a species can have to count as "novice".
     */
    private _noviceMaxAge: number;

    private _mutationOperator: NeatMutation;

    get noviceMaxAge(): number {
        return this._noviceMaxAge;
    }

    set noviceMaxAge(value: number) {
        this._noviceMaxAge = value;
    }

    get mutationOperator(): NeatMutation {
        return this._mutationOperator;
    }

    set mutationOperator(value: NeatMutation) {
        this._mutationOperator = value;
    }
}
