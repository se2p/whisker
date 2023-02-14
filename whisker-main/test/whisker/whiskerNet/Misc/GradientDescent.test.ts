import groundTruthFruitCatching from "./GroundTruthFruitCatching.json";
import fruitCatchingNetwork from "./fruitCatchingNetwork.json";
import {augmentationParameter, GradientDescent, gradientDescentParameter, LossFunction} from "../../../../src/whisker/whiskerNet/Misc/GradientDescent";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";
import {HiddenNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/HiddenNode";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NeatChromosome} from "../../../../src/whisker/whiskerNet/Networks/NeatChromosome";
import {ConnectionGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/ConnectionGene";
import {KeyPressEvent} from "../../../../src/whisker/testcase/events/KeyPressEvent";
import {FeatureGroup, InputFeatures} from "../../../../src/whisker/whiskerNet/Misc/InputExtraction";
import {NetworkChromosome, NetworkLayer} from "../../../../src/whisker/whiskerNet/Networks/NetworkChromosome";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {NetworkLoader} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NetworkLoader";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {Container} from "../../../../src/whisker/utils/Container";
import {RegressionNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/RegressionNode";
import {TypeNumberEvent} from "../../../../src/whisker/testcase/events/TypeNumberEvent";
import {Randomness} from "../../../../src/whisker/utils/Randomness";


const generateNetwork = () => {
    const i1 = new InputNode(3, "i", "1");
    const i2 = new InputNode(4, "i", "2");
    const bias = new BiasNode(2);
    const h1 = new HiddenNode(1, 0.5, ActivationFunction.SIGMOID);
    const h2 = new HiddenNode(2, 0.5, ActivationFunction.SIGMOID);
    const o1 = new RegressionNode(5, new WaitEvent(), "Duration");
    const o2 = new RegressionNode(6, new KeyPressEvent("k"), "Steps");
    const layer: NetworkLayer = new Map<number, NodeGene[]>();
    layer.set(0, [i1, i2, bias]);
    layer.set(0.5, [h1, h2]);
    layer.set(1, [o1, o2]);

    const c1 = new ConnectionGene(i1, h1, 0.15, true, 0);
    const c2 = new ConnectionGene(i1, h2, 0.3, true, 1);
    const c3 = new ConnectionGene(i2, h1, 0.20, true, 2);
    const c4 = new ConnectionGene(i2, h2, 0.25, true, 3);
    const c5 = new ConnectionGene(bias, h1, 0.35, true, 6);
    const c6 = new ConnectionGene(bias, h2, 0.35, true, 7);

    const c7 = new ConnectionGene(h1, o1, 0.4, true, 8);
    const c8 = new ConnectionGene(h1, o2, 0.5, true, 9);
    const c9 = new ConnectionGene(h2, o1, 0.45, true, 10);
    const c10 = new ConnectionGene(h2, o2, 0.55, true, 11);
    const c11 = new ConnectionGene(bias, o1, 0.60, true, 12);
    const c12 = new ConnectionGene(bias, o2, 0.60, true, 13);

    const cons = [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12];

    return new NeatChromosome(layer, cons, undefined, undefined, undefined);
};

const loadNetwork = (networkJSON: any): NetworkChromosome => {
    const networkLoader = new NetworkLoader(networkJSON, [new WaitEvent(), new KeyPressEvent('right arrow'), new KeyPressEvent('left arrow'), new TypeNumberEvent()]);
    const net =  networkLoader.loadNetworks()[0];
    const random = Randomness.getInstance();
    net.connections.forEach(connection => connection.weight = random.nextDouble());
    return net;
};

const generateInputs = (): InputFeatures => {
    const inputFeatures: InputFeatures = new Map<string, FeatureGroup>();
    const featureGroup: FeatureGroup = new Map<string, number>();
    featureGroup.set("1", 0.05);
    featureGroup.set("2", 0.1);
    inputFeatures.set("i", featureGroup);
    return inputFeatures;
};

describe('Test Gradient Descent', () => {
    let backpropagation_1: GradientDescent;
    let backpropagation_2: GradientDescent;
    let gradientDescentForward: gradientDescentParameter;
    let gradientDescentLearning: gradientDescentParameter;
    let augmentationParameter: augmentationParameter;
    const statement = "}Gp_.7).xv-]IUt.!E1/-Bowl"; // Catching the apple for 30 seconds.

    Container.debugLog = () => { /* suppress output */
    };

    beforeEach(() => {
        augmentationParameter = {
            doAugment: false,
            numAugments: 0,
            disturbStateProb: 0,
            disturbStatePower: 0
        };

        gradientDescentForward = {
            learningRate: 0,
            learningRateAlgorithm: 'Static',
            epochs: 1,
            batchSize: 1,
            labelSmoothing: 0
        };

        gradientDescentLearning = {
            learningRate: 0.001,
            learningRateAlgorithm: 'Static',
            epochs: 500,
            batchSize: 32,
            labelSmoothing: 0
        };
        backpropagation_1 = new GradientDescent(groundTruthFruitCatching as any, gradientDescentForward, augmentationParameter);
        backpropagation_2 = new GradientDescent(groundTruthFruitCatching as any, gradientDescentLearning, augmentationParameter);
    });

    test("Check number of recordings after initialisation", () => {
        let featureRecordings = 0;
        for (const recordings of Object.values(groundTruthFruitCatching)) {
            if (!recordings['coverage'].includes(statement)) {
                continue;
            }
            featureRecordings += Object.keys(recordings).length - 1;
        }
        expect([...backpropagation_1._extractDataForStatement(statement).keys()].length).toBe(featureRecordings);
    });

    test("Forward Pass", () => {
        // Example from https://mattmazur.com/2015/03/17/a-step-by-step-backpropagation-example/
        const net = generateNetwork();
        const inputs = generateInputs();
        const labelMap = new Map<string, number>();
        labelMap.set("WaitEvent-Duration", 0.01);
        labelMap.set("KeyPressEvent-k-Steps", 0.99);
        const loss = backpropagation_1._forwardPass(net, inputs, labelMap, LossFunction.SQUARED_ERROR);
        expect(Math.round(loss * 1000) / 1000).toEqual(0.298);
    });

    test("Backward Pass and adjust weights", () => {
        const gradientDescentParameter: gradientDescentParameter = {
            learningRate: 0.5,
            learningRateAlgorithm: 'Static',
            epochs: 1,
            batchSize: 1,
            labelSmoothing: 0
        };
        // Example from https://mattmazur.com/2015/03/17/a-step-by-step-backpropagation-example/
        const backpropagation = new GradientDescent(groundTruthFruitCatching as any, gradientDescentParameter, augmentationParameter);
        const net = generateNetwork();
        const inputs = generateInputs();
        const labelMap = new Map<string, number>();
        labelMap.set("WaitEvent-Duration", 0.01);
        labelMap.set("KeyPressEvent-k-Steps", 0.99);
        const startLoss = backpropagation._forwardPass(net, inputs, labelMap, LossFunction.SQUARED_ERROR);
        backpropagation._backwardPass(net, labelMap);
        backpropagation._adjustWeights(net, 0.5);
        const connectionWeights = net.connections.filter(connection => !(connection.source instanceof BiasNode)).map(conn => Math.round(conn.weight * 1000) / 1000).sort();
        expect(Math.round(startLoss * 1000) / 1000).toEqual(0.298);
        expect(connectionWeights.sort()).toEqual([0.15, 0.2, 0.25, 0.3, 0.359, 0.409, 0.511, 0.561]);

        for (let i = 0; i < 10000; i++) {
            backpropagation._forwardPass(net, inputs, labelMap, LossFunction.SQUARED_ERROR);
            backpropagation._backwardPass(net, labelMap);
            backpropagation._adjustWeights(net, 0.5);
        }
        const finalLoss = backpropagation._forwardPass(net, inputs, labelMap, LossFunction.SQUARED_ERROR);
        expect(finalLoss).toBeLessThan(0.00001);
    });

    test("Mini-Batch Gradient descent", () => {
        const net = loadNetwork(fruitCatchingNetwork);
        const startingLoss = backpropagation_1.gradientDescent(net, statement);
        const finalLoss = backpropagation_2.gradientDescent(net, statement);
        expect(Math.round(finalLoss * 100) / 100).toBeLessThanOrEqual(Math.round(startingLoss * 100) / 100);
    });

    test("Mini-Batch Gradient descent with gradual decreasing learning rate", () => {
        const net = loadNetwork(fruitCatchingNetwork);
        const startingLoss = backpropagation_1.gradientDescent(net, statement);
        const gradientDescentParameter: gradientDescentParameter = {
            learningRate: 0.1,
            learningRateAlgorithm: 'Gradual',
            epochs: 500,
            batchSize: 1,
            labelSmoothing: 0
        };
        const backpropagation = new GradientDescent(groundTruthFruitCatching as any, gradientDescentParameter, augmentationParameter);
        const finalLoss = backpropagation.gradientDescent(net, statement);
        expect(Math.round(finalLoss * 100) / 100).toBeLessThanOrEqual(Math.round(startingLoss * 100) / 100);
    });

    test("Stochastic Gradient descent", () => {
        const net = loadNetwork(fruitCatchingNetwork);
        const gradientDescentParameter: gradientDescentParameter = {
            learningRate: 0,
            learningRateAlgorithm: 'Static',
            epochs: 1,
            batchSize: 1,
            labelSmoothing: 0
        };
        let backpropagation = new GradientDescent(groundTruthFruitCatching as any, gradientDescentParameter, augmentationParameter);
        const startingLoss = backpropagation.gradientDescent(net, statement);

        gradientDescentParameter.learningRate = 0.001;
        gradientDescentParameter.epochs = 500;
        backpropagation = new GradientDescent(groundTruthFruitCatching as any, gradientDescentParameter, augmentationParameter);
        const finalLoss = backpropagation.gradientDescent(net, statement);
        expect(Math.round(finalLoss * 100) / 100).toBeLessThanOrEqual(Math.round(startingLoss * 100) / 100);
    });


    test("Batch Gradient descent", () => {
        const net = loadNetwork(fruitCatchingNetwork);
        const gradientDescentParameter: gradientDescentParameter = {
            learningRate: 0,
            learningRateAlgorithm: 'Static',
            epochs: 1,
            batchSize: Infinity,
            labelSmoothing: 0
        };
        let backpropagation = new GradientDescent(groundTruthFruitCatching as any, gradientDescentParameter, augmentationParameter);
        const startingLoss = backpropagation.gradientDescent(net, statement);

        gradientDescentParameter.learningRate = 0.1;
        gradientDescentParameter.epochs = 500;
        backpropagation = new GradientDescent(groundTruthFruitCatching as any, gradientDescentParameter, augmentationParameter);
        const finalLoss = backpropagation.gradientDescent(net, statement);
        expect(Math.round(finalLoss * 100) / 100).toBeLessThanOrEqual(Math.round(startingLoss * 100) / 100);
    });

    test("Gradient descent with data augmentation", () => {
        const net = loadNetwork(fruitCatchingNetwork);
        const augmentationParameter = {
            doAugment: true,
            numAugments: 1000,
            disturbStateProb: 0.1,
            disturbStatePower: 0.01
        };
        let backpropagation = new GradientDescent(groundTruthFruitCatching, gradientDescentForward, augmentationParameter);
        const startingLoss = backpropagation.gradientDescent(net, statement);

        backpropagation = new GradientDescent(groundTruthFruitCatching, gradientDescentLearning, augmentationParameter);
        const finalLoss = backpropagation.gradientDescent(net, statement);
        expect(Math.round(finalLoss * 100) / 100).toBeLessThanOrEqual(Math.round(startingLoss * 100) / 100);
    });

    test("Mini-Batch Gradient descent with label smoothing", () => {
        const net = loadNetwork(fruitCatchingNetwork);
        const startingLoss = backpropagation_1.gradientDescent(net, statement);

        gradientDescentLearning.labelSmoothing = 0.1;
        const backpropagation = new GradientDescent(groundTruthFruitCatching as any, gradientDescentLearning, augmentationParameter);
        const finalLoss = backpropagation.gradientDescent(net, statement);
        expect(Math.round(finalLoss * 100) / 100).toBeLessThanOrEqual(Math.round(startingLoss * 100) / 100);
    });

});
