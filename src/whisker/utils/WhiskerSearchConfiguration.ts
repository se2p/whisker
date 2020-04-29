import {Preconditions} from "./Preconditions";
import {SearchAlgorithmProperties} from "../search/SearchAlgorithmProperties";
import {TestGenerator} from "../testgenerator/TestGenerator";
import {RandomTestGenerator} from "../testgenerator/RandomTestGenerator";
import {FixedIterationsStoppingCondition} from "../search/stoppingconditions/FixedIterationsStoppingCondition";

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

        const properties = new SearchAlgorithmProperties(populationSize,crossoverProbability,mutationProbability);
        properties.setChromosomeLength(chromosomeLength)

        const stoppingCond =  this.dict['stopping-condition'];
        if (stoppingCond["type"] == "fixed-iteration") {
            properties.setStoppingCondition(new FixedIterationsStoppingCondition(stoppingCond["iterations"]))
        }

        return properties;
    }

    public getTestGenerator(): TestGenerator {
        if (this.dict["algorithm"] == "random") {
            return new RandomTestGenerator();
        }

        throw new ConfigException("Unknown Algorithm");
    }
}
