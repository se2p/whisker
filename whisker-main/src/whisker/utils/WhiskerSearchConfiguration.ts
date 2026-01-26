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
import {NeatMutation} from "../agentTraining/neuroevolution/operators/NeatMutation";
import {NeatCrossover} from "../agentTraining/neuroevolution/operators/NeatCrossover";
import {Container} from "./Container";
import {DynamicScratchEventExtractor} from "../testcase/DynamicScratchEventExtractor";
import {NetworkFitnessFunction} from "../agentTraining/neuroevolution/networkFitness/NetworkFitnessFunction";
import {InputConnectionMethod, NetworkChromosome} from "../agentTraining/neuroevolution/networks/NetworkChromosome";
import {ScoreFitness} from "../agentTraining/neuroevolution/networkFitness/ScoreFitness";
import {SurviveFitness} from "../agentTraining/neuroevolution/networkFitness/SurviveFitness";
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
import {NeuroevolutionScratchEventExtractor} from "../testcase/NeuroevolutionScratchEventExtractor";
import {
    BiasedVariableLengthConstrainedChromosomeMutation
} from "../integerlist/BiasedVariableLengthConstrainedChromosomeMutation";
import {EventBiasedMutation} from "../testcase/EventBiasedMutation";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {NeatParameter} from "../agentTraining/neuroevolution/hyperparameter/NeatParameter";
import {
    BasicNeuroevolutionParameter, ClassificationType,
    NeuroevolutionEventSelection
} from "../agentTraining/neuroevolution/hyperparameter/BasicNeuroevolutionParameter";
import {EventSequenceNovelty} from "../agentTraining/neuroevolution/networkFitness/Novelty/EventSequenceNovelty";
import {ActivationFunction} from "../agentTraining/neuroevolution/networkComponents/ActivationFunction";
import {NeatChromosomeGenerator} from "../agentTraining/neuroevolution/networkGenerators/NeatChromosomeGenerator";
import {NeatestParameter} from "../agentTraining/neuroevolution/hyperparameter/NeatestParameter";
import {CosineStateNovelty} from "../agentTraining/neuroevolution/networkFitness/Novelty/CosineStateNovelty";
import {NetworkFitnessFunctionType} from "../agentTraining/neuroevolution/networkFitness/NetworkFitnessFunctionType";
import {
    DiversityMetric,
    ManyObjectiveNeatestParameter
} from "../agentTraining/neuroevolution/hyperparameter/ManyObjectiveNeatestParameter";
import {UniformNeatCrossover} from "../agentTraining/neuroevolution/operators/UniformNeatCrossover";
import {MioNeatestParameter} from "../agentTraining/neuroevolution/hyperparameter/MioNeatestParameter";
import {NewsdNeatestParameter} from "../agentTraining/neuroevolution/hyperparameter/NewsdNeatestParameter";
import {NoveltyFitness} from "../agentTraining/neuroevolution/networkFitness/Novelty/NoveltyFitness";
import {ReliableCoverageFitness} from "../agentTraining/neuroevolution/networkFitness/ReliableCoverageFitness";
import {ManyObjectiveReliableCoverageFitness} from "../agentTraining/neuroevolution/networkFitness/ManyObjectiveReliableCoverageFitness";
import {RLTestGenerator} from "../agentTraining/reinforcementLearning/misc/RLTestGenerator";
import {RLHyperparameter} from "../agentTraining/reinforcementLearning/hyperparameter/RLHyperparameter";
import {DeepQLearningHyperparameter} from "../agentTraining/reinforcementLearning/hyperparameter/DeepQLearningHyperparameter";
import {FeatureExtraction} from "../agentTraining/featureExtraction/FeatureExtraction";
import {RLEventExtractor} from "../agentTraining/reinforcementLearning/misc/RLEventExtractor";
import {OptimizationAlgorithmType} from "../core/OptimizationAlgorithmType";


class ConfigException implements Error {
    constructor(readonly message: string, readonly name: string = "ConfigException") {
        // empty
    }
}

export class WhiskerSearchConfiguration {

    protected readonly _config: Record<string, any>;
    protected readonly _properties: (SearchAlgorithmProperties<any> | NeatParameter | BasicNeuroevolutionParameter | RLHyperparameter);

    constructor(dict: Record<string, (Record<string, (number | string)> | string | number)>) {
        this._config = Preconditions.checkNotUndefined(dict);

        if ('testSuiteType' in this._config && this._config['testSuiteType'] === 'dynamic') {
            this._properties = this.setDynamicSuiteParameter();
            Container.isNeuroevolution = true;
        } else if (this.getAlgorithm() === 'neat' ||
            this.getAlgorithm() === 'neatest' ||
            this.getAlgorithm() === 'mosaNeatest' ||
            this.getAlgorithm() === 'mioNeatest' ||
            this.getAlgorithm() === 'newsdNeatest'
        ) {
            this._properties = this.setNeuroevolutionProperties();
            Container.isNeuroevolution = true;
        } else if (this.getAlgorithm() === 'dql') {
            this._properties = this._setRLHyperparameter();
            Container.isNeuroevolution = false;
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
     * Sets the number of reservedCodons for each event (event-codon + over-approximation of required parameter-codons)
     * by traversing all events contained within a Scratch project in the search
     * of the maximum number of required parameters per event.
     * @param vm the virtual machine containing the given Scratch project.
     */
    public setReservedCodons(vm: VirtualMachine): void {
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

    public setNeuroevolutionProperties(): NeatParameter {
        let properties: NeatParameter;

        switch (this.getAlgorithm()) {
            case "neat":
                properties = new NeatParameter();
                break;
            case "mosaNeatest":
                properties = new ManyObjectiveNeatestParameter();
                break;
            case "mioNeatest":
                properties = new MioNeatestParameter();
                break;
            case "newsdNeatest":
                properties = new NewsdNeatestParameter();
                break;
            default:
                properties = new NeatestParameter();
        }

        properties.networkFitness = this.getNetworkFitnessFunction(this.getNetworkFitnessFunctionType());

        const populationSize = this._config['populationSize'] as number;
        const parentsPerSpecies = this._config['parentsPerSpecies'] as number;
        const numberOfSpecies = this._config['numberOfSpecies'] as number;
        const penalizingAge = this._config['penalizingAge'] ?? Infinity;
        const ageSignificance = this._config['ageSignificance'] as number;
        const inputRate = this._config['inputRate'] as number;
        const activationFunction = this.getActivationFunction();

        const crossoverWithoutMutation = this._config['crossover']['crossoverWithoutMutation'] as number;
        const interspeciesMating = this._config['crossover']['interspeciesRate'] as number;

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
        const distanceModifier = this._config['compatibility']['distanceModifier'] as number;
        const disjointCoefficient = this._config['compatibility']['disjointCoefficient'] as number;
        const excessCoefficient = this._config['compatibility']['excessCoefficient'] as number;
        const weightCoefficient = this._config['compatibility']['weightCoefficient'] as number;

        const switchObjectiveCount = this._config['switchObjectiveCount'] ?? 20;
        const activationTraceRepetitions = this._config['aTRepetitions'] ?? 0;
        const doPrintPopulationRecord = this._config['populationRecord'] as string === 'true';
        const timeout = this._config['networkFitness']['timeout'];

        const coverageStableCount = this.getCoverageStableCount();

        properties.populationSize = populationSize;
        properties.numberOfSpecies = numberOfSpecies;
        properties.parentsPerSpecies = parentsPerSpecies;
        properties.penalizingAge = penalizingAge;
        properties.ageSignificance = ageSignificance;
        properties.inputRate = inputRate;
        properties.activationFunction = activationFunction;

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

        properties.compatibilityDistanceThreshold = distanceThreshold;
        properties.compatibilityModifier = distanceModifier;
        properties.disjointCoefficient = disjointCoefficient;
        properties.excessCoefficient = excessCoefficient;
        properties.weightCoefficient = weightCoefficient;

        properties.eventSelection = this.getNeuroevolutionEventSelection();
        properties.classificationType = this.getClassificationType();
        properties.timeout = timeout;
        properties.activationTraceRepetitions = activationTraceRepetitions;
        properties.printPopulationRecord = doPrintPopulationRecord;
        properties.stoppingCondition = this._getStoppingCondition(this._config['stoppingCondition']);

        if (properties instanceof (NeatestParameter || ManyObjectiveNeatestParameter)) {
            properties.coverageStableCount = coverageStableCount;
            properties.switchObjectiveCount = switchObjectiveCount;

            if (this._config['population'] === undefined || this._config['population']['strategy'] === undefined) {
                throw new ConfigException('Population generation strategy is missing');
            }

            properties.populationGeneration = this._config['population']['strategy'];
            if (properties.populationGeneration === 'random') {
                properties.randomFraction = 1;
            } else {
                properties.randomFraction = this._config['population']['randomFraction'] ?
                    this._config['population']['randomFraction'] : 0.1;
            }

            // Check whether we will apply gradient descent.
            if ('gradientDescent' in this._config) {
                const gradientDescent = this._config['gradientDescent'];
                properties.gradientDescentParameter = {
                    probability: gradientDescent['probability'],
                    learningRate: gradientDescent['learningRate'],
                    learningRateAlgorithm: gradientDescent['learningRateAlgorithm'],
                    epochs: gradientDescent['epochs'],
                    batchSize: gradientDescent['batchSize'],
                    combinePlayerRecordings: gradientDescent['combinePlayerRecordings'],
                };
            }
        }

        if (properties instanceof ManyObjectiveNeatestParameter && this.getAlgorithm() != 'newsdNeatest') {
            properties.diversityMetric = this._getDiversityMetric();
        }

        if (properties instanceof MioNeatestParameter) {
            this.setNeuroevolutionMioParameter(properties);
        }

        if (properties instanceof NewsdNeatestParameter) {
            this.setNewsdParameter(properties);
        }

        return properties;
    }

    private setNewsdParameter(properties: NewsdNeatestParameter) {
        properties.noviceMaxAge = this._config['noviceMaxAge'] as number;
        properties.mutationOperator = this._getMutationOperator() as NeatMutation;
    }

    private setNeuroevolutionMioParameter(properties: MioNeatestParameter) {
        properties.mutationOperator = this._getMutationOperator() as NeatMutation;
        properties.maxArchiveSize = this._config['maxArchiveSize'] as number;
        properties.randomSelectionProbability = this._config['randomSelectionProbability'] as number;

        properties.maxMutationCount = this._config['mutation']['maxMutationCount'] as number;
        properties.structMutationProb = this._config['mutation']['structMutationProbability'] as number;

        properties.focusedPhaseStart = this._config['focusedPhase']['focusedPhaseStart'] as number;
        properties.maxArchiveSizeFocusedPhase = this._config['focusedPhase']['maxArchiveSizeFocusedPhase'] as number;
        properties.maxMutationCountFocusedPhase = this._config['focusedPhase']['maxMutationCountFocusedPhase'] as number;
        properties.randomSelectionProbabilityFocusedPhase = this._config['focusedPhase']['randomSelectionProbabilityFocusedPhase'] as number;
    }

    get neuroevolutionProperties(): NeatParameter {
        return this._properties as NeatParameter;
    }

    private setDynamicSuiteParameter(): BasicNeuroevolutionParameter {
        const parameter = new BasicNeuroevolutionParameter();
        parameter.timeout = this._config['timeout'];
        parameter.networkFitness = new ReliableCoverageFitness(1, false);
        parameter.classificationType = this.getClassificationType();
        return parameter;
    }

    get dynamicSuiteParameter(): BasicNeuroevolutionParameter {
        if (this._properties instanceof BasicNeuroevolutionParameter) {
            return this._properties;
        }
        return undefined;
    }

    private _setRLHyperparameter(): RLHyperparameter {
        const hyperparameter = this._getRLHyperparameterClass();
        this._setRewardParameter(hyperparameter);
        this._setNetworkParameter(hyperparameter);
        this._setTrainingParameter(hyperparameter);
        this._setEnvironmentParameter(hyperparameter);
        this._setCoverageObjective(hyperparameter);

        hyperparameter.stoppingCondition = this._getStoppingCondition(this._config['stoppingCondition']);
        hyperparameter.logInterval = this._config['logInterval'] ?? Number.MAX_SAFE_INTEGER;
        return hyperparameter;
    }

    public getRLHyperparameter(): RLHyperparameter {
        if (this._properties instanceof RLHyperparameter) {
            return this._properties;
        }
        throw new ConfigException('RL Hyperparameter not set');
    }

    private _getRLHyperparameterClass(): RLHyperparameter {
        switch (this.getAlgorithm()) {
            case "dql":
                return this._setDQLHyperparameter();
            default:
                throw new ConfigException(`No matching Hyperparameter class for ${this.getAlgorithm()}`);
        }
    }

    private _setDQLHyperparameter(): DeepQLearningHyperparameter {
        const hyperparameter = new DeepQLearningHyperparameter();
        this._setEpsilonGreedyParameter(hyperparameter);
        this._setReplayMemoryParameter(hyperparameter);

        hyperparameter.targetUpdateFrequency = this._config['targetUpdateFrequency'] ?? 1000;
        hyperparameter.evaluationFrequency = this._config['evaluationFrequency'] ?? 100;
        return hyperparameter;
    }

    private _setEpsilonGreedyParameter(hyperparameter: RLHyperparameter): void {
        hyperparameter.epsilonGreedyParameter = {
            epsilonStart: this._config['epsilonGreedy']['epsilonStart'] ?? 0,
            epsilonEnd: this._config['epsilonGreedy']['epsilonEnd'] ?? 0,
            epsilonMaxFrames: this._config['epsilonGreedy']['epsilonMaxFrames'] ?? 0,
        };
    }

    private _setReplayMemoryParameter(hyperparameter: RLHyperparameter): void {
        hyperparameter.replayMemoryParameter = {
            size: this._config['replayMemory']['size'] ?? 0,
            warmUpSteps: this._config['replayMemory']['warmUpSteps'] ?? 0,
        };
    }

    private _setRewardParameter(hyperparameter: RLHyperparameter): void {
        hyperparameter.rewardParameter = {
            type: this._config['reward']['type'],
            gamma: this._config['reward']['gamma'] ?? 1
        };
    }

    private _setNetworkParameter(hyperparameter: RLHyperparameter): void {
        const actionExtractor = new RLEventExtractor(Container.vm);
        hyperparameter.networkArchitecture = {
            inputShape: FeatureExtraction.getFeatureDimension(Container.vm),
            hiddenLayers: this._config['network']['hiddenLayers'],
            hiddenActivationFunction: this._config['network']['hiddenActivationFunction'],
            outputShape: actionExtractor.extractStaticEvents(Container.vm).length,
        };
    }

    private _setTrainingParameter(hyperparameter: RLHyperparameter): void {
        hyperparameter.trainingParameter = {
            optimizer: this._config['training']['optimizer'],
            frequency: this._config['training']['frequency'] ?? 5,
            batchSize: this._config['training']['batchSize'] ?? 32,
            learningRate: this._config['training']['learningRate'] ?? 0.0001,
            epochs: this._config['training']['epochs'] ?? 1
        };
    }

    private _setEnvironmentParameter(hyperparameter: RLHyperparameter): void {
        hyperparameter.environmentParameter = {
            skipFrames: this._config['environment']['skipFrames'] ?? 5,
            maxSteps: this._config['environment']['maxSteps'] ?? Number.MAX_SAFE_INTEGER,
            maxTime: this._config['environment']['maxTime'] ?? Number.MAX_SAFE_INTEGER,
            mouseMoveLength: this._config['environment']['mouseMoveLength'] ?? 5,
        };
    }

    private _setCoverageObjective(hyperparameter: RLHyperparameter): void {
        hyperparameter.coverageObjectives = {
            type: this._config['coverageObjective']['type'] ?? "statement",
            targets: this._config['coverageObjective']['targets'] ?? [],
            stableCount: this._config['coverageObjective']['stableCount'] ?? 1,
            switchTargetThreshold: this._config['coverageObjective']['switchTargetThreshold'] ?? Number.MAX_SAFE_INTEGER
        };
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
                    this.searchAlgorithmProperties['chromosomeLength'],
                    this.searchAlgorithmProperties['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case 'variableLengthConstrained':
                return new VariableLengthConstrainedChromosomeMutation(this._config['integerRange']['min'],
                    this._config['integerRange']['max'],
                    this.searchAlgorithmProperties['chromosomeLength'],
                    this.searchAlgorithmProperties['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case 'biasedVariableLength':
                return new BiasedVariableLengthMutation(this._config['integerRange']['min'],
                    this._config['integerRange']['max'],
                    this.searchAlgorithmProperties['chromosomeLength'],
                    this.searchAlgorithmProperties['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case 'biasedVariableLengthConstrained':
                return new BiasedVariableLengthConstrainedChromosomeMutation(this._config['integerRange']['min'],
                    this._config['integerRange']['max'],
                    this.searchAlgorithmProperties['chromosomeLength'],
                    this.searchAlgorithmProperties['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case 'eventBiased':
                return new EventBiasedMutation(this._config['integerRange']['min'],
                    this._config['integerRange']['max'],
                    this.searchAlgorithmProperties['chromosomeLength'],
                    this.searchAlgorithmProperties['reservedCodons'],
                    this._config['mutation']['gaussianMutationPower']);
            case 'neatMutation':
                return new NeatMutation(this._config['mutation'], this.neuroevolutionProperties);
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
                return new SinglePointRelativeCrossover(this.searchAlgorithmProperties['reservedCodons']);
            case 'neatCrossover':
                return new NeatCrossover(this._config['crossover']);
            case 'uniformNeatCrossover':
                return new UniformNeatCrossover(this._config['crossover']);
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
                return new NeuroevolutionScratchEventExtractor(Container.vm, this.getClassificationType());
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
                const mutationOperator = this._getMutationOperator();
                if (!(mutationOperator instanceof NeatMutation)) {
                    throw new ConfigException(`The neatChromosome generator requires a NeatMutation operator, but  ${typeof mutationOperator} was specified`);
                }
                const crossoverOperator = this._getCrossoverOperator();
                if (!(crossoverOperator instanceof NeatCrossover)) {
                    throw new ConfigException(`The neatChromosome generator requires a NeatCrossover operator, but  ${typeof crossoverOperator} was specified`);
                }

                const eventExtractor = this.getEventExtractor();
                let outputSpace = eventExtractor.extractEvents(Container.vm);
                if (outputSpace.length == 0 && eventExtractor instanceof NeuroevolutionScratchEventExtractor) {
                    outputSpace = eventExtractor.extractStaticEvents(Container.vm);
                }

                const outActivationFunction = this.getClassificationType() == 'multiLabel' ?
                    ActivationFunction.SIGMOID : ActivationFunction.SOFTMAX;
                return new NeatChromosomeGenerator(
                    FeatureExtraction.getFeatureMap(Container.vm),
                    outputSpace,
                    this.getInputConnectionMethod(),
                    this.neuroevolutionProperties.activationFunction,
                    outActivationFunction,
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
            case 'branch':
                return FitnessFunctionType.BRANCH;
            case 'one-max':
                return FitnessFunctionType.ONE_MAX;
            case 'single-bit':
                return FitnessFunctionType.SINGLE_BIT;
            default:
                throw new ConfigException(`Unknown fitness function ${fitnessFunction}`);
        }
    }

    public getNetworkFitnessFunctionType(): NetworkFitnessFunctionType {
        // A network fitness function may not be specified, e.g. when executing already generated dynamic tests.
        if (!("networkFitness" in this._config)) {
            return NetworkFitnessFunctionType.NONE;
        }
        const fitnessFunction = this._config["networkFitness"]["type"];
        switch (fitnessFunction) {
            case 'score':
                return NetworkFitnessFunctionType.SCORE;
            case 'survive':
                return NetworkFitnessFunctionType.SURVIVE;
            case 'reliableStatement':
                return NetworkFitnessFunctionType.COVERAGE;
            case 'manyObjectiveReliableStatement':
                return NetworkFitnessFunctionType.MANY_OBJECTIVE_COVERAGE;
            case 'cosineNovelty':
                return NetworkFitnessFunctionType.NOVELTY_COSINE;
            case 'eventNovelty':
                return NetworkFitnessFunctionType.NOVELTY_EVENTS;
            default:
                return NetworkFitnessFunctionType.NONE;
        }
    }

    public getNetworkFitnessFunction(type: NetworkFitnessFunctionType): NetworkFitnessFunction<NetworkChromosome> {
        const fitnessFunction = this._config['networkFitness'];
        const stableCount = this.getCoverageStableCount();
        switch (type) {
            case NetworkFitnessFunctionType.SCORE:
                return new ScoreFitness();
            case NetworkFitnessFunctionType.SURVIVE:
                return new SurviveFitness();
            case NetworkFitnessFunctionType.COVERAGE: {
                const earlyStop = fitnessFunction['earlyStop'] !== undefined ? fitnessFunction['earlyStop'] : false;
                return new ReliableCoverageFitness(stableCount, earlyStop);
            }
            case NetworkFitnessFunctionType.MANY_OBJECTIVE_COVERAGE: {
                const noveltyFunction = this.getManyObjectiveNoveltyFunction();
                return new ManyObjectiveReliableCoverageFitness(stableCount, noveltyFunction);
            }
            case NetworkFitnessFunctionType.NOVELTY_COSINE: {
                const [neighbours, archiveProb, noveltyWeight] = this.extractNoveltyParameter(fitnessFunction);
                return new CosineStateNovelty(stableCount, neighbours, archiveProb, noveltyWeight);
            }
            case NetworkFitnessFunctionType.NOVELTY_EVENTS: {
                const [neighbours, archiveProb, noveltyWeight] = this.extractNoveltyParameter(fitnessFunction);
                return new EventSequenceNovelty(stableCount, neighbours, archiveProb, noveltyWeight);
            }
            default:
                throw new ConfigException(`Unknown network fitness function ${fitnessFunction['type']}`);
        }
    }

    public getManyObjectiveNoveltyFunction(): NoveltyFitness<any> {
        const diversityMetric = this._config['diversityMetric'];
        switch (diversityMetric) {
            case 'cosineNovelty':
                return this.getNetworkFitnessFunction(NetworkFitnessFunctionType.NOVELTY_COSINE) as CosineStateNovelty;
            case 'eventNovelty':
                return this.getNetworkFitnessFunction(NetworkFitnessFunctionType.NOVELTY_EVENTS) as EventSequenceNovelty;
            default:
                return null;
        }
    }

    private extractNoveltyParameter(fitnessConfig: Record<string, number | undefined>): [number, number, number] {
        const neighbours = fitnessConfig['neighbours'] ?? 15;
        const archiveProb = fitnessConfig['archiveProb'] ?? 1;
        const noveltyWeight = fitnessConfig['noveltyWeight'] ?? 0;
        return [neighbours, archiveProb, noveltyWeight];
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

    public getAlgorithm(): OptimizationAlgorithmType {
        return this._config['algorithm'];
    }

    public getTestGenerator(): TestGenerator {
        if (this._config["testGenerator"] == "random") {
            return new RandomTestGenerator(this, this._config['minEventSize'], this._config['maxEventSize'], Container.vmWrapper);
        } else if (this._config['testGenerator'] == 'iterative') {
            return new IterativeSearchBasedTestGenerator(this, Container.vmWrapper);
        } else if (this._config['testGenerator'] == 'manyObjective') {
            return new ManyObjectiveTestGenerator(this, Container.vmWrapper);
        } else if (this._config['testGenerator'] == 'neuroevolution') {
            return new NeuroevolutionTestGenerator(this, Container.vmWrapper);
        } else if (this._config['testGenerator'] == 'reinforcementLearning') {
            return new RLTestGenerator(this, Container.vmWrapper);
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

    private _getDiversityMetric(): DiversityMetric {
        switch (this._config['diversityMetric']) {
            case 'compatibilityDistance':
                return DiversityMetric.COMPAT_DISTANCE;
            case 'speciesSize':
                return DiversityMetric.SPECIES_SIZE;
            case 'cosineNovelty':
            case 'eventNovelty':
                return DiversityMetric.NOVELTY;
            default:
                throw new ConfigException(`Unknown diversity metric ${this._config['diversityMetric']}`);
        }
    }

    public getInputConnectionMethod(): InputConnectionMethod {
        switch (this._config['chromosome']['inputConnectionMethod']) {
            case'sparse':
                return 'sparse';
            case 'fully':
                return 'fully';
        }
        throw new ConfigException("Unknown InputConnectionMethod " + this._config['chromosome']['inputConnectionMethod']);
    }

    public getWaitStepUpperBound(): number {
        if (this._config['durations'] && this._config['durations']['waitStepUpperBound']) {
            return this._config['durations']['waitStepUpperBound'];
        } else {
            return 100;
        }
    }

    public getPressDurationUpperBound(): number {
        if (this._config['durations'] && this._config['durations']['pressDuration']) {
            return this._config['durations']['pressDuration'];
        } else {
            return 10;
        }
    }

    public getSoundDuration(): number {
        if (this._config['durations'] && this._config['durations']['soundDuration']) {
            return this._config['durations']['soundDuration'];
        } else {
            return 10;
        }
    }

    public getClickDuration(): number {
        if (this._config['durations'] && this._config['durations']['clickDuration']) {
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

    public getNeuroevolutionEventSelection(): NeuroevolutionEventSelection {
        if ("eventSelection" in this._config) {
            switch (this._config['eventSelection']) {
                case 'random':
                    return 'random';
                case 'activation':
                default:
                    return 'activation';
            }
        }
        return 'activation';
    }

    public isMinimizationActive(): boolean {
        if ("minimize" in this._config) {
            return this._config['minimize'];
        } else {
            return true; // default
        }
    }

    public isAssertionGenerationActive(): boolean {
        if ("assertions" in this._config) {
            return this._config['assertions'];
        } else {
            return true; // default
        }
    }

    public isMinimizeAssertionsActive(): boolean {
        if ("minimizeAssertions" in this._config) {
            return this._config['minimizeAssertions'];
        } else {
            return true; // default
        }
    }

    // Time budget for test minimization in milliseconds.
    public getMinimizationTimeBudget(): number {
        if ("minimizationTimeBudget" in this._config) {
            return this._config["minimizationTimeBudget"];
        } else {
            return 0; // default, 0 means unlimited budget
        }
    }

    public getCoverageStableCount(): number {
        if ('networkFitness' in this._config && this._config['networkFitness']['stableCount']) {
            return this._config['networkFitness']['stableCount'];
        }
        if ('coverageObjective' in this._config && this._config['coverageObjective']['stableCount']) {
            return this._config['coverageObjective']['stableCount'];
        }
        return 1;
    }

    public getSkipFrame(): number {
        if (this._config['events'] && this._config['events']['skipFrame']) {
            return this._config['events']['skipFrame'];
        } else {
            return 1;
        }
    }

    public getActionThreshold(): number {
        if (this._config['events'] && this._config['events']['actionThreshold']) {
            return this._config['events']['actionThreshold'];
        } else {
            return 0.5;
        }
    }

    public getTypeNumberMagnitude():number {
        if (this._config['events'] && this._config['events']['typeNumberMagnitude']) {
            return this._config['events']['typeNumberMagnitude'];
        } else {
            return 100;
        }
    }

    private getClassificationType(): ClassificationType {
        return this._config['classificationType'] ?? 'multiLabel';
    }
}
