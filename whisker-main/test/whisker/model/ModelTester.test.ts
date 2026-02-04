import {ModelTester} from "../../../src/whisker/model/ModelTester";
import {ModelNode} from "../../../src/whisker/model/components/ModelNode";
import {readFileSync} from "fs";
import * as path from "node:path";
import {ProgramModelEdge} from "../../../src/whisker/model/components/ProgramModelEdge";
import {UserModel} from "../../../src/whisker/model/components/UserModel";
import {EndModel, ProgramModel,} from "../../../src/whisker/model/components/ProgramModel";
import {EndModelJSON, ProgramModelJSON, UserModelJSON} from "../../../src/whisker/model/util/schema";

describe('ModelTester', () => {
    test("Initially no models are loaded", () => {
        const modelTester = ModelTester.getInstance();
        expect(modelTester.programModelsLoaded()).toBe(false);
        expect(modelTester.userModelsLoaded()).toBe(false);
        expect(modelTester.someModelLoaded()).toBe(false);
    });

    test("Load only program model", () => {
        const modelTester = ModelTester.getInstance();
        modelTester.load(programModel);
        expect(modelTester.programModelsLoaded()).toBe(true);
        expect(modelTester.userModelsLoaded()).toBe(false);
        expect(modelTester.someModelLoaded()).toBe(true);
    });

    test("Load only user model", () => {
        const modelTester = ModelTester.getInstance();
        modelTester.load(userModel);
        expect(modelTester.programModelsLoaded()).toBe(false);
        expect(modelTester.userModelsLoaded()).toBe(true);
        expect(modelTester.someModelLoaded()).toBe(true);
    });

    test("UserModel not running immediately after loading", () => {
        const modelTester = ModelTester.getInstance();
        modelTester.load(userModel);
        expect(modelTester.running()).toBe(false);
    });

    test("Loading faulty model clears previous models", () => {
        const modelTester = ModelTester.getInstance();
        modelTester.load(programModel);
        expect(() => {
            modelTester.load(faultyModel);
        }).toThrow();
        expect(modelTester.programModelsLoaded()).toBe(false);
        expect(modelTester.userModelsLoaded()).toBe(false);
        expect(modelTester.someModelLoaded()).toBe(false);
    });

    test("Successfully loading model clears previous models", () => {
        const modelTester = ModelTester.getInstance();
        modelTester.load(programModel);
        modelTester.load(userModel);
        expect(modelTester.programModelsLoaded()).toBe(false);
        expect(modelTester.userModelsLoaded()).toBe(true);
        expect(modelTester.someModelLoaded()).toBe(true);
    });

    describe('GetAllModels()', () => {
        const expectedNodes: Record<string, ModelNode<any>> = {
            "init": new ModelNode("init", undefined),
            "end": new ModelNode("end", undefined)
        };

        const expectedNodesExtended: Record<string, ModelNode<any>> = {
            "init": new ModelNode("init", undefined),
            "start": new ModelNode("start", undefined),
            "text": new ModelNode("text", undefined),
            "end": new ModelNode("end", undefined),
        };

        test("GetAllModels returns the correct amount of models", () => {
            const modelTester = ModelTester.getInstance();

            modelTester.load(allModels);
            const models = modelTester.getAllModels();
            expect(models).toHaveLength(3);
        });

        test("GetAllModels() loads ProgramModel correctly", () => {
            const modelTester = ModelTester.getInstance();

            modelTester.load(allModels);
            const loadedModel = modelTester.getAllModels()[0];
            const expectedProgramModel = new ProgramModel("bowl", "init", expectedNodes,
                {}, [], {});
            const expected: ProgramModelJSON = {
                usage: "program",
                ...expectedProgramModel.toJSON()
            };
            expect(loadedModel).toStrictEqual(expected);
        });

        test("GetAllModels() loads UserModel correctly", () => {
            const modelTester = ModelTester.getInstance();

            modelTester.load(allModels);
            const loadedModel = modelTester.getAllModels()[1];
            const expectedProgramModel = new UserModel("bowl2", "init", expectedNodesExtended,
                {}, ["end"], {});
            const expected: UserModelJSON = {
                usage: "user",
                ...expectedProgramModel.toJSON()
            };
            expect(loadedModel).toStrictEqual(expected);
        });

        test("GetAllModels() loads OnTestEndModel correctly", () => {
            const modelTester = ModelTester.getInstance();
            modelTester.load(allModels);
            const loadedModel = modelTester.getAllModels()[2];
            const expectedEdge = new ProgramModelEdge("init", "init", "bowl3", "init", "start", -1, -1);
            const expectedProgramModel = new EndModel("bowl3", "init", expectedNodesExtended,
                {"e1": expectedEdge}, ["end"], {});
            const expected: EndModelJSON = {
                usage: "end",
                ...expectedProgramModel.toJSON()
            };
            expect(loadedModel).toStrictEqual(expected);
        });
    });

    test("Model Tester coverages", () => {
        const modelTester = ModelTester.getInstance();
        modelTester.load(allModels);
        const result = modelTester.getTotalCoverage(false);
        expect(Object.keys(result)).toHaveLength(2);
        expect(result["bowl"]).toStrictEqual({
            covered: 0,
            total: 0,
        });
        expect(result["bowl3"]).toStrictEqual({
            covered: 0,
            total: 1,
        });
    });
});

const baseDir = 'test/whisker/model/models/ModelTester/';
const programModel = readFileSync(path.join(baseDir, 'programModel.json'), 'utf8');
const faultyModel = readFileSync(path.join(baseDir, 'faultyModel.json'), 'utf8');
const userModel = readFileSync(path.join(baseDir, 'userModel.json'), 'utf8');
const allModels = readFileSync(path.join(baseDir, 'allModels.json'), 'utf8');
