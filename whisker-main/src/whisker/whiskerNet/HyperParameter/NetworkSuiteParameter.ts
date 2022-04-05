import {NetworkFitnessFunction} from "../NetworkFitness/NetworkFitnessFunction";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {StoppingCondition} from "../../search/StoppingCondition";

/**
 * This class stores all relevant properties for a Neuroevolution Algorithm.
 */
export class NetworkSuiteParameter {

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

    // ---------------------------------- Train Parameter ---------------------------------------------

    /**
     * Determines whether the networks should be re-trained on the given project.
     */
    private _train: boolean;

    /**
     * Population size during the re-training process.
     */
    private _trainPopulationSize = 100;

    /**
     * Stopping conditions during the re-training process.
     */
    private _trainStoppingCondition: StoppingCondition<NeatChromosome>;


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

    get train(): boolean {
        return this._train;
    }

    set train(value: boolean) {
        this._train = value;
    }

    get trainPopulationSize(): number {
        return this._trainPopulationSize;
    }

    set trainPopulationSize(value: number) {
        this._trainPopulationSize = value;
    }

    get trainStoppingCondition(): StoppingCondition<NeatChromosome> {
        return this._trainStoppingCondition;
    }

    set trainStoppingCondition(value: StoppingCondition<NeatChromosome>) {
        this._trainStoppingCondition = value;
    }
}
