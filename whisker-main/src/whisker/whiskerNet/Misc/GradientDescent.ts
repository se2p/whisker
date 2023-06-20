import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {FeatureGroup, InputFeatures} from "./InputExtraction";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {NodeGene} from "../NetworkComponents/NodeGene";
import Arrays from "../../utils/Arrays";
import {Container} from "../../utils/Container";
import {RegressionNode} from "../NetworkComponents/RegressionNode";
import {Randomness} from "../../utils/Randomness";

import lodashClonedeep from 'lodash.clonedeep';

export class GradientDescent {

    /**
     * Number of epochs without improvements after which the gradient descent algorithm stops.
     */
    private static EARLY_STOPPING_THRESHOLD = 30;

    /**
     * Size of the validation set used for measuring generalisation performance.
     */
    private static VALIDATION_SET_SIZE = 0.1;

    /**
     * Provides derivatives for various loss and activation functions.
     */
    private static DERIVATIVES = {
        // Loss functions
        "SQUARED_ERROR": (prediction: number, label: number): number => -(label - prediction),

        // Activation functions
        "SIGMOID": (prediction: number): number => prediction * (1 - prediction),
        "TANH": (prediction: number): number => 1 - Math.pow(Math.tanh(prediction), 2),
        "RELU": (prediction: number): number => prediction > 0 ? 1 : 0,
        "NONE": (prediction: number): number => prediction >= 0 ? 1 : -1
    } as const;

    /**
     * The ground truth data corresponding to a given target.
     */
    private _training_data: StateActionRecord = new Map<ObjectInputFeatures, eventAndParametersObject>();

    /**
     * The current target statement. If changed new ground truth data for the new target must be selected.
     */
    private _current_target: string


    constructor(private readonly _groundTruth: Record<string, unknown>,
                private readonly _parameter: gradientDescentParameter,
                private readonly _augmentationParameter: augmentationParameter) {
    }

    /**
     * Optimises the network weights using gradient descent.
     * @param network the network to be optimised.
     * @param statement the statement for which we are optimising the network.
     * @returns training loss normalised by the number of training examples.
     */
    public gradientDescent(network: NetworkChromosome, statement: string): number | undefined {

        // If necessary, update the prepared ground truth data for the given statement.
        if (this._current_target !== statement) {
            Container.debugLog(`Collecting gradient descent data with augmentation set to ${this._augmentationParameter.doAugment}`);
            this._training_data = this._extractDataForStatement(statement);
            Container.debugLog(`Starting with ${this.training_data.size} recordings.`);
            this._current_target = statement;
        }

        // Check if we have some ground truth data available for the current target statement.
        if (this._training_data.size <= 0) {
            Container.debugLog(`No data for statement: ${statement}`);
            return undefined;
        }

        // Variables for calculating the training progress and early stopping
        let bestValidationLoss = Number.MAX_VALUE;
        let epochsWithoutImprovement = 0;
        let bestWeights = network.connections.map(conn => conn.weight);

        // Extract the training and validation batches.
        const batches = this._extractBatches();
        const [trainingSet, validationSet] = this._validationSetSplit(batches);
        for (let i = 0; i < this._parameter.epochs; i++) {
            let loss = this._trainingEpoch(network, trainingSet, i);  // Train
            if (loss === undefined) {
                Container.debugLog("Classification node missing in Training; Falling back to weight mutation");
                return undefined;
            }

            // Only apply validation if we have enough training data.
            if (validationSet.length > 0) {
                loss = this._validationEpoch(network, validationSet);   // Validate
                if (loss === undefined) {
                    Container.debugLog("Classification node missing in Validation; Falling back to weight mutation");
                    return undefined;
                }
            }

            // Early stopping: Stop after a few rounds without improvement and reset weights to the best epoch.
            if (loss < bestValidationLoss) {
                bestWeights = network.connections.map(conn => conn.weight);
                bestValidationLoss = loss;
                epochsWithoutImprovement = 0;
            } else {
                epochsWithoutImprovement++;
            }

            if (epochsWithoutImprovement >= GradientDescent.EARLY_STOPPING_THRESHOLD) {
                Container.debugLog(`Early stopping at epoch ${i}`);
                break;
            }

        }

        // Reset weights to the ones that obtained the best training loss.
        for (let j = 0; j < network.connections.length; j++) {
            network.connections[j].weight = bestWeights[j];
        }

        Container.debugLog(`ValidationLoss: ${bestValidationLoss}`);
        return bestValidationLoss;
    }

    /**
     * Assembles the labels of classification and regression nodes in a label to value map.
     * @param network whose classification and regression outputs are compared to the labels.
     * @param batch the entire data batch hosting the label values.
     * @param example the data sample that will be used in the forward pass.
     * @returns mapping of label to values.
     */
    private _prepareLabels(network: NetworkChromosome, batch: StateActionRecord,
                           example: ObjectInputFeatures): Map<string, number> {

        // One-hot encoded label vector.
        const eventLabel = batch.get(example).event;
        const labelVector = new Map<string, number>();
        for (const event of network.classificationNodes.keys()) {
            if (event.localeCompare(eventLabel, 'en', {sensitivity: 'base'}) === 0) {
                labelVector.set(event, 1);
            } else {
                labelVector.set(event, 0);
            }
        }

        // Label Smoothing Regularisation
        if (this._parameter.labelSmoothing > 0) {
            for (const event of labelVector.keys()) {
                if (labelVector.get(event) === 1) {
                    labelVector.set(event, 1 - this._parameter.labelSmoothing);
                } else {
                    labelVector.set(event, this._parameter.labelSmoothing / (labelVector.size - 1));
                }
            }
        }

        // Evaluate regression nodes if we have some for the target event.
        if (network.regressionNodes.has(eventLabel)) {
            for (const regNode of network.regressionNodes.get(eventLabel)) {
                const trueValue = batch.get(example).parameter[regNode.eventParameter];
                labelVector.set(this._regressionNodeIdentifier(regNode), trueValue);
            }
        }

        return labelVector;
    }

    /**
     * Executes a training epoch by executing the forward/backward pass for each training example and applying gradient
     * descent after the whole training batch has been processed.
     * @param network that will be optimised.
     * @param trainingBatches consisting of records of program states and the corresponding actions and parameters.
     * @param epoch number of epochs executed.
     * @returns training loss normalised over number of training examples.
     */
    private _trainingEpoch(network: NetworkChromosome, trainingBatches: StateActionRecord[], epoch: number): number {
        let trainingLoss = 0;
        let numTrainingExamples = 0;
        for (const trainingBatch of trainingBatches) {
            // Shuffle the training data
            const trainingInputs = [...trainingBatch.keys()];
            Arrays.shuffle(trainingInputs);

            // Iterate over each training example and apply gradient descent.
            for (const trainingExample of trainingInputs) {
                const inputFeatures = this._objectToInputFeature(trainingExample);

                const labelVector = this._prepareLabels(network, trainingBatch, trainingExample);
                // Check if the required classification neurons are present in the network.
                if ([...labelVector.values()].every(value => value == 0)) {
                    continue;
                }


                // Compute loss and determine gradients of weights.
                trainingLoss += this._forwardPass(network, inputFeatures, labelVector, LossFunction.SQUARED_ERROR_CATEGORICAL_CROSS_ENTROPY_COMBINED);
                this._backwardPass(network, labelVector);
                numTrainingExamples++;
            }
            // The network may not have required classification neurons.
            // In this case, we return undefined as an indicator to stop the network training
            if (numTrainingExamples == 0) {
                return undefined;
            }

            // Update the weights using gradient descent.
            this._adjustWeights(network, epoch);
        }

        // Normalise by the total number of data points.
        return trainingLoss / numTrainingExamples;
    }

    /**
     * Executes a validation epoch by computing the mean validation loss over all validation set samples.
     * @param network that is currently being optimised.
     * @param validationBatches consisting of records of program states and the corresponding actions and parameters.
     * @returns validation loss normalised over number of training examples.
     */
    private _validationEpoch(network: NetworkChromosome, validationBatches: StateActionRecord[]): number {
        let validationLoss = 0;
        let numValidationExamples = 0;
        for (const validationBatch of validationBatches) {
            // Shuffle the training data
            const validationInputs = [...validationBatch.keys()];
            Arrays.shuffle(validationInputs);

            // Iterate over each training example and apply gradient descent.
            for (const validationExample of validationInputs) {
                const inputFeatures = this._objectToInputFeature(validationExample);
                const labelVector = this._prepareLabels(network, validationBatch, validationExample);

                // Check if the required classification neurons are present in the network.
                if ([...labelVector.values()].every(value => value == 0)) {
                    continue;
                }

                // Compute the loss on validation set.
                validationLoss += this._forwardPass(network, inputFeatures, labelVector, LossFunction.SQUARED_ERROR_CATEGORICAL_CROSS_ENTROPY_COMBINED);
                numValidationExamples++;
            }
        }

        // The network may be missing required classification neurons. In this case, we return undefined as an indicator
        // to stop the network training
        if (numValidationExamples === 0) {
            return undefined;
        }

        // Normalise by the total number of data points.
        return validationLoss / numValidationExamples;
    }

    /**
     * The forward pass propagates activates the network based on a supplied input vector
     * and returns a loss value based on the specified loss function.
     * @param network the network to be trained.
     * @param inputs the provided feature vector.
     * @param labelVector the provided label vector corresponding to the input features.
     * @param lossFunction the loss function to be used to calculate the loss value.
     * @returns the loss value for the given inputs and labels.
     */
    public _forwardPass(network: NetworkChromosome, inputs: InputFeatures, labelVector: Map<string, number>,
                        lossFunction: LossFunction): number {
        network.activateNetwork(inputs);
        let loss = 0;
        switch (lossFunction) {
            case LossFunction.SQUARED_ERROR: {
                const regressionNodes = network.layers.get(1).filter(node => node instanceof RegressionNode) as RegressionNode[];
                loss = this._squaredLoss(regressionNodes, labelVector);
                break;
            }
            case LossFunction.CATEGORICAL_CROSS_ENTROPY: {
                const classificationNodes = network.layers.get(1).filter(node => node instanceof ClassificationNode) as ClassificationNode[];
                loss = this._categoricalCrossEntropyLoss(classificationNodes, labelVector);
                break;
            }
            case LossFunction.SQUARED_ERROR_CATEGORICAL_CROSS_ENTROPY_COMBINED: {
                const regressionNodes = network.layers.get(1).filter(node => node instanceof RegressionNode) as RegressionNode[];
                const classificationNodes = network.layers.get(1).filter(node => node instanceof ClassificationNode) as ClassificationNode[];
                loss = this._squaredLoss(regressionNodes, labelVector) + this._categoricalCrossEntropyLoss(classificationNodes, labelVector);
            }
        }
        return loss;
    }

    /**
     * Calculates the squared loss function between the regression prediction of a node and the true label value.
     * @param regNodes the regression nodes on which the squared loss will be computed.
     * @param labels vector of true target labels.
     * @returns squared loss between regression prediction and label.
     */
    private _squaredLoss(regNodes: RegressionNode[], labels: Map<string, number>): number {
        let loss = 0;
        for (const node of regNodes) {
            const trueValue = labels.get(this._regressionNodeIdentifier(node));
            if (!isNaN(trueValue)) {
                const node_error = 0.5 * Math.pow(trueValue - node.activationValue, 2);
                loss += node_error;
            }
        }
        return loss;
    }

    /**
     * Calculates the categorical cross entropy loss function between a classification prediction and the true label.
     * @param classNodes the classification nodes on which the cross entropy loss will be computed.
     * @param labels vector of true target labels.
     * @returns categorical cross entropy loss between classification prediction and label.
     */
    private _categoricalCrossEntropyLoss(classNodes: ClassificationNode[], labels: Map<string, number>): number {
        let loss = 0;
        for (const node of classNodes) {
            const trueValue = labels.get(node.event.stringIdentifier());
            const node_error = trueValue * Math.log(node.activationValue);
            loss += node_error;
        }
        return -loss;
    }

    /**
     * The backward pass determines the gradient for each connection based on the previously computed loss function.
     * @param network the network hosting the connections for which the gradient should be computed.
     * @param labelVector the label vector hosting the desired network predictions.
     */
    public _backwardPass(network: NetworkChromosome, labelVector: Map<string, number>): void {
        // Traverse the network from the back to the front
        const layersInverted = [...network.layers.keys()].sort((a, b) => b - a);
        for (const layer of layersInverted) {

            // Calculate the gradients for each connection going into the output layer.
            if (layer == 1) {
                for (const node of network.layers.get(layer)) {

                    // Calculate gradient for classification nodes.
                    if (node instanceof ClassificationNode) {
                        const label = labelVector.get(node.event.stringIdentifier());
                        node.gradient += node.activationValue - label;  // Combined gradient for SoftMax + Cross-Entropy
                    }

                    // Calculate gradient for regression nodes.
                    if (node instanceof RegressionNode) {
                        const label = labelVector.get(`${node.event.stringIdentifier()}-${node.eventParameter}`);
                        if (label === undefined) {
                            continue;
                        }
                        const lossGradient = GradientDescent.DERIVATIVES[LossFunction[LossFunction.SQUARED_ERROR]];
                        const activationFunctionGradient = GradientDescent.DERIVATIVES[ActivationFunction[node.activationFunction]];
                        node.gradient += lossGradient(node.activationValue, label) * activationFunctionGradient(node.activationValue);
                    }

                    // Calculate gradients for incoming connections of output nodes.
                    for (const connection of node.incomingConnections) {
                        connection.gradient += node.gradient * connection.source.activationValue;
                    }
                }
            }

            // Calculate the gradients and update the weights for each connection going into hidden layers.
            else if (layer > 0) {
                for (const node of network.layers.get(layer)) {
                    const incomingGradient = this._incomingGradientHiddenNode(network, node);
                    const activationDerivative = GradientDescent.DERIVATIVES[ActivationFunction[node.activationFunction]];
                    node.gradient += incomingGradient * activationDerivative(node.activationValue);
                    for (const connection of node.incomingConnections) {
                        connection.gradient += node.gradient * connection.source.activationValue;
                    }
                }
            }
        }
    }

    /**
     * Computes the gradient for hidden neurons by summarising the gradient of outgoing connections.
     * @param network the network hosting the neuron for which the gradient should be calculated.
     * @param neuron the neuron whose gradient is to be determined.
     * @returns gradient of given neuron.
     */
    private _incomingGradientHiddenNode(network: NetworkChromosome, neuron: NodeGene): number {
        let gradient = 0;
        for (const connection of network.connections) {
            if (connection.source === neuron) {
                gradient += (connection.target.gradient * connection.weight);
            }
        }

        return gradient;
    }

    /**
     * Updates the weights of a network by applying a single gradient descent update step.
     * @param network the network whose weights are to be updated.
     * @param epoch number of executed epochs.
     */
    public _adjustWeights(network: NetworkChromosome, epoch: number): void {
        // Fetch learning rate.
        const learningRate = this._getLearningRate(epoch);

        // Update the weight and reset the gradient value for each connection.
        for (const connection of network.connections) {
            connection.weight -= learningRate * connection.gradient;
            connection.gradient = 0;
        }

        // Reset intermediate gradients in neurons.
        network.getAllNodes().forEach(node => node.gradient = 0);
    }

    /**
     * Restructures the data obtained from the .json file such that it only includes records that
     * correspond to the current statement target.
     * @param statement the target statement for which the networks should be optimised.
     * @returns structured data for the gradient descent process.
     */
    public _extractDataForStatement(statement: string): StateActionRecord {
        const stateActionRecord: StateActionRecord = new Map<ObjectInputFeatures, eventAndParametersObject>();

        // Iterate over each recording in the .json file.
        for (const recording of Object.values(this._groundTruth)) {

            // Exclude recordings that do not include the supplied target statement.
            if (!(recording['coverage'].includes(statement))) {
                continue;
            }

            // Extract an executed action and the corresponding state from the .json file
            for (const record of Object.values(recording)) {
                const eventAndParams: eventAndParametersObject = {
                    event: record['action'],
                    parameter: record['parameter']
                };

                if (record['features'] !== undefined) {
                    stateActionRecord.set(record['features'], eventAndParams);
                }
            }
        }

        // Return the collected data or augment it to increase the dataset size.
        return this._augmentationParameter.doAugment ? this._augmentData(stateActionRecord) : stateActionRecord;
    }

    /**
     * Extracts batches of training samples from the entire training dataset.
     * @return training dataset split into batches.
     */
    private _extractBatches(): StateActionRecord[] {

        // Batch gradient descent
        if (this._parameter.batchSize === Infinity) {
            return [this._training_data];
        }

        const batches: StateActionRecord[] = [];
        const keys = [...this._training_data.keys()];
        const random = Randomness.getInstance();
        Arrays.shuffle(keys);

        // Randomly select data points from the training dataset and combine them to form a training batch until all
        // data points have been distributed.
        while (keys.length > 0) {
            const batch: StateActionRecord = new Map<ObjectInputFeatures, eventAndParametersObject>();
            while (batch.size < this._parameter.batchSize && keys.length > 0) {
                const ranDataSample = random.pick(keys);
                batch.set(ranDataSample, this.training_data.get(ranDataSample));
                keys.splice(keys.indexOf(ranDataSample), 1);
            }
            batches.push(batch);
        }
        return batches;
    }

    /**
     * Extracts a validation set split from the training dataset organised in batches. The validation split can be used
     * to measure the generalisation error for a given epoch.
     * @param batches the entire dataset organised in batches.
     * @return dataset split into training batch and validation batch.
     */
    private _validationSetSplit(batches: StateActionRecord[]): [StateActionRecord[], StateActionRecord[]] {

        // Only make a split if we have enough data.
        if (batches.length < 30) {
            return [batches, []];
        }
        const desiredValidationSize = Math.ceil(batches.length * GradientDescent.VALIDATION_SET_SIZE);
        const validationSet = batches.slice(0, desiredValidationSize);
        const trainingSet = batches.slice(desiredValidationSize);

        return [trainingSet, validationSet];
    }

    /**
     * Helper function to map input feature objects to the corresponding {@link InputFeatures} type.
     * @param object the object that should be mapped to an input feature.
     * @returns the {@link InputFeatures} corresponding to the supplied object.
     */
    private _objectToInputFeature(object: Record<string, Record<string, number>>): InputFeatures {
        const inputFeatures: InputFeatures = new Map<string, FeatureGroup>();
        for (const [sprite, featureGroup] of Object.entries(object)) {
            const featureGroupMap: FeatureGroup = new Map<string, number>();
            for (const [featureKey, value] of Object.entries(featureGroup)) {
                featureGroupMap.set(featureKey, value);
            }
            inputFeatures.set(sprite, featureGroupMap);
        }
        return inputFeatures;
    }


    /**
     * Increases the training data size used by the gradient descent algorithm using data augmentation.
     * @param data the training dataset that will be extended via data augmentation.
     * @return the augmented training dataset.
     */
    public _augmentData(data: StateActionRecord): StateActionRecord {
        const keys = [...data.keys()];

        // We cannot augment an empty dataset.
        if (keys.length == 0) {
            return data;
        }

        const random = Randomness.getInstance();
        for (let i = 0; i < this._augmentationParameter.numAugments; i++) {
            const randomState = random.pick(keys);
            const stateClone = lodashClonedeep(randomState) as ObjectInputFeatures;

            // Cycle through all state variables until we made at least one change.
            let changed = false;
            while (!changed) {
                for (const sprite of Object.values(stateClone)) {
                    for (const [feature, value] of Object.entries(sprite)) {

                        // Disturb values probabilistically.
                        if (random.nextDouble() < this._augmentationParameter.disturbStateProb) {
                            sprite[feature] = random.nextGaussian(value, this._augmentationParameter.disturbStatePower);
                            changed = true;
                        }
                    }
                }
            }

            // Add augment to dataset.
            data.set(stateClone, data.get(randomState));
        }
        return data;
    }

    /**
     * Returns a learning rate value based on the defined learning rate adaption algorithm.
     * @param epoch number of epochs executed.
     * @returns learning rate value.
     */
    private _getLearningRate(epoch: number): number {
        switch (this._parameter.learningRateAlgorithm) {
            case "Static":
                return this._parameter.learningRate;
            case "Gradual":
                return this._gradualDeceasingLearningRate(epoch);
        }
    }

    /**
     * Decreases learning rate gradually based on the number of executed epochs. The intuition of this approach is to
     * start with high learning rates to explore minima neighbourhoods, and then converge with a low learning rate.
     * @param epoch number of executed epochs.
     * @return learning rate value for a given epoch.
     */
    private _gradualDeceasingLearningRate(epoch: number): number {
        const minLearningRate = 0.01 * this._parameter.learningRate;
        let pointAtNoDecrease: number;
        if (this._parameter.epochs >= 300) {
            pointAtNoDecrease = 200;
        } else {
            pointAtNoDecrease = 0.5 * this._parameter.epochs;
        }
        let alpha = 1;
        if (epoch < pointAtNoDecrease) {
            alpha = epoch / pointAtNoDecrease;
        }
        return (1 - alpha) * this._parameter.learningRate + alpha * minLearningRate;
    }

    /**
     * Returns a unique identifier for regression nodes to save and fetch regression labels in the label map.
     * @param node for which an id should be generated.
     * @return regression neuron label id
     */
    private _regressionNodeIdentifier(node: RegressionNode) {
        return `${node.event.stringIdentifier()}-${node.eventParameter}`;
    }

    get training_data(): StateActionRecord {
        return this._training_data;
    }
}

/**
 * Maps executed actions to the corresponding input features representing the program state.
 */
export type StateActionRecord = Map<ObjectInputFeatures, eventAndParametersObject>;

/**
 * Represents input features via a mapping from sprites to sprite features and their corresponding values.
 */
export type ObjectInputFeatures = Record<string, Record<string, number>>;

/**
 * Represents the structure of Scratch actions.
 */
export interface eventAndParametersObject {
    event: string,
    parameter: Record<string, number>
}

/**
 * Enumerator for the used loss functions.
 */
export enum LossFunction {
    SQUARED_ERROR,
    CATEGORICAL_CROSS_ENTROPY,
    SQUARED_ERROR_CATEGORICAL_CROSS_ENTROPY_COMBINED
}

/**
 * Defines hyper parameter required for performing gradient descent.
 */
export interface gradientDescentParameter {
    learningRate: number,
    learningRateAlgorithm: learningRateAlgorithm,
    epochs: number,
    batchSize: number,
    labelSmoothing: number
}

/**
 * Defines hyper parameter required for data augmentation.
 */
export interface augmentationParameter {
    doAugment: boolean,
    numAugments: number,
    disturbStateProb: number,
    disturbStatePower: number
}

/**
 * Defines available learning rate algorithms.
 */
export type learningRateAlgorithm = 'Static' | 'Gradual' // TODO AdaGrad, RMSProp, Adam, momentum
