import groundTruthFruitCatching from "./GroundTruthFruitCatching.json";
import groundTruthFruitCatchingCombined from "./GroundTruthFruitCatchingCombined.json";
import groundTruthPong from "./GroundTruthPong.json";
import fruitCatchingMultiLabel from "./fruitCatchingMultiLabel.json";
import fruitCatchingMultiClass from "./fruitCatchingMultiClass.json";
import pongNetwork from "./pongNetwork.json";
import {GradientDescent, gradientDescentParameter} from "../../../../../src/whisker/agentTraining/neuroevolution/misc/GradientDescent";
import {KeyPressEvent} from "../../../../../src/whisker/testcase/events/KeyPressEvent";
import {NetworkChromosome} from "../../../../../src/whisker/agentTraining/neuroevolution/networks/NetworkChromosome";
import {NetworkLoader} from "../../../../../src/whisker/agentTraining/neuroevolution/networkGenerators/NetworkLoader";
import {TypeNumberEvent} from "../../../../../src/whisker/testcase/events/TypeNumberEvent";
import {Randomness} from "../../../../../src/whisker/utils/Randomness";
import logger from "../../../../../src/util/logger";
import {MouseMoveDimensionEvent} from "../../../../../src/whisker/testcase/events/MouseMoveDimensionEvent";
import {WaitEvent} from "../../../../../src/whisker/testcase/events/WaitEvent";


const loadNetwork = (networkJSON: any): NetworkChromosome => {
    const networkLoader = new NetworkLoader(networkJSON, [
        new KeyPressEvent('right arrow'), new KeyPressEvent('left arrow'),
        new TypeNumberEvent(), new WaitEvent(),
        new MouseMoveDimensionEvent("X"), new MouseMoveDimensionEvent("Y")]);
    const net = networkLoader.loadNetworks()[0];
    const random = Randomness.getInstance();
    net.connections.forEach(connection => connection.weight = random.nextDouble());
    return net;
};

describe('Test Gradient Descent', () => {
    let forwardPassGradientDescent: GradientDescent;
    let gradientDescentForward: gradientDescentParameter;
    let gradientDescentLearning: gradientDescentParameter;
    const statement = "}Gp_.7).xv-]IUt.!E1/-Bowl"; // Catching the apple for 30 seconds.

    logger.suggest.deny(/.*/, "debug");

    beforeEach(() => {
        gradientDescentForward = {
            probability: 1,
            learningRate: 0,
            learningRateAlgorithm: 'Static',
            epochs: 1,
            batchSize: 1,
            combinePlayerRecordings: false,
        };

        gradientDescentLearning = {
            probability: 1,
            learningRate: 0.001,
            learningRateAlgorithm: 'Static',
            epochs: 500,
            batchSize: 1,
            combinePlayerRecordings: false,
        };
        forwardPassGradientDescent = new GradientDescent(groundTruthFruitCatching, gradientDescentForward);
    });

    test("Check number of recordings after initialisation", () => {
        let featureRecordings = 0;
        for (const recordings of Object.values(groundTruthFruitCatching)) {
            if (!recordings['coverage'].includes(statement)) {
                continue;
            }
            featureRecordings += Object.keys(recordings).length - 1;
        }
        expect([...forwardPassGradientDescent.extractDataForStatement(statement).keys()].length).toBe(featureRecordings);
    });

    test("Check number of combined recordings after initialisation", () => {
        const combinedIndividual = new GradientDescent(groundTruthFruitCatchingCombined, gradientDescentForward);
        gradientDescentLearning.combinePlayerRecordings = true;
        const combined = new GradientDescent(groundTruthFruitCatchingCombined, gradientDescentLearning);
        const numIndividuals = [...combinedIndividual.extractDataForStatement(statement).keys()].length;
        const numCombined = [...combined.extractDataForStatement(statement).keys()].length;
        expect(numCombined).toBeGreaterThan(numIndividuals);
    });

    test("Mini-batch gradient descent with gradual decreasing learning rate", () => {
        const net = loadNetwork(fruitCatchingMultiLabel);
        const startingLoss = forwardPassGradientDescent.gradientDescent(net, statement);

        gradientDescentLearning.batchSize = 4;
        gradientDescentLearning.learningRate = 0.01;
        gradientDescentLearning.learningRateAlgorithm = 'Gradual';
        const backpropagation = new GradientDescent(groundTruthFruitCatching, gradientDescentLearning);
        const finalLoss = backpropagation.gradientDescent(net, statement);
        expect(Math.round(finalLoss * 100) / 100).toBeLessThanOrEqual(Math.round(startingLoss * 100) / 100);
    });

    test("Stochastic gradient descent with multi-label classification network", () => {
        const net = loadNetwork(fruitCatchingMultiLabel);
        const startingLoss = forwardPassGradientDescent.gradientDescent(net, statement);

        gradientDescentLearning.learningRate = 0.01;
        gradientDescentLearning.epochs = 1000;
        const backpropagation = new GradientDescent(groundTruthFruitCatching, gradientDescentLearning);
        const finalLoss = backpropagation.gradientDescent(net, statement);
        expect(Math.round(finalLoss * 100) / 100).toBeLessThanOrEqual(Math.round(startingLoss * 100) / 100);
    });

    test("Stochastic gradient descent with multi-class classification network", () => {
        const net = loadNetwork(fruitCatchingMultiClass);
        const startingLoss = forwardPassGradientDescent.gradientDescent(net, statement);

        gradientDescentLearning.learningRate = 0.01;
        gradientDescentLearning.epochs = 1000;
        const backpropagation = new GradientDescent(groundTruthFruitCatching, gradientDescentLearning);
        const finalLoss = backpropagation.gradientDescent(net, statement);
        expect(Math.round(finalLoss * 100) / 100).toBeLessThanOrEqual(Math.round(startingLoss * 100) / 100);
    });

    test("Batch gradient descent", () => {
        const net = loadNetwork(fruitCatchingMultiLabel);
        const startingLoss = forwardPassGradientDescent.gradientDescent(net, statement);

        gradientDescentLearning.batchSize = 4;
        const backpropagation = new GradientDescent(groundTruthFruitCatching, gradientDescentLearning);
        const finalLoss = backpropagation.gradientDescent(net, statement);
        expect(Math.round(finalLoss * 100) / 100).toBeLessThanOrEqual(Math.round(startingLoss * 100) / 100);
    });

    test("Stochastic gradient descent with regression mouse move nodes", () => {
        const net = loadNetwork(pongNetwork);
        const forwardPassGradientDescent = new GradientDescent(groundTruthPong, gradientDescentForward);
        const startingLoss = forwardPassGradientDescent.gradientDescent(net, "x|uP^bqm{]xwITPjY@yB");

        gradientDescentLearning.batchSize = 4;
        const backpropagation = new GradientDescent(groundTruthPong, gradientDescentLearning);
        const finalLoss = backpropagation.gradientDescent(net, "x|uP^bqm{]xwITPjY@yB");
        expect(Math.round(finalLoss * 100) / 100).toBeLessThanOrEqual(Math.round(startingLoss * 100) / 100);
    });
});
