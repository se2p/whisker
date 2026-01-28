import * as tf from "@tensorflow/tfjs";
import {TfAgentWrapper} from "./TfAgentWrapper";
import {LayersModel} from "@tensorflow/tfjs";

export class QNetwork extends TfAgentWrapper {

    /**
     * Generates a Q-Network based on the supplied architecture that computes a linear output activation function
     * for computing action-value pairs.
     *
     * @returns The generated network.
     */
    protected _generateModel(): LayersModel {
        const model = tf.sequential();
        const architecture = this._hyperparameter.networkArchitecture;

        const hiddenInit = architecture.hiddenActivationFunction === 'relu'
            ? 'heUniform' : 'glorotUniform';

        // Hidden layers
        for (let i = 0; i < architecture.hiddenLayers.length; i++) {
            model.add(tf.layers.dense({
                units: architecture.hiddenLayers[i],
                activation: architecture.hiddenActivationFunction,
                kernelInitializer: hiddenInit,
                biasInitializer: 'zeros',
                ...(i === 0 ? {inputShape: [architecture.inputShape]} : {})
            }));
        }

        // Output layer
        model.add(tf.layers.dense({
            units: architecture.outputShape,
            activation: "linear",
            kernelInitializer: tf.initializers.randomUniform({minval: -1e-3, maxval: 1e-3}),
            biasInitializer: 'zeros'
        }));

        model.compile({
            optimizer: this._getOptimizer(this._hyperparameter.trainingParameter),
            loss: 'meanSquaredError'
        });

        return model;
    }

    /**
     * {@inheritDoc}
     */
    public override clone(): QNetwork {
        const clone = new QNetwork(this._hyperparameter);
        const weights = this.model.getWeights();
        const copiedWeights = weights.map(w => w.clone());
        clone.model.setWeights(copiedWeights);
        return clone;
    }
}
