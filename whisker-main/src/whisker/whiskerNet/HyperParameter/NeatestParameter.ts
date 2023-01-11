import {NeuroevolutionTestGenerationParameter} from "./NeuroevolutionTestGenerationParameter";

export class NeatestParameter extends NeuroevolutionTestGenerationParameter {
    /**
     * Number of generations without improvement after which the explorative NEAT algorithm changes his currently
     * selected target statement.
     */
    private _switchTargetCount = 5;

    /**
     * Number of robustness checks after which a statement is treated as covered within the explorative NEAT algorithm.
     */
    private _coverageStableCount = 0;

    /**
     * Defines how new population are to be generated.
     */
    private _populationGeneration: PopulationGeneration;

    /**
     * The number of randomly generated networks in non-random population generation strategies.
     */
    private _randomFraction: number;


    // Stochastic Gradient Descent.

    /**
     * Whether to use SGD for network training.
     */
    private _applyStochasticGradientDescent = false;

    /**
     * Probability of applying SGD instead of genetic weight mutation.
     */
    private _sgdProbability = 0.5

    /**
     * The learning rate for gradient descent.
     */
    private _learningRate = 0.1

    /**
     * The number of training iterations.
     */
    private _epochs = 100;


    get switchTargetCount(): number {
        return this._switchTargetCount;
    }

    set switchTargetCount(value: number) {
        this._switchTargetCount = value;
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

    get applyStochasticGradientDescent(): boolean {
        return this._applyStochasticGradientDescent;
    }

    set applyStochasticGradientDescent(value: boolean) {
        this._applyStochasticGradientDescent = value;
    }

    get sgdProbability(): number {
        return this._sgdProbability;
    }

    set sgdProbability(value: number) {
        this._sgdProbability = value;
    }

    get learningRate(): number {
        return this._learningRate;
    }

    set learningRate(value: number) {
        this._learningRate = value;
    }

    get epochs(): number {
        return this._epochs;
    }

    set epochs(value: number) {
        this._epochs = value;
    }
}

export type PopulationGeneration = 'random' | 'direct_parent' | 'global_solutions';
