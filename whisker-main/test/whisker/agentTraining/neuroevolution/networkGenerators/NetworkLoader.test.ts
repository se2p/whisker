import {NetworkLoader} from "../../../../../src/whisker/agentTraining/neuroevolution/networkGenerators/NetworkLoader";
import {WaitEvent} from "../../../../../src/whisker/testcase/events/WaitEvent";
import {ActivationFunction} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/ActivationFunction";
import {BiasNode} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/BiasNode";
import {ActionNode} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/ActionNode";
import {KeyPressEvent} from "../../../../../src/whisker/testcase/events/KeyPressEvent";
import multiLabelNetwork from "./multiLabel.json";
import multiClassNetwork from "./multiClass.json";

describe("Test NetworkLoader", () => {

    test("Load MultiLabel networks", () => {
        const events = [new KeyPressEvent("left arrow"), new KeyPressEvent("right arrow")];
        const networkLoader = new NetworkLoader(multiLabelNetwork as any, events);

        const networks = networkLoader.loadNetworks();
        expect(networks.length).toBe(2);

        const firstNetwork = networks[0];
        const secondNetwork = networks[1];
        expect(firstNetwork.uID).not.toBe(secondNetwork.uID);

        expect(firstNetwork.outputActivationFunction).toBe(ActivationFunction["SIGMOID"]);
        expect(firstNetwork.inputConnectionMethod).toBe("fully");
        expect(firstNetwork.getAllNodes().length).toBe(24);
        expect(firstNetwork.connections.length).toBe(40);
        expect(firstNetwork.layers.get(0).length).toBe(21);
        expect(firstNetwork.getAllNodes().filter(n => n instanceof BiasNode).length).toBe(1);
        expect(firstNetwork.layers.get(1).length).toBe(2);
        expect(firstNetwork.getAllNodes().filter(n => n instanceof ActionNode).length).toBe(2);

        expect(secondNetwork.outputActivationFunction).toBe(ActivationFunction["SIGMOID"]);
        expect(secondNetwork.inputConnectionMethod).toBe("fully");
        expect(secondNetwork.getAllNodes().length).toBe(23);
        expect(secondNetwork.connections.length).toBe(38);
        expect(secondNetwork.layers.get(0).length).toBe(21);
        expect(secondNetwork.getAllNodes().filter(n => n instanceof BiasNode).length).toBe(1);
        expect(secondNetwork.layers.get(1).length).toBe(2);
        expect(secondNetwork.getAllNodes().filter(n => n instanceof ActionNode).length).toBe(2);
    });

    test("Load MultiClass networks", () => {
        const events = [new KeyPressEvent("left arrow"), new KeyPressEvent("right arrow"), new WaitEvent()];
        const networkLoader = new NetworkLoader(multiClassNetwork as any, events);
        const networks = networkLoader.loadNetworks();

        expect(networks.length).toBe(2);

        const firstNetwork = networks[0];
        const secondNetwork = networks[1];
        expect(firstNetwork.uID).not.toBe(secondNetwork.uID);

        expect(firstNetwork.outputActivationFunction).toBe(ActivationFunction["SOFTMAX"]);
        expect(firstNetwork.inputConnectionMethod).toBe("fully");
        expect(firstNetwork.getAllNodes().length).toBe(24);
        expect(firstNetwork.connections.length).toBe(57);
        expect(firstNetwork.layers.get(0).length).toBe(21);
        expect(firstNetwork.getAllNodes().filter(n => n instanceof BiasNode).length).toBe(1);
        expect(firstNetwork.layers.get(1).length).toBe(3);
        expect(firstNetwork.getAllNodes().filter(n => n instanceof ActionNode).length).toBe(3);

        expect(secondNetwork.outputActivationFunction).toBe(ActivationFunction["SOFTMAX"]);
        expect(secondNetwork.inputConnectionMethod).toBe("fully");
        expect(secondNetwork.getAllNodes().length).toBe(24);
        expect(secondNetwork.connections.length).toBe(57);
        expect(secondNetwork.layers.get(0).length).toBe(21);
        expect(secondNetwork.getAllNodes().filter(n => n instanceof BiasNode).length).toBe(1);
        expect(secondNetwork.layers.get(1).length).toBe(3);
        expect(secondNetwork.getAllNodes().filter(n => n instanceof ActionNode).length).toBe(3);
    });

});
