import {StoppingCondition} from "../../search/StoppingCondition";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {BasicNeuroevolutionParameter} from "./BasicNeuroevolutionParameter";


export class NeuroevolutionTestGenerationParameter extends BasicNeuroevolutionParameter {

    // ----------------- Population Management -------------------

    /**
     * The size of the initial network population.
     */
    private _populationSize = 150;

    /**
     * Number of desired species.
     */
    private _numberOfSpecies = 5;

    /**
     * Specifies how many member per species survive in each generation.
     */
    private _parentsPerSpecies = 0.20;

    /**
     * Specifies when Species start go get penalized if no improvement is being observed.
     */
    private _penalizingAge = 15;

    /**
     * Specifies how much of a boost young generations should get (1.0 for no boost at all).
     */
    private _ageSignificance = 1.0;

    /**
     * Probability of adding a Sprite as input to the network during the generation of the network population if
     * a sparse generation technique is used.
     */
    private _inputRate = 0.3;

    /**
     * The activation function used within hidden nodes.
     */
    private _activationFunction: ActivationFunction


    // ----------------- Mutation -------------------
    /**
     * Probability of applying Mutation without Crossover.
     */
    private _mutationWithoutCrossover = 0.25

    /**
     * Probability of adding a new connection between nodes during mutation.
     */
    private _mutationAddConnection = 0.05

    /**
     * Probability of adding a recurrent connection within the "addConnection" mutation.
     */
    private _recurrentConnection = 0.1;

    /**
     * Number of tries for finding a valid node pair to crate a nove connection within the addConnection mutation.
     */
    private _addConnectionTries = 50;

    /**
     * Number of offspring reserved for the population champion.
     */
    private _populationChampionNumberOffspring = 3;

    /**
     * Number of population champion clones.
     */
    private _populationChampionNumberClones = 1;

    /**
     * Probability of mutating the connections of a population champion.
     */
    private _populationChampionConnectionMutation = 0.3;

    /**
     * Probability of adding a new node to the network.
     */
    private _mutationAddNode = 0.03;

    /**
     * Probability of mutating the weights of a network.
     */
    private _mutateWeights = 0.6;

    /**
     * Defines how strong the weights are perturbed during weight mutation.
     */
    private _perturbationPower = 2.5;

    /**
     * Probability of toggling the enable state of a network's connection gene.
     */
    private _mutateToggleEnableConnection = 0.1;

    /**
     * Number of toggled connections during a toggleEnableConnection mutation.
     */
    private _toggleEnableConnectionTimes = 3;

    /**
     * Probability of enabling a previously disabled connection gene.
     */
    private _mutateEnableConnection = 0.03;


    // ----------------- Crossover -------------------
    /**
     * Probability of applying Crossover without a following Mutation.
     */
    private _crossoverWithoutMutation = 0.25;

    /**
     * Probability of mating organisms outside their species.
     */
    private _interspeciesMating = 0.001;


    // ----------------- Compatibility Distance -------------------
    /**
     * Determines up to which compatibility distance two organisms belong to the same species.
     */
    private _compatibilityDistanceThreshold = 3.0;

    /**
     * Defines the importance of disjoint connections.
     */
    private _disjointCoefficient = 1;

    /**
     * Defines the importance of excess connections.
     */
    private _excessCoefficient = 1;

    /**
     * Defines the importance of the weights in case of matching connections.
     */
    private _weightCoefficient = 0.5;


    // ----------------- Miscellaneous -------------------

    /**
     * Stopping condition for test generation.
     */
    private _stoppingCondition: StoppingCondition<NeatChromosome>;

    /**
     * Size of reference trace to be used as test oracle.
     */
    private _activationTraceRepetitions = 0;

    /**
     * Defines whether after each generation a population record containing all chromosomes should be printed as JSON.
     */
    private _printPopulationRecord = false;

    get populationSize(): number {
        return this._populationSize;
    }

    set populationSize(value: number) {
        this._populationSize = value;
    }

    get numberOfSpecies(): number {
        return this._numberOfSpecies;
    }

    set numberOfSpecies(value: number) {
        this._numberOfSpecies = value;
    }

    get parentsPerSpecies(): number {
        return this._parentsPerSpecies;
    }

    set parentsPerSpecies(value: number) {
        this._parentsPerSpecies = value;
    }

    get penalizingAge(): number {
        return this._penalizingAge;
    }

    set penalizingAge(value: number) {
        this._penalizingAge = value;
    }

    get ageSignificance(): number {
        return this._ageSignificance;
    }

    set ageSignificance(value: number) {
        this._ageSignificance = value;
    }

    get inputRate(): number {
        return this._inputRate;
    }

    set inputRate(value: number) {
        this._inputRate = value;
    }

    get activationFunction(): ActivationFunction {
        return this._activationFunction;
    }

    set activationFunction(value: ActivationFunction) {
        this._activationFunction = value;
    }

    get mutationWithoutCrossover(): number {
        return this._mutationWithoutCrossover;
    }

    set mutationWithoutCrossover(value: number) {
        this._mutationWithoutCrossover = value;
    }

    get mutationAddConnection(): number {
        return this._mutationAddConnection;
    }

    set mutationAddConnection(value: number) {
        this._mutationAddConnection = value;
    }

    get recurrentConnection(): number {
        return this._recurrentConnection;
    }

    set recurrentConnection(value: number) {
        this._recurrentConnection = value;
    }

    get addConnectionTries(): number {
        return this._addConnectionTries;
    }

    set addConnectionTries(value: number) {
        this._addConnectionTries = value;
    }

    get populationChampionNumberOffspring(): number {
        return this._populationChampionNumberOffspring;
    }

    set populationChampionNumberOffspring(value: number) {
        this._populationChampionNumberOffspring = value;
    }

    get populationChampionNumberClones(): number {
        return this._populationChampionNumberClones;
    }

    set populationChampionNumberClones(value: number) {
        this._populationChampionNumberClones = value;
    }

    get populationChampionConnectionMutation(): number {
        return this._populationChampionConnectionMutation;
    }

    set populationChampionConnectionMutation(value: number) {
        this._populationChampionConnectionMutation = value;
    }

    get mutationAddNode(): number {
        return this._mutationAddNode;
    }

    set mutationAddNode(value: number) {
        this._mutationAddNode = value;
    }

    get mutateWeights(): number {
        return this._mutateWeights;
    }

    set mutateWeights(value: number) {
        this._mutateWeights = value;
    }

    get perturbationPower(): number {
        return this._perturbationPower;
    }

    set perturbationPower(value: number) {
        this._perturbationPower = value;
    }

    get mutateToggleEnableConnection(): number {
        return this._mutateToggleEnableConnection;
    }

    set mutateToggleEnableConnection(value: number) {
        this._mutateToggleEnableConnection = value;
    }

    get toggleEnableConnectionTimes(): number {
        return this._toggleEnableConnectionTimes;
    }

    set toggleEnableConnectionTimes(value: number) {
        this._toggleEnableConnectionTimes = value;
    }

    get mutateEnableConnection(): number {
        return this._mutateEnableConnection;
    }

    set mutateEnableConnection(value: number) {
        this._mutateEnableConnection = value;
    }

    get crossoverWithoutMutation(): number {
        return this._crossoverWithoutMutation;
    }

    set crossoverWithoutMutation(value: number) {
        this._crossoverWithoutMutation = value;
    }

    get interspeciesMating(): number {
        return this._interspeciesMating;
    }

    set interspeciesMating(value: number) {
        this._interspeciesMating = value;
    }

    get compatibilityDistanceThreshold(): number {
        return this._compatibilityDistanceThreshold;
    }

    set compatibilityDistanceThreshold(value: number) {
        this._compatibilityDistanceThreshold = value;
    }

    get disjointCoefficient(): number {
        return this._disjointCoefficient;
    }

    set disjointCoefficient(value: number) {
        this._disjointCoefficient = value;
    }

    get excessCoefficient(): number {
        return this._excessCoefficient;
    }

    set excessCoefficient(value: number) {
        this._excessCoefficient = value;
    }

    get weightCoefficient(): number {
        return this._weightCoefficient;
    }

    set weightCoefficient(value: number) {
        this._weightCoefficient = value;
    }

    get stoppingCondition(): StoppingCondition<NeatChromosome> {
        return this._stoppingCondition;
    }

    set stoppingCondition(value: StoppingCondition<NeatChromosome>) {
        this._stoppingCondition = value;
    }

    get activationTraceRepetitions(): number {
        return this._activationTraceRepetitions;
    }

    set activationTraceRepetitions(value: number) {
        this._activationTraceRepetitions = value;
    }

    get printPopulationRecord(): boolean {
        return this._printPopulationRecord;
    }

    set printPopulationRecord(value: boolean) {
        this._printPopulationRecord = value;
    }
}
