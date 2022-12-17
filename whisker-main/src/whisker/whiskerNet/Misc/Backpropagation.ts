import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {FeatureGroup, InputFeatures} from "./InputExtraction";
import {Randomness} from "../../utils/Randomness";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {NodeGene} from "../NetworkComponents/NodeGene";

export class Backpropagation {

    private static derivatives = {
        // Loss functions
        "SQUARED_ERROR": (prediction: number, label: number): number => -(label - prediction),
        "CATEGORICAL_CROSS_ENTROPY": (prediction): number => -1/prediction,

        // Activation functions
        "SIGMOID": (prediction: number): number => prediction * (1 - prediction),
        "SOFTMAX": (prediction:number): number => prediction * (1- prediction),
        "RELU": (prediction:number): number => prediction > 0 ? 1 : 0
    } as const;


    constructor(private readonly _groundTruth: Record<string, unknown>,
                private readonly _errorFunction: LossFunction,
                private readonly _learningRate: number) {
    }

    public optimiseWeights(network: NetworkChromosome, statement: string): number {
        let loss = 0;
        const dataSamples = this._organiseData(statement);
        for(const [input, label] of dataSamples.entries()){
            const inputFeatures = this._objectToInputFeature(input);
            // One-hot encode label vector.
            const labelVector = new Map<string, number>();
            for(const event of network.classificationNodes.keys()){
                if (event === label){
                    labelVector.set(event, 1);
                }
                else{
                    labelVector.set(event, 0);
                }
            }

            loss += this._forwardPass(network, inputFeatures, labelVector);
            this._backwardPass(network, labelVector);
            this._adjustWeights(network, this._learningRate);
        }
        return loss;
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
        const outputMap = new Map<string, number>();
        for (const [event, node] of network.classificationNodes.entries()) {
            outputMap.set(event, node.activationValue);
        }
        let loss = 0;
        switch (this._errorFunction) {
            case LossFunction.SQUARED_ERROR:
                loss = this._squaredLoss(outputMap, labelVector);
                break;
            case LossFunction.CATEGORICAL_CROSS_ENTROPY:
                loss = this._categoricalCrossEntropyLoss(outputMap, labelVector);
                break;
        }
        return loss;
    }

    public _backwardPass(network: NetworkChromosome, labels: Map<string, number>): void {
        // Traverse the network from the back to the front
        const layersInverted = [...network.layers.keys()].sort((a, b) => b - a);
        for (const layer of layersInverted) {

            // Calculate the gradients and update the weights for each connection going into the output layer.
            if (layer == 1) {
                const classificationNodes: ClassificationNode[] = [...network.layers.get(layer)].filter(node => node instanceof ClassificationNode) as ClassificationNode[];
                for (const node of classificationNodes) {
                    const label = labels.get(node.event.stringIdentifier());
                    node.delta = this._getClassificationDelta(label, node.activationValue,
                        ActivationFunction.SIGMOID, LossFunction.SQUARED_ERROR);
                    for (const connection of node.incomingConnections) {
                        connection.delta = node.delta * connection.source.activationValue;
                    }
                }
            }

            // Calculate the gradients and update the weights for each connection going into hidden layers.
            else if (layer > 0){
                for(const node of network.layers.get(layer)){
                    const deltaWeightPairs = this.outgoingDeltaWeightPairs(network, node);
                    for (let i = 0; i < deltaWeightPairs[0].length; i++) {
                        node.delta += deltaWeightPairs[0][i] * deltaWeightPairs[1][i];
                    }
                    for(const connection of node.incomingConnections){
                        const activationDerivative = Backpropagation.derivatives[ActivationFunction[node.activationFunction]];
                        connection.delta = node.delta * connection.source.activationValue * activationDerivative(node.activationValue);
                    }
                }
            }
        }
    }

    private outgoingDeltaWeightPairs(network: NetworkChromosome, node:NodeGene): [number[], number[]]{
        const deltas = [];
        const weights = [];
            for(const connection of network.connections){
                if(connection.source === node){
                    deltas.push(connection.source.delta);
                    weights.push(connection.weight);
                }
            }

        return [deltas, weights];
    }

    public _adjustWeights(network: NetworkChromosome, learningRate:number):void {
        for(const connection of network.connections){
            connection.weight -= learningRate * connection.delta;
            connection.delta = 0;
        }
    }

    /**
     * Restructures and shuffles the data obtained from the .json file such that it can be handily used during the
     * backpropagation process and only includes records that correspond to the current statement target.
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

    private _objectToInputFeature(object:Record<string, Record<string, number>>): InputFeatures{
        const inputFeatures: InputFeatures = new Map<string, FeatureGroup>();
        for(const [sprite, featureGroup] of Object.entries(object)){
            const featureGroupMap: FeatureGroup = new Map<string, number>();
            for(const [featureKey, value] of Object.entries(featureGroup)){
                featureGroupMap.set(featureKey, value);
            }
            inputFeatures.set(sprite, featureGroupMap);
        }
        return inputFeatures;
    }

    private _squaredLoss(prediction: Map<string, number>, labels: Map<string, number>): number {
        let loss = 0;
        for (const [event, predictionValue] of prediction.entries()) {
            const trueValue = labels.get(event);
            const node_error = 0.5 * Math.pow(trueValue - predictionValue, 2);
            loss += node_error;
        }
        return loss;
    }

    private _categoricalCrossEntropyLoss(prediction: Map<string, number>, labels: Map<string, number>): number{
        for(const [event, trueValue] of labels.entries()){
            if(trueValue === 1){
                return -Math.log(prediction.get(event));
            }
        }
        throw "Prediction does not contain required target node in categorical cross entropy";
    }

    private _getClassificationDelta(label: number, prediction: number, activationFunction: ActivationFunction, loss: LossFunction): number {
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
