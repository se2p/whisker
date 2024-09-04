import {ProgramModel, SimpleProgramModel} from "../../../../src/whisker/model/components/ProgramModel";
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
});
