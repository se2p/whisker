import * as tf from "@tensorflow/tfjs";
import {FitnessFunction} from "../../../search/FitnessFunction";
import {RLHyperparameter, TrainingParameter} from "../hyperparameter/RLHyperparameter";
import {ExecutionTrace} from "../../../testcase/ExecutionTrace";
import {StatementFitnessFunction} from "../../../testcase/fitness/StatementFitnessFunction";
import logger from "../../../../util/logger";
import {TestCase} from "../../../core/TestCase";
import {NonExhaustiveCaseDistinction} from "../../../core/exceptions/NonExhaustiveCaseDistinction";
import {LayersModel} from "@tensorflow/tfjs";

// Wrapper class for TensorFlow model.
export abstract class TfAgentWrapper implements TestCase {

    /**
     * The central TensorFlow model of the wrapper instance.
     */
    private _model: LayersModel

    /**
     * Stores the trace of the agent's last execution in the environment.
     */
    private _trace: ExecutionTrace;

    /**
     * Stores the set of covered blocks of the agent's last execution in the environment.
     */
    private _blockCoverage: Set<string>;

    /**
     * Stores the set of covered branching blocks of the agent's last execution in the environment.
     */
    private _branchCoverage: Set<string>;

    /**
     * Maps each coverage objective to the number of times it was covered by the agent's last executions.
     */
    private readonly _coverageCounts: Map<StatementFitnessFunction, number> = new Map<StatementFitnessFunction, number>();


    constructor(protected readonly _hyperparameter: RLHyperparameter) {
        this._model = this._generateModel();
    }

    /**
     * Generates a TensorFlow network model based on the supplied architecture and training parameters.
     *
     * @returns The generated network.
     */
    protected abstract _generateModel(): LayersModel;

    /**
     * Computes a forward pass based on the supplied inputs.
     *
     * @param inputs The inputs to the network.
     * @returns The output of the network.
     */
    public forwardPass(inputs: number[]): number[] {
        return tf.tidy(() => {
            const inputTensor = tf.tensor([inputs]); // shape: [1, inputs.length]
            const outputTensor = this._model.predict(inputTensor) as tf.Tensor;
            return Array.from(outputTensor.dataSync());
        });
    }

    /**
     * Trains the model on the supplied inputs and target vectors.
     *
     * @param inputs The inputs to the model.
     * @param labels The expected output labels of the network.
     * @param batchSize The batch size to use for training.
     * @param epochs The number of epochs to train for.
     * @returns The loss of the final training epoch.
     */
    public async train(inputs: number[][], labels: number[][], batchSize: number, epochs: number): Promise<tf.History> {
        const inputTensor = tf.tensor2d(inputs, [inputs.length, inputs[0].length]);
        const labelTensor = tf.tensor2d(labels, [labels.length, labels[0].length]);

        const history = await this._model.fit(inputTensor, labelTensor, {
            batchSize,
            epochs,
            shuffle: true,
            verbose: 0
        });

        inputTensor.dispose();
        labelTensor.dispose();

        return history;
    }

    /**
     * Initializes the specified TensorFlow optimizer with the specified parameters.
     * @param trainingParameter The training parameters to use.
     * @returns The initialized optimizer.
     *
     */
    protected _getOptimizer(trainingParameter: TrainingParameter): tf.Optimizer {
        switch (trainingParameter.optimizer) {
            case "adam":
                return tf.train.adam(trainingParameter.learningRate);
            case"rmsprop":
                return tf.train.rmsprop(trainingParameter.learningRate);
            default:
                throw new NonExhaustiveCaseDistinction(
                    trainingParameter.optimizer,
                    `Optimizer ${trainingParameter.optimizer} not supported!`
                );
        }
    }

    /**
     * Updates the input layer of the neural network to accommodate a new input size.
     * This method modifies the architecture of the model, transferring weights where applicable
     * with special handling for the first dense layer to preserve some compatibility during the adaptation process.
     *
     * @param newInputSize The size of the new input layer to be set.
     * @returns True if the input layer got modified.
     */
    public updateInputLayer(newInputSize: number): boolean {
        if (newInputSize <= this.getInputLayerSize()) {
            return false;
        }

        logger.debug(`Updating input layer: ${this.getInputLayerSize()} -> ${newInputSize}`);

        this._hyperparameter.networkArchitecture.inputShape = newInputSize;
        const oldWeights = this._model.getWeights();

        const newModel = this._generateModel();
        const newWeights = newModel.getWeights();

        // Transfer weights with special handling for the first dense layer
        const transferableWeights = newWeights.map((w, i) => {
            if (i === 0) {
                // For the first layer weights, we can try to preserve what we can
                const oldWeight = oldWeights[0];
                const newWeight = w;

                // If this is a dense layer, we can preserve weights for existing inputs
                if (oldWeight.shape.length === 2 && newWeight.shape.length === 2) {
                    const minInputs = Math.min(oldWeight.shape[0], newWeight.shape[0]);
                    const outputs = oldWeight.shape[1];

                    // Copy the overlapping weights
                    return tf.tidy(() => {
                        const preserved = oldWeight.slice([0, 0], [minInputs, outputs]);
                        const random = tf.randomNormal([newWeight.shape[0] - minInputs, outputs]);
                        return tf.concat([preserved, random], 0);
                    });
                }
            }

            // For other layers, keep existing weights if shapes match
            if (i < oldWeights.length && tf.util.arraysEqual(w.shape, oldWeights[i].shape)) {
                return oldWeights[i];
            }
            return w;
        });

        newModel.setWeights(transferableWeights);
        this._model = newModel;
        oldWeights.forEach(w => w.dispose());

        return true;
    }

    /**
     * Updates the output layer of the neural network to accommodate a new output size.
     * This method modifies the architecture of the model, transferring weights where applicable
     * with special handling for the last dense layer to preserve some compatibility during the adaptation process.
     *
     * @param newOutputSize The size of the new output layer to be set.
     * @returns True if the output layer got modified.
     */
    public updateOutputLayer(newOutputSize: number): boolean {
        if (newOutputSize <= this.getOutputLayerSize()) {
            return false;
        }

        logger.debug(`Updating output layer: ${this.getOutputLayerSize()} -> ${newOutputSize}`);

        // Update the architecture's output shape
        this._hyperparameter.networkArchitecture.outputShape = newOutputSize;
        const oldWeights = this._model.getWeights();

        // Generate a new model with the updated architecture
        const newModel = this._generateModel();
        const newWeights = newModel.getWeights();

        // Transfer weights with special handling for the last dense layer
        const transferableWeights = newWeights.map((w, i) => {
            if (i === newWeights.length - 2) { // Last layer's weights (excluding bias)
                // For the last layer weights, we can try to preserve what we can
                const oldWeight = oldWeights[oldWeights.length - 2];
                const newWeight = w;

                // If this is a dense layer, we can preserve weights for existing outputs
                if (oldWeight.shape.length === 2 && newWeight.shape.length === 2) {
                    const inputs = oldWeight.shape[0];
                    const minOutputs = Math.min(oldWeight.shape[1], newWeight.shape[1]);

                    // Copy the overlapping weights
                    return tf.tidy(() => {
                        const preserved = oldWeight.slice([0, 0], [inputs, minOutputs]);
                        const random = tf.randomNormal([inputs, newWeight.shape[1] - minOutputs]);
                        return tf.concat([preserved, random], 1);
                    });
                }
            } else if (i === newWeights.length - 1) { // Last layer's bias
                const oldBias = oldWeights[oldWeights.length - 1];
                const newBias = w;

                // Preserve existing biases and initialize new ones randomly
                return tf.tidy(() => {
                    const preserved = oldBias.slice([0], [Math.min(oldBias.shape[0], newBias.shape[0])]);
                    const random = tf.randomNormal([newBias.shape[0] - Math.min(oldBias.shape[0], newBias.shape[0])]);
                    return tf.concat([preserved, random], 0);
                });
            }

            // For other layers, keep existing weights if shapes match
            if (i < oldWeights.length && tf.util.arraysEqual(w.shape, oldWeights[i].shape)) {
                return oldWeights[i];
            }
            return w;
        });

        // Set the weights in the new model and clean up
        newModel.setWeights(transferableWeights);
        this._model = newModel;
        oldWeights.forEach(w => w.dispose());

        return true;
    }

    /**
     * Disposes the weights of the model.
     * This method should be called when the agent is no longer needed.
     * It frees up memory and prevents the agent from being used again.
     */
    public dispose(): void {
        this.model.dispose();
    }

    /**
     * Creates a deep clone of this agent.
     * The cloned agent model will have the same architecture, training parameters and weights as the original agent.
     *
     * @returns A new instance of the agent.
     */
    public abstract clone(): TfAgentWrapper;

    /**
     * Prints a summary of the network.
     */
    public printModelSummary(): void {
        this._model.summary();
    }

    /**
     * Resets the coverage map by setting all coverage counts of the supplied objectives to 0.
     * @param objectives The coverage objectives to track.
     */
    public resetCoverageMap(objectives: StatementFitnessFunction[]): void {
        this._coverageCounts.clear();
        for (const objective of objectives) {
            this._coverageCounts.set(objective, 0);
        }
    }

    /**
     * Saves the TensorFlow.js LayersModel to memory such that it can be downloaded after zipping it.
     *
     * @param filename The name of the model files (without extension).
     * @returns Promise that resolves with an array of file objects containing the model data.
     */
    public async saveModelToMemory(filename: string): Promise<Array<{ name: string, data: ArrayBuffer | string }>> {
        try {
            const modelFiles: Array<{ name: string, data: ArrayBuffer | string }> = [];

            await this._model.save({
                save: async (modelArtifacts) => {
                    // Save model topology and weights manifest
                    const modelJSON = {
                        modelTopology: modelArtifacts.modelTopology,
                        format: modelArtifacts.format,
                        generatedBy: modelArtifacts.generatedBy,
                        convertedBy: modelArtifacts.convertedBy,
                        weightsManifest: [{
                            paths: ["weights.bin"],
                            weights: modelArtifacts.weightSpecs
                        }],

                        customMetadata: {
                            parameter: this._hyperparameter,
                        }
                    };

                    modelFiles.push({
                        name: `${filename}/model.json`,
                        data: JSON.stringify(modelJSON)
                    });

                    // Handle weight data
                    if (modelArtifacts.weightData) {
                        modelFiles.push({
                            name: `${filename}/weights.bin`,
                            data: modelArtifacts.weightData as ArrayBuffer
                        });
                    }

                    return {
                        modelArtifactsInfo: {
                            dateSaved: new Date(),
                            modelTopologyType: 'JSON'
                        }
                    };
                }
            });

            return modelFiles;
        } catch (error) {
            logger.error(`Failed to save model to memory: ${error}`);
            throw error;
        }
    }

    public static async loadModelFromMemory<T extends TfAgentWrapper>(
        this: new (hyperparameter: RLHyperparameter) => T,
        model: string,
        weights: ArrayBuffer
    ): Promise<T> {
        try {
            const modelJSON = JSON.parse(model);
            const parameter = RLHyperparameter.fromJSON(modelJSON.customMetadata.parameter);
            const instance = new this(parameter);

            const ioHandler: tf.io.IOHandler = {
                load: async () => ({
                    modelTopology: modelJSON.modelTopology,
                    weightSpecs: modelJSON.weightsManifest[0].weights,
                    weightData: weights,
                })
            };
            const loadedModel = await tf.loadLayersModel(ioHandler);
            loadedModel.compile({
                optimizer: instance._getOptimizer(parameter.trainingParameter),
                loss: 'meanSquaredError'
            });
            instance._model = loadedModel;
            return instance;
        } catch (error) {
            logger.error(`Failed to load model from memory: ${error}`);
            throw error;
        }
    }


    public getInputLayerSize(): number {
        return this._model.layers[0].batchInputShape[1];
    }

    public getOutputLayerSize(): number {
        const lastLayer = this._model.layers[this._model.layers.length - 1];
        return lastLayer['units'];
    }

    /**
     * {@inheritdoc}
     */
    getFitness(fitnessFunction: FitnessFunction<TestCase>): Promise<number> {
        return fitnessFunction.getFitness(this);
    }

    /**
     * {@inheritdoc}
     */
    getTrace(): ExecutionTrace {
        return this._trace;
    }

    /**
     * {@inheritdoc}
     */
    getCoveredBlocks(): Set<string> {
        return this._blockCoverage;
    }

    getCoveredBranches(): Set<string> {
        return this._branchCoverage;
    }

    get hyperparameter(): RLHyperparameter {
        return this._hyperparameter;
    }

    get model(): LayersModel {
        return this._model;
    }

    set trace(value: ExecutionTrace) {
        this._trace = value;
    }

    set blockCoverage(value: Set<string>) {
        this._blockCoverage = value;
    }

    set branchCoverage(value: Set<string>) {
        this._branchCoverage = value;
    }

    get coverageCounts(): Map<StatementFitnessFunction, number> {
        return this._coverageCounts;
    }
}
