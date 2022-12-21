import groundTruth from "./GroundTruth.json";
import network from "./fruitCatchingNetwork.json";
import {Backpropagation, LossFunction} from "../../../../src/whisker/whiskerNet/Misc/Backpropagation";
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


const generateNetwork = () => {
    const i1 = new InputNode(3, "i", "1");
    const i2 = new InputNode(4, "i", "2");
    const bias = new BiasNode(2);
    const h1 = new HiddenNode(1, 0.5, ActivationFunction.SIGMOID);
    const h2 = new HiddenNode(2, 0.5, ActivationFunction.SIGMOID);
    const o1 = new RegressionNode(5, new WaitEvent(),"Duration", ActivationFunction.SIGMOID);
    const o2 = new RegressionNode(6, new KeyPressEvent("k"), "Steps", ActivationFunction.SIGMOID);
    const layer: NetworkLayer = new Map<number, NodeGene[]>();
    layer.set(0, [i1, i2, bias]);
    layer.set(0.5, [h1, h2]);
    layer.set(1, [o1, o2]);

    const c1 = new ConnectionGene(i1, h1, 0.15, true, 0, false);
    const c2 = new ConnectionGene(i1, h2, 0.3, true, 1, false);
    const c3 = new ConnectionGene(i2, h1, 0.20, true, 2, false);
    const c4 = new ConnectionGene(i2, h2, 0.25, true, 3, false);
    const c5 = new ConnectionGene(bias, h1, 0.35, true, 6, false);
    const c6 = new ConnectionGene(bias, h2, 0.35, true, 7, false);

    const c7 = new ConnectionGene(h1, o1, 0.4, true, 8, false);
    const c8 = new ConnectionGene(h1, o2, 0.5, true, 9, false);
    const c9 = new ConnectionGene(h2, o1, 0.45, true, 10, false);
    const c10 = new ConnectionGene(h2, o2, 0.55, true, 11, false);
    const c11 = new ConnectionGene(bias, o1, 0.60, true, 12, false);
    const c12 = new ConnectionGene(bias, o2, 0.60, true, 13, false);

    const cons = [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12];

    return new NeatChromosome(layer, cons, undefined, undefined, undefined);
};

const loadFruitCatchingNetwork = (): NetworkChromosome => {
    const networkJSON = network as any;
    const networkLoader = new NetworkLoader(networkJSON, [new WaitEvent(), new KeyPressEvent('right arrow'), new KeyPressEvent('left arrow')]);
    return networkLoader.loadNetworks()[0];
};

const generateInputs = (): InputFeatures => {
    const inputFeatures: InputFeatures = new Map<string, FeatureGroup>();
    const featureGroup: FeatureGroup = new Map<string, number>();
    featureGroup.set("1", 0.05);
    featureGroup.set("2", 0.1);
    inputFeatures.set("i", featureGroup);
    return inputFeatures;
};

describe('Test Backpropagation', () => {
    let backpropagation: Backpropagation;
    const statement = "}Gp_.7).xv-]IUt.!E1/-Bowl"; // Catching the apple for 30 seconds.
    Container.debugLog = () => { /* suppress output */
    };

    beforeEach(() => {
        backpropagation = new Backpropagation(groundTruth as any);
    });

    test("Check number of recordings after initialisation", () => {
        let featureRecordings = 0;
        for (const recordings of Object.values(groundTruth)) {
                if (!recordings['coverage'].includes(statement)) {
                    continue;
                }
                featureRecordings += Object.keys(recordings).length - 1;
            }
        expect([...backpropagation._organiseData(statement).keys()].length).toBe(featureRecordings);
    });

    test("Forward Pass", () => {
        // Example from https://mattmazur.com/2015/03/17/a-step-by-step-backpropagation-example/
        const net = generateNetwork();
        const inputs = generateInputs();
        const labelMap = new Map<string, number>();
        labelMap.set("KeyPressEvent-j", 0.01);
        labelMap.set("KeyPressEvent-k", 0.99);
        const loss = backpropagation._forwardPass(net, inputs, labelMap, LossFunction.SQUARED_ERROR);
        expect(Math.round(loss * 1000) / 1000).toEqual(0.298);
    });

    test("Backward Pass and adjust weights", () => {
        // Example from https://mattmazur.com/2015/03/17/a-step-by-step-backpropagation-example/
        const net = generateNetwork();
        const inputs = generateInputs();
        const labelMap = new Map<string, number>();
        labelMap.set("KeyPressEvent-j", 0.01);
        labelMap.set("KeyPressEvent-k", 0.99);
        const startLoss = backpropagation._forwardPass(net, inputs, labelMap, LossFunction.SQUARED_ERROR);
        backpropagation._backwardPass(net, labelMap);
        backpropagation._adjustWeights(net, 0.5);
        const connectionWeights = net.connections.filter(connection => !(connection.source instanceof BiasNode)).map(conn => Math.round(conn.weight * 1000)/ 1000).sort();
        expect(Math.round(startLoss * 1000) / 1000).toEqual(0.298);
        expect(connectionWeights.sort()).toEqual([0.15, 0.2, 0.25,0.3, 0.359, 0.409, 0.511, 0.561]);

        for (let i = 0; i < 10000; i++) {
        backpropagation._forwardPass(net, inputs, labelMap, LossFunction.SQUARED_ERROR);
            backpropagation._backwardPass(net, labelMap);
        backpropagation._adjustWeights(net, 0.5);
        }
        const finalLoss = backpropagation._forwardPass(net, inputs, labelMap, LossFunction.SQUARED_ERROR);
        expect(finalLoss).toBeLessThan(0.00001);
    });

    test("Optimise Network", () => {
        const backpropagation = new Backpropagation(groundTruth);
        const net = loadFruitCatchingNetwork();
        const learningRate = 0.001;
        const startingLoss = backpropagation.stochasticGradientDescent(net, statement, 1, learningRate);
        const finalLoss = backpropagation.stochasticGradientDescent(net, statement, 100, learningRate);
        expect(finalLoss).toBeLessThan(startingLoss);
    });

});
