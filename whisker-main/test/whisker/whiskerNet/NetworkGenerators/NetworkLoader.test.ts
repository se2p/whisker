import {NetworkLoader} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NetworkLoader";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";
import {HiddenNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/HiddenNode";
import {ClassificationNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/ClassificationNode";
import {RegressionNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/RegressionNode";

describe("Test NetworkLoader", () => {
    let networkLoader: NetworkLoader;

    beforeEach(() => {
        const networkJSON: any = {
            "Network 0": {
                "id": 0,
                "aF": "TANH",
                "cM": "fullyHidden",
                "tf": "u*;kMNBI!JQ!TOk8u1{~-Stage",
                "Nodes": {
                    "Node 0": {
                        "id": 0,
                        "t": "I",
                        "aF": "NONE",
                        "sprite": "Sprite1",
                        "feature": "A"
                    },
                    "Node 1": {
                        "id": 1,
                        "t": "I",
                        "aF": "NONE",
                        "sprite": "Sprite2",
                        "feature": "A"
                    },
                    "Node 2": {
                        "id": 2,
                        "t": "I",
                        "aF": "NONE",
                        "sprite": "Sprite2",
                        "feature": "B"
                    },
                    "Node 3": {
                        "id": 3,
                        "t": "B",
                        "aF": "NONE"
                    },
                    "Node 4": {
                        "id": 4,
                        "t": "H",
                        "aF": "TANH"
                    },
                    "Node 5": {
                        "id": 5,
                        "t": "H",
                        "aF": "TANH"
                    },
                    "Node 6": {
                        "id": 6,
                        "t": "C",
                        "aF": "NONE",
                        "event": "WaitEvent"
                    },
                    "Node 7": {
                        "id": 7,
                        "t": "R",
                        "aF": "NONE",
                        "event": "WaitEvent",
                        "eventP": "Duration"
                    }
                },
                "Cons": {
                    "Con 0": {
                        "s": 0,
                        "t": 4,
                        "w": 1,
                        "e": true,
                        "i": 0,
                        "r": false
                    },
                    "Con 1": {
                        "s": 1,
                        "t": 5,
                        "w": -1,
                        "e": true,
                        "i": 1,
                        "r": false
                    },
                    "Con 2": {
                        "s": 2,
                        "t": 5,
                        "w": -1,
                        "e": true,
                        "i": 1,
                        "r": false
                    },
                    "Con 3": {
                        "s": 3,
                        "t": 5,
                        "w": 1,
                        "e": true,
                        "i": 1,
                        "r": false
                    },
                    "Con 4": {
                        "s": 4,
                        "t": 6,
                        "w": -0.5,
                        "e": true,
                        "i": 1,
                        "r": false
                    },
                    "Con 5": {
                        "s": 4,
                        "t": 7,
                        "w": -0.5,
                        "e": true,
                        "i": 1,
                        "r": false
                    },
                    "Con 6": {
                        "s": 5,
                        "t": 6,
                        "w": 0.5,
                        "e": true,
                        "i": 1,
                        "r": false
                    },
                    "Con 7": {
                        "s": 5,
                        "t": 7,
                        "w": 0.5,
                        "e": true,
                        "i": 1,
                        "r": false
                    }
                },
                "AT": {
                    "1": {
                        "H4": [0.1, 0.1, 0.12, 0.08, 0.11],
                        "H5": [-0.5, -0.4, -0.3, -0.2, -0.55]
                    },
                    "5": {
                        "H4": [1, 1.1, 1.2, 0.9, 0.8],
                        "H5": [-1, -1, 1, 1, -0.5]
                    }
                }
            },
            "Network 1": {
                "id": 0,
                "aF": "TANH",
                "cM": "fullyHidden",
                "tf": "u*;kMNBI!JQ!TOk8u1{~-Stage",
                "Nodes": {
                    "Node 0": {
                        "id": 0,
                        "t": "I",
                        "aF": "NONE",
                        "sprite": "Sprite1",
                        "feature": "A"
                    },
                    "Node 1": {
                        "id": 1,
                        "t": "I",
                        "aF": "NONE",
                        "sprite": "Sprite2",
                        "feature": "A"
                    },
                    "Node 2": {
                        "id": 2,
                        "t": "I",
                        "aF": "NONE",
                        "sprite": "Sprite2",
                        "feature": "B"
                    },
                    "Node 6": {
                        "id": 6,
                        "t": "C",
                        "aF": "NONE",
                        "event": "WaitEvent"
                    },
                    "Node 7": {
                        "id": 7,
                        "t": "R",
                        "aF": "NONE",
                        "event": "WaitEvent",
                        "eventP": "Duration"
                    }
                },
                "Cons": {
                    "Con 0": {
                        "s": 0,
                        "t": 6,
                        "w": 1,
                        "e": true,
                        "i": 0,
                        "r": false
                    },
                    "Con 1": {
                        "s": 0,
                        "t": 7,
                        "w": -1,
                        "e": true,
                        "i": 1,
                        "r": false
                    },
                    "Con 2": {
                        "s": 1,
                        "t": 6,
                        "w": -1,
                        "e": true,
                        "i": 1,
                        "r": false
                    },
                    "Con 3": {
                        "s": 1,
                        "t": 7,
                        "w": 1,
                        "e": true,
                        "i": 1,
                        "r": false
                    },
                    "Con 4": {
                        "s": 2,
                        "t": 6,
                        "w": -0.5,
                        "e": true,
                        "i": 1,
                        "r": false
                    },
                    "Con 5": {
                        "s": 2,
                        "t": 7,
                        "w": -0.5,
                        "e": true,
                        "i": 1,
                        "r": false
                    },
                },
            }
        };
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
