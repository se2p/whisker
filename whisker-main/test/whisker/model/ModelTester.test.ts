import {ModelTester, SimpleTypedModel} from "../../../src/whisker/model/ModelTester";
import {ProgramModel} from "../../../src/whisker/model/components/ProgramModel";
import {ModelNode} from "../../../src/whisker/model/components/ModelNode";
import {ProgramModelEdge} from "../../../src/whisker/model/components/ModelEdge";
import {Condition} from "../../../src/whisker/model/components/Condition";
import {CheckName} from "../../../src/whisker/model/components/Check";

describe('ModelTester', () => {
    test("Initially no models are loaded", () => {
        const modelTester = new ModelTester();
        expect(modelTester.programModelsLoaded()).toBe(false);
        expect(modelTester.userModelsLoaded()).toBe(false);
        expect(modelTester.someModelLoaded()).toBe(false);
    });

    test("Load only program model", () => {
        const modelTester = new ModelTester();
        modelTester.load(programModel);
        expect(modelTester.programModelsLoaded()).toBe(true);
        expect(modelTester.userModelsLoaded()).toBe(false);
        expect(modelTester.someModelLoaded()).toBe(true);
    });

    test("Load only user model", () => {
        const modelTester = new ModelTester();
        modelTester.load(userModel);
        expect(modelTester.programModelsLoaded()).toBe(false);
        expect(modelTester.userModelsLoaded()).toBe(true);
        expect(modelTester.someModelLoaded()).toBe(true);
    });

    test("UserModel not running immediately after loading", () => {
        const modelTester = new ModelTester();
        modelTester.load(userModel);
        expect(modelTester.running()).toBe(false);
    });

    test("Loading faulty model clears previous models", () => {
        const modelTester = new ModelTester();
        modelTester.load(programModel);
        expect(() => {
            modelTester.load(faultyModel);
        }).toThrow();
        expect(modelTester.programModelsLoaded()).toBe(false);
        expect(modelTester.userModelsLoaded()).toBe(false);
        expect(modelTester.someModelLoaded()).toBe(false);
    });

    test("Successfully loading model clears previous models", () => {
        const modelTester = new ModelTester();
        modelTester.load(programModel);
        modelTester.load(userModel);
        expect(modelTester.programModelsLoaded()).toBe(false);
        expect(modelTester.userModelsLoaded()).toBe(true);
        expect(modelTester.someModelLoaded()).toBe(true);
    });

    describe('GetAllModels()', () => {
        const expectedNodes : Record<string, ModelNode> = {
            "init": new ModelNode("init", undefined),
            "end": new ModelNode("end", undefined)
        };

        const expectedNodesExtended : Record<string, ModelNode> = {
            "init": new ModelNode("init", undefined),
            "start": new ModelNode("start", undefined),
            "text": new ModelNode("text", undefined),
            "end": new ModelNode("end", undefined),
        };

        test("GetAllModels returns the correct amount of models", () => {
            const modelTester = new ModelTester();

            modelTester.load(modelAll);
            const models = modelTester.getAllModels();
            expect(models).toHaveLength(3);
        });

        test("GetAllModels() loads ProgramModel correctly", () => {
            const modelTester = new ModelTester();

            modelTester.load(modelAll);
            const loadedModel = modelTester.getAllModels()[0];
            const expectedProgramModel = new ProgramModel("bowl", "init", expectedNodes,
                {}, ["end"], []);
            const expected: SimpleTypedModel = {
                usage: "program",
                ...expectedProgramModel.simplifyForSave()
            };
            expect(loadedModel).toStrictEqual(expected);
        });

        test("GetAllModels() loads UserModel correctly", () => {
            const modelTester = new ModelTester();

            modelTester.load(modelAll);
            const loadedModel = modelTester.getAllModels()[1];
            const expectedProgramModel = new ProgramModel("bowl2", "init", expectedNodesExtended,
                {}, ["end"], ["end"]);
            const expected: SimpleTypedModel = {
                usage: "user",
                ...expectedProgramModel.simplifyForSave()
            };
            expect(loadedModel).toStrictEqual(expected);
        });

        test("GetAllModels() loads OnTestEndModel correctly", () => {
            const modelTester = new ModelTester();
            modelTester.load(modelAll);
            const loadedModel = modelTester.getAllModels()[2];
            const expectedEdge = new ProgramModelEdge("init", "init", "bowl3", "init", "start", -1, -1);
            expectedEdge.addCondition(new Condition("condition1", undefined, CheckName.Function, false, ["true"]));
            const expectedProgramModel = new ProgramModel("bowl3", "init", expectedNodesExtended,
                {"e1": expectedEdge}, ["end"], ["end"]);
            const expected: SimpleTypedModel = {
                usage: "end",
                ...expectedProgramModel.simplifyForSave()
            };
            expect(loadedModel).toStrictEqual(expected);
        });
    });

    test("Model Tester coverages", () => {
        const modelTester = new ModelTester();
        modelTester.load(modelAll);
        const result = modelTester.getTotalCoverage();
        expect(Object.keys(result)).toHaveLength(2);
        expect(result["bowl"]).toStrictEqual({
            covered: [],
            total: 0,
        });
        expect(result["bowl3"]).toStrictEqual({
            covered: [],
            total: 1,
        });
    });
});

const programModel = `[{
    "usage": "program",
    "id": "bowl",
    "startNodeId": "init",
    "stopNodeIds": ["end"],
    "stopAllNodeIds": ["end"],
    "nodeIds": ["init", "start", "text", "end"],
    "edges": []
}]`;

const faultyModel = `[{
    "usage": "a",
    "id": "bowl",
    "startNodeId": "init",
    "stopNodeIds": ["end"],
    "stopAllNodeIds": ["end"],
    "nodeIds": ["init", "start", "text", "end"],
    "edges": []
}]`;

const userModel = `[{
    "usage": "user",
    "id": "bowl",
    "startNodeId": "init",
    "stopNodeIds": ["end"],
    "stopAllNodeIds": ["end"],
    "nodeIds": ["init", "start", "text", "end"],
    "edges": []
}]`;

const modelAll = `[{
    "usage": "program",
    "id": "bowl",
    "startNodeId": "init",
    "stopNodeIds": ["end"],
    "stopAllNodeIds": [],
    "nodeIds": ["init", "end"],
    "edges": []
}, {
    "usage": "user",
    "id": "bowl2",
    "startNodeId": "init",
    "stopNodeIds": ["end"],
    "stopAllNodeIds": ["end"],
    "nodeIds": ["init", "start", "text", "end"],
    "edges": []
}, {
    "usage": "end",
    "id": "bowl3",
    "startNodeId": "init",
    "stopNodeIds": ["end"],
    "stopAllNodeIds": ["end"],
    "nodeIds": ["init", "start", "text", "end"],
    "edges": [{
        "id": "init",
        "from": "init",
        "to": "start",
        "forceTestAfter": -1,
        "forceTestAt": -1,
        "conditions": [{"id": "condition1", "name": "Function", "args": ["true"], "negated": false}],
        "effects": []
    }]
}]`;
