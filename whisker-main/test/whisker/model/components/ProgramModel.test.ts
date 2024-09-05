import {CoverageResult, ProgramModel, SimpleProgramModel} from "../../../../src/whisker/model/components/ProgramModel";
import {ModelNode} from "../../../../src/whisker/model/components/ModelNode";
import {ProgramModelEdge} from "../../../../src/whisker/model/components/ModelEdge";

describe('Program model', () => {
    describe('Invalid constructor calls', () => {

        test("Constructor throws for undefined id", () => {
            expect(() => {
                new ProgramModel(undefined, "start", {start: new ModelNode("start", "label")}, {},
                    [], []);
            }).toThrow();
        });

        test("Constructor throws for undefined startNode", () => {
            expect(() => {
                new ProgramModel("id", undefined, {start: new ModelNode("start", "label")}, {},
                    [], []);
            }).toThrow();
        });

        test("Constructor throws when startNode ids do not match", () => {
            expect(() => {
                new ProgramModel("id", "n", {start: new ModelNode("start", "label")}, {},
                    [], []);
            }).toThrow();
        });
    });

    function getValidProgramModelForCoverage(): ProgramModel {
        const edges: Record<string, ProgramModelEdge> = {};
        edges["1"] = new ProgramModelEdge("1", "label", "graphID", "from", "to", -1, -1);
        edges["2"] = new ProgramModelEdge("2", "label", "graphID", "from", "to", 1000, -1);
        edges["3"] = new ProgramModelEdge("3", "label", "graphID", "from", "to", -1, 200);
        edges["4"] = new ProgramModelEdge("4", "label", "graphID", "from", "to", 1, 200);

        return new ProgramModel("id", "start", {start: new ModelNode("start", "label")},
            edges, [], []);
    }

    test("Coverage without run", () => {
        const p = getValidProgramModelForCoverage();
        const coverage = p.getCoverageCurrentRun();
        expect(coverage.covered.length).toBe(0);
        expect(coverage.total).toBe(4);
    });

    test("Total coverage without run", () => {
        const p = getValidProgramModelForCoverage();
        const totalCoverage = p.getTotalCoverage();
        expect(totalCoverage.covered.length).toBe(0);
        expect(totalCoverage.total).toBe(4);
        expect(totalCoverage.missedEdges.length).toBe(4);
    });

    test("SimplifyForSave", () => {
        const p = getValidProgramModelForCoverage();
        const actual = p.simplifyForSave();
        const expected: SimpleProgramModel = {
            id: p.id,
            startNodeId: "start",
            stopNodeIds: [],
            stopAllNodeIds: [],
            nodes: [
                {
                    id: "start",
                    label: "label"
                }
            ],
            edges: [
                {
                    id: "1",
                    label: "label",
                    from: "from",
                    to: "to",
                    forceTestAt: -1,
                    forceTestAfter: -1,
                    conditions: [],
                    effects: []
                },
                {
                    id: "2",
                    label: "label",
                    from: "from",
                    to: "to",
                    forceTestAt: -1,
                    forceTestAfter: 1000,
                    conditions: [],
                    effects: []
                },
                {
                    id: "3",
                    label: "label",
                    from: "from",
                    to: "to",
                    forceTestAt: 200,
                    forceTestAfter: -1,
                    conditions: [],
                    effects: []
                },
                {
                    id: "4",
                    label: "label",
                    from: "from",
                    to: "to",
                    forceTestAfter: 1,
                    forceTestAt: 200,
                    conditions: [],
                    effects: []
                },
            ]
        };
        expect(actual).toStrictEqual(expected);
    });

    test("ProgramModel is initially not stopped", () => {
        const p = new ProgramModel("id", "start", {start: new ModelNode("start", "label")}, {}, [], []);
        expect(p.stopped()).toBe(false);
    });

    test("ProgramModel initially not all models should be halted", () => {
        const p = new ProgramModel("id", "start", {start: new ModelNode("start", "label")}, {}, [], []);
        expect(p.haltAllModels()).toBe(false);
    });

    test("SetTransitionStart changes two values", () => {
        const p = new ProgramModel("id", "start", {start: new ModelNode("start", "label")}, {}, [], []);
        p.setTransitionsStartTo(3);
        expect(p.secondLastTransitionStep).toBe(3);
        expect(p.lastTransitionStep).toBe(3);
    });

    test("Reset() resets transition steps", () => {
        const model = getValidProgramModelForCoverage();
        model.setTransitionsStartTo(3);
        model.reset();
        expect(model.lastTransitionStep).toBe(0);
        expect(model.secondLastTransitionStep).toBe(0);
    });

    test("Reset() resets start node", () => {
        const nodes: Record<string, ModelNode> = {
            start: new ModelNode("start", "label"),
            n1: new ModelNode("n1", "n1"),
            n2: new ModelNode("n1", "n2")
        };
        const model = new ProgramModel("model", "start", nodes, {}, [], []);
        model.currentState = nodes["n2"];
        model.reset();
        expect(model.currentState).toBe(nodes["start"]);
    });

    class MockedModelNode extends ModelNode {
        private readonly fn: jest.Mock;

        constructor(id: string, label: string, fn: jest.Mock) {
            super(id, label);
            this.fn = fn;
        }

        override reset() {
            this.fn();
            super.reset();
        }
    }

    test("Reset() calls node.reset() for every node", () => {
        const fn = jest.fn();
        const nodes: Record<string, ModelNode> = {
            start: new MockedModelNode("start", "label", fn),
            n1: new MockedModelNode("n1", "n1", fn),
            n2: new MockedModelNode("n1", "n2", fn)
        };
        const model = new ProgramModel("model", "start", nodes, {}, [], []);
        model.reset();
        expect(fn).toBeCalledTimes(3);
    });

    class MockedProgram extends ProgramModel {
        setCoverageForKey(key: string) {
            this.coverageCurrentRun[key] = true;
        }
    }

    test("Reset() calls node.reset() for every node", () => {
        const nodes: Record<string, ModelNode> = {
            start: new ModelNode("start", "label"),
            n1: new ModelNode("n1", "n1"),
            n2: new ModelNode("n2", "n2")
        };
        const edges: Record<string, ProgramModelEdge> = {
            "edgeID": new ProgramModelEdge("edgeId", "edgeID", "model", "n1", "n2", -1, -1)
        };
        const model = new MockedProgram("model", "start", nodes, edges, [], []);
        model.setCoverageForKey("edgeID");
        let expected: CoverageResult = {total: 1, covered: ["edgeID"]};
        expect(model.getCoverageCurrentRun()).toStrictEqual(expected);
        model.reset();
        expected = {total: 1, covered: []};
        expect(model.getCoverageCurrentRun()).toStrictEqual(expected);
    });
});
