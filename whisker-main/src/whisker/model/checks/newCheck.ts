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
import {z, ZodDiscriminatedUnion, ZodObject, ZodUnion} from "zod";
import {TimeAfterEnd, TimeAfterEndJSON, TimeBetween, TimeBetweenJSON, TimeElapsed, TimeElapsedJSON} from "./Time";
import {ClearedEffect, ClearedEffectJSON} from "./ClearedEffect";
import {PointsTo, PointsToJSON} from "./PointsTo";
import {AnyKey, AnyKeyJSON} from "./AnyKey";
import {ParsingResult} from "./CheckTypes";
import {ChangeStorageBy, ChangeStorageByJSON} from "./ChangeStorageBy";
import {SetStorage, SetStorageJSON} from "./SetStorage";
import {MoveSteps, MoveStepsJSON} from "./MoveSteps";
import {Bounce, BounceJSON} from "./Bounce";
import {StopModels, StopModelsJSON} from "./StopModels";
import {RestartModels, RestartModelsJSON} from "./RestartModels";
import {CloneCreated, CloneCreatedJSON} from "./CloneCreated";
import {CloneRemoved, CloneRemovedJSON} from "./CloneRemoved";
import {SpriteColorTouchColor, SpriteColorTouchColorJSON} from "./SpriteColorTouchColor";

export type ConditionJSON =
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
    | MoveStepsJSON
    | BounceJSON
    | CloneCreatedJSON
    | CloneRemovedJSON
    | SpriteColorTouchColorJSON
    ;

export const ConditionJSON = z.discriminatedUnion("name", [
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
    ChangeStorageByJSON,
    SetStorageJSON,
    MoveStepsJSON,
    BounceJSON,
    CloneCreatedJSON,
    CloneRemovedJSON,
    SpriteColorTouchColorJSON
]);

export type CheckJSON =
    | ConditionJSON
    | ChangeStorageByJSON
    | SetStorageJSON
    | StopModelsJSON
    | RestartModelsJSON
    ;

export const CheckJSON = z.union([
    ConditionJSON,
    ChangeStorageByJSON,
    SetStorageJSON,
    StopModelsJSON,
    RestartModelsJSON,
]);

function extractCheckNamesFromZodSchema(z: ZodUnion<any> | ZodDiscriminatedUnion<"name", any> | ZodObject<any>): string[] {
    if (z instanceof ZodObject) {
        return [z.shape.name.value];
    }

    return z.options.flatMap((o) => extractCheckNamesFromZodSchema(o));
}

export const CHECK_NAMES = Object.freeze(extractCheckNamesFromZodSchema(CheckJSON));

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
    | MoveSteps
    | Bounce
    | CloneCreated
    | CloneRemoved
    | SpriteColorTouchColor
    | ChangeStorageBy
    | SetStorage
    | StopModels
    | RestartModels
    ;

// Every pure check can automatically be used as edge condition.
export type Condition = Extract<Check, { isPure: true }>;
export type PureCheck = Condition;

export function newCondition(edgeLabel: string, conditionJSON: ConditionJSON): Condition {
    const name = conditionJSON.name;

    switch (name) {
        case "AttrChange":
            return new AttrChange(edgeLabel, conditionJSON);
        case "AttrComp":
            return new AttrComp(edgeLabel, conditionJSON);
        case "BackgroundChange":
            return new BackgroundChange(edgeLabel, conditionJSON);
        case "Click":
            return new Click(edgeLabel, conditionJSON);
        case "Key":
            return new Key(edgeLabel, conditionJSON);
        case "AnyKey":
            return new AnyKey(edgeLabel, conditionJSON);
        case "Output":
            return new Output(edgeLabel, conditionJSON);
        case "SpriteColor":
            return new SpriteColor(edgeLabel, conditionJSON);
        case "SpriteTouching":
            return new SpriteTouching(edgeLabel, conditionJSON);
        case "VarChange":
            return new VarChange(edgeLabel, conditionJSON);
        case "VarComp":
            return new VarComp(edgeLabel, conditionJSON);
        case "Expr":
            return new Expr(edgeLabel, conditionJSON);
        case "Probability":
            return new Probability(edgeLabel, conditionJSON);
        case "TimeElapsed":
            return new TimeElapsed(edgeLabel, conditionJSON);
        case "TimeBetween":
            return new TimeBetween(edgeLabel, conditionJSON);
        case "TimeAfterEnd":
            return new TimeAfterEnd(edgeLabel, conditionJSON);
        case "NbrOfClones":
            return new NbrOfClones(edgeLabel, conditionJSON);
        case "NbrOfVisibleClones":
            return new NbrOfVisibleClones(edgeLabel, conditionJSON);
        case "TouchingEdge":
            return new TouchingEdge(edgeLabel, conditionJSON);
        case "TouchingVerticalEdge":
            return new TouchingVerticalEdge(edgeLabel, conditionJSON);
        case "TouchingHorizEdge":
            return new TouchingHorizEdge(edgeLabel, conditionJSON);
        case "Layer":
            return new Layer(edgeLabel, conditionJSON);
        case "ClearedEffects":
            return new ClearedEffect(edgeLabel, conditionJSON);
        case "PointsTo":
            return new PointsTo(edgeLabel, conditionJSON);
        case "MoveSteps":
            return new MoveSteps(edgeLabel, conditionJSON);
        case "Bounce":
            return new Bounce(edgeLabel, conditionJSON);
        case "CloneCreated":
            return new CloneCreated(edgeLabel, conditionJSON);
        case "CloneRemoved":
            return new CloneRemoved(edgeLabel, conditionJSON);
        case "SpriteColorTouchColor":
            return new SpriteColorTouchColor(edgeLabel, conditionJSON);
        default:
            throw new NonExhaustiveCaseDistinction(name);
    }
}

export function newCheck(edgeLabel: string, checkJSON: CheckJSON): Check {
    const name = checkJSON.name;

    switch (name) {
        case "ChangeStorageBy":
            return new ChangeStorageBy(edgeLabel, checkJSON);
        case "SetStorage":
            return new SetStorage(edgeLabel, checkJSON);
        case "StopModels":
            return new StopModels(edgeLabel, checkJSON);
        case "RestartModels":
            return new RestartModels(edgeLabel, checkJSON);
        default:
            return newCondition(edgeLabel, checkJSON);
    }
}

export function convertArgs(checkJSON: CheckJSON): ParsingResult {
    const name = checkJSON.name;

    switch (name) {
        case "AttrChange":
            return AttrChange.convertArgs(checkJSON.args);
        case "AttrComp":
            return AttrComp.convertArgs(checkJSON.args);
        case "BackgroundChange":
            return BackgroundChange.convertArgs(checkJSON.args);
        case "Click":
            return Click.convertArgs(checkJSON.args);
        case "Key":
            return Key.convertArgs(checkJSON.args);
        case "AnyKey":
            return AnyKey.convertArgs(checkJSON.args);
        case "Output":
            return Output.convertArgs(checkJSON.args);
        case "SpriteColor":
            return SpriteColor.convertArgs(checkJSON.args);
        case "SpriteTouching":
            return SpriteTouching.convertArgs(checkJSON.args);
        case "VarChange":
            return VarChange.convertArgs(checkJSON.args);
        case "VarComp":
            return VarComp.convertArgs(checkJSON.args);
        case "Expr":
            return Expr.convertArgs(checkJSON.args);
        case "Probability":
            return Probability.convertArgs(checkJSON.args);
        case "TimeElapsed":
            return TimeElapsed.convertArgs(checkJSON.args);
        case "TimeBetween":
            return TimeBetween.convertArgs(checkJSON.args);
        case "TimeAfterEnd":
            return TimeAfterEnd.convertArgs(checkJSON.args);
        case "NbrOfClones":
            return NbrOfClones.convertArgs(checkJSON.args);
        case "NbrOfVisibleClones":
            return NbrOfVisibleClones.convertArgs(checkJSON.args);
        case "TouchingEdge":
            return TouchingEdge.convertArgs(checkJSON.args);
        case "TouchingVerticalEdge":
            return TouchingVerticalEdge.convertArgs(checkJSON.args);
        case "TouchingHorizEdge":
            return TouchingHorizEdge.convertArgs(checkJSON.args);
        case "Layer":
            return Layer.convertArgs(checkJSON.args);
        case "ClearedEffects":
            return ClearedEffect.convertArgs(checkJSON.args);
        case "PointsTo":
            return PointsTo.convertArgs(checkJSON.args);
        case "ChangeStorageBy":
            return ChangeStorageBy.convertArgs(checkJSON.args);
        case "SetStorage":
            return SetStorage.convertArgs(checkJSON.args);
        case "MoveSteps":
            return MoveSteps.convertArgs(checkJSON.args);
        case "Bounce":
            return Bounce.convertArgs(checkJSON.args);
        case "StopModels":
            return StopModels.convertArgs(checkJSON.args);
        case "RestartModels":
            return RestartModels.convertArgs(checkJSON.args);
        case "CloneCreated":
            return CloneCreated.convertArgs(checkJSON.args);
        case "CloneRemoved":
            return CloneRemoved.convertArgs(checkJSON.args);
        case "SpriteColorTouchColor":
            return SpriteColorTouchColor.convertArgs(checkJSON.args);
        default:
            throw new NonExhaustiveCaseDistinction(name);
    }
}
