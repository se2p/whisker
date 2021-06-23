import {SearchAlgorithm} from "../../SearchAlgorithm";
import {ScratchEventExtractor} from "../../../testcase/ScratchEventExtractor";
import {TestExecutor} from "../../../testcase/TestExecutor";
import VMWrapper = require("../../../../vm/vm-wrapper.js")
import {Chromosome} from "../../Chromosome";


/**
 * LocalSearch implementations are plugged into a SearchAlgorithm and help improve chromosomes according to a
 * predefined fitness function by modifying the given chromosome in place.
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
     * The algorithm calling the local search operator.
     */
    protected _algorithm: SearchAlgorithm<C>;

    /**
     * Defines the probability of applying the concrete Local Search operator.
     */
    protected readonly _probability: number

    /**
     * Observes if the the Scratch-VM is still running
     */
    protected _projectRunning: boolean;

    /**
     * Constructs a new LocalSearch object.
     * @param vmWrapper the vmWrapper containing the Scratch-VM.
     * @param eventExtractor the eventExtractor used to obtain the currently available set of events.
     * @param probability Defines the probability of applying the concrete Local Search operator.
     */
    constructor(vmWrapper: VMWrapper, eventExtractor: ScratchEventExtractor, probability: number) {
        this._vmWrapper = vmWrapper;
        this._eventExtractor = eventExtractor;
        this._testExecutor = new TestExecutor(vmWrapper, eventExtractor);
        this._probability = probability;
    }

    /**
     * Applies local search to the specified chromosome.
     * @param chromosome the chromosome that should be modified by local search.
     * @returns the modified chromosome wrapped in a Promise.
     */
    abstract apply(chromosome: C): Promise<C>;

    /**
     * Determines whether local search can be applied to this chromosome.
     * @param chromosome the chromosome local search should be applied to.
     * @return boolean whether the local search operator can be applied to the given chromosome.
     */
    abstract isApplicable(chromosome: C): boolean;

    /**
     * Determines whether the local search operator improved the original chromosome.
     * @param originalChromosome the chromosome local search is applied on.
     * @param modifiedChromosome the resulting chromosome after local search has been applied to the original.
     * @return boolean whether the local search operator improved the original chromosome.
     */
    abstract hasImproved(originalChromosome: C, modifiedChromosome: C): boolean

    /**
     * Sets the algorithm, the local search operator will be called from.
     * @param algorithm the searchAlgorithm calling the local search operator.
     */
    setAlgorithm(algorithm: SearchAlgorithm<C>): void {
        this._algorithm = algorithm;
    }

    /**
     * Returns the probability of applying the given local search operator.
     * @return the probability of applying local search
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
