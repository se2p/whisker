import {NetworkFitnessFunction} from "../NetworkFitness/NetworkFitnessFunction";
import {NeatChromosome} from "../Networks/NeatChromosome";

/**
 * This class stores all relevant properties for a Neuroevolution Algorithm.
 */
export class BasicNeuroevolutionParameter {

    /**
     * The fitness function with which the networks' fitness is measured.
     */
    private _networkFitness: NetworkFitnessFunction<NeatChromosome>;

    /**
     * Timout for the execution of a scratch game during the evaluation of a network.
     */
    private _timeout: number

    /**
     * Determines how events should be selected.
     */
    private _eventSelection: NeuroevolutionEventSelection

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

    get eventSelection(): NeuroevolutionEventSelection {
        return this._eventSelection;
    }

    set eventSelection(value: NeuroevolutionEventSelection) {
        this._eventSelection = value;
    }
}

export type NeuroevolutionEventSelection = 'random' | 'activation';

