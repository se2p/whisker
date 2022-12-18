import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {FeatureGroup, InputFeatures} from "./InputExtraction";
import {Randomness} from "../../utils/Randomness";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {NodeGene} from "../NetworkComponents/NodeGene";

export class Backpropagation {

    /**
     * Provides derivatives for various loss and activation functions.
     */
    private static derivatives = {
        // Loss functions
        "SQUARED_ERROR": (prediction: number, label: number): number => -(label - prediction),
        "CATEGORICAL_CROSS_ENTROPY": (prediction): number => -1 / prediction,

        // Activation functions
        "SIGMOID": (prediction: number): number => prediction * (1 - prediction),
        "SOFTMAX": (prediction: number): number => prediction * (1 - prediction),
        "RELU": (prediction: number): number => prediction > 0 ? 1 : 0,
        "NONE": (prediction: number): number => prediction >= 0 ? 1 : -1
    } as const;


    constructor(private readonly _groundTruth: Record<string, unknown>,
                private readonly _lossFunction: LossFunction,
                private readonly _learningRate: number) {
    }

    /**
     * Optimises the network weights using true stochastic gradient descent backpropagation.
     * @param network the network to be optimised.
     * @param statement the statement for which we are optimising the network.
     */
    public optimiseWeights(network: NetworkChromosome, statement: string): number {
        let loss = 0;
        const dataSamples = this._organiseData(statement);
        for (const [input, label] of dataSamples.entries()) {
            const inputFeatures = this._objectToInputFeature(input);
            // One-hot encoded label vector.
            const labelVector = new Map<string, number>();
            for (const event of network.classificationNodes.keys()) {
                if (event === label) {
                    labelVector.set(event, 1);
                } else {
                    labelVector.set(event, 0);
                }
            }

            loss += this._forwardPass(network, inputFeatures, labelVector);
            this._backwardPass(network, labelVector);
            this._adjustWeights(network, this._learningRate);
        }
        return loss / [...dataSamples.keys()].length;
    }

    /**
     * The forward pass propagates the inputs through the network and returns a loss value based
     * on the specified loss function
     * @param network the network to be trained.
     * @param inputs the provided input features
     * @param labelVector the provided label vector corresponding to the input features.
     * @returns the loss for the given inputs and labels.
     */
    public _forwardPass(network: NetworkChromosome, inputs: InputFeatures, labelVector: Map<string, number>): number {
        network.activateNetwork(inputs);
        const predictions = new Map<string, number>();
        for (const [event, node] of network.classificationNodes.entries()) {
            if (event === "WaitEvent") {
                continue;
            }
            predictions.set(event, node.activationValue);
        }
        let loss = 0;
        switch (this._lossFunction) {
            case LossFunction.SQUARED_ERROR:
                loss = this._squaredLoss(predictions, labelVector);
                break;
            case LossFunction.CATEGORICAL_CROSS_ENTROPY:
                loss = this._categoricalCrossEntropyLoss(predictions, labelVector);
                break;
        }
        return loss;
    }

    /**
     * The backward pass calculates the gradient for each connection weight based on the previously executed forward pass.
     * @param network the network for whose connections the gradient should be calculated.
     * @param labels the true label represented as a map mapping an event id to the corresponding label value.
     */
    public _backwardPass(network: NetworkChromosome, labels: Map<string, number>): void {
        // Traverse the network from the back to the front
        const layersInverted = [...network.layers.keys()].sort((a, b) => b - a);
        for (const layer of layersInverted) {

            // Calculate the gradients and update the weights for each connection going into the output layer.
            if (layer == 1) {
                const classificationNodes: ClassificationNode[] = [...network.layers.get(layer)].filter(node => node instanceof ClassificationNode) as ClassificationNode[];
                for (const node of classificationNodes) {
                    const label = labels.get(node.event.stringIdentifier());
                    node.gradient = this._getOutputNodeGradient(node.activationValue, label,
                        ActivationFunction.SIGMOID, LossFunction.SQUARED_ERROR);
                    for (const connection of node.incomingConnections) {
                        connection.gradient = node.gradient * connection.source.activationValue;
                    }
                }
            }

            // Calculate the gradients and update the weights for each connection going into hidden layers.
            else if (layer > 0) {
                for (const node of network.layers.get(layer)) {
                    const gradientPairs = this._outgoingGradientWeightPairs(network, node);
                    for (let i = 0; i < gradientPairs[0].length; i++) {
                        node.gradient += gradientPairs[0][i] * gradientPairs[1][i];
                    }
                    for (const connection of node.incomingConnections) {
                        const activationDerivative = Backpropagation.derivatives[ActivationFunction[node.activationFunction]];
                        connection.gradient = node.gradient * connection.source.activationValue * activationDerivative(node.activationValue);
                    }
                }
            }
        }
    }

    /**
     * Calculates the gradients of outgoing connections, which is required to calculate the gradient for the supplied
     * node.
     * @param network the network hosting the node for which the gradient should be calculated.
     * @param node the node whose gradient is to be determined.
     */
    private _outgoingGradientWeightPairs(network: NetworkChromosome, node: NodeGene): [number[], number[]] {
        const gradients = [];
        const weights = [];
        for (const connection of network.connections) {
            if (connection.source === node) {
                gradients.push(connection.source.gradient);
                weights.push(connection.weight);
            }
        }

        return [gradients, weights];
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
     * Restructures and shuffles the data obtained from the .json file such that it only includes records that
     * correspond to the current statement target.
     * @param statement the target for which the networks should be optimised.
     * @returns structured and shuffled input-label data for the backpropagation process.
     */
    public _organiseData(statement: string): StateActionRecord {
        // We may have multiple recordings within one file. Collect all recordings that covered the current target in
        // an action to feature map.
        const actionStateRecord = new Map<string, objectInputFeatures[]>();
        for (const recording of Object.values(this._groundTruth)) {
            for (const [action, feature] of Object.entries(recording)) {
                if (action === 'coverage' || !(recording['coverage'].includes(statement))) {
                    continue;
                }
                if (!actionStateRecord.has(action)) {
                    actionStateRecord.set(action, []);
                }
                actionStateRecord.get(action).push(...feature);
            }
        }

        // Randomly pick one label (action) and corresponding input vector after another and add it to the structured
        // groundTruth map that maps input vector to output label.
        const random = Randomness.getInstance();
        const shuffledGroundTruth: StateActionRecord = new Map<objectInputFeatures, string>();
        while ([...actionStateRecord.keys()].length > 0) {
            const nextAction = random.pick([...actionStateRecord.keys()]);
            const featureArray = actionStateRecord.get(nextAction);
            const randomFeatureIndex = random.nextInt(0, featureArray.length);
            shuffledGroundTruth.set(featureArray[randomFeatureIndex], nextAction);
            featureArray.splice(randomFeatureIndex, 1);
            if (featureArray.length == 0) {
                actionStateRecord.delete(nextAction);
            }
        }
        return shuffledGroundTruth;
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

    /**
     * Calculates the squared loss function.
     * @param prediction the predictions made by the network.
     * @param labels the true target labels
     * @returns squared loss of the prediction and label vector.
     */
    private _squaredLoss(prediction: Map<string, number>, labels: Map<string, number>): number {
        let loss = 0;
        for (const [event, predictionValue] of prediction.entries()) {
            const trueValue = labels.get(event);
            const node_error = 0.5 * Math.pow(trueValue - predictionValue, 2);
            loss += node_error;
        }
        return loss;
    }

    /**
     * Calculates the categorical cross entropy loss function.
     * @param prediction the predictions made by the network.
     * @param labels the true target labels
     * @returns categorical cross entropy of the prediction and label vector.
     */
    private _categoricalCrossEntropyLoss(prediction: Map<string, number>, labels: Map<string, number>): number {
        for (const [event, trueValue] of labels.entries()) {
            if (trueValue === 1) {
                return -Math.log(prediction.get(event));
            }
        }
        throw "Prediction does not contain required target node in categorical cross entropy";
    }

    /**
     * Calculates the gradient for an output node based on the contributed loss of the node and its activation function.
     * @param prediction activation value of the node.
     * @param label true target label of the node.
     * @param activationFunction the used activation function whose derivative will be calculated.
     * @param loss the used loss function whose derivative will be calculated.
     */
    private _getOutputNodeGradient(prediction: number, label: number, activationFunction: ActivationFunction,
                                   loss: LossFunction): number {
        const lossName = LossFunction[loss];
        const activationFunctionName = ActivationFunction[activationFunction];
        const loss_derivative: (prediction: number, label: number) => number = Backpropagation.derivatives[lossName];
        const activationDerivative: (prediction: number) => number = Backpropagation.derivatives[activationFunctionName];
        return loss_derivative(prediction, label) * activationDerivative(prediction);
    }

}

/**
 * Maps training data in the form of inputFeatures to the corresponding event string.
 */
export type StateActionRecord = Map<objectInputFeatures, string>;

export type objectInputFeatures = Record<string, Record<string, number>>;


export enum LossFunction {
    SQUARED_ERROR,
    CATEGORICAL_CROSS_ENTROPY

}
