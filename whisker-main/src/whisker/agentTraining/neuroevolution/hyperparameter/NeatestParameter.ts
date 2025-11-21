import {NeatParameter} from "./NeatParameter";
import {gradientDescentParameter} from "../misc/GradientDescent";

export class NeatestParameter extends NeatParameter {
    /**
     * Number of generations without improvement after which the explorative NEAT algorithm changes his currently
     * selected target statement.
     */
    private _switchObjectiveCount = 5;

    /**
     * Number of robustness checks after which a statement is treated as covered within the explorative NEAT algorithm.
     */
    private _coverageStableCount = 0;

    /**
     * Defines how new populations will be generated.
     */
    private _populationGeneration: PopulationGeneration;

    /**
     * The number of randomly generated networks in non-random population generation strategies.
     */
    private _randomFraction: number;


    // Gradient Descent.

    /**
     * Parameter for the gradient descent algorithm.
     */
    private _gradientDescentParameter: gradientDescentParameter = {
        probability: 0,
        learningRate: 0.001,
        learningRateAlgorithm: 'Static',
        epochs: 1000,
        combinePlayerRecordings: false,
        batchSize: 1,
    };

    get switchObjectiveCount(): number {
        return this._switchObjectiveCount;
    }

    set switchObjectiveCount(value: number) {
        this._switchObjectiveCount = value;
    }

    get coverageStableCount(): number {
        return this._coverageStableCount;
    }

    set coverageStableCount(value: number) {
        this._coverageStableCount = value;
    }

    get populationGeneration(): PopulationGeneration {
        return this._populationGeneration;
    }

    set populationGeneration(value: PopulationGeneration) {
        this._populationGeneration = value;
    }

    get randomFraction(): number {
        return this._randomFraction;
    }

    set randomFraction(value: number) {
        this._randomFraction = value;
    }

    get gradientDescentParameter(): gradientDescentParameter {
        return this._gradientDescentParameter;
    }

    set gradientDescentParameter(value: gradientDescentParameter) {
        this._gradientDescentParameter = value;
    }
}

export type PopulationGeneration = 'random' | 'direct_parent' | 'global_solutions';
