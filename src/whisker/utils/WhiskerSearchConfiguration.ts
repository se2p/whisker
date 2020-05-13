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

class ConfigException implements Error {
    message: string;
    name: string;

    constructor(message: string) {
        this.name = "ConfigException"
        this.message = message;

    }
}

export class WhiskerSearchConfiguration {

    private readonly dict: {};

    constructor(dict: {}) {
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
            this.dict['mutation']['maxMutationCountStart'] as number);
        properties.setSelectionProbabilities(this.dict['selection']['randomSelectionProbabilityStart'] as number,
            this.dict['selection']['randomSelectionProbabilityFocusedPhase'] as number);
        properties.setMaxArchiveSizes(this.dict['archive']['maxArchiveSizeStart'] as number,
            this.dict['archive']['maxArchiveSizeFocusedPhase'] as number);
        properties.setStartOfFocusedPhase(this.dict['startOfFocusedPhase'] as number);

        const stoppingCond = this.dict['stopping-condition'];
        if (stoppingCond["type"] == "fixed-iteration") {
            properties.setStoppingCondition(new FixedIterationsStoppingCondition(stoppingCond["iterations"]))
        }

        //TODO maybe we need to throw an error if we expect his and it is not here?
        if ("integerRange" in this.dict) {
            const integerRange = this.dict["integerRange"];
            properties.setIntRange(integerRange["min"], integerRange["max"]);
        }

        return properties;
    }

    private _getMutationOperator(): Mutation<any> {
        switch (this.dict['mutation']['operator']) {
            case 'bitflip':
                return new BitflipMutation();
            case 'integerlist':
            default:
                return new IntegerListMutation(this.dict['integerRange']['min'], this.dict['integerRange']['max']);
        }
    }

    private _getCrossoverOperator(): Crossover<any> {
        switch (this.dict['crossover']['operator']) {
            case 'singlepoint':
            default:
                return new SinglePointCrossover();
        }
    }

    public getSelectionOperator(): Selection<any> {
        switch (this.dict['selection']['operator']) {
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
            case 'test':
            default:
                return new TestChromosomeGenerator(this.getSearchAlgorithmProperties(),
                    this._getMutationOperator(),
                    this._getCrossoverOperator());
        }
    }

    public getFitnessFunctionType(): FitnessFunctionType {
        switch (this.dict['fitness-function']) {
            case 'statement':
                return FitnessFunctionType.STATEMENT;
            case 'one-max':
                return FitnessFunctionType.ONE_MAX;
            case 'single-bit':
            default:
                return FitnessFunctionType.SINGLE_BIT;
        }
    }

    public getAlgorithm(): SearchAlgorithmType {
        switch (this.dict['algorithm']) {
            case 'random':
                return SearchAlgorithmType.RANDOM;
            case 'one-plus-one':
                return SearchAlgorithmType.ONE_PLUS_ONE;
            case 'mosa':
                return SearchAlgorithmType.MOSA;
            case 'mio':
            default:
                return SearchAlgorithmType.MIO;
        }
    }

    public getTestGenerator(): TestGenerator {
        if (this.dict["test-generator"] == "random") {
            return new RandomTestGenerator(this);
        } else if (this.dict['test-generator'] == 'iterative') {
            return new IterativeSearchBasedTestGenerator(this);
        } else if (this.dict['test-generator'] == 'many-objective') {
            return new ManyObjectiveTestGenerator(this);
        }

        throw new ConfigException("Unknown Algorithm " + this.dict["test-generator"]);
    }
}
