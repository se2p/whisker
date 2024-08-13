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
