import {NeuroevolutionTestGenerationParameter} from "./NeuroevolutionTestGenerationParameter";
import {augmentationParameter, gradientDescentParameter} from "../Misc/GradientDescent";

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
     * Defines how new populations will be generated.
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
    private _gradientDescentProb = 0.5

    /**
     * Parameter for the gradient descent algorithm.
     */
    private _gradientDescentParameter: gradientDescentParameter = {
        learningRate: 0.001,
        learningRateAlgorithm: 'Static',
        epochs: 100,
        batchSize: 32,
        labelSmoothing: 0
    };

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

    get gradientDescentProb(): number {
        return this._gradientDescentProb;
    }

    set gradientDescentProb(value: number) {
        this._gradientDescentProb = value;
    }

    get gradientDescentParameter(): gradientDescentParameter {
        return this._gradientDescentParameter;
    }

    set gradientDescentParameter(value: gradientDescentParameter) {
        this._gradientDescentParameter = value;
    }

    get dataAugmentation(): augmentationParameter {
        return this._dataAugmentation;
    }

    set dataAugmentation(value: augmentationParameter) {
        this._dataAugmentation = value;
    }

}

export type PopulationGeneration = 'random' | 'direct_parent' | 'global_solutions';
