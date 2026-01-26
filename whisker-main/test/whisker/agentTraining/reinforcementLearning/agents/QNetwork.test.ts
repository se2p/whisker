import * as tf from '@tensorflow/tfjs';
import {expect} from "@jest/globals";
import {
    NetworkArchitecture,
    RLHyperparameter,
    TrainingParameter
} from '../../../../../src/whisker/agentTraining/reinforcementLearning/hyperparameter/RLHyperparameter';
import {QNetwork} from "../../../../../src/whisker/agentTraining/reinforcementLearning/agents/QNetwork";


describe('QNetwork', () => {

    let architecture: NetworkArchitecture;
    let trainingParameter: TrainingParameter;
    const hyperparameter = new RLHyperparameter();

    beforeEach(() => {
        architecture = {
            inputShape: 4,
            hiddenLayers: [24, 12],
            hiddenActivationFunction: 'relu',
            outputShape: 2
        };

        trainingParameter = {
            learningRate: 0.001,
            frequency: 4,
            optimizer: 'adam',
            batchSize: 32,
            epochs: 10
        };

        hyperparameter.networkArchitecture = architecture;
        hyperparameter.trainingParameter = trainingParameter;
    });

    afterEach(() => {
        // Clean up any tensors to prevent memory leaks
        tf.dispose();
    });

    describe('model generation', () => {
        it('should create a network with correct architecture', () => {
            const qNetwork = new QNetwork(hyperparameter);
            const model = qNetwork.model;
            expect(model.layers.length).toBe(3); // Input + 2 hidden layers
            expect(model.layers[0].batchInputShape[1]).toBe(architecture.inputShape);
            expect(model.layers[0]['units']).toBe(architecture.hiddenLayers[0]);
            expect(model.layers[1]['units']).toBe(architecture.hiddenLayers[1]);
            expect(model.layers[2]['units']).toBe(architecture.outputShape);
        });

        it('should compile model with correct optimizer and loss', () => {
            const qNetwork = new QNetwork(hyperparameter);
            const model = qNetwork.model;
            expect(model.optimizer).toBeDefined();
            expect(model.loss).toBe('meanSquaredError');
        });
    });

    describe('clone', () => {
        it('should create a deep copy with same architecture', () => {
            const original = new QNetwork(hyperparameter);
            const clone = original.clone();
            expect(clone.model.layers.length).toBe(original.model.layers.length);
        });

        it('should create independent copy with separate weights', async () => {
            const original = new QNetwork(hyperparameter);
            const clone = original.clone();

            // Get initial weights
            const originalWeights = original.model.getWeights();
            const cloneWeights = clone.model.getWeights();

            // Verify weights are equal but separate
            for (let i = 0; i < originalWeights.length; i++) {
                const originalData = await originalWeights[i].data();
                const cloneData = await cloneWeights[i].data();
                expect(originalData).toEqual(cloneData);
                expect(originalWeights[i]).not.toBe(cloneWeights[i]);
            }
        });
    });

    describe('forwardPass', () => {
        let qNetwork: QNetwork;

        beforeEach(() => {
            qNetwork = new QNetwork(hyperparameter);
        });

        it('should perform forward pass and return expected shape', () => {
            const output = qNetwork.forwardPass([1, 1, 1, 1]);
            expect(output.length).toEqual(2);
            tf.dispose(output);
        });

        it('should produce different outputs for different inputs', () => {
            const output1 = qNetwork.forwardPass([1, 1, 1, 1]);
            const output2 = qNetwork.forwardPass([0, 0, 0, 0]);

            expect(output1).not.toEqual(output2);

            tf.dispose([output1, output2]);
        });

    });

    describe('train', () => {
        let qNetwork: QNetwork;
        let inputs: number[][];
        let labels: number[][];

        beforeEach(() => {
            qNetwork = new QNetwork(hyperparameter);

            // Create sample training data
            inputs = Array(10).fill(0).map(() =>
                Array(architecture.inputShape).fill(0).map(() => Math.random())
            );

            labels = Array(10).fill(0).map(() =>
                Array(architecture.outputShape).fill(0).map(() => Math.random())
            );
        });

        it('should reduce loss during training', async () => {
            const result = await qNetwork.train(inputs, labels, 2, 10);
            const losses = result.history.loss as number[];
            expect(losses[losses.length - 1]).toBeLessThan(losses[0]);
        });

        it('should train for the specified number of epochs', async () => {
            const result = await qNetwork.train(inputs, labels, 2, trainingParameter.epochs);
            const losses = result.history.loss as number[];
            expect(losses.length).toBe(trainingParameter.epochs);
        });
    });

    describe('adaptInputLayer', () => {
        let qNetwork: QNetwork;

        beforeEach(() => {
            qNetwork = new QNetwork(hyperparameter);
        });

        it('should modify input layer size while preserving other layers', () => {
            const newInputSize = 8;
            const originalHiddenUnits = [...qNetwork.model.layers.map(layer => layer['units'])];

            qNetwork.updateInputLayer(newInputSize);

            expect(qNetwork.getInputLayerSize()).toBe(newInputSize);
            for (let i = 0; i < qNetwork.model.layers.length; i++) {
                expect(qNetwork.model.layers[i]['units']).toBe(originalHiddenUnits[i]);
            }
        });

        it('should maintain model compilability after update', () => {
            const newInputSize = 6;
            qNetwork.updateInputLayer(newInputSize);

            expect(qNetwork.model.optimizer).toBeDefined();
            expect(qNetwork.model.loss).toBe('meanSquaredError');

            const testInput = tf.ones([1, newInputSize]);
            const output = qNetwork.model.predict(testInput) as tf.Tensor;

            expect(output.shape[1]).toBe(architecture.outputShape);
            tf.dispose(testInput);
            tf.dispose(output);
        });

        it('should preserve training capability after update', async () => {
            const newInputSize = 5;
            qNetwork.updateInputLayer(newInputSize);

            const xs = tf.ones([2, newInputSize]);
            const ys = tf.ones([2, architecture.outputShape]);

            const history = await qNetwork.model.fit(xs, ys, {
                epochs: 1,
                batchSize: 1
            });

            expect(history.history.loss).toBeDefined();

            tf.dispose([xs, ys]);
        });

        it('should work with consecutive updates', () => {
            const firstSize = 6;
            const secondSize = 8;

            qNetwork.updateInputLayer(firstSize);
            expect(qNetwork.getInputLayerSize()).toBe(firstSize);

            qNetwork.updateInputLayer(secondSize);
            expect(qNetwork.getInputLayerSize()).toBe(secondSize);
        });

        it('should preserve weights of hidden layers after update', async () => {
            const qNetwork = new QNetwork(hyperparameter);

            // Get initial weights of hidden layers
            const originalWeights = qNetwork.model.getWeights();
            const originalHiddenLayerWeights = originalWeights.slice(2); // Skip input layer weights
            const originalHiddenData = await Promise.all(
                originalHiddenLayerWeights.map(w => w.data())
            );

            // Adapt input layer
            const newInputSize = 6;
            qNetwork.updateInputLayer(newInputSize);

            // Get new weights
            const newWeights = qNetwork.model.getWeights();
            const newHiddenLayerWeights = newWeights.slice(2); // Skip input layer weights
            const newHiddenData = await Promise.all(
                newHiddenLayerWeights.map(w => w.data())
            );

            // Compare hidden layer weights
            for (let i = 0; i < originalHiddenData.length; i++) {
                expect(newHiddenData[i]).toEqual(originalHiddenData[i]);
            }
        });

        it('should initialize new input layer weights with different values while maintaining old weights', async () => {
            const qNetwork = new QNetwork(hyperparameter);

            // Get original input layer weights
            const originalWeights = qNetwork.model.getWeights();
            const originalInputLayerWeights = await originalWeights[0].data();

            // Adapt input layer
            const newInputSize = 6;
            qNetwork.updateInputLayer(newInputSize);

            // Get new input layer weights
            const newWeights = qNetwork.model.getWeights();
            const newInputLayerWeights = await newWeights[0].data();

            // Check that the weights are different
            expect(originalInputLayerWeights.length).not.toBe(newInputLayerWeights.length);

            // Check that weights of existing features are preserved
            const matchingNewWeights = newInputLayerWeights.slice(0, originalInputLayerWeights.length);
            expect(matchingNewWeights).toEqual(originalInputLayerWeights);
        });

        it('should generate consistent weights when updating to same size multiple times', async () => {
            const qNetwork = new QNetwork(hyperparameter);

            // First adaptation
            qNetwork.updateInputLayer(6);
            const firstAdaptationWeights = qNetwork.model.getWeights();
            const firstWeightsData = await Promise.all(
                firstAdaptationWeights.map(w => w.data())
            );

            // Second adaptation to the same size
            qNetwork.updateInputLayer(6);
            const secondAdaptationWeights = qNetwork.model.getWeights();
            const secondWeightsData = await Promise.all(
                secondAdaptationWeights.map(w => w.data())
            );

            // Compare weights
            for (let i = 0; i < firstWeightsData.length; i++) {
                expect(secondWeightsData[i]).toEqual(firstWeightsData[i]);
            }
        });
    });

    describe('adaptOutputLayer', () => {
        let qNetwork: QNetwork;

        beforeEach(() => {
            qNetwork = new QNetwork(hyperparameter);
        });

        it('should modify output layer size while preserving other layers', () => {
            const newOutputSize = 4;
            const originalHiddenUnits = qNetwork.model.layers.slice(0, -1).map(layer => layer['units']);

            qNetwork.updateOutputLayer(newOutputSize);

            // Check that hidden layers remain unchanged
            for (let i = 0; i < qNetwork.model.layers.length - 1; i++) {
                expect(qNetwork.model.layers[i]['units']).toBe(originalHiddenUnits[i]);
            }
            // Check that the output layer was modified
            expect(qNetwork.getOutputLayerSize()).toBe(newOutputSize);
        });

        it('should maintain model compilability after update', () => {
            const newOutputSize = 3;
            qNetwork.updateOutputLayer(newOutputSize);

            expect(qNetwork.model.optimizer).toBeDefined();
            expect(qNetwork.model.loss).toBe('meanSquaredError');

            const testInput = tf.ones([1, architecture.inputShape]);
            const output = qNetwork.model.predict(testInput) as tf.Tensor;

            expect(output.shape[1]).toBe(newOutputSize);
            tf.dispose([testInput, output]);
        });

        it('should preserve training capability after update', async () => {
            const newOutputSize = 3;
            qNetwork.updateOutputLayer(newOutputSize);

            const xs = tf.ones([2, architecture.inputShape]);
            const ys = tf.ones([2, newOutputSize]);

            const history = await qNetwork.model.fit(xs, ys, {
                epochs: 1,
                batchSize: 1
            });

            expect(history.history.loss).toBeDefined();

            tf.dispose([xs, ys]);
        });

        it('should work with consecutive updates', () => {
            const firstSize = 3;
            const secondSize = 5;

            qNetwork.updateOutputLayer(firstSize);
            expect(qNetwork.getOutputLayerSize()).toBe(firstSize);

            qNetwork.updateOutputLayer(secondSize);
            expect(qNetwork.getOutputLayerSize()).toBe(secondSize);
        });

        it('should preserve weights of hidden layers after update', async () => {
            // Get initial weights of hidden layers
            const originalWeights = qNetwork.model.getWeights();
            const originalHiddenLayerWeights = originalWeights.slice(0, -2); // Skip output layer weights
            const originalHiddenData = await Promise.all(
                originalHiddenLayerWeights.map(w => w.data())
            );

            // Adapt output layer
            const newOutputSize = 4;
            qNetwork.updateOutputLayer(newOutputSize);

            // Get new weights
            const newWeights = qNetwork.model.getWeights();
            const newHiddenLayerWeights = newWeights.slice(0, -2); // Skip output layer weights
            const newHiddenData = await Promise.all(
                newHiddenLayerWeights.map(w => w.data())
            );

            // Compare hidden layer weights
            for (let i = 0; i < originalHiddenData.length; i++) {
                expect(newHiddenData[i]).toEqual(originalHiddenData[i]);
            }
        });

        it('should preserve existing output weights when expanding', async () => {
            // Get original output layer weights
            const originalWeights = qNetwork.model.getWeights();
            const originalOutputLayerWeights = await originalWeights[originalWeights.length - 2].data();
            const originalOutputBias = await originalWeights[originalWeights.length - 1].data();

            // Get dimensions
            const inputSize = architecture.hiddenLayers[architecture.hiddenLayers.length - 1];
            const originalOutputSize = architecture.outputShape;
            const newOutputSize = originalOutputSize + 2;

            // Adapt to larger output size
            qNetwork.updateOutputLayer(newOutputSize);

            // Get new output layer weights
            const newWeights = qNetwork.model.getWeights();
            const newOutputLayerWeights = await newWeights[newWeights.length - 2].data();
            const newOutputBias = await newWeights[newWeights.length - 1].data();

            // Check that the weight matrix has grown
            expect(newOutputLayerWeights.length).toBe(inputSize * newOutputSize);
            expect(newOutputLayerWeights.length).toBeGreaterThan(originalOutputLayerWeights.length);

            // Check preservation of original weights
            // In the output layer; weights are stored as [inputSize, outputSize] matrix
            // Each column represents weights for one output neuron
            for (let outputNeuron = 0; outputNeuron < originalOutputSize; outputNeuron++) {
                for (let inputNeuron = 0; inputNeuron < inputSize; inputNeuron++) {
                    const oldIndex = inputNeuron * originalOutputSize + outputNeuron;
                    const newIndex = inputNeuron * newOutputSize + outputNeuron;
                    expect(newOutputLayerWeights[newIndex]).toBe(originalOutputLayerWeights[oldIndex]);
                }
            }

            // Check bias preservation
            for (let i = 0; i < originalOutputBias.length; i++) {
                expect(newOutputBias[i]).toBe(originalOutputBias[i]);
            }
        });


        it('should generate consistent weights when updating to same size multiple times', async () => {
            const newOutputSize = 4;

            // First adaptation
            qNetwork.updateOutputLayer(newOutputSize);
            const firstAdaptationWeights = qNetwork.model.getWeights();
            const firstWeightsData = await Promise.all(
                firstAdaptationWeights.map(w => w.data())
            );

            // Second adaptation to the same size
            qNetwork.updateOutputLayer(newOutputSize);
            const secondAdaptationWeights = qNetwork.model.getWeights();
            const secondWeightsData = await Promise.all(
                secondAdaptationWeights.map(w => w.data())
            );

            // Compare weights
            for (let i = 0; i < firstWeightsData.length; i++) {
                expect(secondWeightsData[i]).toEqual(firstWeightsData[i]);
            }
        });

        it('should not modify network when new size equals current size', async () => {
            // Get original weights
            const originalWeights = qNetwork.model.getWeights();
            const originalWeightsData = await Promise.all(
                originalWeights.map(w => w.data())
            );

            // Adapt to the same size
            qNetwork.updateOutputLayer(architecture.outputShape);

            // Get new weights
            const newWeights = qNetwork.model.getWeights();
            const newWeightsData = await Promise.all(
                newWeights.map(w => w.data())
            );

            // Compare all weights
            for (let i = 0; i < originalWeightsData.length; i++) {
                expect(newWeightsData[i]).toEqual(originalWeightsData[i]);
            }
        });
    });
});

