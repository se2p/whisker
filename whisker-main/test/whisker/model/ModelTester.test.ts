import {ModelTester, SimpleTypedModel} from "../../../src/whisker/model/ModelTester";
import {ProgramModel} from "../../../src/whisker/model/components/ProgramModel";
import {ModelNode} from "../../../src/whisker/model/components/ModelNode";
import {Condition} from "../../../src/whisker/model/components/Condition";
import {readFileSync} from "fs";
import * as path from "node:path";
import {ProgramModelEdge} from "../../../src/whisker/model/components/ProgramModelEdge";
import {UserModel} from "../../../src/whisker/model/components/UserModel";

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
        const expectedNodes: Record<string, ModelNode> = {
            "init": new ModelNode("init", undefined),
            "end": new ModelNode("end", undefined)
        };

        const expectedNodesExtended: Record<string, ModelNode> = {
            "init": new ModelNode("init", undefined),
            "start": new ModelNode("start", undefined),
            "text": new ModelNode("text", undefined),
            "end": new ModelNode("end", undefined),
        };

        test("GetAllModels returns the correct amount of models", () => {
            const modelTester = new ModelTester();

            modelTester.load(allModels);
            const models = modelTester.getAllModels();
            expect(models).toHaveLength(3);
        });

        test("GetAllModels() loads ProgramModel correctly", () => {
            const modelTester = new ModelTester();

            modelTester.load(allModels);
            const loadedModel = modelTester.getAllModels()[0];
            const expectedProgramModel = new ProgramModel("bowl", "init", expectedNodes,
                {}, ["end"], []);
            const expected: SimpleTypedModel = {
                usage: "program",
                ...expectedProgramModel.toJSON()
            };
            expect(loadedModel).toStrictEqual(expected);
        });

        test("GetAllModels() loads UserModel correctly", () => {
            const modelTester = new ModelTester();

            modelTester.load(allModels);
            const loadedModel = modelTester.getAllModels()[1];
            const expectedProgramModel = new UserModel("bowl2", "init", expectedNodesExtended,
                {}, ["end"], ["end"]);
            const expected: SimpleTypedModel = {
                usage: "user",
                ...expectedProgramModel.toJSON()
            };
            expect(loadedModel).toStrictEqual(expected);
        });

        test("GetAllModels() loads OnTestEndModel correctly", () => {
            const modelTester = new ModelTester();
            modelTester.load(allModels);
            const loadedModel = modelTester.getAllModels()[2];
            const expectedEdge = new ProgramModelEdge("init", "init", "bowl3", "init", "start", -1, -1);
            expectedEdge.addCondition(new Condition("condition1", undefined, "Function", false, ["true"]));
            const expectedProgramModel = new ProgramModel("bowl3", "init", expectedNodesExtended,
                {"e1": expectedEdge}, ["end"], ["end"]);
            const expected: SimpleTypedModel = {
                usage: "end",
                ...expectedProgramModel.toJSON()
            };
            expect(loadedModel).toStrictEqual(expected);
        });
    });

    test("Model Tester coverages", () => {
        const modelTester = new ModelTester();
        modelTester.load(allModels);
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

const baseDir = 'test/whisker/model/models/ModelTester/';
const programModel = readFileSync(path.join(baseDir, 'programModel.json'), 'utf8');
const faultyModel = readFileSync(path.join(baseDir, 'faultyModel.json'), 'utf8');
const userModel = readFileSync(path.join(baseDir, 'userModel.json'), 'utf8');
const allModels = readFileSync(path.join(baseDir, 'allModels.json'), 'utf8');
