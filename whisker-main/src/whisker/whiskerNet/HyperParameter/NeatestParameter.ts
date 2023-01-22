import {NeuroevolutionTestGenerationParameter} from "./NeuroevolutionTestGenerationParameter";
import {augmentationParameter} from "../Misc/GradientDescent";

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


    // Gradient Descent.

    /**
     * Whether to use gradient descent for network training.
     */
    private _applyGradientDescent = false;

    /**
     * Probability of applying gradient descent instead of genetic weight mutation.
     */
    private _gradientDescent = 0.5

    /**
     * The learning rate for gradient descent.
     */
    private _learningRate = 0.1

    /**
     * The number of training iterations.
     */
    private _epochs = 100;

    /**
     * The batch size used by the gradient descent algorithm.
     */
    private _batchSize = 32;

    /**
     * Parameter for augmenting gradient descent ground truth data.
     */
    private _dataAugmentation: augmentationParameter = {
        doAugment: false,
        numAugments: 0,
        disturbStateProb: 0,
        disturbStatePower: 0
    };


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

    get applyGradientDescent(): boolean {
        return this._applyGradientDescent;
    }

    set applyGradientDescent(value: boolean) {
        this._applyGradientDescent = value;
    }

    get gradientDescent(): number {
        return this._gradientDescent;
    }

    set gradientDescent(value: number) {
        this._gradientDescent = value;
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

    get dataAugmentation(): augmentationParameter {
        return this._dataAugmentation;
    }

    set dataAugmentation(value: augmentationParameter) {
        this._dataAugmentation = value;
    }

    get batchSize(): number {
        return this._batchSize;
    }

    set batchSize(value: number) {
        this._batchSize = value;
    }
}

export type PopulationGeneration = 'random' | 'direct_parent' | 'global_solutions';
