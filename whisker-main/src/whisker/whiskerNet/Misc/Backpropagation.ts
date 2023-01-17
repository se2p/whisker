import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {FeatureGroup, InputFeatures} from "./InputExtraction";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {NodeGene} from "../NetworkComponents/NodeGene";
import Arrays from "../../utils/Arrays";
import {Container} from "../../utils/Container";
import {RegressionNode} from "../NetworkComponents/RegressionNode";

export class Backpropagation {

    /**
     * Number of epochs without improvements after which the SGD algorithm stops.
     */
    private static EARLY_STOPPING_THRESHOLD = 10;

    /**
     * Provides derivatives for various loss and activation functions.
     */
    private static derivatives = {
        // Loss functions
        "SQUARED_ERROR": (prediction: number, label: number): number => -(label - prediction),

        // Activation functions
        "SIGMOID": (prediction: number): number => prediction * (1 - prediction),
        "TANH": (prediction: number): number => 1 - Math.pow(Math.tanh(prediction), 2),
        "RELU": (prediction: number): number => prediction > 0 ? 1 : 0,
        "NONE": (prediction: number): number => prediction >= 0 ? 1 : -1
    } as const;


    constructor(private readonly _groundTruth: Record<string, unknown>) {
    }

    /**
     * Optimises the network weights using true stochastic gradient descent backpropagation.
     * @param network the network to be optimised.
     * @param statement the statement for which we are optimising the network.
     * @param epochs defines how often SGD is to be performed on the whole dataset.
     * @param learningRate the learning based on which the network weights will be updated.
     * @returns training loss normalised by the number of training examples and executed epochs.
     */
    public stochasticGradientDescent(network: NetworkChromosome, statement: string, epochs: number,
                                     learningRate: number): number {
        let totalLoss = 0;
        const dataSamples = this._organiseData(statement);
        let bestEpochLoss = Number.MAX_VALUE;
        let bestWeights = network.connections.map(conn => conn.weight);
        let epochsWithoutImprovement = 0;
        if (dataSamples.size <= 0) {
            Container.debugLog(`No data for statement: ${statement}`);
            return NaN;
        }
        for (let i = 0; i < epochs; i++) {
            // Shuffle the training data
            let epochLoss = 0;
            const trainingInputs = [...dataSamples.keys()];
            Arrays.shuffle(trainingInputs);

            // Iterate over each training example and apply gradient descent.
            for (const input of trainingInputs) {
                const inputFeatures = this._objectToInputFeature(input);

                // One-hot encoded label vector.
                const eventLabel = dataSamples.get(input).event;
                const labelVector = new Map<string, number>();
                for (const event of network.classificationNodes.keys()) {
                    if (event === eventLabel) {
                        labelVector.set(event, 1);
                    } else {
                        labelVector.set(event, 0);
                    }
                }

                // Evaluate regression nodes if we have some for the target event.
                if (network.regressionNodes.has(eventLabel)) {
                    for (const regNode of network.regressionNodes.get(eventLabel)) {
                        const trueValue = dataSamples.get(input).parameter[regNode.eventParameter];
                        labelVector.set(`${eventLabel}-${regNode.eventParameter}`, trueValue);
                    }
                }

                // Compute the loss -> gradients of weights -> update the weights.
                epochLoss += this._forwardPass(network, inputFeatures, labelVector, LossFunction.SQUARED_ERROR_CATEGORICAL_CROSS_ENTROPY_COMBINED);
                this._backwardPass(network, labelVector);
                this._adjustWeights(network, learningRate);
            }

            totalLoss = epochLoss / [...dataSamples.keys()].length;

            // Early stopping.
            if (totalLoss < bestEpochLoss) {
                bestWeights = network.connections.map(conn => conn.weight);
                bestEpochLoss = totalLoss;
                epochsWithoutImprovement = 0;
            } else {
                epochsWithoutImprovement++;
            }

            if (epochsWithoutImprovement >= Backpropagation.EARLY_STOPPING_THRESHOLD) {
                break;
            }

        }
        // Container.debugLog(`Loss ${bestEpochLoss}`);
        for (let j = 0; j < network.connections.length; j++) {
            network.connections[j].weight = bestWeights[j];
        }

        return bestEpochLoss;
    }

    /**
     * The forward pass propagates the inputs through the network and returns a loss value based
     * on the specified loss function
     * @param network the network to be trained.
     * @param inputs the provided input features
     * @param labelVector the provided label vector corresponding to the input features.
     * @param lossFunction the loss function to be used to calculate the training error.
     * @returns the loss for the given inputs and labels.
     */
    public _forwardPass(network: NetworkChromosome, inputs: InputFeatures, labelVector: Map<string, number>,
                        lossFunction: LossFunction): number {
        network.flushNodeValues();
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

    private _regressionNodeIdentifier(node: RegressionNode) {
        return `${node.event.stringIdentifier()}-${node.eventParameter}`;
    }

    /**
     * Calculates the squared loss function.
     * @param regNodes the regression nodes on which the squared loss will be computed.
     * @param labels the true target labels.
     * @returns squared loss of the prediction and label vector.
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
     * Calculates the categorical cross entropy loss function.
     * @param classNodes the classification nodes on which the cross entropy loss will be computed.
     * @param labels the true target labels.
     * @returns categorical cross entropy of the prediction and label vector.
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
     * The backward pass calculates the gradient for each connection weight based on the previously executed forward pass.
     * @param network the network for whose connections the gradient should be calculated.
     * @param labelVector the true label represented as a map mapping an event id to the corresponding label value.
     */
    public _backwardPass(network: NetworkChromosome, labelVector: Map<string, number>): void {
        // Traverse the network from the back to the front
        const layersInverted = [...network.layers.keys()].sort((a, b) => b - a);
        for (const layer of layersInverted) {

            // Calculate the gradients and update the weights for each connection going into the output layer.
            if (layer == 1) {
                for (const node of network.layers.get(layer)) {

                    // Calculate gradient for classification nodes.
                    if (node instanceof ClassificationNode) {
                        const label = labelVector.get(node.event.stringIdentifier());
                        node.gradient = node.activationValue - label;  // Combined gradient for SoftMax + Cross-Entropy
                    }

                    // Calculate gradient for regression nodes.
                    if (node instanceof RegressionNode) {
                        const label = labelVector.get(`${node.event.stringIdentifier()}-${node.eventParameter}`);
                        if (label === undefined) {
                            continue;
                        }
                        const lossGradient = Backpropagation.derivatives[LossFunction[LossFunction.SQUARED_ERROR]];
                        const activationFunctionGradient = Backpropagation.derivatives[ActivationFunction[node.activationFunction]];
                        node.gradient = lossGradient(node.activationValue, label) * activationFunctionGradient(node.activationValue);
                    }

                    // Calculate gradients for incoming connections of output nodes.
                    for (const connection of node.incomingConnections) {
                        connection.gradient = node.gradient * connection.source.activationValue;
                    }
                }
            }

            // Calculate the gradients and update the weights for each connection going into hidden layers.
            else if (layer > 0) {
                for (const node of network.layers.get(layer)) {
                    const incomingGradient = this._incomingGradientHiddenNode(network, node);
                    const activationDerivative = Backpropagation.derivatives[ActivationFunction[node.activationFunction]];
                    node.gradient = incomingGradient * activationDerivative(node.activationValue);
                    for (const connection of node.incomingConnections) {
                        connection.gradient = node.gradient * connection.source.activationValue;
                    }
                }
            }
        }
    }

    /**
     * Summarises the gradients of nodes from outgoing connections. Based on this summation we can then calculate the
     * gradient of the source node.
     * @param network the network hosting the node for which the gradient should be calculated.
     * @param node the node whose gradient is to be determined.
     */
    private _incomingGradientHiddenNode(network: NetworkChromosome, node: NodeGene): number {
        let gradient = 0;
        for (const connection of network.connections) {
            if (connection.source === node) {
                gradient += (connection.target.gradient * connection.weight);
            }
        }

        return gradient;
    }

    /**
     * Shifts the weights using gradient descent based on a pre-defined learning rate.
     * @param network the network whose weights are to be updated.
     * @param learningRate determines how much the weights are to be shifted towards the negative gradient.
     */
    public _adjustWeights(network: NetworkChromosome, learningRate: number): void {
        for (const connection of network.connections) {
            connection.weight -= learningRate * connection.gradient;
            connection.gradient = 0;
        }
    }

    /**
     * Restructures the data obtained from the .json file such that it only includes records that
     * correspond to the current statement target.
     * @param statement the target for which the networks should be optimised.
     * @returns structured data for the backpropagation process.
     */
    public _organiseData(statement: string): StateActionRecord {
        // We may have multiple recordings within one file. Collect all recordings that covered the current target in
        // an action to feature map.
        const stateActionRecord: StateActionRecord = new Map<objectInputFeatures, eventAndParameters>();
        for (const recording of Object.values(this._groundTruth)) {
            if (!(recording['coverage'].includes(statement))) {
                continue;
            }
            for (const record of Object.values(recording)) {
                const eventAndParams: eventAndParameters = {
                    event: record['action'],
                    parameter: record['parameter']
                };

                if (record['features'] !== undefined) {
                    stateActionRecord.set(record['features'], eventAndParams);
                }
            }
        }
        return stateActionRecord;
    }

    /**
     * Maps objects to input features.
     * @param object the object that should be mapped to an input feature.
     * returns the input feature corresponding to the supplied object.
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
}

/**
 * Maps training data in the form of inputFeatures to the corresponding event string.
 */
export type StateActionRecord = Map<objectInputFeatures, eventAndParameters>;

export type objectInputFeatures = Record<string, Record<string, number>>;

export interface eventAndParameters {
    event: string,
    parameter: Record<string, number>
}

export enum LossFunction {
    SQUARED_ERROR,
    CATEGORICAL_CROSS_ENTROPY,
    SQUARED_ERROR_CATEGORICAL_CROSS_ENTROPY_COMBINED

}
