import {NetworkLoader} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NetworkLoader";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";
import {HiddenNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/HiddenNode";
import {ClassificationNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/ClassificationNode";
import {RegressionNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/RegressionNode";
import network from "./networkToLoad.json";

describe("Test NetworkLoader", () => {
    let networkLoader: NetworkLoader;

    beforeEach(() => {
        const networkJSON = network as any;
        const events = [new WaitEvent()];
        networkLoader = new NetworkLoader(networkJSON, events);
    });

    test("Load Networks", () => {
        const networks = networkLoader.loadNetworks();
        expect(networks.length).toBe(2);
        const firstNetwork = networks[0];
        expect(firstNetwork.uID).toBe(0);
        expect(firstNetwork.activationFunction).toBe(ActivationFunction["TANH"]);
        expect(firstNetwork.inputConnectionMethod).toBe("fullyHidden");
        expect(firstNetwork.targetFitness).toBe(undefined); // We have no CDG -> no actual statements
        expect(firstNetwork.allNodes.length).toBe(8);
        expect(firstNetwork.connections.length).toBe(8);
        expect(firstNetwork.allNodes.filter(n => n instanceof InputNode).length).toBe(3);
        expect(firstNetwork.allNodes.filter(n => n instanceof BiasNode).length).toBe(1);
        expect(firstNetwork.allNodes.filter(n => n instanceof HiddenNode).length).toBe(2);
        expect(firstNetwork.allNodes.filter(n => n instanceof ClassificationNode).length).toBe(1);
        expect(firstNetwork.allNodes.filter(n => n instanceof RegressionNode).length).toBe(1);
        expect(firstNetwork.referenceActivationTrace.tracedNodes).toEqual(firstNetwork.allNodes.filter(node => node instanceof HiddenNode));
        expect(firstNetwork.referenceActivationTrace.trace.size).toBe(2);
        expect(firstNetwork.referenceActivationTrace.trace.get(5).size).toBe(2);
        expect(firstNetwork.referenceActivationTrace.trace.get(1).get("H4")[2]).toBe(0.12);

        const cNode = firstNetwork.allNodes.find(n => n instanceof ClassificationNode) as ClassificationNode;
        expect(cNode.incomingConnections.length).toBe(2);
        expect(cNode.event.stringIdentifier()).toBe("WaitEvent");

        const rNode = firstNetwork.allNodes.find(n => n instanceof RegressionNode) as RegressionNode;
        expect(rNode.incomingConnections.length).toBe(2);
        expect(rNode.event.stringIdentifier()).toBe("WaitEvent");
        expect(rNode.eventParameter).toBe("Duration");
    });

});
