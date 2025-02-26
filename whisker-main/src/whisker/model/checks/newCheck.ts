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
import {Layer, LayerJSON} from "./Layer";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";
import {z} from "zod";
import {TimeAfterEnd, TimeAfterEndJSON, TimeBetween, TimeBetweenJSON, TimeElapsed, TimeElapsedJSON} from "./Time";
import {ClearedEffect, ClearedEffectJSON} from "./ClearedEffect";
import {PointsTo, PointsToJSON} from "./PointsTo";
import {AnyKey, AnyKeyJSON} from "./AnyKey";

export type CheckJSON =
    | AttrChangeJSON
    | AttrCompJSON
    | BackgroundChangeJSON
    | ClickJSON
    | KeyJSON
    | AnyKeyJSON
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
    | LayerJSON
    | ClearedEffectJSON
    | PointsToJSON
    ;

export const CheckJSON = z.discriminatedUnion("name", [
    AttrChangeJSON,
    AttrCompJSON,
    BackgroundChangeJSON,
    ClickJSON,
    KeyJSON,
    AnyKeyJSON,
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
    LayerJSON,
    ClearedEffectJSON,
    PointsToJSON,
]);

export type Check =
    | AttrChange
    | AttrComp
    | BackgroundChange
    | Click
    | Key
    | AnyKey
    | Output
    | SpriteColor
    | SpriteTouching
    | VarChange
    | VarComp
    | Expr
    | Probability
    | TimeElapsed
    | TimeBetween
    | TimeAfterEnd
    | NbrOfClones
    | NbrOfVisibleClones
    | TouchingEdge
    | TouchingVerticalEdge
    | TouchingHorizEdge
    | Layer
    | ClearedEffect
    | PointsTo
    ;

export type CheckName = CheckJSON['name'];

export const CHECK_NAMES: readonly CheckName[] = Object.freeze([
    "AttrChange",
    "AttrComp",
    "BackgroundChange",
    "Click",
    "AnyKey",
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
    "PointsTo",
    "Layer",
    "ClearedEffects",
]);

export function newCheck(edgeLabel: string, checkJSON: CheckJSON): Check {
    const name = checkJSON.name;

    switch (name) {
        case "AttrChange":
            return new AttrChange(edgeLabel, checkJSON);
        case "AttrComp":
            return new AttrComp(edgeLabel, checkJSON);
        case "BackgroundChange":
            return new BackgroundChange(edgeLabel, checkJSON);
        case "Click":
            return new Click(edgeLabel, checkJSON);
        case "Key":
            return new Key(edgeLabel, checkJSON);
        case "AnyKey":
            return new AnyKey(edgeLabel, checkJSON);
        case "Output":
            return new Output(edgeLabel, checkJSON);
        case "SpriteColor":
            return new SpriteColor(edgeLabel, checkJSON);
        case "SpriteTouching":
            return new SpriteTouching(edgeLabel, checkJSON);
        case "VarChange":
            return new VarChange(edgeLabel, checkJSON);
        case "VarComp":
            return new VarComp(edgeLabel, checkJSON);
        case "Expr":
            return new Expr(edgeLabel, checkJSON);
        case "Probability":
            return new Probability(edgeLabel, checkJSON);
        case "TimeElapsed":
            return new TimeElapsed(edgeLabel, checkJSON);
        case "TimeBetween":
            return new TimeBetween(edgeLabel, checkJSON);
        case "TimeAfterEnd":
            return new TimeAfterEnd(edgeLabel, checkJSON);
        case "NbrOfClones":
            return new NbrOfClones(edgeLabel, checkJSON);
        case "NbrOfVisibleClones":
            return new NbrOfVisibleClones(edgeLabel, checkJSON);
        case "TouchingEdge":
            return new TouchingEdge(edgeLabel, checkJSON);
        case "TouchingVerticalEdge":
            return new TouchingVerticalEdge(edgeLabel, checkJSON);
        case "TouchingHorizEdge":
            return new TouchingHorizEdge(edgeLabel, checkJSON);
        case "Layer":
            return new Layer(edgeLabel, checkJSON);
        case "ClearedEffects":
            return new ClearedEffect(edgeLabel, checkJSON);
        case "PointsTo":
            return new PointsTo(edgeLabel, checkJSON);
        default:
            throw new NonExhaustiveCaseDistinction(name);
    }
}
