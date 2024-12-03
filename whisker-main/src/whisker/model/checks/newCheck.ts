import {AbstractCheck} from "./AbstractCheck";
import {AttrChange, AttrChangeJSON} from "./AttrChange";
import {AttrComp, AttrCompJSON} from "./AttrComp";
import {Click, ClickJSON} from "./Click";
import {Key, KeyJSON} from "./Key";
import {Output, OutputJSON} from "./Output";
import {SpriteColor, SpriteColorJSON} from "./SpriteColor";
import {SpriteTouching, SpriteTouchingJSON} from "./SpriteTouching";
import {VarChange, VarChangeJSON} from "./VarChange";
import {VarComp, VarCompJSON} from "./VarComp";
import {Expr, ExprJSON} from "./Expr";
import {Probability, ProbabilityJSON} from "./Probability";
import {TimeElapsed, TimeElapsedJSON} from "./TimeElapsed";
import {TimeBetween, TimeBetweenJSON} from "./TimeBetween";
import {TimeAfterEnd, TimeAfterEndJSON} from "./TimeAfterEnd";
import {NbrOfClones, NbrOfClonesJSON, NbrOfVisibleClones, NbrOfVisibleClonesJSON} from "./NbrOfClones";
import {
    TouchingEdge,
    TouchingEdgeJSON,
    TouchingHorizEdge,
    TouchingHorizEdgeJSON,
    TouchingVerticalEdge,
    TouchingVerticalEdgeJSON
} from "./TouchingEdge";
import {BackgroundChange, BackgroundChangeJSON} from "./BackgroundChange";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";
import {z} from "zod";

export type CheckJSON =
    | AttrChangeJSON
    | AttrCompJSON
    | BackgroundChangeJSON
    | ClickJSON
    | KeyJSON
    | OutputJSON
    | SpriteColorJSON
    | SpriteTouchingJSON
    | VarChangeJSON
    | VarCompJSON
    | ExprJSON
    | ProbabilityJSON
    | TimeElapsedJSON
    | TimeBetweenJSON
    | TimeAfterEndJSON
    | NbrOfClonesJSON
    | NbrOfVisibleClonesJSON
    | TouchingEdgeJSON
    | TouchingVerticalEdgeJSON
    | TouchingHorizEdgeJSON
    ;

export const CheckJSON = z.discriminatedUnion("name", [
    AttrChangeJSON,
    AttrCompJSON,
    BackgroundChangeJSON,
    ClickJSON,
    KeyJSON,
    OutputJSON,
    SpriteColorJSON,
    SpriteTouchingJSON,
    VarChangeJSON,
    VarCompJSON,
    ExprJSON,
    ProbabilityJSON,
    TimeElapsedJSON,
    TimeBetweenJSON,
    TimeAfterEndJSON,
    NbrOfClonesJSON,
    NbrOfVisibleClonesJSON,
    TouchingEdgeJSON,
    TouchingVerticalEdgeJSON,
    TouchingHorizEdgeJSON,
]);

export type CheckName = CheckJSON['name'];

export const CHECK_NAMES: readonly CheckName[] = Object.freeze([
    "AttrChange",
    "AttrComp",
    "BackgroundChange",
    "Click",
    "Key",
    "Output",
    "SpriteColor",
    "SpriteTouching",
    "VarChange",
    "VarComp",
    "Expr",
    "Probability",
    "TimeElapsed",
    "TimeBetween",
    "TimeAfterEnd",
    "NbrOfClones",
    "NbrOfVisibleClones",
    "TouchingEdge",
    "TouchingVerticalEdge",
    "TouchingHorizEdge",
]);

export function newCheck(edgeLabel: string, {name, id, negated, args}: CheckJSON): AbstractCheck {
    switch (name) {
        case "AttrChange":
            return new AttrChange(id, edgeLabel, negated, args);
        case "AttrComp":
            return new AttrComp(id, edgeLabel, negated, args);
        case "BackgroundChange":
            return new BackgroundChange(id, edgeLabel, negated, args);
        case "Click":
            return new Click(id, edgeLabel, negated, args);
        case "Key":
            return new Key(id, edgeLabel, negated, args);
        case "Output":
            return new Output(id, edgeLabel, negated, args);
        case "SpriteColor":
            return new SpriteColor(id, edgeLabel, negated, args);
        case "SpriteTouching":
            return new SpriteTouching(id, edgeLabel, negated, args);
        case "VarChange":
            return new VarChange(id, edgeLabel, negated, args);
        case "VarComp":
            return new VarComp(id, edgeLabel, negated, args);
        case "Expr":
            return new Expr(id, edgeLabel, negated, args);
        case "Probability":
            return new Probability(id, edgeLabel, negated, args);
        case "TimeElapsed":
            return new TimeElapsed(id, edgeLabel, negated, args);
        case "TimeBetween":
            return new TimeBetween(id, edgeLabel, negated, args);
        case "TimeAfterEnd":
            return new TimeAfterEnd(id, edgeLabel, negated, args);
        case "NbrOfClones":
            return new NbrOfClones(id, edgeLabel, negated, args);
        case "NbrOfVisibleClones":
            return new NbrOfVisibleClones(id, edgeLabel, negated, args);
        case "TouchingEdge":
            return new TouchingEdge(id, edgeLabel, negated, args);
        case "TouchingVerticalEdge":
            return new TouchingVerticalEdge(id, edgeLabel, negated, args);
        case "TouchingHorizEdge":
            return new TouchingHorizEdge(id, edgeLabel, negated, args);
        default:
            throw new NonExhaustiveCaseDistinction(name);
    }
}
