import {NetworkFitnessFunction} from "../NetworkFitness/NetworkFitnessFunction";
import {NeatChromosome} from "../Networks/NeatChromosome";

/**
 * This class stores all relevant properties for a Neuroevolution Algorithm.
 */
export class DynamicSuiteParameter {

    /**
     * The fitness function with which the network fitness is measured.
     */
    private _networkFitness: NetworkFitnessFunction<NeatChromosome>;

    /**
     * Timout for the execution of a scratch game during the evaluation of the network.
     */
    private _timeout: number

    /**
     * Determines how the events should be selected.
     */
    private _eventSelection: string

    get networkFitness(): NetworkFitnessFunction<NeatChromosome> {
        return this._networkFitness;
    }

    set networkFitness(value: NetworkFitnessFunction<NeatChromosome>) {
        this._networkFitness = value;
    }

    get timeout(): number {
        return this._timeout;
    }

    set timeout(value: number) {
        this._timeout = value;
    }

    get eventSelection(): string {
        return this._eventSelection;
    }

    set eventSelection(value: string) {
        this._eventSelection = value;
    }
}
