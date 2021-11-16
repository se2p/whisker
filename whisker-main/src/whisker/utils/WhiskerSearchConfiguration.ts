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
import {IllegalArgumentException} from "../core/exceptions/IllegalArgumentException";
import {NeuroevolutionTestGenerator} from "../testgenerator/NeuroevolutionTestGenerator";
import {NetworkChromosomeGeneratorSparse} from "../whiskerNet/NetworkGenerators/NetworkChromosomeGeneratorSparse";
import {NetworkChromosomeGeneratorFullyConnected} from "../whiskerNet/NetworkGenerators/NetworkChromosomeGeneratorFullyConnected";
import {NeatMutation} from "../whiskerNet/NeatMutation";
import {NeatCrossover} from "../whiskerNet/NeatCrossover";
import {Container} from "./Container";
import {DynamicScratchEventExtractor} from "../testcase/DynamicScratchEventExtractor";
import {NeuroevolutionProperties} from "../whiskerNet/NeuroevolutionProperties";
import {StatementNetworkFitness} from "../whiskerNet/NetworkFitness/StatementNetworkFitness";
import {NetworkFitnessFunction} from "../whiskerNet/NetworkFitness/NetworkFitnessFunction";
import {NetworkChromosome} from "../whiskerNet/NetworkChromosome";
import {ScoreFitness} from "../whiskerNet/NetworkFitness/ScoreFitness";
import {SurviveFitness} from "../whiskerNet/NetworkFitness/SurviveFitness";
import {CombinedNetworkFitness} from "../whiskerNet/NetworkFitness/CombinedNetworkFitness";
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
import {BiasedVariableLengthConstrainedChromosomeMutation} from "../integerlist/BiasedVariableLengthConstrainedChromosomeMutation";
import {EventBiasedMutation} from "../testcase/EventBiasedMutation";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';


class ConfigException implements Error {
    message: string;
    name: string;

    constructor(message: string) {
        this.name = "ConfigException";
        this.message = message;
    }
}

export class WhiskerSearchConfiguration {

    private readonly _config: Record<string, any>;
    private readonly _searchAlgorithmProperties: (SearchAlgorithmProperties<any> | NeuroevolutionProperties<any>)

    constructor(dict: Record<string, (Record<string, (number | string)> | string | number)>) {
        this._config = Preconditions.checkNotUndefined(dict);
        if (this.getAlgorithm() === SearchAlgorithmType.NEAT) {
            this._searchAlgorithmProperties = this.setNeuroevolutionProperties();
        } else {
            this._searchAlgorithmProperties = this.setSearchAlgorithmProperties();
        }
    }

    private setSearchAlgorithmProperties(): SearchAlgorithmProperties<any> {
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
                case SearchAlgorithmType.MIO:
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
                case SearchAlgorithmType.ONE_PLUS_ONE:
                    return {
                        mutationProbability: this._config["mutation"]["probability"],
                    };
                case SearchAlgorithmType.SIMPLEGA:
                case SearchAlgorithmType.MOSA:
                    return {
                        populationSize: this._config["populationSize"],
                        crossoverProbability: this._config["crossover"]["probability"],
                        mutationProbability: this._config["mutation"]["probability"],
                    };
                case SearchAlgorithmType.RANDOM:
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
        return this._searchAlgorithmProperties as SearchAlgorithmProperties<any>;
    }

    public setNeuroevolutionProperties(): NeuroevolutionProperties<any> {
        const populationSize = this._config['populationSize'] as number;
        const properties = new NeuroevolutionProperties(populationSize);

        const parentsPerSpecies = this._config['parentsPerSpecies'] as number;
        const numberOfSpecies = this._config['numberOfSpecies'] as number;
        const penalizingAge = this._config['penalizingAge'] as number;
        const ageSignificance = this._config['ageSignificance'] as number;
        const inputRate = this._config['inputRate'] as number

        const crossoverWithoutMutation = this._config['crossover']['crossoverWithoutMutation'] as number
        const interspeciesMating = this._config['crossover']['interspeciesRate'] as number

        const mutationWithoutCrossover = this._config['mutation']['mutationWithoutCrossover'] as number
        const mutationAddConnection = this._config['mutation']['mutationAddConnection'] as number
        const recurrentConnection = this._config['mutation']['recurrentConnection'] as number
        const addConnectionTries = this._config['mutation']['addConnectionTries'] as number
        const populationChampionNumberOffspring = this._config['mutation']['populationChampionNumberOffspring'] as number;
        const populationChampionNumberClones = this._config['mutation']['populationChampionNumberClones'] as number;
        const populationChampionConnectionMutation = this._config['mutation']['populationChampionConnectionMutation'] as number;
        const mutationAddNode = this._config['mutation']['mutationAddNode'] as number;
        const mutateWeights = this._config['mutation']['mutateWeights'] as number;
        const perturbationPower = this._config['mutation']['perturbationPower'] as number;
        const mutateToggleEnableConnection = this._config['mutation']['mutateToggleEnableConnection'] as number;
        const toggleEnableConnectionTimes = this._config['mutation']['toggleEnableConnectionTimes'] as number;
        const mutateEnableConnection = this._config['mutation']['mutateEnableConnection'] as number;

        const distanceThreshold = this._config['compatibility']['distanceThreshold'] as number
        const disjointCoefficient = this._config['compatibility']['disjointCoefficient'] as number
        const excessCoefficient = this._config['compatibility']['excessCoefficient'] as number;
        const weightCoefficient = this._config['compatibility']['weightCoefficient'] as number;

        const timeout = this._config['networkFitness']['timeout']

        properties.populationType = this._config[`populationType`] as string;
        properties.numberOfSpecies = numberOfSpecies;
        properties.parentsPerSpecies = parentsPerSpecies;
        properties.penalizingAge = penalizingAge;
        properties.ageSignificance = ageSignificance;
        properties.inputRate = inputRate;

        properties.crossoverWithoutMutation = crossoverWithoutMutation;
        properties.interspeciesMating = interspeciesMating;

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

        properties.distanceThreshold = distanceThreshold;
        properties.disjointCoefficient = disjointCoefficient;
        properties.excessCoefficient = excessCoefficient;
        properties.weightCoefficient = weightCoefficient;

        properties.timeout = timeout;

        properties.stoppingCondition = this._getStoppingCondition(this._config['stoppingCondition']);
        properties.networkFitness = this.getNetworkFitnessFunction(this._config['networkFitness'])
        return properties;
    }

    get neuroevolutionProperties(): NeuroevolutionProperties<any> {
        return this._searchAlgorithmProperties as NeuroevolutionProperties<any>;
    }

    private _getStoppingCondition(stoppingCondition: Record<string, any>): StoppingCondition<any> {
        const stoppingCond = stoppingCondition["type"];
        if (stoppingCond == "fixedIteration") {
            return new FixedIterationsStoppingCondition(stoppingCondition["iterations"])
        } else if (stoppingCond == "fixedTime") {
            return new FixedTimeStoppingCondition(stoppingCondition["duration"]);
        } else if (stoppingCond == "optimal") {
            return new OptimalSolutionStoppingCondition()
        } else if (stoppingCond == 'events') {
            return new ExecutedEventsStoppingCondition(stoppingCondition['max-events']);
        } else if (stoppingCond == 'evaluations') {
            return new FitnessEvaluationStoppingCondition(stoppingCondition['max-evaluations']);
        } else if (stoppingCond == "combined") {
            const conditions = stoppingCondition["conditions"].map((c) => this._getStoppingCondition(c));
            return new OneOfStoppingCondition(...conditions)
        }

        throw new ConfigException("No stopping condition given");
    }

    private _getMutationOperator(): Mutation<any> {
        // Not all algorithms use mutation.
        if(!this._config['mutation']){
            return undefined;
        }
        switch (this._config['mutation']['operator']) {
            case 'bitFlip':
                return new BitflipMutation();
            case 'variableLength':
                return new VariableLengthMutation(this._config['integerRange']['min'],
                    this._config['integerRange']['max'],
                    this._config['chromosome']['maxLength'],
                    this.searchAlgorithmProperties['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case 'variableLengthConstrained':
                return new VariableLengthConstrainedChromosomeMutation(this._config['integerRange']['min'],
                    this._config['integerRange']['max'],
                    this._config['chromosome']['maxLength'],
                    this.searchAlgorithmProperties['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case 'biasedVariableLength':
                return new BiasedVariableLengthMutation(this._config['integerRange']['min'],
                    this._config['integerRange']['max'],
                    this._config['chromosome']['maxLength'],
                    this.searchAlgorithmProperties['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case 'biasedVariableLengthConstrained':
                return new BiasedVariableLengthConstrainedChromosomeMutation(this._config['integerRange']['min'],
                    this._config['integerRange']['max'],
                    this._config['chromosome']['maxLength'],
                    this.searchAlgorithmProperties['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case 'eventBiased':
                return new EventBiasedMutation(this._config['integerRange']['min'],
                    this._config['integerRange']['max'],
                    this._config['chromosome']['maxLength'],
                    this.searchAlgorithmProperties['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case'neatMutation':
                return new NeatMutation(this._config['mutation'])
            case 'integerList':
            default:
                return new IntegerListMutation(this._config['integerRange']['min'], this._config['integerRange']['max']);
        }
    }

    private _getCrossoverOperator(): Crossover<any> {
        // Some algorithms don't use crossover operators
        if (!this._config['crossover']) {
            return undefined;
        }
        switch (this._config['crossover']['operator']) {
            case 'singlePointRelative':
                return new SinglePointRelativeCrossover();
            case 'neatCrossover':
                return new NeatCrossover(this._config['crossover']);
            case 'singlePoint':
            default:
                return new SinglePointCrossover();
        }
    }

    public getSelectionOperator(): Selection<any> {
        // Some algorithms don't use a selection operator
        if (!this._config['selection']) {
            return undefined;
        }
        switch (this._config['selection']['operator']) {
            case 'tournament':
                return new TournamentSelection(this._config['selection']['tournamentSize']) as unknown as Selection<any>;
            case 'rank':
            default:
                return new RankSelection();
        }
    }

    public getLocalSearchOperators(): LocalSearch<any>[] {
        const operators: LocalSearch<any>[] = [];
        const localSearchOperators = this._config['localSearch'];

        // If there are no local search operators defined return an empty list.
        if (!localSearchOperators) {
            return operators;
        }

        // Otherwise add the defined local search operators
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
            }

            operators.push(type);
        }
        return operators;
    }

    public getEventExtractor(): ScratchEventExtractor {
        switch (this._config['extractor']) {
            case 'naive':
                return new NaiveScratchEventExtractor(Container.vm);
            case 'wait':
                return new JustWaitScratchEventExtractor(Container.vm);
            case 'static':
                return new StaticScratchEventExtractor(Container.vm);
            case 'neuroevolution':
                return new NeuroevolutionScratchEventExtractor(Container.vm);
            case 'dynamic':
            default:
                return new DynamicScratchEventExtractor(Container.vm);
        }
    }

    public getEventSelector(): EventSelector {
        switch (this._config['eventSelector']) {
            case 'clustering': {
                const {integerRange} = this._config;
                return new ClusteringEventSelector(integerRange);
            }
            case 'interleaving':
            default:
                return new InterleavingEventSelector();
        }
    }

    public getChromosomeGenerator(): ChromosomeGenerator<any> {
        switch (this._config['chromosome']['type']) {
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
            case 'sparseNetwork': {
                const eventExtractor = this.getEventExtractor();
                return new NetworkChromosomeGeneratorSparse(this._config['mutation'], this._config['crossover'],
                    InputExtraction.extractSpriteInfo(Container.vm), eventExtractor.extractEvents(Container.vm),
                    this._config['inputRate']);
            }
            case 'fullyConnectedNetwork': {
                const eventExtractor = new NeuroevolutionScratchEventExtractor(Container.vm);
                return new NetworkChromosomeGeneratorFullyConnected(this._config['mutation'], this._config['crossover'],
                    InputExtraction.extractSpriteInfo(Container.vm), eventExtractor.extractEvents(Container.vm));
            }
            case 'test':
            default:
                return new TestChromosomeGenerator(this.searchAlgorithmProperties as GeneticAlgorithmProperties<any>,
                    this._getMutationOperator(),
                    this._getCrossoverOperator());
        }
    }

    public getFitnessFunctionType(): FitnessFunctionType {
        const fitnessFunctionDef = this._config['fitnessFunction'];
        switch (fitnessFunctionDef["type"]) {
            case 'statement':
                return FitnessFunctionType.STATEMENT;
            case 'one-max':
                return FitnessFunctionType.ONE_MAX;
            case 'single-bit':
            default:
                return FitnessFunctionType.SINGLE_BIT;
        }
    }

    public getNetworkFitnessFunction(fitnessFunction: Record<string, any>): NetworkFitnessFunction<NetworkChromosome> {
        const networkFitnessDef = fitnessFunction['type'];
        if (networkFitnessDef === 'score')
            return new ScoreFitness(fitnessFunction['offset']);
        else if (networkFitnessDef === 'statement')
            return new StatementNetworkFitness();
        else if (networkFitnessDef === 'survive')
            return new SurviveFitness();
        else if (networkFitnessDef === 'target')
            return new TargetFitness(fitnessFunction['player'], fitnessFunction['target'],
                fitnessFunction['travelWeight']);
        else if (networkFitnessDef === 'combined') {
            const fitnessFunctions = fitnessFunction["functions"];
            const comb = fitnessFunctions.map((ff) => this.getNetworkFitnessFunction(ff));
            return new CombinedNetworkFitness(...comb)
        }
        throw new ConfigException("No Network Fitness specified in the config file!")
    }


    public getFitnessFunctionTargets(): string[] {
        const fitnessFunctionDef = this._config['fitnessFunction'];
        if (fitnessFunctionDef['targets']) {
            const targets: string[] = [];
            for (const target of fitnessFunctionDef['targets']) {
                targets.push(target)
            }
            return targets;
        } else {
            return [];
        }
    }

    public getAlgorithm(): SearchAlgorithmType {
        switch (this._config['algorithm']) {
            case 'random':
                return SearchAlgorithmType.RANDOM;
            case 'onePlusOne':
                return SearchAlgorithmType.ONE_PLUS_ONE;
            case 'simpleGA':
                return SearchAlgorithmType.SIMPLEGA;
            case 'mosa':
                return SearchAlgorithmType.MOSA;
            case 'mio':
                return SearchAlgorithmType.MIO;
            case'neat':
                return SearchAlgorithmType.NEAT;
            default:
                throw new IllegalArgumentException("Invalid configuration. Unknown algorithm: " + this._config['algorithm']);
        }
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

        throw new ConfigException("Unknown Algorithm " + this._config["testGenerator"]);
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
            return () => { /* no-op */
            };
        }
    }
}
