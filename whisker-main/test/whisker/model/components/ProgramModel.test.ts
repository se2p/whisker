import {expect} from "@jest/globals";
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
        let edges = {};
        edges["1"] = new ProgramModelEdge("1", "label", "graphID", "from", "to", -1, -1);
        edges["2"] = new ProgramModelEdge("2", "label", "graphID", "from", "to", 1000, -1);
        edges["3"] = new ProgramModelEdge("3", "label", "graphID", "from", "to", -1, 200);
        edges["4"] = new ProgramModelEdge("4", "label", "graphID", "from", "to", 1, 200);

        let p = new ProgramModel("id", "start", {start: new ModelNode("start", "label")},
            edges, [], []);
        let coverage = p.getCoverageCurrentRun();
        expect(coverage.covered.length == 0);
        expect(coverage.total == 4);

        let totalCoverage = p.getTotalCoverage();
        expect(totalCoverage.covered.length == 0);
        expect(totalCoverage.total == 4);
        expect(totalCoverage.missedEdges.length == 0);

        expect(() => {
            p.simplifyForSave();
        }).not.toThrow();
    });

    test("Program model: functions", () => {
        let p = new ProgramModel("id", "start", {start: new ModelNode("start", "label")}, {}, [], []);
        expect(p.stopped() == false);
        expect(p.haltAllModels() == false);
        expect(() => {
            p.reset();
        }).not.toThrow();
        expect(() => {
            p.simplifyForSave();
        }).not.toThrow();
        p.setTransitionsStartTo(3);
        expect(p.secondLastTransitionStep == 3);
        expect(p.lastTransitionStep == 3);
    });
});
