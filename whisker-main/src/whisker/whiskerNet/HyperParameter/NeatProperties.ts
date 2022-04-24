import {StoppingCondition} from "../../search/StoppingCondition";
import {NetworkFitnessFunction} from "../NetworkFitness/NetworkFitnessFunction";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";

/**
 * This class stores all relevant properties for a Neuroevolution Algorithm.
 * All parameter values are set to default values but should be altered to reflect the given problem domain.
 */
export class NeatProperties {

    // ----------------- Population Management -------------------

    /**
     * Defines the type of NeuroevolutionPopulation.
     */
    private _populationType = 'neat';

    /**
     * The size of the population that will be initially generated.
     */
    private _populationSize = 150;

    /**
     * Number of desired species.
     */
    private _numberOfSpecies = 5;

    /**
     * Specifies how many member of the species survive in each generation
     */
    private _parentsPerSpecies = 0.20;

    /**
     * Specifies when Species start go get penalized due to their age
     * This helps younger species to be able to develop themselves for some time.
     */
    private _penalizingAge = 15;

    /**
     * Specifies how much of a boost young generations should get (1.0 resembles no boost at all).
     */
    private _ageSignificance = 1.0;

    /**
     * The probability of adding a Sprite as Input to the network during the generation of the network population
     */
    private _inputRate = 0.3;

    /**
     * The activation function used within hidden and output nodes (for the latter in the case of recursion).
     */
    private _activationFunction: ActivationFunction


    // ----------------- Mutation -------------------
    /**
     * The Probability of applying Mutation without Crossover
     */
    private _mutationWithoutCrossover = 0.25

    /**
     * The probability for adding a new connection between nodes during mutation
     */
    private _mutationAddConnection = 0.05

    /**
     * The rate of adding a recurrent connection during the "addConnection" mutation
     */
    private _recurrentConnection = 0.1;

    /**
     * How often we try finding a new connection that fits our desires (recurrent/not recurrent) during the
     * "addConnection" mutation
     */
    private _addConnectionTries = 50;

    /**
     * Defines how many offspring are reserved for the population Champion.
     */
    private _populationChampionNumberOffspring = 3;

    /**
     * Defines how often we clone the population Champion.
     */
    private _populationChampionNumberClones = 1;

    /**
     * The Population Champion gets a unique probability of mutating the connections of his network
     */
    private _populationChampionConnectionMutation = 0.3;

    /**
     * The probability for adding a new node to the network during mutation
     */
    private _mutationAddNode = 0.03;

    /**
     * The probability for mutating the weights of the connections between nodes
     */
    private _mutateWeights = 0.6;

    /**
     * Defines how strong the weights are perturbed during weight mutation
     */
    private _perturbationPower = 2.5;

    /**
     * The probability for enabling/disabling a connection between nodes
     */
    private _mutateToggleEnableConnection = 0.1;

    /**
     * Defines how many connections are toggled during a toggleEnableConnection mutation
     */
    private _toggleEnableConnectionTimes = 3;

    /**
     * The probability for enabling a previously disabled connection between nodes
     */
    private _mutateEnableConnection = 0.03;


    // ----------------- Crossover -------------------
    /**
     * The Probability of applying Crossover without a Mutation following
     */
    private _crossoverWithoutMutation = 0.25;

    /**
     * Defines how often organisms mate outside their species
     */
    private _interspeciesMating = 0.001;

    /**
     * Defines how often we average the weights of two matching genes during crossover.
     */
    private _crossoverWeightAverageRate = 0.4;


    // ----------------- Compatibility Distance -------------------
    /**
     * Determines up to which compatibility distance value two organisms belong to the same species.
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
     * Determines how networks choose the next event (random | activation).
     */
    private _eventSelection: string

    /**
     * The stopping condition for the corresponding search algorithm.
     */
    private _stoppingCondition: StoppingCondition<NeatChromosome>;

    /**
     * The fitness function with which the network fitness is measured
     */
    private _networkFitness: NetworkFitnessFunction<NeatChromosome>;

    /**
     * Switch the current target statement if no improvement has been seen for a set number of generations.
     */
    private _switchTargetCount = 5;

    /**
     * Timeout for the execution of a scratch game during the evaluation of the network.
     */
    private _timeout = 30000;

    /**
     * The number of times a network has to repeatedly cover a Scratch statement with diverging seeds to count the
     * statements as covered.
     */
    private _coverageStableCount = 0;

    /**
     * The number of repetitions applied upon the final dynamic test suite with the aim of obtaining a broad
     * ActivationTrace across many program states with diverging seeds.
     */
    private _activationTraceRepetitions = 0;

    /**
     * The template of a static/dynamic test
     */
    private _testTemplate: string;

    /**
     * Defines whether after each generation a population record containing all chromosomes should be printed in
     * JSON format.
     */
    private _printPopulationRecord = false;

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

    get crossoverWeightAverageRate(): number {
        return this._crossoverWeightAverageRate;
    }

    set crossoverWeightAverageRate(value: number) {
        this._crossoverWeightAverageRate = value;
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

    get eventSelection(): string {
        return this._eventSelection;
    }

    set eventSelection(value: string) {
        this._eventSelection = value;
    }

    get stoppingCondition(): StoppingCondition<NeatChromosome> {
        return this._stoppingCondition;
    }

    set stoppingCondition(value: StoppingCondition<NeatChromosome>) {
        this._stoppingCondition = value;
    }

    get networkFitness(): NetworkFitnessFunction<NeatChromosome> {
        return this._networkFitness;
    }

    set networkFitness(value: NetworkFitnessFunction<NeatChromosome>) {
        this._networkFitness = value;
    }

    get switchTargetCount(): number {
        return this._switchTargetCount;
    }

    set switchTargetCount(value: number) {
        this._switchTargetCount = value;
    }

    get timeout(): number {
        return this._timeout;
    }

    set timeout(value: number) {
        this._timeout = value;
    }

    get coverageStableCount(): number {
        return this._coverageStableCount;
    }

    set coverageStableCount(value: number) {
        this._coverageStableCount = value;
    }

    get activationTraceRepetitions(): number {
        return this._activationTraceRepetitions;
    }

    set activationTraceRepetitions(value: number) {
        this._activationTraceRepetitions = value;
    }

    get testTemplate(): string {
        return this._testTemplate;
    }

    set testTemplate(value: string) {
        this._testTemplate = value;
    }

    get printPopulationRecord(): boolean {
        return this._printPopulationRecord;
    }

    set printPopulationRecord(value: boolean) {
        this._printPopulationRecord = value;
    }
}
