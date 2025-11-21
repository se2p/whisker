import {NetworkFitnessFunction} from "../networkFitness/NetworkFitnessFunction";
import {NeatChromosome} from "../networks/NeatChromosome";

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
     * Determines the type of classification.
     */
    private _classificationType: ClassificationType = 'multiLabel';

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

    get classificationType(): ClassificationType {
        return this._classificationType;
    }

    set classificationType(value: ClassificationType) {
        this._classificationType = value;
    }

    get eventSelection(): NeuroevolutionEventSelection {
        return this._eventSelection;
    }

    set eventSelection(value: NeuroevolutionEventSelection) {
        this._eventSelection = value;
    }
}

export type NeuroevolutionEventSelection = 'random' | 'activation';

export type ClassificationType = 'multiLabel' | 'multiClass';
