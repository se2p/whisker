import {Preconditions} from "./Preconditions";
import {GeneticAlgorithmProperties, SearchAlgorithmProperties} from "../search/SearchAlgorithmProperties";
import {TestGenerator} from "../testgenerator/TestGenerator";
import {RandomTestGenerator} from "../testgenerator/RandomTestGenerator";
import {FixedIterationsStoppingCondition} from "../search/stoppingconditions/FixedIterationsStoppingCondition";
import {Mutation} from "../search/Mutation";
import {BitflipMutation} from "../bitstring/BitflipMutation";
import {IntegerListMutation} from "../integerlist/IntegerListMutation";
import {Crossover} from "../search/Crossover";
import {SinglePointCrossover} from "../search/operators/SinglePointCrossover";
import {RankSelection} from "../search/operators/RankSelection";
import {Selection} from "../search/Selection";
import {SearchAlgorithmType} from "../search/algorithms/SearchAlgorithmType";
import {ChromosomeGenerator} from "../search/ChromosomeGenerator";
import {BitstringChromosomeGenerator} from "../bitstring/BitstringChromosomeGenerator";
import {IntegerListChromosomeGenerator} from "../integerlist/IntegerListChromosomeGenerator";
import {TestChromosomeGenerator} from "../testcase/TestChromosomeGenerator";
import {IterativeSearchBasedTestGenerator} from "../testgenerator/IterativeSearchBasedTestGenerator";
import {ManyObjectiveTestGenerator} from "../testgenerator/ManyObjectiveTestGenerator";
import {FitnessFunctionType} from "../search/FitnessFunctionType";
import {TournamentSelection} from "../search/operators/TournamentSelection";
import {VariableLengthMutation} from "../integerlist/VariableLengthMutation";
import {SinglePointRelativeCrossover} from "../search/operators/SinglePointRelativeCrossover";
import {VariableLengthTestChromosomeGenerator} from "../testcase/VariableLengthTestChromosomeGenerator";
import {StoppingCondition} from "../search/StoppingCondition";
import {FixedTimeStoppingCondition} from "../search/stoppingconditions/FixedTimeStoppingCondition";
import {OneOfStoppingCondition} from "../search/stoppingconditions/OneOfStoppingCondition";
import {OptimalSolutionStoppingCondition} from "../search/stoppingconditions/OptimalSolutionStoppingCondition";
import {NeuroevolutionTestGenerator} from "../testgenerator/NeuroevolutionTestGenerator";
import {NeatMutation} from "../whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../whiskerNet/Operators/NeatCrossover";
import {Container} from "./Container";
import {DynamicScratchEventExtractor} from "../testcase/DynamicScratchEventExtractor";
import {NetworkFitnessFunction} from "../whiskerNet/NetworkFitness/NetworkFitnessFunction";
import {InputConnectionMethod, NetworkChromosome} from "../whiskerNet/Networks/NetworkChromosome";
import {ScoreFitness} from "../whiskerNet/NetworkFitness/ScoreFitness";
import {SurviveFitness} from "../whiskerNet/NetworkFitness/SurviveFitness";
import {InputExtraction} from "../whiskerNet/InputExtraction";
import {ExecutedEventsStoppingCondition} from "../search/stoppingconditions/ExecutedEventsStoppingCondition";
import {FitnessEvaluationStoppingCondition} from "../search/stoppingconditions/FitnessEvaluationStoppingCondition";
import {ScratchEventExtractor} from "../testcase/ScratchEventExtractor";
import {StaticScratchEventExtractor} from "../testcase/StaticScratchEventExtractor";
import {NaiveScratchEventExtractor} from "../testcase/NaiveScratchEventExtractor";
import {JustWaitScratchEventExtractor} from "../testcase/JustWaitScratchEventExtractor";
import {LocalSearch} from "../search/operators/LocalSearch/LocalSearch";
import {ExtensionLocalSearch} from "../search/operators/LocalSearch/ExtensionLocalSearch";
import {ReductionLocalSearch} from "../search/operators/LocalSearch/ReductionLocalSearch";
import {ClusteringEventSelector, EventSelector, InterleavingEventSelector} from "../testcase/EventSelector";
import {BiasedVariableLengthMutation} from "../integerlist/BiasedVariableLengthMutation";
import {VariableLengthConstrainedChromosomeMutation} from "../integerlist/VariableLengthConstrainedChromosomeMutation";
import {TargetFitness} from "../whiskerNet/NetworkFitness/TargetFitness";
import {NeuroevolutionScratchEventExtractor} from "../testcase/NeuroevolutionScratchEventExtractor";
import {NoveltyTargetNetworkFitness} from "../whiskerNet/NetworkFitness/NoveltyTargetNetworkFitness";
import {
    BiasedVariableLengthConstrainedChromosomeMutation
} from "../integerlist/BiasedVariableLengthConstrainedChromosomeMutation";
import {EventBiasedMutation} from "../testcase/EventBiasedMutation";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {NeatProperties} from "../whiskerNet/HyperParameter/NeatProperties";
import {NetworkSuiteParameter} from "../whiskerNet/HyperParameter/NetworkSuiteParameter";
import {ReliableStatementFitness} from "../whiskerNet/NetworkFitness/ReliableStatementFitness";
import {NoveltyReliableStatementFitness} from "../whiskerNet/NetworkFitness/NoveltyReliableStatementFitness";
import {ActivationFunction} from "../whiskerNet/NetworkComponents/ActivationFunction";
import {NeatChromosomeGenerator} from "../whiskerNet/NetworkGenerators/NeatChromosomeGenerator";


class ConfigException implements Error {
    constructor(readonly message: string, readonly name: string = "ConfigException") {
        // empty
    }
}

export class WhiskerSearchConfiguration {

    private readonly _config: Record<string, any>;
    private readonly _properties: (SearchAlgorithmProperties<any> | NeatProperties | NetworkSuiteParameter);

    constructor(dict: Record<string, (Record<string, (number | string)> | string | number)>) {
        this._config = Preconditions.checkNotUndefined(dict);

        if (this.getTestSuiteType() == 'dynamic') {
            this._properties = this.setDynamicSuiteParameter();
            Container.isNeuroevolution = true;
        } else if (this.getAlgorithm() === 'neat' ||
            this.getAlgorithm() === 'e-neat') {
            this._properties = this.setNeuroevolutionProperties();
            Container.isNeuroevolution = true;
        } else {
            this._properties = this._buildSearchAlgorithmProperties();
            Container.isNeuroevolution = false;
        }
    }

    private _buildSearchAlgorithmProperties(): SearchAlgorithmProperties<any> {
        // Properties all search algorithms have in common.
        const commonProps = {
            testGenerator: this._config["testGenerator"],
            stoppingCondition: this._getStoppingCondition(this._config["stoppingCondition"])
        };

        // Properties all other algorithms have in common.
        const additionalProps = {
            chromosomeLength: this._config["chromosome"]["maxLength"],
            integerRange: this._config["integerRange"],
        };

        // Properties specific to every algorithm.
        const specificProps = (() => {
            switch (this.getAlgorithm()) {
                case "mio":
                    return {
                        maxMutationCount: {
                            start: this._config["mutation"]["maxMutationCountStart"],
                            focusedPhase: this._config["mutation"]["maxMutationCountFocusedPhase"],
                        },
                        selectionProbability: {
                            start: this._config["selection"]["randomSelectionProbabilityStart"],
                            focusedPhase: this._config["selection"]["randomSelectionProbabilityFocusedPhase"],
                        },
                        startOfFocusedPhase: this._config["startOfFocusedPhase"],
                        maxArchiveSize: {
                            start: this._config["archive"]["maxArchiveSizeStart"],
                            focusedPhase: this._config["archive"]["maxArchiveSizeFocusedPhase"],
                        },
                    };
                case "onePlusOne":
                    return {
                        mutationProbability: this._config["mutation"]["probability"],
                    };
                case "simpleGA":
                case "mosa":
                    return {
                        populationSize: this._config["populationSize"],
                        crossoverProbability: this._config["crossover"]["probability"],
                        mutationProbability: this._config["mutation"]["probability"],
                    };
                case "random":
                default:
                    return {};
            }
        })();

        return {
            ...commonProps,
            ...additionalProps,
            ...specificProps,
        };
    }

    /**
     * Sets the number of reservedCodons for each event (event-codon + overapproximation of required
     * parameter-codons) by traversing all events contained within a Scratch project in the search of the maximum
     * amount of required parameters per event.
     * @param vm the virtual machine containing the given Scratch project.
     */
    public _setReservedCodons(vm: VirtualMachine): void {
        const eventExtractor = new StaticScratchEventExtractor(vm);
        const programEvents = eventExtractor.extractEvents(vm);
        const numSearchParams = programEvents.map(event => event.numSearchParameter());
        // Add 1 for the event-codon itself.
        this.searchAlgorithmProperties['reservedCodons'] = Math.max(...numSearchParams) + 1;
        this.searchAlgorithmProperties['chromosomeLength'] *= this.searchAlgorithmProperties['reservedCodons'];
    }


    get searchAlgorithmProperties(): SearchAlgorithmProperties<any> {
        return this._properties as SearchAlgorithmProperties<any>;
    }

    public setNeuroevolutionProperties(): NeatProperties {
        const properties = new NeatProperties();

        const populationSize = this._config['populationSize'] as number;
        const parentsPerSpecies = this._config['parentsPerSpecies'] as number;
        const numberOfSpecies = this._config['numberOfSpecies'] as number;
        const penalizingAge = this._config['penalizingAge'] as number;
        const ageSignificance = this._config['ageSignificance'] as number;
        const inputRate = this._config['inputRate'] as number;
        const activationFunction = this.getActivationFunction();

        const crossoverWithoutMutation = this._config['crossover']['crossoverWithoutMutation'] as number;
        const interspeciesMating = this._config['crossover']['interspeciesRate'] as number;
        const crossoverWeightAverageRate = this._config['crossover']['weightAverageRate'] as number;

        const mutationWithoutCrossover = this._config['mutation']['mutationWithoutCrossover'] as number;
        const mutationAddConnection = this._config['mutation']['mutationAddConnection'] as number;
        const recurrentConnection = this._config['mutation']['recurrentConnection'] as number;
        const addConnectionTries = this._config['mutation']['addConnectionTries'] as number;
        const populationChampionNumberOffspring = this._config['mutation']['populationChampionNumberOffspring'] as number;
        const populationChampionNumberClones = this._config['mutation']['populationChampionNumberClones'] as number;
        const populationChampionConnectionMutation = this._config['mutation']['populationChampionConnectionMutation'] as number;
        const mutationAddNode = this._config['mutation']['mutationAddNode'] as number;
        const mutateWeights = this._config['mutation']['mutateWeights'] as number;
        const perturbationPower = this._config['mutation']['perturbationPower'] as number;
        const mutateToggleEnableConnection = this._config['mutation']['mutateToggleEnableConnection'] as number;
        const toggleEnableConnectionTimes = this._config['mutation']['toggleEnableConnectionTimes'] as number;
        const mutateEnableConnection = this._config['mutation']['mutateEnableConnection'] as number;

        const distanceThreshold = this._config['compatibility']['distanceThreshold'] as number;
        const disjointCoefficient = this._config['compatibility']['disjointCoefficient'] as number;
        const excessCoefficient = this._config['compatibility']['excessCoefficient'] as number;
        const weightCoefficient = this._config['compatibility']['weightCoefficient'] as number;

        const eventSelection = this._config['eventSelection'] as string;
        const coverageStableCount = this._config['networkFitness']['stableCount'] !== undefined ?
            this._config['networkFitness']['stableCount'] : 0;
        const switchTargetCount = this._config['switchTargetCount'] !== undefined ?
            this._config['switchTargetCount'] : 20;
        const timeout = this._config['networkFitness']['timeout'];
        const activationTraceRepetitions = this._config['aTRepetitions'] !== undefined ?
            this._config['aTRepetitions'] : 0;
        const doPrintPopulationRecord = this._config['populationRecord'] as string === 'true';

        properties.populationSize = populationSize;
        properties.populationType = this._config['populationType'] as string;
        properties.testTemplate = Container.template;
        properties.numberOfSpecies = numberOfSpecies;
        properties.parentsPerSpecies = parentsPerSpecies;
        properties.penalizingAge = penalizingAge;
        properties.ageSignificance = ageSignificance;
        properties.inputRate = inputRate;
        properties.activationFunction = activationFunction;

        properties.crossoverWithoutMutation = crossoverWithoutMutation;
        properties.interspeciesMating = interspeciesMating;
        properties.crossoverWeightAverageRate = crossoverWeightAverageRate;

        properties.mutationWithoutCrossover = mutationWithoutCrossover;
        properties.mutationAddConnection = mutationAddConnection;
        properties.recurrentConnection = recurrentConnection;
        properties.addConnectionTries = addConnectionTries;
        properties.populationChampionNumberOffspring = populationChampionNumberOffspring;
        properties.populationChampionNumberClones = populationChampionNumberClones;
        properties.populationChampionConnectionMutation = populationChampionConnectionMutation;
        properties.mutationAddNode = mutationAddNode;
        properties.mutateWeights = mutateWeights;
        properties.perturbationPower = perturbationPower;
        properties.mutateToggleEnableConnection = mutateToggleEnableConnection;
        properties.toggleEnableConnectionTimes = toggleEnableConnectionTimes;
        properties.mutateEnableConnection = mutateEnableConnection;

        properties.compatibilityDistanceThreshold = distanceThreshold;
        properties.disjointCoefficient = disjointCoefficient;
        properties.excessCoefficient = excessCoefficient;
        properties.weightCoefficient = weightCoefficient;

        properties.eventSelection = eventSelection;
        properties.coverageStableCount = coverageStableCount;
        properties.timeout = timeout;
        properties.activationTraceRepetitions = activationTraceRepetitions;
        properties.printPopulationRecord = doPrintPopulationRecord;
        properties.switchTargetCount = switchTargetCount;

        properties.stoppingCondition = this._getStoppingCondition(this._config['stoppingCondition']);
        properties.networkFitness = this.getNetworkFitnessFunction(this._config['networkFitness']);
        return properties;
    }

    get neuroevolutionProperties(): NeatProperties {
        return this._properties as NeatProperties;
    }

    private setDynamicSuiteParameter(): NetworkSuiteParameter {
        const parameter = new NetworkSuiteParameter();
        parameter.timeout = this._config['timeout'];
        parameter.networkFitness = new ReliableStatementFitness(1);

        // TODO: Think of a nicer way to set re-train parameter without having to introduce config files or new cli
        //  parameter. Maybe good default values which balance performance and time required for
        //  re-training are also fine...
        parameter.trainPopulationSize = 50;
        const iterationStoppingCondition = new FixedIterationsStoppingCondition(5);
        const optimalSolutionStoppingCondition = new OptimalSolutionStoppingCondition();
        parameter.trainStoppingCondition = new OneOfStoppingCondition(
            iterationStoppingCondition, optimalSolutionStoppingCondition);

        return parameter;
    }

    get dynamicSuiteParameter(): NetworkSuiteParameter {
        if (this._properties instanceof NetworkSuiteParameter) {
            return this._properties;
        }
        return undefined;
    }

    private _getStoppingCondition(stoppingCondition: Record<string, any>): StoppingCondition<any> {
        const stoppingCond = stoppingCondition["type"];
        switch (stoppingCond) {
            case "fixedIteration":
                return new FixedIterationsStoppingCondition(stoppingCondition["iterations"]);
            case "fixedTime":
                return new FixedTimeStoppingCondition(stoppingCondition["duration"]);
            case "optimal":
                return new OptimalSolutionStoppingCondition();
            case 'events':
                return new ExecutedEventsStoppingCondition(stoppingCondition['max-events']);
            case 'evaluations':
                return new FitnessEvaluationStoppingCondition(stoppingCondition['maxEvaluations']);
            case "combined": {
                const conditions = stoppingCondition["conditions"].map((c) => this._getStoppingCondition(c));
                return new OneOfStoppingCondition(...conditions);
            }
            default:
                throw new ConfigException(`Unknown stopping condition ${stoppingCond}`);
        }
    }

    private _getMutationOperator(): Mutation<any> {
        // Not all algorithms use mutation.
        if (!this._config['mutation']) {
            return undefined;
        }
        const mutationOperator = this._config['mutation']['operator'];
        switch (mutationOperator) {
            case 'bitFlip':
                return new BitflipMutation();
            case 'variableLength':
                return new VariableLengthMutation(this._config['integerRange']['min'],
                    this._config['integerRange']['max'],
                    this._config['chromosomeLength'],
                    this._config['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case 'variableLengthConstrained':
                return new VariableLengthConstrainedChromosomeMutation(this._config['integerRange']['min'],
                    this._config['integerRange']['max'],
                    this._config['chromosomeLength'],
                    this._config['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case 'biasedVariableLength':
                return new BiasedVariableLengthMutation(this._config['integerRange']['min'],
                    this._config['integerRange']['max'],
                    this._config['chromosomeLength'],
                    this._config['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case 'biasedVariableLengthConstrained':
                return new BiasedVariableLengthConstrainedChromosomeMutation(this._config['integerRange']['min'],
                    this._config['integerRange']['max'],
                    this._config['chromosomeLength'],
                    this._config['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case 'eventBiased':
                return new EventBiasedMutation(this._config['integerRange']['min'],
                    this._config['integerRange']['max'],
                    this._config['chromosomeLength'],
                    this._config['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case'neatMutation':
                return new NeatMutation(this._config['mutation']);
            case 'integerList':
                return new IntegerListMutation(this._config['integerRange']['min'], this._config['integerRange']['max']);
            default:
                throw new ConfigException(`Unknown mutation operator ${mutationOperator}`);
        }
    }

    private _getCrossoverOperator(): Crossover<any> {
        // Some algorithms don't use crossover operators
        if (!this._config['crossover']) {
            return undefined;
        }
        const crossoverOperator = this._config['crossover']['operator'];
        switch (crossoverOperator) {
            case 'singlePointRelative':
                return new SinglePointRelativeCrossover(this._config['reservedCodons']);
            case 'neatCrossover':
                return new NeatCrossover(this._config['crossover']);
            case 'singlePoint':
                return new SinglePointCrossover();
            default:
                throw new ConfigException(`Unknown crossover operator ${crossoverOperator}`);
        }
    }

    public getSelectionOperator(): Selection<any> {
        // Some algorithms don't use a selection operator
        if (!this._config['selection']) {
            return undefined;
        }

        const selectionOperator = this._config['selection']['operator'];

        if (this.getAlgorithm() == "mio") {
            if (selectionOperator != undefined) {
                throw new ConfigException(`MIO cannot use selection operator ${selectionOperator}`);
            } else {
                return undefined; // dummy value, MIO actually doesn't use a selection operator
            }
        }

        switch (selectionOperator) {
            case 'tournament':
                return new TournamentSelection(this._config['selection']['tournamentSize']) as unknown as Selection<any>;
            case 'rank':
                return new RankSelection();
            default:
                throw new ConfigException(`Unknown selection operator ${selectionOperator}`);
        }
    }

    public getLocalSearchOperators(): LocalSearch<any>[] {
        const operators: LocalSearch<any>[] = [];
        const localSearchOperators = this._config['localSearch'];

        // If there are no local search operators defined return an empty list.
        if (!localSearchOperators) {
            return operators;
        }

        // Otherwise, add the defined local search operators
        for (const operator of localSearchOperators) {
            let type: LocalSearch<any>;
            switch (operator['type']) {
                case "Extension":
                    type = new ExtensionLocalSearch(Container.vmWrapper, this.getEventExtractor(),
                        this.getEventSelector(), operator['probability'], operator['newEventProbability']);
                    break;
                case "Reduction":
                    type = new ReductionLocalSearch(Container.vmWrapper, this.getEventExtractor(),
                        this.getEventSelector(), operator['probability']);
                    break;
                default:
                    throw new ConfigException(`Unknown local search operator ${operator['type']}`);
            }

            operators.push(type);
        }
        return operators;
    }

    public getEventExtractor(): ScratchEventExtractor {
        const eventExtractor = this._config['extractor'];
        switch (eventExtractor) {
            case 'naive':
                return new NaiveScratchEventExtractor(Container.vm);
            case 'wait':
                return new JustWaitScratchEventExtractor(Container.vm);
            case 'static':
                return new StaticScratchEventExtractor(Container.vm);
            case 'neuroevolution':
                return new NeuroevolutionScratchEventExtractor(Container.vm);
            case 'dynamic':
                return new DynamicScratchEventExtractor(Container.vm);
            default:
                throw new ConfigException(`Unknown event extractor ${eventExtractor}`);
        }
    }

    public getEventSelector(): EventSelector {
        const eventSelector = this._config['eventSelector'];
        switch (eventSelector) {
            case 'clustering': {
                const {integerRange} = this._config;
                return new ClusteringEventSelector(integerRange);
            }
            case 'interleaving':
                return new InterleavingEventSelector();
            default:
                throw new ConfigException(`Unknown event selector ${eventSelector}`);
        }
    }

    public getChromosomeGenerator(): ChromosomeGenerator<any> {
        const chromosomeGenerator = this._config['chromosome']['type'];
        switch (chromosomeGenerator) {
            case 'bitString':
                return new BitstringChromosomeGenerator(this.searchAlgorithmProperties as GeneticAlgorithmProperties<any>,
                    this._getMutationOperator(),
                    this._getCrossoverOperator());
            case 'integerList':
                return new IntegerListChromosomeGenerator(this.searchAlgorithmProperties as GeneticAlgorithmProperties<any>,
                    this._getMutationOperator(),
                    this._getCrossoverOperator());
            case 'variableLengthTest':
                return new VariableLengthTestChromosomeGenerator(this.searchAlgorithmProperties as GeneticAlgorithmProperties<any>,
                    this._getMutationOperator(),
                    this._getCrossoverOperator(),
                    this._config['chromosome']['minSampleLength'],
                    this._config['chromosome']['maxSampleLength']);
            case 'neatChromosome': {
                const eventExtractor = this.getEventExtractor();
                const mutationOperator = this._getMutationOperator();
                if (!(mutationOperator instanceof NeatMutation)) {
                    throw new ConfigException(`The neatChromosome generator requires a NeatMutation operator, but  ${typeof mutationOperator} was specified`);
                }
                const crossoverOperator = this._getCrossoverOperator();
                if (!(crossoverOperator instanceof NeatCrossover)) {
                    throw new ConfigException(`The neatChromosome generator requires a NeatCrossover operator, but  ${typeof crossoverOperator} was specified`);
                }
                return new NeatChromosomeGenerator(
                    InputExtraction.extractSpriteInfo(Container.vmWrapper),
                    eventExtractor.extractEvents(Container.vm),
                    this.getInputConnectionMethod(),
                    this.neuroevolutionProperties.activationFunction,
                    mutationOperator,
                    crossoverOperator,
                    Number(this._config['inputRate']));
            }
            case 'test':
                return new TestChromosomeGenerator(this.searchAlgorithmProperties as GeneticAlgorithmProperties<any>,
                    this._getMutationOperator(),
                    this._getCrossoverOperator());
            default:
                throw new ConfigException(`Unknown chromosome generator ${chromosomeGenerator}`);
        }
    }

    public getFitnessFunctionType(): FitnessFunctionType {
        const fitnessFunction = this._config['fitnessFunction']["type"];
        switch (fitnessFunction) {
            case 'statement':
                return FitnessFunctionType.STATEMENT;
            case 'one-max':
                return FitnessFunctionType.ONE_MAX;
            case 'single-bit':
                return FitnessFunctionType.SINGLE_BIT;
            default:
                throw new ConfigException(`Unknown fitness function ${fitnessFunction}`);
        }
    }

    public getNetworkFitnessFunction(fitnessFunction: Record<string, any>): NetworkFitnessFunction<NetworkChromosome> {
        const networkFitnessDef = fitnessFunction['type'];
        switch (networkFitnessDef) {
            case 'score':
                return new ScoreFitness();
            case 'survive':
                return new SurviveFitness();
            case 'reliableStatement': {
                const stableCount = fitnessFunction['stableCount'] !== undefined ? fitnessFunction['stableCount'] : 1;
                return new ReliableStatementFitness(stableCount);
            }
            case 'noveltyReliableStatement': {
                const stableCount = fitnessFunction['stableCount'] !== undefined ? fitnessFunction['stableCount'] : 1;
                return new NoveltyReliableStatementFitness(stableCount);
            }
            case 'target':
                return new TargetFitness(fitnessFunction['player'], fitnessFunction['target'],
                    fitnessFunction['colorObstacles'], fitnessFunction['spriteObstacles']);
            case 'novelty':
                return new NoveltyTargetNetworkFitness(fitnessFunction['player'], fitnessFunction['neighbourCount'],
                    fitnessFunction['archiveThreshold']);
            default:
                throw new ConfigException(`Unknown network fitness function ${networkFitnessDef}`);
        }
    }


    public getFitnessFunctionTargets(): string[] {
        const fitnessFunctionDef = this._config['fitnessFunction'];
        if (fitnessFunctionDef['targets']) {
            const targets: string[] = [];
            for (const target of fitnessFunctionDef['targets']) {
                targets.push(target);
            }
            return targets;
        } else {
            return [];
        }
    }

    public getAlgorithm(): SearchAlgorithmType {
        return this._config['algorithm'];
    }

    public getTestGenerator(): TestGenerator {
        if (this._config["testGenerator"] == "random") {
            return new RandomTestGenerator(this, this._config['minEventSize'], this._config['maxEventSize']);
        } else if (this._config['testGenerator'] == 'iterative') {
            return new IterativeSearchBasedTestGenerator(this);
        } else if (this._config['testGenerator'] == 'manyObjective') {
            return new ManyObjectiveTestGenerator(this);
        } else if (this._config['testGenerator'] == 'neuroevolution') {
            return new NeuroevolutionTestGenerator(this);
        }

        throw new ConfigException("Unknown TestGenerator " + this._config["testGenerator"]);
    }

    public getActivationFunction(): ActivationFunction {
        switch (this._config['chromosome']['activationFunction'].toUpperCase()) {
            case 'SIGMOID':
                return ActivationFunction.SIGMOID;
            case 'SOFTMAX':
                return ActivationFunction.SOFTMAX;
            case 'RELU':
                return ActivationFunction.RELU;
            case 'TANH':
                return ActivationFunction.TANH;
            case 'NONE':
                return ActivationFunction.NONE;
        }
        throw new ConfigException("Unknown Activation Function " + this._config['chromosome']['activationFunction']);
    }

    public getInputConnectionMethod(): InputConnectionMethod {
        switch (this._config['chromosome']['inputConnectionMethod']) {
            case'sparse':
                return 'sparse';
            case 'fullyHidden':
                return 'fullyHidden';
            case 'fully':
                return 'fully';
        }
        throw new ConfigException("Unknown InputConnectionMethod " + this._config['chromosome']['inputConnectionMethod']);
    }

    public getWaitStepUpperBound(): number {
        if (this._config['durations']['waitStepUpperBound']) {
            return this._config['durations']['waitStepUpperBound'];
        } else {
            return 100;
        }
    }

    public getPressDurationUpperBound(): number {
        if (this._config['durations']['pressDurationUpperBound']) {
            return this._config['durations']['pressDurationUpperBound'];
        } else {
            return 10;
        }
    }

    public getSoundDuration(): number {
        if (this._config['durations']['soundDuration']) {
            return this._config['durations']['soundDuration'];
        } else {
            return 10;
        }
    }

    public getClickDuration(): number {
        if (this._config['durations']['clickDuration']) {
            return this._config['durations']['clickDuration'];
        } else {
            return 10;
        }
    }

    public getRandomSeed(): number {
        if ("seed" in this._config) {
            return this._config["seed"];
        } else {
            return undefined;
        }
    }

    public getLoggingFunction(): typeof console.log {
        if (this._config["debugLogging"] == true) {
            return (...data) => console.log('DEBUG:', ...data);
        } else {
            return () => {
                /* no-op */
            };
        }
    }

    public getTestSuiteType(): string {
        if ("testSuiteType" in this._config) {
            return this._config['testSuiteType'];
        } else {
            return undefined;
        }
    }

    public isMinimizationActive(): boolean {
        if ("minimize" in this._config) {
            return this._config['minimize'];
        } else {
            return true; // default
        }
    }
}
