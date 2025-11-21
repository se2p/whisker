import {NeatMutation} from "../operators/NeatMutation";
import {ManyObjectiveNeatestParameter} from "./ManyObjectiveNeatestParameter";

export class MioNeatestParameter extends ManyObjectiveNeatestParameter {

    /**
     * The operator used for mutation.
     */
    private _mutationOperator: NeatMutation;

    /**
     * The maximum size a fitness function's archive population.
     */
    private _maxArchiveSize = 20;

    /**
     * Defines the number of mutations applied to a given Chromosome within one round of mutation during search.
     */
    private _maxMutationCount = 10;

    /**
     * The probability for applying one structural mutation.
     */
    private _structMutationProb = 0.6;

    /**
     * Defines the probability of sampling a new Chromosome instead of mutating an existing one during search.
     */
    private _randomSelectionProbability = 0.5;

    // ----------------- Focus Phase Params -------------------

    /**
     * The percentage of time after which MIO's focus phase starts.
     */
    private _focusedPhaseStart = 10;

    /**
     * The maximum size a fitness function's archive population after the focused phase has begun.
     */
    private _maxArchiveSizeFocusedPhase = 5;

    /**
     * after the focused phase has begun.
     * @private
     */
    private _maxMutationCountFocusedPhase = 15;

    /**
     * Defines the probability of sampling a new Chromosome instead of mutating an existing one during search
     * after the focused phase has begun.
     */
    private _randomSelectionProbabilityFocusedPhase = 0.5;


    get mutationOperator(): NeatMutation {
        return this._mutationOperator;
    }

    set mutationOperator(value: NeatMutation) {
        this._mutationOperator = value;
    }

    get maxArchiveSize(): number {
        return this._maxArchiveSize;
    }

    set maxArchiveSize(value: number) {
        this._maxArchiveSize = value;
    }

    get maxMutationCount(): number {
        return this._maxMutationCount;
    }

    set maxMutationCount(value: number) {
        this._maxMutationCount = value;
    }

    get structMutationProb(): number {
        return this._structMutationProb;
    }

    set structMutationProb(value: number) {
        this._structMutationProb = value;
    }

    get randomSelectionProbability(): number {
        return this._randomSelectionProbability;
    }

    set randomSelectionProbability(value: number) {
        this._randomSelectionProbability = value;
    }

    get focusedPhaseStart(): number {
        return this._focusedPhaseStart;
    }

    set focusedPhaseStart(value: number) {
        this._focusedPhaseStart = value;
    }

    get maxArchiveSizeFocusedPhase(): number {
        return this._maxArchiveSizeFocusedPhase;
    }

    set maxArchiveSizeFocusedPhase(value: number) {
        this._maxArchiveSizeFocusedPhase = value;
    }

    get maxMutationCountFocusedPhase(): number {
        return this._maxMutationCountFocusedPhase;
    }

    set maxMutationCountFocusedPhase(value: number) {
        this._maxMutationCountFocusedPhase = value;
    }

    get randomSelectionProbabilityFocusedPhase(): number {
        return this._randomSelectionProbabilityFocusedPhase;
    }

    set randomSelectionProbabilityFocusedPhase(value: number) {
        this._randomSelectionProbabilityFocusedPhase = value;
    }

}

