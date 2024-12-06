import {
    getEffectFailedOutput,
    getErrorOnEdgeOutput,
    getTimeLimitFailedAfterOutput,
    getTimeLimitFailedAtOutput
} from "../../../../src/whisker/model/util/ModelError";
import {ProgramModelEdge} from "../../../../src/whisker/model/components/ProgramModelEdge";
import {Key} from "../../../../src/whisker/model/checks/Key";
import {AttrComp} from "../../../../src/whisker/model/checks/AttrComp";
import {AttrChange} from "../../../../src/whisker/model/checks/AttrChange";
import {Click} from "../../../../src/whisker/model/checks/Click";
import {Expr} from "../../../../src/whisker/model/checks/Expr";
import {TimeElapsed} from "../../../../src/whisker/model/checks/TimeElapsed";
import {TimeAfterEnd} from "../../../../src/whisker/model/checks/TimeAfterEnd";
import {TimeBetween} from "../../../../src/whisker/model/checks/TimeBetween";

describe('ModelError', () => {
    function getEdge(): ProgramModelEdge {
        const edge = new ProgramModelEdge("id", "label", "graphID", "from", "to", -1, -1);
        edge.addCondition(new Expr("label", {negated: false, args: ["true"]}));
        edge.addCondition(new Key("label", {negated: true, args: ["a"]}));
        return edge;
    }

    test("getEffectFailedOutput()", () => {
        const edge = getEdge();
        const effect = new AttrChange("label", {negated: false, args: ["Apple", "x", "+"]});
        expect(getEffectFailedOutput(edge, effect)).toEqual("graphID-label: AttrChange(Apple,x,+)");
    });

    test("getEffectFailedOutput() with TimeBetween", () => {
        const edge = getEdge();
        edge.addCondition(new TimeBetween("label", {negated: true, args: [123]}));
        const effect = new AttrComp("label", {negated: false, args: ["Apple", "x", ">", "0"]});
        expect(getEffectFailedOutput(edge, effect)).toEqual("graphID-label: AttrComp(Apple,x,>,0) after 123ms");

    });

    test("getEffectFailedOutput() with TimeElapsed", () => {
        const edge = getEdge();
        edge.addCondition(new TimeElapsed("label", {negated: true, args: [456]}));
        const effect = new AttrChange("label", {negated: false, args: ["Apple", "x", "+"]});
        expect(getEffectFailedOutput(edge, effect)).toEqual("graphID-label: AttrChange(Apple,x,+) before 456ms elapsed");
    });

    test("getEffectFailedOutput() with TimeElapsed and TimeAfterEnd", () => {
        const edge = getEdge();
        edge.addCondition(new TimeAfterEnd("label", {negated: true, args: [789]}));
        edge.addCondition(new TimeElapsed("label", {negated: true, args: [456]}));
        const effect = new AttrChange("label", {negated: false, args: ["Banana", "x", "+"]});
        expect(getEffectFailedOutput(edge, effect)).toEqual("graphID-label: AttrChange(Banana,x,+) before 456ms elapsed after 789ms");
    });

    test("getTimeLimitFailedAfterOutput()", () => {
        const condition = new Expr("label", {negated: false, args: ["$(Bowl.x)>0"]});
        expect(getTimeLimitFailedAfterOutput(getEdge(), condition, 50)).toEqual("graphID-label: Expr($(Bowl.x)>0) after 50ms");
    });

    test("getTimeLimitFailedAtOutput()", () => {
        const condition = new Click("label", {negated: false, args: ["Bowl"]});
        expect(getTimeLimitFailedAtOutput(getEdge(), condition, 42)).toEqual("graphID-label: Click(Bowl) at 42ms");
    });

    test("getErrorOnEdgeOutput()", () => {
        expect(getErrorOnEdgeOutput("label", "graphID", "here is some text")).toEqual("Error graphID-label: here is some text");
    });
});
