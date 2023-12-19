import {SearchAlgorithm} from "../../SearchAlgorithm";
import {ScratchEventExtractor} from "../../../testcase/ScratchEventExtractor";
import {TestExecutor} from "../../../testcase/TestExecutor";
import VMWrapper = require("../../../../vm/vm-wrapper.js")
import {Chromosome} from "../../Chromosome";
import {EventSelector} from "../../../testcase/EventSelector";


/**
 * LocalSearch implementations can be plugged into a SearchAlgorithm. They improve chromosomes in various ways
 * by modifying the given chromosome in place.
 *
 * @param <C> the type of chromosomes supported by this LocalSearch operator.
 */
export abstract class LocalSearch<C extends Chromosome> {

    /**
     * The vmWrapper wrapped around the Scratch-VM.
     */
    protected readonly _vmWrapper: VMWrapper;

    /**
     * The ScratchEventExtractor used to obtain the currently available Events.
     */
    protected readonly _eventExtractor: ScratchEventExtractor;

    /**
     * The TestExecutor responsible for executing codons and resetting the state of the VM.
     */
    protected readonly _testExecutor: TestExecutor;

    /**
     * The algorithm calling the LocalSearch operator.
     */
    protected _algorithm: SearchAlgorithm<C>;

    /**
     * Defines the probability of applying the LocalSearch operator.
     */
    protected readonly _probability: number

    /**
     * Observes if the the Scratch-VM is still running
     */
    protected _projectRunning: boolean;

    /**
     * Constructs a new LocalSearch object.
     * @param vmWrapper the vmWrapper containing the Scratch-VM.
     * @param eventExtractor obtains the currently available set of events.
     * @param eventSelector
     * @param probability defines the probability of applying the concrete LocalSearch operator.
     */
    constructor(vmWrapper: VMWrapper, eventExtractor: ScratchEventExtractor, eventSelector: EventSelector,
                probability: number) {
        this._vmWrapper = vmWrapper;
        this._eventExtractor = eventExtractor;
        this._testExecutor = new TestExecutor(vmWrapper, eventExtractor, eventSelector);
        this._probability = probability;
    }

    /**
     * Applies LocalSearch to the specified chromosome.
     * @param chromosome the chromosome that will be modified by LocalSearch.
     * @returns the modified chromosome wrapped in a Promise.
     */
    abstract apply(chromosome: C): Promise<C>;

    /**
     * Determines whether LocalSearch can be applied to this chromosome.
     * @param chromosome the chromosome LocalSearch should be applied to.
     * @return boolean determining whether the LocalSearch operator can be applied to the given chromosome.
     */
    abstract isApplicable(chromosome: C): Promise<boolean>;

    /**
     * Determines whether the LocalSearch operator improved the original chromosome.
     * @param originalChromosome the chromosome LocalSearch is applied on.
     * @param modifiedChromosome the resulting chromosome after LocalSearch has been applied to the original.
     * @return boolean whether the LocalSearch operator improved the original chromosome.
     */
    abstract hasImproved(originalChromosome: C, modifiedChromosome: C): boolean

    /**
     * Sets the algorithm, the LocalSearch operator will be called from.
     * @param algorithm the SearchAlgorithm calling the LocalSearch operator.
     */
    setAlgorithm(algorithm: SearchAlgorithm<C>): void {
        this._algorithm = algorithm;
    }

    /**
     * Returns the probability of applying the given LocalSearch operator.
     * @returns the probability of applying LocalSearch
     */
    getProbability(): number {
        return this._probability;
    }

    /**
     * Event listener observing if the project is still running.
     */
    protected projectStopped(): boolean {
        return this._projectRunning = false;
    }

}
