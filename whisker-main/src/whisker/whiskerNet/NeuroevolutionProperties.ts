import {NetworkChromosome} from "./NetworkChromosome";
import {StoppingCondition} from "../search/StoppingCondition";
import {NetworkFitnessFunction} from "./NetworkFitness/NetworkFitnessFunction";

/**
 * This class stores all relevant properties for a Neuroevolution Algorithm.
 */
export class NeuroevolutionProperties<C extends NetworkChromosome> {

    // ----------------- Population Management -------------------

    /**
     * Defines the type of NeuroevolutionPopulation
     */
    private _populationType: string;

    /**
     * The size of the population that will be initially generated.
     */
    private _populationSize: number;

    /**
     * Number of desired species.
     */
    private _numberOfSpecies: number;

    /**
     * Specifies how many member of the species survive in each generation
     */
    private _parentsPerSpecies: number

    /**
     * Specifies when Species start go get penalized due to their age
     * This helps younger species to be able to develop themself for some time
     */
    private _penalizingAge: number

    /**
     * Specifies how much of a boost young generations should get (1.0 resembles no boost at all).
     */
    private _ageSignificance: number

    /**
     * The probability of adding a Sprite as Input to the network during the generation of the network population
     */
    private _inputRate: number


    // ----------------- Mutation -------------------
    /**
     * The Probability of applying Mutation without Crossover
     */
    private _mutationWithoutCrossover: number

    /**
     * The probability for adding a new connection between nodes during mutation
     */
    private _mutationAddConnection: number

    /**
     * The rate of adding a recurrent connection during the "addConnection" mutation
     */
    private _recurrentConnection: number

    /**
     * How often we try finding a new connection that fits our desires (recurrent/not recurrent) during the
     * "addConnection" mutation
     */
    private _addConnectionTries: number

    /**
     * Defines how many offspring are reserved for the population Champion.
     */
    private _populationChampionNumberOffspring: number

    /**
     * Defines how often we clone the population Champion.
     */
    private _populationChampionNumberClones: number

    /**
     * The Population Champion gets a unique probability of mutating the connections of his network
     */
    private _populationChampionConnectionMutation: number

    /**
     * The probability for adding a new node to the network during mutation
     */
    private _mutationAddNode: number

    /**
     * The probability for mutating the weights of the connections between nodes
     */
    private _mutateWeights: number

    /**
     * Defines how strong the weights are perturbed during weight mutation
     */
    private _perturbationPower: number

    /**
     * The probability for enabling/disabling a connection between nodes
     */
    private _mutateToggleEnableConnection: number

    /**
     * Defines how many connections are toggled during a toggleEnableConnection mutation
     */
    private _toggleEnableConnectionTimes: number

    /**
     * The probability for enabling a previously disabled connection between nodes
     */
    private _mutateEnableConnection: number


    // ----------------- Crossover -------------------
    /**
     * The Probability of applying Crossover without a Mutation following
     */
    private _crossoverWithoutMutation: number

    /**
     * Defines how often organisms mate outside of their species
     */
    private _interspeciesMating: number


    // ----------------- Compatibility Distance -------------------
    /**
     * Determines up to which distance threshold two organisms belong to the same species
     */
    private _distanceThreshold: number

    /**
     * Defines the importance of disjoint connections
     */
    private _disjointCoefficient

    /**
     * Defines the importance of excess connections
     */
    private _excessCoefficient: number

    /**
     * Defines the importance of the weights in case of matching connections
     */
    private _weightCoefficient: number


    // ----------------- Miscellaneous -------------------
    /**
     * The stopping condition for the corresponding search algorithm.
     */
    private _stoppingCondition: StoppingCondition<C>;

    /**
     * The fitness function with which the network fitness is measured
     */
    private _networkFitness: NetworkFitnessFunction<C>;

    /**
     * Timout for the execution of a scratch game during the evaluation of the network
     */
    private _timeout: number

    /**
     * Determines how the events should be selected.
     */
    private _eventSelection: string

    /**
     * Determines the type of the returned testSuite (static/dynamic)
     * @private
     */
    private _testSuiteType: string

    /**
     * The template of a static/dynamic test
     */
    private _testTemplate: string;

    /**
     * Constructs an object that stores all relevant properties of a Neuroevolution Algorithm.
     * @param populationSize the size of the population
     */
    constructor(populationSize: number) {
        this._populationSize = populationSize;
    }

    // Getter and Setter

    get populationType(): string {
        return this._populationType;
    }

    set populationType(value: string) {
        this._populationType = value;
    }

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

    get distanceThreshold(): number {
        return this._distanceThreshold;
    }

    set distanceThreshold(value: number) {
        this._distanceThreshold = value;
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

    get stoppingCondition(): StoppingCondition<C> {
        return this._stoppingCondition;
    }

    set stoppingCondition(value: StoppingCondition<C>) {
        this._stoppingCondition = value;
    }

    get networkFitness(): NetworkFitnessFunction<C> {
        return this._networkFitness;
    }

    set networkFitness(value: NetworkFitnessFunction<C>) {
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

    get testSuiteType(): string {
        return this._testSuiteType;
    }

    set testSuiteType(value: string) {
        this._testSuiteType = value;
    }

    get testTemplate(): string {
        return this._testTemplate;
    }

    set testTemplate(value: string) {
        this._testTemplate = value;
    }
}
