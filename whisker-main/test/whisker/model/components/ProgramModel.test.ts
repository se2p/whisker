import {ProgramModel} from "../../../../src/whisker/model/components/ProgramModel";
import {ModelNode} from "../../../../src/whisker/model/components/ModelNode";
import {ProgramModelEdge} from "../../../../src/whisker/model/components/ModelEdge";

describe('Program model', () => {
    test("constructor", () => {
        expect(() => {
            new ProgramModel("id", "start", {start: new ModelNode("start", "label")}, {},
                [], []);
        }).not.toThrow();
        expect(() => {
            new ProgramModel(undefined, "start", {start: new ModelNode("start", "label")}, {},
                [], []);
        }).toThrow();
        expect(() => {
            new ProgramModel("id", undefined, {start: new ModelNode("start", "label")}, {},
                [], []);
        }).toThrow();
        expect(() => {
            new ProgramModel("id", "n", {start: new ModelNode("start", "label")}, {},
                [], []);
        }).toThrow();
    });

    test("Program model: coverage without run", () => {
        const edges = {};
        edges["1"] = new ProgramModelEdge("1", "label", "graphID", "from", "to", -1, -1);
        edges["2"] = new ProgramModelEdge("2", "label", "graphID", "from", "to", 1000, -1);
        edges["3"] = new ProgramModelEdge("3", "label", "graphID", "from", "to", -1, 200);
        edges["4"] = new ProgramModelEdge("4", "label", "graphID", "from", "to", 1, 200);

        const p = new ProgramModel("id", "start", {start: new ModelNode("start", "label")},
            edges, [], []);
        const coverage = p.getCoverageCurrentRun();
        expect(coverage.covered.length).toBe(0);
        expect(coverage.total).toBe(4);

        const totalCoverage = p.getTotalCoverage();
        expect(totalCoverage.covered.length).toBe(0);
        expect(totalCoverage.total).toBe(4);
        expect(totalCoverage.missedEdges.length).toBe(4);

        expect(() => {
            p.simplifyForSave();
        }).not.toThrow();
    });

    test("Program model: functions", () => {
        const p = new ProgramModel("id", "start", {start: new ModelNode("start", "label")}, {}, [], []);
        expect(p.stopped()).toBe(false);
        expect(p.haltAllModels()).toBe(false);
        expect(() => {
            p.reset();
        }).not.toThrow();
        expect(() => {
            p.simplifyForSave();
        }).not.toThrow();
        p.setTransitionsStartTo(3);
        expect(p.secondLastTransitionStep).toBe(3);
        expect(p.lastTransitionStep).toBe(3);
    });
});
