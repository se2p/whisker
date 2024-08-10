import {ModelTester} from "../../../src/whisker/model/ModelTester";

describe('ModelTester', () => {
    test("Model Tester Load models", () => {
        let modelTester = new ModelTester();
        expect(modelTester.programModelsLoaded()).toBe(false);
        expect(modelTester.someModelLoaded()).toBe(false);
        expect(() => {
            modelTester.load(model1);
        }).not.toThrow();
        expect(modelTester.programModelsLoaded()).toBe(true);
        expect(modelTester.userModelsLoaded()).toBe(false);
        expect(modelTester.someModelLoaded()).toBe(true);
        modelTester = new ModelTester();
        /*
        if the previous line is not added then the test will fail, since a model is still loaded from the previous test
        case within this method. If the loaded models should be removed in an error case, then the catch clause of the
        `modelTester.load(...)` method must be changed to set to current loaded models to [].
        Otherwise, the method is correct and this test is buggy and should be split into separate tests or fixed.
        I suggest this is again a buggy test which did not catch her attention, because the assertions did not
        actually assert anything due to the missing matcher after the call to `expect(...)`.
        This test case be either split into multiple tests or the modelTester instance be replaced by a fresh
        instance to clear the already loaded models. Many tests in the "../../../src/whisker/model" directory are
        rather big, so not splitting the test would match the current style of the other tests.
        */
        expect(() => {
            modelTester.load(faultyModel);
        }).toThrow();
        expect(modelTester.programModelsLoaded()).toBe(false);
        expect(modelTester.someModelLoaded()).toBe(false);
        expect(() => {
            modelTester.load(userModel);
        }).not.toThrow();
        expect(modelTester.programModelsLoaded()).toBe(false);
        expect(modelTester.userModelsLoaded()).toBe(true);
        expect(modelTester.someModelLoaded()).toBe(true);
        expect(modelTester.running()).toBe(false);
    });

    test("ModelTester get all models", () => {
        const modelTester = new ModelTester();

        modelTester.load(modelAll);
        expect(() => {
            modelTester.getAllModels();
        }).not.toThrow();
    });

    test("Model Tester coverages", () => {
        const modelTester = new ModelTester();
        modelTester.load(modelAll);
        expect(() => {
            modelTester.getTotalCoverage();
        }).not.toThrow();
    });
});

const model1 = '[{"usage": "program","id": "bowl","startNodeId": "init", "stopNodeIds": ["end"],"stopAllNodeIds":' +
    ' ["end"],"nodeIds": ["init","start","text","end"],"edges": []}]';

const faultyModel ='[{"usage": "a","id": "bowl","startNodeId": "init", "stopNodeIds": ["end"],"stopAllNodeIds":' +
    ' ["end"],"nodeIds": ["init","start","text","end"],"edges": []}]';

const userModel = '[{"usage": "user","id": "bowl","startNodeId": "init", "stopNodeIds": ["end"],"stopAllNodeIds":' +
    ' ["end"],"nodeIds": ["init","start","text","end"],"edges": []}]';

const modelAll ='[{"usage": "program","id": "bowl","startNodeId": "init", "stopNodeIds": ["end"],"stopAllNodeIds":' +
    ' [],"nodeIds": ["init","end"],"edges": []},' +
    '{"usage": "user","id": "bowl2","startNodeId": "init", "stopNodeIds": ["end"],"stopAllNodeIds":' +
    ' ["end"],"nodeIds": ["init","start","text","end"],"edges": []},' +
    '{"usage": "end","id": "bowl3","startNodeId": "init", "stopNodeIds": ["end"],"stopAllNodeIds":' +
    ' ["end"],"nodeIds": ["init","start","text","end"],"edges": [{"id": "init","from": "init",' +
    '"to": "start",  "forceTestAfter": -1,"forceTestAt": -1,"conditions": [{"id": "condition1",' +
    '"name": "Function","args": ["true"],"negated": false}], "effects": []}]}]';
