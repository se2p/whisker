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
import {TimeAfterEnd, TimeBetween, TimeElapsed} from "../../../../src/whisker/model/checks/Time";

describe('ModelError', () => {
    const reason = {message: "check failed"};

    function getEdge(): ProgramModelEdge {
        const edge = new ProgramModelEdge("id", "label", "graphID", "from", "to", -1, -1);
        edge.addCondition(new Expr("label", {args: ["true"]}));
        edge.addCondition(new Key("label", {negated: true, args: ["a"]}));
        return edge;
    }

    test("getEffectFailedOutput()", () => {
        const edge = getEdge();
        const effect = new AttrChange("label", {args: ["Apple", "x", "+"]});
        const expected = 'graphID-label: AttrChange(Apple,x,+) {"message":"check failed"}';
        expect(getEffectFailedOutput(edge, effect, reason)).toEqual(expected);
    });

    test("getEffectFailedOutput() with TimeBetween", () => {
        const edge = getEdge();
        edge.addCondition(new TimeBetween("label", {negated: true, args: [123]}));
        const effect = new AttrComp("label", {args: ["Apple", "x", ">", 0]});
        const expected = 'graphID-label: AttrComp(Apple,x,>,0) after 123ms {"message":"check failed"}';
        expect(getEffectFailedOutput(edge, effect, reason)).toEqual(expected);
    });

    test("getEffectFailedOutput() with TimeElapsed", () => {
        const edge = getEdge();
        edge.addCondition(new TimeElapsed("label", {negated: true, args: [456]}));
        const effect = new AttrChange("label", {args: ["Apple", "x", "+"]});
        const expected = 'graphID-label: AttrChange(Apple,x,+) before 456ms elapsed {"message":"check failed"}';
        expect(getEffectFailedOutput(edge, effect, reason)).toEqual(expected);
    });

    test("getEffectFailedOutput() with TimeElapsed and TimeAfterEnd", () => {
        const edge = getEdge();
        edge.addCondition(new TimeAfterEnd("label", {negated: true, args: [789]}));
        edge.addCondition(new TimeElapsed("label", {negated: true, args: [456]}));
        const effect = new AttrChange("label", {args: ["Banana", "x", "+"]});
        const expected = 'graphID-label: AttrChange(Banana,x,+) before 456ms elapsed after 789ms {"message":"check failed"}';
        expect(getEffectFailedOutput(edge, effect, reason)).toEqual(expected);
    });

    test("getTimeLimitFailedAfterOutput()", () => {
        const condition = new Expr("label", {args: ["$(Bowl.x)>0"]});
        // the expression was not evaluated so there is no logged last value
        expect(getTimeLimitFailedAfterOutput(getEdge(), condition, 50, reason)).toEqual('graphID-label: Expr($(Bowl.x)>0) after 50ms {"message":"check failed"}');
    });

    test("getTimeLimitFailedAtOutput()", () => {
        const condition = new Click("label", {args: ["Bowl"]});
        expect(getTimeLimitFailedAtOutput(getEdge(), condition, 42, reason)).toEqual('graphID-label: Click(Bowl) at 42ms {"message":"check failed"}');
    });

    test("getErrorOnEdgeOutput()", () => {
        expect(getErrorOnEdgeOutput("label", "graphID", "here is some text")).toEqual("Error graphID-label: here is some text");
    });
});
