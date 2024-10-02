import {ModelEdge, ProgramModelEdge} from "../../../../src/whisker/model/components/ModelEdge";
import {Condition} from "../../../../src/whisker/model/components/Condition";
import {CheckName} from "../../../../src/whisker/model/components/Check";
import {
    getEffectFailedOutput, getErrorOnEdgeOutput,
    getTimeLimitFailedAfterOutput,
    getTimeLimitFailedAtOutput
} from "../../../../src/whisker/model/util/ModelError";
import {Effect} from "../../../../src/whisker/model/components/Effect";

describe('ModelError', () => {
    function getEdge(): ProgramModelEdge {
        const edge = new ProgramModelEdge("id", "label", "graphID", "from", "to", -1, -1);
        edge.addCondition(new Condition("c1", "label", CheckName.Function, false, ["true"]));
        edge.addCondition(new Condition("c2", "label", CheckName.Key, true, ["a"]));
        return edge;
    }

    test("getEffectFailedOutput()", () => {
        const edge = getEdge();
        const effect = new Effect("e1", "label", CheckName.AttrChange, false, ["Apple", "x", "+"]);
        expect(getEffectFailedOutput(edge, effect)).toEqual("graphID-label: AttrChange(Apple,x,+)");
    });

    test("getEffectFailedOutput() with TimeBetween", () => {
        const edge = getEdge();
        edge.addCondition(new Condition("c4", "label", CheckName.TimeBetween, true, ["123"]));
        const effect = new Effect("e1", "label", CheckName.AttrComp, false, ["Apple", "x", ">", "0"]);
        expect(getEffectFailedOutput(edge, effect)).toEqual("graphID-label: AttrComp(Apple,x,>,0) after 123ms");

    });

    test("getEffectFailedOutput() with TimeElapsed", () => {
        const edge = getEdge();
        edge.addCondition(new Condition("c3", "label", CheckName.TimeElapsed, true, ["456"]));
        const effect = new Effect("e1", "label", CheckName.AttrChange, false, ["Apple", "x", "+"]);
        expect(getEffectFailedOutput(edge, effect)).toEqual("graphID-label: AttrChange(Apple,x,+) before 456ms elapsed");
    });

    test("getEffectFailedOutput() with TimeElapsed and TimeAfterEnd", () => {
        const edge = getEdge();
        edge.addCondition(new Condition("c5", "label", CheckName.TimeAfterEnd, true, ["789"]));
        edge.addCondition(new Condition("c4", "label", CheckName.TimeElapsed, true, ["456"]));
        const effect = new Effect("e1", "label", CheckName.AttrChange, false, ["Banana", "x", "+"]);
        expect(getEffectFailedOutput(edge, effect)).toEqual("graphID-label: AttrChange(Banana,x,+) before 456ms elapsed after 789ms");
    });

    test("getTimeLimitFailedAfterOutput()", () => {
        const condition = new Condition("c6", "label", CheckName.Expr, false, ["$(Bowl.x)>0"]);
        expect(getTimeLimitFailedAfterOutput(getEdge(), condition, 50)).toEqual("graphID-label: Expr($(Bowl.x)>0) after 50ms");
    });

    test("getTimeLimitFailedAtOutput()", () => {
        const condition = new Condition("c6", "label", CheckName.Click, false, ["Bowl"]);
        expect(getTimeLimitFailedAtOutput(getEdge(), condition, 42)).toEqual("graphID-label: Click(Bowl) at 42ms");
    });

    test("getErrorOnEdgeOutput()", () => {
        expect(getErrorOnEdgeOutput("label", "graphID", "here is some text")).toEqual("Error graphID-label: here is some text");
    });
});
