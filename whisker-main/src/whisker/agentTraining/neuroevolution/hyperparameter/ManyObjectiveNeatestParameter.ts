import {NeatestParameter} from "./NeatestParameter";

export class ManyObjectiveNeatestParameter extends NeatestParameter {

    /**
     * The probability for executing a mutation.
     */
    private _mutationProbability: number;

    /**
     * The probability for executing a crossover.
     */
    private _crossoverProbability: number;

    /**
     * The options "compatibilityDistance" and "speciesSize" are allowed.
     */
    private _diversityMetric: DiversityMetric

    get mutationProbability(): number {
        return this._mutationProbability;
    }

    set mutationProbability(value: number) {
        this._mutationProbability = value;
    }

    get crossoverProbability(): number {
        return this._crossoverProbability;
    }

    set crossoverProbability(value: number) {
        this._crossoverProbability = value;
    }

    get diversityMetric(): DiversityMetric {
        return this._diversityMetric;
    }

    set diversityMetric(value: DiversityMetric) {
        this._diversityMetric = value;
    }
}


/**
 * The method to calculate the diversity of a network.
 */
export enum DiversityMetric {
    SPECIES_SIZE = "speciesSize",
    COMPAT_DISTANCE = "compatibilityDistance",
    NOVELTY = "novelty",
}

