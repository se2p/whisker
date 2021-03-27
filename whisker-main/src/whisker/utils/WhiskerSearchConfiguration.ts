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
import {FixedTimeStoppingCondtion} from "../search/stoppingconditions/FixedTimeStoppingCondition";
import {OneOfStoppingCondition} from "../search/stoppingconditions/OneOfStoppingCondition";
import {OptimalSolutionStoppingCondition} from "../search/stoppingconditions/OptimalSolutionStoppingCondition";
import {IllegalArgumentException} from "../core/exceptions/IllegalArgumentException";
import {NeuroevolutionTestGenerator} from "../testgenerator/NeuroevolutionTestGenerator";
import {NeatChromosomeGenerator} from "../whiskerNet/NeatChromosomeGenerator";
import {NeatMutation} from "../whiskerNet/NeatMutation";
import {NeatCrossover} from "../whiskerNet/NeatCrossover";
import {Container} from "./Container";
import {ScratchEventExtractor} from "../testcase/ScratchEventExtractor";
import {NeuroevolutionProperties} from "../whiskerNet/NeuroevolutionProperties";
import {StatementNetworkFitness} from "../whiskerNet/NetworkFitness/StatementNetworkFitness";
import {NetworkFitnessFunction} from "../whiskerNet/NetworkFitness/NetworkFitnessFunction";
import {NeatChromosome} from "../whiskerNet/NeatChromosome";
import {ScoreFitness} from "../whiskerNet/NetworkFitness/ScoreFitness";
import {SurviveFitness} from "../whiskerNet/NetworkFitness/SurviveFitness";
import {CombinedNetworkFitness} from "../whiskerNet/NetworkFitness/CombinedNetworkFitness";

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

    constructor(dict: Record<string, any>) {
        this.dict = Preconditions.checkNotUndefined(dict)
    }

    public getSearchAlgorithmProperties(): SearchAlgorithmProperties<any> {
        const populationSize = this.dict['population-size'] as number;
        const chromosomeLength = this.dict['chromosome-length'] as number;
        const crossoverProbability = this.dict['crossover']['probability'] as number;
        const mutationProbability = this.dict['mutation']['probability'] as number;

        const properties = new SearchAlgorithmProperties(populationSize, chromosomeLength);

        properties.setMutationProbablity(mutationProbability);
        properties.setCrossoverProbability(crossoverProbability);
        properties.setMaxMutationCounter(this.dict['mutation']['maxMutationCountStart'] as number,
            this.dict['mutation']['maxMutationCountFocusedPhase'] as number);
        properties.setSelectionProbabilities(this.dict['selection']['randomSelectionProbabilityStart'] as number,
            this.dict['selection']['randomSelectionProbabilityFocusedPhase'] as number);
        properties.setMaxArchiveSizes(this.dict['archive']['maxArchiveSizeStart'] as number,
            this.dict['archive']['maxArchiveSizeFocusedPhase'] as number);
        properties.setStartOfFocusedPhase(this.dict['startOfFocusedPhase'] as number);

        properties.setStoppingCondition(this._getStoppingCondition(this.dict['stopping-condition']));

        //TODO maybe we need to throw an error if we expect this and it is not here?
        if ("integerRange" in this.dict) {
            const integerRange = this.dict["integerRange"];
            properties.setIntRange(integerRange["min"], integerRange["max"]);
        }

        return properties;
    }

    public getNeuroevolutionProperties(): NeuroevolutionProperties<any> {
        const populationSize = this.dict['population-size'] as number;
        const properties = new NeuroevolutionProperties(populationSize);

        const parentsPerSpecies = this.dict['parentsPerSpecies'] as number;
        const penalizingAge = this.dict['penalizingAge'] as number;
        const ageSignificance = this.dict['ageSignificance'] as number;
        const inputRate = this.dict['inputRate'] as number

        const crossoverWithoutMutation = this.dict['crossover']['crossoverWithoutMutation'] as number
        const interspeciesMating = this.dict['crossover']['interspeciesRate'] as number
        const weightAverageRate = this.dict['crossover']['weightAverageRate'] as number

        const mutationWithoutCrossover = this.dict['mutation']['mutationWithoutCrossover'] as number
        const mutationAddConnection = this.dict['mutation']['mutationAddConnection'] as number
        const recurrentConnection = this.dict['mutation']['recurrentConnection'] as number
        const addConnectionTries = this.dict['mutation']['addConnectionTries'] as number
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

        const timeout = this.dict['network-fitness']['timeout']

        properties.parentsPerSpecies = parentsPerSpecies;
        properties.penalizingAge = penalizingAge;
        properties.ageSignificance = ageSignificance;
        properties.inputRate = inputRate;

        properties.crossoverWithoutMutation = crossoverWithoutMutation;
        properties.interspeciesMating = interspeciesMating;
        properties.crossoverAverageWeights = weightAverageRate;

        properties.mutationWithoutCrossover = mutationWithoutCrossover;
        properties.mutationAddConnection = mutationAddConnection;
        properties.recurrentConnection = recurrentConnection;
        properties.addConnectionTries = addConnectionTries;
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

        properties.stoppingCondition = this._getStoppingCondition(this.dict['stopping-condition']);
        properties.networkFitness = this.getNetworkFitnessFunction(this.dict['network-fitness'])
        return properties;
    }

    private _getStoppingCondition(stoppingCondition: Record<string, any>): StoppingCondition<any> {
        const stoppingCond = stoppingCondition["type"];
        if (stoppingCond == "fixed-iteration") {
            return new FixedIterationsStoppingCondition(stoppingCondition["iterations"])
        } else if (stoppingCond == "fixed-time") {
            return new FixedTimeStoppingCondtion(stoppingCondition["duration"]);
        } else if (stoppingCond == "optimal") {
            return new OptimalSolutionStoppingCondition()
        } else if (stoppingCond == "one-of") {
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
            case 'bitflip':
                return new BitflipMutation();
            case 'variablelength':
                return new VariableLengthMutation(this.dict['integerRange']['min'], this.dict['integerRange']['max'],
                    this.dict['chromosome-length'], this.dict['mutation']['alpha']);
            case'neatMutation':
                return new NeatMutation(
                    this.dict['mutation']['mutationAddConnection'] as number,
                    this.dict['mutation']['recurrentConnection'] as number,
                    this.dict['mutation']['addConnectionTries'] as number,
                    this.dict['mutation']['populationChampionConnectionMutation'] as number,
                    this.dict['mutation']['mutationAddNode'] as number,
                    this.dict['mutation']['mutateWeights'] as number,
                    this.dict['mutation']['perturbationPower'] as number,
                    this.dict['mutation']['mutateToggleEnableConnection'] as number,
                    this.dict['mutation']['toggleEnableConnectionTimes'] as number,
                    this.dict['mutation']['mutateEnableConnection'] as number)
            case 'integerlist':
            default:
                return new IntegerListMutation(this.dict['integerRange']['min'], this.dict['integerRange']['max']);
        }
    }

    private _getCrossoverOperator(): Crossover<any> {
        switch (this.dict['crossover']['operator']) {
            case 'singlepointrelative':
                return new SinglePointRelativeCrossover();
            case 'neatCrossover':
                return new NeatCrossover(this.dict['crossover']['weightAverageRate'] as number);
            case 'singlepoint':
            default:
                return new SinglePointCrossover();
        }
    }

    public getSelectionOperator(): Selection<any> {
        switch (this.dict['selection']['operator']) {
            case 'tournament':
                return new TournamentSelection(this.dict['selection']['tournamentSize']) as unknown as Selection<any>;
            case 'rank':
            default:
                return new RankSelection();
        }
    }

    public getChromosomeGenerator(): ChromosomeGenerator<any> {
        switch (this.dict['chromosome']) {
            case 'bitstring':
                return new BitstringChromosomeGenerator(this.getSearchAlgorithmProperties(),
                    this._getMutationOperator(),
                    this._getCrossoverOperator());
            case 'integerlist':
                return new IntegerListChromosomeGenerator(this.getSearchAlgorithmProperties(),
                    this._getMutationOperator(),
                    this._getCrossoverOperator());
            case 'variablelengthtest':
                return new VariableLengthTestChromosomeGenerator(this.getSearchAlgorithmProperties(),
                    this._getMutationOperator(),
                    this._getCrossoverOperator(),
                    this.dict['init-var-length']);
            case 'neatChromosome':
                return new NeatChromosomeGenerator(this._getMutationOperator(), this._getCrossoverOperator(),
                    ScratchEventExtractor.extractSpriteInfo(Container.vm),
                    ScratchEventExtractor.extractEvents(Container.vm).size(), this.dict['inputRate'],
                    ScratchEventExtractor.hasMouseEvent(Container.vm))

            case 'test':
            default:
                return new TestChromosomeGenerator(this.getSearchAlgorithmProperties(),
                    this._getMutationOperator(),
                    this._getCrossoverOperator());
        }
    }

    public getFitnessFunctionType(): FitnessFunctionType {
        const fitnessFunctionDef = this.dict['fitness-function'];
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

    public getNetworkFitnessFunction(fitnessFunction: Record<string, any>): NetworkFitnessFunction<NeatChromosome> {
        const networkFitnessDef = fitnessFunction['type'];
        if (networkFitnessDef === 'score')
            return new ScoreFitness(fitnessFunction['offset']);
        else if (networkFitnessDef === 'statement')
            return new StatementNetworkFitness();
        else if (networkFitnessDef === 'survive')
            return new SurviveFitness();
        else if (networkFitnessDef === 'combined') {
            const fitnessFunctions = fitnessFunction["functions"];
            const comb: NetworkFitnessFunction<NeatChromosome>[] = [];
            for (const functions of fitnessFunctions) {
                comb.push(this.getNetworkFitnessFunction(functions));
            }
            return new CombinedNetworkFitness(...comb)
        }
        throw new ConfigException("No Network Fitness specified in the config file!")
    }


    public getFitnessFunctionTargets(): List<string> {
        const fitnessFunctionDef = this.dict['fitness-function'];
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
        switch (this.dict['algorithm']) {
            case 'random':
                return SearchAlgorithmType.RANDOM;
            case 'one-plus-one':
                return SearchAlgorithmType.ONE_PLUS_ONE;
            case 'simplega':
                return SearchAlgorithmType.SIMPLEGA;
            case 'mosa':
                return SearchAlgorithmType.MOSA;
            case 'mio':
                return SearchAlgorithmType.MIO;
            case'neat':
                return SearchAlgorithmType.NEAT;
            case'randomNeuroevolution':
                return SearchAlgorithmType.RANDOM_NEUROEVOLUTION;
            default:
                throw new IllegalArgumentException("Invalid configuration. Unknown algorithm: " + this.dict['algorithm']);
        }
    }

    public getTestGenerator(): TestGenerator {
        if (this.dict["test-generator"] == "random") {
            return new RandomTestGenerator(this);
        } else if (this.dict['test-generator'] == 'iterative') {
            return new IterativeSearchBasedTestGenerator(this);
        } else if (this.dict['test-generator'] == 'many-objective') {
            return new ManyObjectiveTestGenerator(this);
        } else if (this.dict['test-generator'] == 'neuroevolution') {
            return new NeuroevolutionTestGenerator(this);
        }

        throw new ConfigException("Unknown Algorithm " + this.dict["test-generator"]);
    }

    public getWaitDuration(): number {
        if ("wait-duration" in this.dict) {
            return this.dict["wait-duration"]
        } else {
            return 10;
        }
    }

    public getPressDuration(): number {
        if ("press-duration" in this.dict) {
            return this.dict["press-duration"]
        } else {
            return 10;
        }
    }

    public getClickDuration(): number {
        if ("click-duration" in this.dict) {
            return this.dict["click-duration"]
        } else {
            return 10;
        }
    }
}
