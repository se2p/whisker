import {NetworkChromosome} from "../networks/NetworkChromosome";
import {ActivationFunction} from "../networkComponents/ActivationFunction";
import {NodeGene} from "../networkComponents/NodeGene";
import Arrays from "../../../utils/Arrays";
import {Randomness} from "../../../utils/Randomness";
import logger from "../../../../util/logger";
import {Container} from "../../../utils/Container";
import {BranchCoverageFitnessFunctionFactory} from "../../../testcase/fitness/BranchCoverageFitnessFunctionFactory";
import {StatementFitnessFunctionFactory} from "../../../testcase/fitness/StatementFitnessFunctionFactory";
import {MouseMoveDimensionEvent} from "../../../testcase/events/MouseMoveDimensionEvent";
import {FeatureGroup, InputFeatures} from "../../featureExtraction/FeatureExtraction";

export class GradientDescent {

    /**
     * Number of epochs without improvements after which the gradient descent algorithm stops.
     */
    private static EARLY_STOPPING_THRESHOLD = 30;

    /**
     * Size of the validation set used for measuring generalization performance.
     */
    private static VALIDATION_SET_SIZE = 0.1;

    /**
     * Provides derivatives for various loss and activation functions.
     */
    private static DERIVATIVES = {
        // Loss functions
        "BINARY_CROSS_ENTROPY": (prediction: number, label: number): number =>
            (prediction - label) / (prediction * (1 - prediction) + Number.EPSILON),
        "MSE": (prediction: number, label: number): number =>
            2 * (prediction - label),
        "CATEGORICAL_CROSS_ENTROPY": (prediction: number, label: number): number =>
            -label / (prediction + Number.EPSILON),

        // Activation functions
        "NONE": (): number => 1,
        "SIGMOID": (activationValue: number): number => activationValue * (1 - activationValue),
        "RELU": (activationValue: number): number => activationValue >= 0 ? 1 : 0,

        // tanh(x)' = 1 - tanh^2(x). But in our case, x = activationValue = tanh(x).
        // Thus tanh(x)' = 1 - activationValue^2
        "TANH": (activationValue: number): number => 1 - activationValue * activationValue
    } as const;

    /**
     * The ground truth data corresponding to a given target.
     */
    private _trainingData: StateActionRecord = new Map<ObjectInputFeatures, EventAndParametersObject>();

    /**
     * The current target statement. If changed, new ground truth data for the new target must be selected.
     */
    private _currentTarget: string

    /**
     * Defines whether the given groundTruth trace was combined of several player traces.
     */
    private readonly _isMultiplePlayerTrace: boolean

    /**
     * Safes the optimisation times per target.
     */
    private readonly _trainingTimes: number[] = []

    /**
     * Safes the epochs in which early stopping terminated the optimisation.
     */
    private readonly _trainingEpochs: number[] = []


    constructor(private readonly _groundTruth: Record<string, unknown>,
                private readonly _parameter: gradientDescentParameter) {
        this._isMultiplePlayerTrace = this.hasTracesFromMultiplePlayers(_groundTruth);
        this.printRecordingCoverages();
    }

    /**
     * Optimises the network weights using gradient descent.
     * @param network the network to be optimised.
     * @param statement the statement for which we are optimising the network.
     * @returns training loss normalised by the number of training examples.
     */
    public gradientDescent(network: NetworkChromosome, statement: string): number | undefined {

        // If necessary, update the prepared ground truth data for the given statement.
        if ((this._isMultiplePlayerTrace && !this._parameter.combinePlayerRecordings)
            || this._currentTarget !== statement) {
            this._trainingData = this.extractDataForStatement(statement);
            logger.debug(`Starting with ${this.trainingData.size} recordings.`);
            this._currentTarget = statement;
        }

        // Check if we have some ground truth data available for the current target statement.
        if (this._trainingData.size <= 0) {
            logger.debug(`No data for statement: ${statement}`);
            return undefined;
        }

        // Variables for calculating the training progress and early stopping
        let bestValidationLoss = Number.MAX_VALUE;
        let epochsWithoutImprovement = 0;
        let bestWeights = network.connections.map(conn => conn.weight);

        // Extract the training and validation batches.
        const batches = this._extractBatches();
        const [trainingSet, validationSet] = this._validationSetSplit(batches);
        const startTime = Date.now();
        for (let i = 0; i < this._parameter.epochs; i++) {
            let loss = this._trainingEpoch(network, trainingSet, i);  // Train
            if (loss === undefined) {
                logger.debug("Classification node missing in Training; Falling back to weight mutation");
                return undefined;
            }

            // Only apply validation if we have enough training data.
            if (validationSet.length > 0) {
                loss = this._validationEpoch(network, validationSet);   // Validate
                if (loss === undefined) {
                    logger.debug("Classification node missing in Validation; Falling back to weight mutation");
                    return undefined;
                }
            }

            // Early stopping: Stop after a few rounds without an improvement and reset weights to the best epoch.
            if (loss < bestValidationLoss) {
                bestWeights = network.connections.map(conn => conn.weight);
                bestValidationLoss = loss;
                epochsWithoutImprovement = 0;
            } else {
                epochsWithoutImprovement++;
            }

            if (epochsWithoutImprovement >= GradientDescent.EARLY_STOPPING_THRESHOLD) {
                this._trainingEpochs.push(i);
                this._trainingTimes.push(Date.now() - startTime);
                break;
            }

        }

        // Only record training time and epochs if we didn't break early
        if (epochsWithoutImprovement < GradientDescent.EARLY_STOPPING_THRESHOLD) {
            this._trainingTimes.push(Date.now() - startTime);
            this._trainingEpochs.push(this._parameter.epochs);
        }

        // Reset weights to the ones that obtained the best training loss.
        for (let j = 0; j < network.connections.length; j++) {
            network.connections[j].weight = bestWeights[j];
        }

        return bestValidationLoss;
    }

    /**
     * Assembles the labels of classification and regression nodes in a label-to-value map.
     * @param network whose classification and regression outputs are compared to the labels.
     * @param batch the entire data batch hosting the label values.
     * @param example the data sample that will be used in the forward pass.
     * @returns mapping of label to values.
     */
    private _prepareLabels(network: NetworkChromosome, batch: StateActionRecord,
                           example: ObjectInputFeatures): Map<string, number> {

        const eventLabel = batch.get(example).event;
        const labelVector = new Map<string, number>();

        // Special handling for continuous action nodes like mouse movements.
        if (eventLabel === "MouseMoveEvent") {
            this._computeMouseMoveLabels(batch.get(example), network, labelVector);
        }

        // Trigger actions are one-hot encoded.
        for (const event of network.getTriggerActionNodes().map(node => node.event.stringIdentifier())) {
            if (event.localeCompare(eventLabel, 'en', {sensitivity: 'base'}) === 0) {
                labelVector.set(event, 1);
            } else {
                labelVector.set(event, 0);
            }
        }

        return labelVector;
    }

    /**
     * Computes and labels for {@link MouseMoveDimensionEvent}s.
     *
     * @param {StateActionRecord} labelAction The ground truth action and parameter output.
     * @param {NetworkChromosome} network The network chromosome that is optimised.
     * @param {Map<string, number>} labelVector The label vector mapping action events to target labels.
     */
    private _computeMouseMoveLabels(labelAction: EventAndParametersObject, network: NetworkChromosome,
                                    labelVector: Map<string, number>): void {

        const mouseMoveDimensionX = network.getContinuousActionNodes()
            .find(n => n.event.stringIdentifier() === "MouseMoveDimensionEvent-X");
        const mouseMoveDimensionY = network.getContinuousActionNodes()
            .find(n => n.event.stringIdentifier() === "MouseMoveDimensionEvent-Y");

        // If we do not have matching action nodes in our network, exit.
        if (!mouseMoveDimensionX || !mouseMoveDimensionY) {
            return;
        }

        const mouseMoveDimensionEventX = mouseMoveDimensionX.event as MouseMoveDimensionEvent;
        const mouseMoveDimensionEventY = mouseMoveDimensionY.event as MouseMoveDimensionEvent;

        const targetX = labelAction.parameter.X * 240;
        const targetY = labelAction.parameter.Y * 180;

        const magnitudeX = mouseMoveDimensionEventX.magnitude;
        const magnitudeY = mouseMoveDimensionEventY.magnitude;

        const targetActivationX = this._castScratchPositionToSigmoid(targetX, magnitudeX);
        const targetActivationY = this._castScratchPositionToSigmoid(targetY, magnitudeY);

        labelVector.set(mouseMoveDimensionEventX.stringIdentifier(), targetActivationX);
        labelVector.set(mouseMoveDimensionEventY.stringIdentifier(), targetActivationY);
    }

    /**
     * Computes the target label of {@link MouseMoveDimensionEvent} action nodes
     * by inverting the scaleSigmoidToMagnitude function of the {@link ScratchEvent} class.
     * @param delta The difference along the x or y dimension between the mouse position
     * of the training input and the targeted mouse position.
     * @param magnitude The magnitude to which the sigmoid output is scaled to during network inference.
     * @returns the target label of {@link MouseMoveDimensionEvent} action nodes.
     */
    private _castScratchPositionToSigmoid(delta: number, magnitude: number): number {
        const inverted = (delta + magnitude) / (2 * magnitude);
        return Math.min(1, Math.max(0, inverted));
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
                trainingLoss += this._forwardPass(network, inputFeatures, labelVector);
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

                // Compute the loss on the validation set.
                validationLoss += this._forwardPass(network, inputFeatures, labelVector);
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
     * The forward pass activates the network based on a supplied input vector
     * and returns a loss value based on the specified loss function.
     * @param network the network to be trained.
     * @param inputs the provided feature vector.
     * @param labelVector the provided label vector corresponding to the input features.
     * @returns the loss value for the given inputs and labels.
     */
    public _forwardPass(network: NetworkChromosome, inputs: InputFeatures, labelVector: Map<string, number>): number {
        network.activateNetwork(inputs);
        const labels = network.getTriggerActionNodes().map(node => labelVector.get(node.event.stringIdentifier()) ?? 0);
        const predictions = network.getTriggerActionNodes().map(node => node.activationValue);
        const triggerActionLoss = network.outputActivationFunction === ActivationFunction.SOFTMAX ?
            this._categoricalCrossEntropyLoss(predictions, labels) : this._binaryCrossEntropyLoss(predictions, labels);
        return triggerActionLoss + this.mouseMoveLoss(network, labelVector);
    }

    /**
     * Computes the loss function for a multi-label classification network.
     * @param network the network hosting the mouse move nodes.
     * @param labelVector the label vector containing the desired network predictions.
     * @returns the loss value for the given inputs and labels.
     */
    private mouseMoveLoss(network: NetworkChromosome, labelVector: Map<string, number>) {
        const predictions: number[] = [];
        const labels: number[] = [];
        for (const node of network.getContinuousActionNodes()) {
            if (!(node.event instanceof MouseMoveDimensionEvent) || !labelVector.has(node.event.stringIdentifier())) {
                continue;
            }
            predictions.push(node.activationValue);
            labels.push(labelVector.get(node.event.stringIdentifier()));
        }
        return this._mseLoss(predictions, labels);
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

            if (layer == 1) {
                this._computeOutputNodeGradients(network, labelVector);
                this._computeOutputConnectionGradients(network);
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
     * Computes the gradients for the output nodes of a network.
     * @param network The network whose gradients should be computed.
     * @param labelVector The label vector mapping action events to target labels.
     * @private
     */
    private _computeOutputNodeGradients(network: NetworkChromosome, labelVector: Map<string, number>) {
        const triggerActionNodes = network.getTriggerActionNodes();
        for (const node of triggerActionNodes) {
            const label = labelVector.get(node.event.stringIdentifier()) ?? 0;
            const prediction = node.activationValue;
            if (node.activationFunction === ActivationFunction.SOFTMAX) {
                node.gradient = prediction - label;
            } else {
                const lossGradient = GradientDescent.DERIVATIVES.BINARY_CROSS_ENTROPY(prediction, label);
                const activationFunctionGradient = GradientDescent.DERIVATIVES[ActivationFunction[node.activationFunction]](prediction);
                node.gradient = lossGradient * activationFunctionGradient;
            }
        }

        const mouseMoveNodes = network.getContinuousActionNodes();
        for (const node of mouseMoveNodes) {
            if (!(node.event instanceof MouseMoveDimensionEvent) || !labelVector.has(node.event.stringIdentifier())) {
                continue;
            }
            const label = labelVector.get(node.event.stringIdentifier());
            const prediction = node.activationValue;
            const lossGradient = GradientDescent.DERIVATIVES.MSE(prediction, label);
            const activationFunctionGradient = GradientDescent.DERIVATIVES[ActivationFunction[node.activationFunction]](prediction);
            node.gradient = lossGradient * activationFunctionGradient;
        }
    }

    /**
     * Update the gradients for connections leading into an output layer.
     * @param network The network whose gradients should be updated.
     */
    private _computeOutputConnectionGradients(network: NetworkChromosome) {
        for (const node of network.getActionNodes()) {
            for (const connection of node.incomingConnections) {
                connection.gradient += node.gradient * connection.source.activationValue;
            }
        }
    }

    /**
     * Updates the weights of a network by applying a single gradient descent update step.
     * @param network the network whose weights are to be updated.
     * @param epoch number of executed epochs.
     */
    public _adjustWeights(network: NetworkChromosome, epoch: number): void {
        // Fetch learning rate.
        const learningRate = this._getLearningRate(epoch);
        network.connections.forEach(connection => connection.weight -= learningRate * connection.gradient);
        this.resetGradients(network);
    }

    private resetGradients(network: NetworkChromosome): void {
        network.getAllNodes().forEach(node => node.gradient = 0);
        network.connections.forEach(connection => connection.gradient = 0);
    }

    public extractDataForStatement(statement: string): StateActionRecord {
        if (!this._isMultiplePlayerTrace) {
            return this._extractDataForStatementFromPlayer(statement, this._groundTruth);
        }

        if (this._parameter.combinePlayerRecordings) {
            const stateActionRecord: StateActionRecord = new Map<ObjectInputFeatures, EventAndParametersObject>();
            for (const player in this._groundTruth) {
                const playerRecording = this._groundTruth[player] as Record<string, unknown>;
                const playerData = this._extractDataForStatementFromPlayer(statement, playerRecording);
                playerData.forEach((value, key) => stateActionRecord.set(key, value));
            }
            return stateActionRecord;
        }

        // Pick a random player recording to be used.
        const player = Randomness.getInstance().pick(Object.keys(this._groundTruth));
        logger.debug(`Using recording of player ${player}`);
        return this._extractDataForStatementFromPlayer(statement, this._groundTruth[player] as Record<string, unknown>);
    }

    /**
     * Restructures the data obtained from the .json file from a player's recording trace
     * such that it only includes records that correspond to the current statement target.
     * @param statement the target statement for which the networks should be optimised.
     * @param playerRecording the player's recording dataset.
     * @returns structured data for the gradient descent process.
     */
    private _extractDataForStatementFromPlayer(statement: string, playerRecording: Record<string, unknown>): StateActionRecord {
        const stateActionRecord: StateActionRecord = new Map<ObjectInputFeatures, EventAndParametersObject>();
        if (!playerRecording) {
            return stateActionRecord;
        }

        // Iterate over each recording in the .json file.
        for (const recording of Object.values(playerRecording)) {

            // Exclude recordings that do not include the supplied target statement.
            if (!(recording['coverage'].includes(statement))) {
                continue;
            }

            // Extract an executed action and the corresponding state from the .json file
            for (const record of Object.values(recording)) {
                const eventAndParams: EventAndParametersObject = {
                    event: record['action'],
                    parameter: record['parameter']
                };

                if (record['features'] !== undefined) {
                    stateActionRecord.set(record['features'], eventAndParams);
                }
            }
        }

        // Return the collected data or augment it to increase the dataset size.
        return stateActionRecord;
    }

    /**
     * Extracts batches of training samples from the entire training dataset.
     * @return training dataset split into batches.
     */
    private _extractBatches(): StateActionRecord[] {

        // Batch gradient descent
        if (this._parameter.batchSize === Infinity) {
            return [this._trainingData];
        }

        const batches: StateActionRecord[] = [];
        const keys = [...this._trainingData.keys()];
        const random = Randomness.getInstance();
        Arrays.shuffle(keys);

        // Randomly select data points from the training dataset and combine them to form a training batch until all
        // data points have been distributed.
        while (keys.length > 0) {
            const batch: StateActionRecord = new Map<ObjectInputFeatures, EventAndParametersObject>();
            while (batch.size < this._parameter.batchSize && keys.length > 0) {
                const ranDataSample = random.pick(keys);
                batch.set(ranDataSample, this.trainingData.get(ranDataSample));
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
        if (batches.length < 20) {
            return [batches, []];
        }
        Arrays.shuffle(batches);
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
     * Computes the binary cross-entropy loss between the prediction and label value.
     * @param predictions Array of predictions from the model.
     * @param labels Array of ground truth labels.
     * @returns The binary cross-entropy loss between the prediction and label value.
     */
    private _binaryCrossEntropyLoss(predictions: number[], labels: number[]): number {
        let loss = 0;
        for (let i = 0; i < predictions.length; i++) {
            loss += -(labels[i] * Math.log(predictions[i] + Number.EPSILON) +
                (1 - labels[i]) * Math.log(1 - predictions[i] + Number.EPSILON));
        }
        return loss;
    }

    /**
     * Computes the mean_squared error loss between the prediction and label value.
     * @param predictions Array of predictions from the model.
     * @param labels Array of ground truth labels.
     * @returns The mean-squared error loss between the prediction and label value.
     */
    private _mseLoss(predictions: number[], labels: number[]): number {
        let loss = 0;
        for (let i = 0; i < predictions.length; i++) {
            loss += (predictions[i] - labels[i]) ** 2;
        }
        return loss;
    }

    /**
     * Computes the categorical cross-entropy loss for multi-class classification with softmax activation.
     * @param predictions Array of predictions from the model.
     * @param labels Array of one-hot encoded ground truth labels.
     * @returns The categorical cross-entropy loss.
     */
    private _categoricalCrossEntropyLoss(predictions: number[], labels: number[]): number {
        let loss = 0;
        for (let i = 0; i < predictions.length; i++) {
            if (labels[i] > 0) {
                loss -= labels[i] * Math.log(predictions[i] + Number.EPSILON);
            }
        }
        return loss;
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
     * Computes and returns the average number of training epochs.
     * @return Average number of training epochs.
     */
    public getTrainingEpochsMean(): number {
        if (this._trainingEpochs.length > 0) {
            return this._trainingEpochs.reduce((a, b) => a + b, 0) / this._trainingEpochs.length;
        } else {
            return 0;
        }
    }

    /**
     * Computes and returns the average time used for gradient descent.
     * @return Average gradient descent optimisation time.
     */
    public getTrainingTimeMean(): number {
        if (this._trainingTimes.length > 0) {
            const time = Math.round(this._trainingTimes.reduce((a, b) => a + b, 0) / this._trainingTimes.length * 100) / 100;
            const timeSeconds = time / 1000;
            return Math.round(timeSeconds * 100) / 100;
        } else {
            return 0;
        }
    }

    /**
     * Prints the statement and branch coverage of the recorded training data.
     */
    private printRecordingCoverages() {
        const recordingCoverage = this.collectCoverages();
        const statementFactory = new StatementFitnessFunctionFactory();
        const branchFactory = new BranchCoverageFitnessFunctionFactory();
        const statements = statementFactory.extractFitnessFunctions(Container.vm, []).map(statement => statement.getNodeId());
        const branches = branchFactory.extractFitnessFunctions(Container.vm, []).map(branch => branch.getNodeId());

        const statementCoverage: string[] = [];
        const branchCoverage: string[] = [];
        statements.forEach(stat => recordingCoverage.has(stat) ? statementCoverage.push(stat) : null);
        branches.forEach(branch => recordingCoverage.has(branch) ? branchCoverage.push(branch) : null);

        logger.debug(`Recording Statement Coverage: ${statementCoverage.length} / ${statements.length}`);
        logger.debug(`Recording Branch Coverage: ${branchCoverage.length} / ${branches.length}`);
    }

    /**
     * Collects the set of covered blocks across all recording sessions of the recorded training data.
     * @return Set of covered blocks.
     */
    private collectCoverages(): Set<string> {
        const recordingCoverage: Set<string> = new Set();
        if (this._isMultiplePlayerTrace) {
            for (const player of Object.keys(this._groundTruth)) {
                for (const session of Object.values(this._groundTruth[player])) {
                    session['coverage'].forEach((cov: string) => recordingCoverage.add(cov));
                }
            }
        } else {
            for (const session of Object.values(this._groundTruth)) {
                session['coverage'].forEach((cov: string) => recordingCoverage.add(cov));
            }
        }
        return recordingCoverage;
    }

    /**
     * Computes the depth of the training data object.
     * @param trainingData the training data object for which the depth should be computed.
     */
    private getTrainingDataDepth(trainingData: Record<string, unknown>): number {
        let level = 1;
        for (const key in trainingData) {
            if (!Object.prototype.hasOwnProperty.call(trainingData, key)) continue;

            if (typeof trainingData[key] == 'object' && trainingData[key] !== null) {
                const depth = this.getTrainingDataDepth(trainingData[key] as Record<string, unknown>) + 1;
                level = Math.max(depth, level);
            }
        }
        return level;
    }

    /**
     * Determines whether the training data object contains traces from multiple players, which is inferred
     * by the depth of the training data object.
     * @param trainingData the training data for which we want to determine if it contains traces from multiple players.
     */
    private hasTracesFromMultiplePlayers(trainingData: Record<string, unknown>): boolean {
        return this.getTrainingDataDepth(trainingData) > 5;
    }

    get trainingData(): StateActionRecord {
        return this._trainingData;
    }
}

/**
 * Maps executed actions to the corresponding input features representing the program state.
 */
export type StateActionRecord = Map<ObjectInputFeatures, EventAndParametersObject>;

/**
 * Represents input features via a mapping from sprites to sprite features and their corresponding values.
 */
export type ObjectInputFeatures = Record<string, Record<string, number>>;

/**
 * Represents the structure of Scratch actions.
 */
export interface EventAndParametersObject {
    event: string,
    parameter: Record<string, number>
}

/**
 * Defines hyper parameter required for performing gradient descent.
 */
export interface gradientDescentParameter {
    probability: number,
    learningRate: number,
    learningRateAlgorithm: learningRateAlgorithm,
    epochs: number,
    batchSize: number,
    combinePlayerRecordings: boolean
}

/**
 * Defines available learning rate algorithms.
 */
export type learningRateAlgorithm = 'Static' | 'Gradual' // TODO AdaGrad, RMSProp, Adam, momentum
