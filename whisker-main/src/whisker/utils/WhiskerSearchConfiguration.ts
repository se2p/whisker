import {Preconditions} from "./Preconditions";
import {SearchAlgorithmProperties} from "../search/SearchAlgorithmProperties";
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
import {List} from "./List";
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

class ConfigException implements Error {
    message: string;
    name: string;

    constructor(message: string) {
        this.name = "ConfigException";
        this.message = message;

    }
}

export class WhiskerSearchConfiguration {

    private readonly dict: Record<string, any>;
    private readonly _searchAlgorithmProperties: (SearchAlgorithmProperties<any> | NeuroevolutionProperties<any>)

    constructor(dict: Record<string, (Record<string, (number | string)> | string | number)>) {
        this.dict = Preconditions.checkNotUndefined(dict);
        if (this.getAlgorithm() === SearchAlgorithmType.NEAT) {
            this._searchAlgorithmProperties = this.setNeuroevolutionProperties();
        } else {
            this._searchAlgorithmProperties = this.setSearchAlgorithmProperties();
        }
    }

    private setSearchAlgorithmProperties(): SearchAlgorithmProperties<any> {
        const properties = new SearchAlgorithmProperties();

        // Properties all search algorithms have in common
        properties.setTestGenerator(this.dict['testGenerator'] as string);
        properties.setStoppingCondition(this._getStoppingCondition(this.dict['stoppingCondition']));

        // Random does not need additional properties
        if (properties.getTestGenerator() === 'random') {
            return properties;
        }

        switch (this.getAlgorithm()) {
            case SearchAlgorithmType.MIO:
                properties.setChromosomeLength(this.dict['chromosome']['maxLength'] as number);
                properties.setIntRange(this.dict['integerRange']['min'] as number, this.dict['integerRange']['max'] as number);
                properties.setMaxMutationCounter(this.dict['mutation']['maxMutationCountStart'] as number,
                    this.dict['mutation']['maxMutationCountFocusedPhase'] as number);
                properties.setSelectionProbabilities(this.dict['selection']['randomSelectionProbabilityStart'] as number,
                    this.dict['selection']['randomSelectionProbabilityFocusedPhase'] as number);
                properties.setStartOfFocusedPhase(this.dict['startOfFocusedPhase'] as number);
                properties.setMaxArchiveSizes(this.dict['archive']['maxArchiveSizeStart'] as number,
                    this.dict['archive']['maxArchiveSizeFocusedPhase'] as number);
                break;
            case SearchAlgorithmType.ONE_PLUS_ONE:
                properties.setChromosomeLength(this.dict['chromosome']['maxLength'] as number);
                properties.setIntRange(this.dict['integerRange']['min'] as number, this.dict['integerRange']['max'] as number);
                properties.setMutationProbability(this.dict['mutation']['probability'] as number);
                break;
            case SearchAlgorithmType.SIMPLEGA:
            case SearchAlgorithmType.MOSA:
            default:
                properties.setChromosomeLength(this.dict['chromosome']['maxLength'] as number);
                properties.setIntRange(this.dict['integerRange']['min'] as number, this.dict['integerRange']['max'] as number);
                properties.setPopulationSize(this.dict['populationSize'] as number);
                properties.setCrossoverProbability(this.dict['crossover']['probability'] as number);
                properties.setMutationProbability(this.dict['mutation']['probability'] as number);
        }
        return properties;
    }

    get searchAlgorithmProperties(): SearchAlgorithmProperties<any> {
        return this._searchAlgorithmProperties as SearchAlgorithmProperties<any>;
    }

    public setNeuroevolutionProperties(): NeuroevolutionProperties<any> {
        const populationSize = this.dict['populationSize'] as number;
        const properties = new NeuroevolutionProperties(populationSize);

        const parentsPerSpecies = this.dict['parentsPerSpecies'] as number;
        const numberOfSpecies = this.dict['numberOfSpecies'] as number;
        const penalizingAge = this.dict['penalizingAge'] as number;
        const ageSignificance = this.dict['ageSignificance'] as number;
        const inputRate = this.dict['inputRate'] as number

        const crossoverWithoutMutation = this.dict['crossover']['crossoverWithoutMutation'] as number
        const interspeciesMating = this.dict['crossover']['interspeciesRate'] as number

        const mutationWithoutCrossover = this.dict['mutation']['mutationWithoutCrossover'] as number
        const mutationAddConnection = this.dict['mutation']['mutationAddConnection'] as number
        const recurrentConnection = this.dict['mutation']['recurrentConnection'] as number
        const addConnectionTries = this.dict['mutation']['addConnectionTries'] as number
        const populationChampionNumberOffspring = this.dict['mutation']['populationChampionNumberOffspring'] as number;
        const populationChampionNumberClones = this.dict['mutation']['populationChampionNumberClones'] as number;
        const populationChampionConnectionMutation = this.dict['mutation']['populationChampionConnectionMutation'] as number;
        const mutationAddNode = this.dict['mutation']['mutationAddNode'] as number;
        const mutateWeights = this.dict['mutation']['mutateWeights'] as number;
        const perturbationPower = this.dict['mutation']['perturbationPower'] as number;
        const mutateToggleEnableConnection = this.dict['mutation']['mutateToggleEnableConnection'] as number;
        const toggleEnableConnectionTimes = this.dict['mutation']['toggleEnableConnectionTimes'] as number;
        const mutateEnableConnection = this.dict['mutation']['mutateEnableConnection'] as number;

        const distanceThreshold = this.dict['compatibility']['distanceThreshold'] as number
        const disjointCoefficient = this.dict['compatibility']['disjointCoefficient'] as number
        const excessCoefficient = this.dict['compatibility']['excessCoefficient'] as number;
        const weightCoefficient = this.dict['compatibility']['weightCoefficient'] as number;

        const timeout = this.dict['networkFitness']['timeout']

        properties.populationType = this.dict[`populationType`] as string;
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

        properties.stoppingCondition = this._getStoppingCondition(this.dict['stoppingCondition']);
        properties.networkFitness = this.getNetworkFitnessFunction(this.dict['networkFitness'])
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
            const conditions = stoppingCondition["conditions"];
            const l: StoppingCondition<any>[] = [];
            for (const c of conditions) {
                l.push(this._getStoppingCondition(c));
            }
            return new OneOfStoppingCondition(...l)
        }

        throw new ConfigException("No stopping condition given");
    }

    private _getMutationOperator(): Mutation<any> {
        switch (this.dict['mutation']['operator']) {
            case 'bitFlip':
                return new BitflipMutation();
            case 'variableLength':
                return new VariableLengthMutation(this.dict['integerRange']['min'], this.dict['integerRange']['max'],
                    this.dict['chromosome']['maxLength'], this.dict['mutation']['gaussianMutationPower']);
            case 'variableLengthConstrained':
                return new VariableLengthConstrainedChromosomeMutation(this.dict['integerRange']['min'], this.dict['integerRange']['max'],
                    this.dict['chromosome']['maxLength'], this.dict['mutation']['gaussianMutationPower']);
            case 'biasedVariableLength':
                return new BiasedVariableLengthMutation(this.dict['integerRange']['min'], this.dict['integerRange']['max'],
                    this.dict['chromosome']['maxLength'], this.dict['mutation']['gaussianMutationPower']);
            case 'biasedVariableLengthConstrained':
                return new BiasedVariableLengthConstrainedChromosomeMutation(this.dict['integerRange']['min'], this.dict['integerRange']['max'],
                    this.dict['chromosome']['maxLength'], this.dict['mutation']['gaussianMutationPower']);
            case'neatMutation':
                return new NeatMutation(this.dict['mutation'])
            case 'integerList':
            default:
                return new IntegerListMutation(this.dict['integerRange']['min'], this.dict['integerRange']['max']);
        }
    }

    private _getCrossoverOperator(): Crossover<any> {
        // Some algorithms don't use crossover operators
        if (!this.dict['crossover']) {
            return undefined;
        }
        switch (this.dict['crossover']['operator']) {
            case 'singlePointRelative':
                return new SinglePointRelativeCrossover();
            case 'neatCrossover':
                return new NeatCrossover(this.dict['crossover']);
            case 'singlePoint':
            default:
                return new SinglePointCrossover();
        }
    }

    public getSelectionOperator(): Selection<any> {
        // Some algorithms don't use a selection operator
        if (!this.dict['selection']) {
            return undefined;
        }
        switch (this.dict['selection']['operator']) {
            case 'tournament':
                return new TournamentSelection(this.dict['selection']['tournamentSize']) as unknown as Selection<any>;
            case 'rank':
            default:
                return new RankSelection();
        }
    }

    public getLocalSearchOperators(): List<LocalSearch<any>> {
        const operators = new List<LocalSearch<any>>();
        const localSearchOperators = this.dict['localSearch'];

        // If there are no local search operators defined return an empty list.
        if (!localSearchOperators) {
            return new List<LocalSearch<any>>();
        }

        // Otherwise add the defined local search operators
        for (const operator of localSearchOperators) {
            let type: LocalSearch<any>;
            switch (operator['type']) {
                case "Extension":
                    type = new ExtensionLocalSearch(Container.vmWrapper, this.getEventExtractor(),
                        this.getEventSelector(), operator['probability']);
                    break;
                case "Reduction":
                    type = new ReductionLocalSearch(Container.vmWrapper, this.getEventExtractor(),
                        this.getEventSelector(), operator['probability']);
            }

            operators.add(type);
        }
        return operators;
    }

    public getEventExtractor(): ScratchEventExtractor {
        switch (this.dict['extractor']) {
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
        switch (this.dict['eventSelector']) {
            case 'clustering': {
                const {integerRange} = this.dict;
                return new ClusteringEventSelector(integerRange);
            }
            case 'interleaving':
            default:
                return new InterleavingEventSelector();
        }
    }

    public getChromosomeGenerator(): ChromosomeGenerator<any> {
        switch (this.dict['chromosome']['type']) {
            case 'bitString':
                return new BitstringChromosomeGenerator(this.searchAlgorithmProperties,
                    this._getMutationOperator(),
                    this._getCrossoverOperator());
            case 'integerList':
                return new IntegerListChromosomeGenerator(this.searchAlgorithmProperties,
                    this._getMutationOperator(),
                    this._getCrossoverOperator());
            case 'variableLengthTest':
                return new VariableLengthTestChromosomeGenerator(this.searchAlgorithmProperties,
                    this._getMutationOperator(),
                    this._getCrossoverOperator(),
                    this.dict['chromosome']['minSampleLength'],
                    this.dict['chromosome']['maxSampleLength']);
            case 'sparseNetwork': {
                const eventExtractor = this.getEventExtractor();
                return new NetworkChromosomeGeneratorSparse(this.dict['mutation'], this.dict['crossover'],
                    InputExtraction.extractSpriteInfo(Container.vm), eventExtractor.extractEvents(Container.vm),
                    this.dict['inputRate']);
            }
            case 'fullyConnectedNetwork': {
                const eventExtractor = new NeuroevolutionScratchEventExtractor(Container.vm);
                return new NetworkChromosomeGeneratorFullyConnected(this.dict['mutation'], this.dict['crossover'],
                    InputExtraction.extractSpriteInfo(Container.vm), eventExtractor.extractEvents(Container.vm));
            }
            case 'test':
            default:
                return new TestChromosomeGenerator(this.searchAlgorithmProperties,
                    this._getMutationOperator(),
                    this._getCrossoverOperator());
        }
    }

    public getFitnessFunctionType(): FitnessFunctionType {
        const fitnessFunctionDef = this.dict['fitnessFunction'];
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
            const comb: NetworkFitnessFunction<NetworkChromosome>[] = [];
            for (const functions of fitnessFunctions) {
                comb.push(this.getNetworkFitnessFunction(functions));
            }
            return new CombinedNetworkFitness(...comb)
        }
        throw new ConfigException("No Network Fitness specified in the config file!")
    }


    public getFitnessFunctionTargets(): List<string> {
        const fitnessFunctionDef = this.dict['fitnessFunction'];
        if (fitnessFunctionDef['targets']) {
            const targets = new List<string>();
            for (const target of fitnessFunctionDef['targets']) {
                targets.add(target)
            }
            return targets;
        } else {
            return new List();
        }
    }

    public getAlgorithm(): SearchAlgorithmType {
        if (this.dict['testGenerator'] === 'random') {
            return SearchAlgorithmType.RANDOM;
        }
        switch (this.dict['algorithm']) {
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
                throw new IllegalArgumentException("Invalid configuration. Unknown algorithm: " + this.dict['algorithm']);
        }
    }

    public getTestGenerator(): TestGenerator {
        if (this.dict["testGenerator"] == "random") {
            return new RandomTestGenerator(this, this.dict['minEventSize'], this.dict['maxEventSize']);
        } else if (this.dict['testGenerator'] == 'iterative') {
            return new IterativeSearchBasedTestGenerator(this);
        } else if (this.dict['testGenerator'] == 'manyObjective') {
            return new ManyObjectiveTestGenerator(this);
        } else if (this.dict['testGenerator'] == 'neuroevolution') {
            return new NeuroevolutionTestGenerator(this);
        }

        throw new ConfigException("Unknown Algorithm " + this.dict["testGenerator"]);
    }

    public getWaitStepUpperBound(): number {
        if (this.dict['durations']['waitStepUpperBound']) {
            return this.dict['durations']['waitStepUpperBound'];
        } else {
            return 100;
        }
    }

    public getPressDurationUpperBound(): number {
        if (this.dict['durations']['pressDurationUpperBound']) {
            return this.dict['durations']['pressDurationUpperBound'];
        } else {
            return 10;
        }
    }

    public getClickDuration(): number {
        if (this.dict['durations']['clickDuration']) {
            return this.dict['durations']['clickDuration'];
        } else {
            return 10;
        }
    }

    public getRandomSeed(): number {
        if ("seed" in this.dict) {
            return this.dict["seed"];
        } else {
            return undefined;
        }
    }

    public getLoggingFunction(): typeof console.log {
        if (this.dict["debugLogging"] == true) {
            return (...data: any[]) => console.log('DEBUG:', ...data);
        } else {
            return () => { /* no-op */ };
        }
    }
}
