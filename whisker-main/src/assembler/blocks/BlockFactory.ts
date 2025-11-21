import {Block} from "./Block";
import {
    controlCreateCloneOf,
    controlDeleteThisClone,
    controlForever,
    controlIf,
    controlIfElse,
    controlRepeat,
    controlRepeatUntil,
    controlStartAsClone,
    controlStop,
    controlWait,
    controlWaitUntil
} from "./categories/Control";
import {
    dataAddToList,
    dataChangeVariableBy,
    dataDeleteAllOfList,
    dataDeleteOfList,
    dataHideList,
    dataHideVariable,
    dataInsertAtList,
    dataItemNumOfList,
    dataItemOfList,
    dataLengthOfList,
    dataListContainsItem,
    dataReplaceItemOfList,
    dataSetVariableTo,
    dataShowList,
    dataShowVariable
} from "./categories/Data";
import {
    eventBroadcast,
    eventBroadcastAndWait,
    eventWhenBackdropSwitchesTo,
    eventWhenBroadcastReceived,
    eventWhenFlagClicked,
    eventWhenGreaterThan,
    eventWhenKeyPressed,
    eventWhenStageClicked,
    eventWhenThisSpriteClicked
} from "./categories/Events";
import {
    looksBackdropNumberName,
    looksChangeEffectBy,
    looksChangeSizeBy,
    looksClearGraphicEffects,
    looksCostumeNumberName,
    looksGoForwardBackwardLayers,
    looksGotoFrontBack,
    looksHide,
    looksNextBackdrop,
    looksNextCostume,
    looksSay,
    looksSayForSecs,
    looksSetEffectTo,
    looksSetSizeTo,
    looksShow,
    looksSize,
    looksSwitchBackdropAndWait,
    looksSwitchBackdropTo,
    looksSwitchCostumeTo,
    looksThink,
    looksThinkForSecs
} from "./categories/Looks";
import {
    motionChangeXBy,
    motionChangeYBy,
    motionDirection,
    motionGlideSecsToXY,
    motionGlideTo,
    motionGoto,
    motionGotoXY,
    motionIfOnEdgeBounce,
    motionMoveSteps,
    motionPointInDirection,
    motionPointTowards,
    motionSetRotationStyle,
    motionSetX,
    motionSetY,
    motionTurnLeft,
    motionTurnRight,
    motionXPosition,
    motionYPosition
} from "./categories/Motion";
import {
    operatorAdd,
    operatorAnd,
    operatorContains,
    operatorDivide,
    operatorEquals,
    operatorGt,
    operatorJoin,
    operatorLength,
    operatorLetterOf,
    operatorLt,
    operatorMathOp,
    operatorMod,
    operatorMultiply,
    operatorNot,
    operatorOr,
    operatorRandom,
    operatorRound,
    operatorSubtract
} from "./categories/Operators";
import {
    changePenColorParamBy,
    changePenSizeBy,
    penClear,
    penDown,
    penStamp,
    penUp,
    setPenColorParamTo,
    setPenColorToColor,
    setPenSizeTo
} from "./categories/Pen";
import {
    sensingAnswer,
    sensingAskAndWait,
    sensingColorIsTouchingColor,
    sensingCurrent,
    sensingDaysSince2000,
    sensingDistanceTo,
    sensingDragMode,
    sensingKeyPressed,
    sensingLoudness,
    sensingMouseDown,
    sensingMouseX,
    sensingMouseY,
    sensingOf,
    sensingResetTimer,
    sensingTimer,
    sensingTouchingColor,
    sensingTouchingObject,
    sensingUsername
} from "./categories/Sensing";
import {
    soundChangeEffectBy,
    soundChangeVolumeBy,
    soundClearEffects,
    soundPlay,
    soundPlayUntilDone,
    soundSetEffectTo,
    soundSetVolumeTo,
    soundStopAllSounds,
    soundVolume
} from "./categories/Sound";
import {isShadowBlockOpcode, Opcode} from "./Opcode";
import {Blocks} from "../project/Target";
import {BlockMeta, emptyBlockMeta} from "../utils/meta";
import {NonExhaustiveCaseDistinction} from "../../whisker/core/exceptions/NonExhaustiveCaseDistinction";
import {isTopLevelDataBlock} from "./Inputs";
import {canonicalizeInputs} from "../utils/helpers";

export function blockMeta(blocks: Blocks): BlockMeta {
    const [blockID] = Object.entries(blocks).find(([_blockID, block]) => (block as Block).topLevel);
    const meta = emptyBlockMeta(blockID, blockID);
    meta.blocks = blocks;
    return meta;
}

export function block(opcode: Opcode): BlockMeta | null {
    if (isShadowBlockOpcode(opcode)) {
        // Shadow blocks cannot be synthesized without their parents.
        return null;
    }

    if (opcode === "data_listcontents" || opcode === "data_variable") {
        // Cannot synthesize a monitor.
        return null;
    }

    if (opcode === "procedures_call" || opcode === "procedures_definition") {
        // Don't know how to synthesize custom blocks.
        return null;
    }

    if (opcode === "argument_reporter_boolean" || opcode === "argument_reporter_string_number") {
        // Don't know how to handle arguments of custom blocks.
        return null;
    }

    const meta = (() => {
        switch (opcode) {
            case "control_create_clone_of":
                return controlCreateCloneOf();
            case "control_delete_this_clone":
                return controlDeleteThisClone();
            case "control_forever":
                return controlForever();
            case "control_if":
                return controlIf();
            case "control_if_else":
                return controlIfElse();
            case "control_repeat":
                return controlRepeat();
            case "control_repeat_until":
                return controlRepeatUntil();
            case "control_start_as_clone":
                return controlStartAsClone();
            case "control_stop":
                return controlStop();
            case "control_wait":
                return controlWait();
            case "control_wait_until":
                return controlWaitUntil();
            case "data_addtolist":
                return dataAddToList();
            case "data_changevariableby":
                return dataChangeVariableBy();
            case "data_deletealloflist":
                return dataDeleteAllOfList();
            case "data_deleteoflist":
                return dataDeleteOfList();
            case "data_hidelist":
                return dataHideList();
            case "data_hidevariable":
                return dataHideVariable();
            case "data_insertatlist":
                return dataInsertAtList();
            case "data_itemnumoflist":
                return dataItemNumOfList();
            case "data_itemoflist":
                return dataItemOfList();
            case "data_lengthoflist":
                return dataLengthOfList();
            case "data_listcontainsitem":
                return dataListContainsItem();
            case "data_replaceitemoflist":
                return dataReplaceItemOfList();
            case "data_setvariableto":
                return dataSetVariableTo();
            case "data_showlist":
                return dataShowList();
            case "data_showvariable":
                return dataShowVariable();
            case "event_broadcast":
                return eventBroadcast();
            case "event_broadcastandwait":
                return eventBroadcastAndWait();
            case "event_whenbackdropswitchesto":
                return eventWhenBackdropSwitchesTo();
            case "event_whenbroadcastreceived":
                return eventWhenBroadcastReceived();
            case "event_whenflagclicked":
                return eventWhenFlagClicked();
            case "event_whengreaterthan":
                return eventWhenGreaterThan();
            case "event_whenkeypressed":
                return eventWhenKeyPressed();
            case "event_whenstageclicked":
                return eventWhenStageClicked();
            case "event_whenthisspriteclicked":
                return eventWhenThisSpriteClicked();
            case "looks_backdropnumbername":
                return looksBackdropNumberName();
            case "looks_changeeffectby":
                return looksChangeEffectBy();
            case "looks_changesizeby":
                return looksChangeSizeBy();
            case "looks_cleargraphiceffects":
                return looksClearGraphicEffects();
            case "looks_costumenumbername":
                return looksCostumeNumberName();
            case "looks_goforwardbackwardlayers":
                return looksGoForwardBackwardLayers();
            case "looks_gotofrontback":
                return looksGotoFrontBack();
            case "looks_hide":
                return looksHide();
            case "looks_nextbackdrop":
                return looksNextBackdrop();
            case "looks_nextcostume":
                return looksNextCostume();
            case "looks_say":
                return looksSay();
            case "looks_sayforsecs":
                return looksSayForSecs();
            case "looks_seteffectto":
                return looksSetEffectTo();
            case "looks_setsizeto":
                return looksSetSizeTo();
            case "looks_show":
                return looksShow();
            case "looks_size":
                return looksSize();
            case "looks_switchbackdropto":
                return looksSwitchBackdropTo();
            case "looks_switchbackdroptoandwait":
                return looksSwitchBackdropAndWait();
            case "looks_switchcostumeto":
                return looksSwitchCostumeTo();
            case "looks_think":
                return looksThink();
            case "looks_thinkforsecs":
                return looksThinkForSecs();
            case "motion_changexby":
                return motionChangeXBy();
            case "motion_changeyby":
                return motionChangeYBy();
            case "motion_direction":
                return motionDirection();
            case "motion_glidesecstoxy":
                return motionGlideSecsToXY();
            case "motion_glideto":
                return motionGlideTo();
            case "motion_goto":
                return motionGoto();
            case "motion_gotoxy":
                return motionGotoXY();
            case "motion_ifonedgebounce":
                return motionIfOnEdgeBounce();
            case "motion_movesteps":
                return motionMoveSteps();
            case "motion_pointindirection":
                return motionPointInDirection();
            case "motion_pointtowards":
                return motionPointTowards();
            case "motion_setrotationstyle":
                return motionSetRotationStyle();
            case "motion_setx":
                return motionSetX();
            case "motion_sety":
                return motionSetY();
            case "motion_turnleft":
                return motionTurnLeft();
            case "motion_turnright":
                return motionTurnRight();
            case "motion_xposition":
                return motionXPosition();
            case "motion_yposition":
                return motionYPosition();
            case "operator_add":
                return operatorAdd();
            case "operator_and":
                return operatorAnd();
            case "operator_contains":
                return operatorContains();
            case "operator_divide":
                return operatorDivide();
            case "operator_equals":
                return operatorEquals();
            case "operator_gt":
                return operatorGt();
            case "operator_join":
                return operatorJoin();
            case "operator_length":
                return operatorLength();
            case "operator_letter_of":
                return operatorLetterOf();
            case "operator_lt":
                return operatorLt();
            case "operator_mathop":
                return operatorMathOp();
            case "operator_mod":
                return operatorMod();
            case "operator_multiply":
                return operatorMultiply();
            case "operator_not":
                return operatorNot();
            case "operator_or":
                return operatorOr();
            case "operator_random":
                return operatorRandom();
            case "operator_round":
                return operatorRound();
            case "operator_subtract":
                return operatorSubtract();
            case "pen_changePenColorParamBy":
                return changePenColorParamBy();
            case "pen_changePenSizeBy":
                return changePenSizeBy();
            case "pen_clear":
                return penClear();
            case "pen_penDown":
                return penDown();
            case "pen_penUp":
                return penUp();
            case "pen_setPenColorParamTo":
                return setPenColorParamTo();
            case "pen_setPenColorToColor":
                return setPenColorToColor();
            case "pen_setPenSizeTo":
                return setPenSizeTo();
            case "pen_stamp":
                return penStamp();
            case "sensing_answer":
                return sensingAnswer();
            case "sensing_askandwait":
                return sensingAskAndWait();
            case "sensing_coloristouchingcolor":
                return sensingColorIsTouchingColor();
            case "sensing_current":
                return sensingCurrent();
            case "sensing_dayssince2000":
                return sensingDaysSince2000();
            case "sensing_distanceto":
                return sensingDistanceTo();
            case "sensing_keypressed":
                return sensingKeyPressed();
            case "sensing_loudness":
                return sensingLoudness();
            case "sensing_mousedown":
                return sensingMouseDown();
            case "sensing_mousex":
                return sensingMouseX();
            case "sensing_mousey":
                return sensingMouseY();
            case "sensing_of":
                return sensingOf();
            case "sensing_resettimer":
                return sensingResetTimer();
            case "sensing_setdragmode":
                return sensingDragMode();
            case "sensing_timer":
                return sensingTimer();
            case "sensing_touchingcolor":
                return sensingTouchingColor();
            case "sensing_touchingobject":
                return sensingTouchingObject();
            case "sensing_username":
                return sensingUsername();
            case "sound_changeeffectby":
                return soundChangeEffectBy();
            case "sound_changevolumeby":
                return soundChangeVolumeBy();
            case "sound_cleareffects":
                return soundClearEffects();
            case "sound_play":
                return soundPlay();
            case "sound_playuntildone":
                return soundPlayUntilDone();
            case "sound_seteffectto":
                return soundSetEffectTo();
            case "sound_setvolumeto":
                return soundSetVolumeTo();
            case "sound_stopallsounds":
                return soundStopAllSounds();
            case "sound_volume":
                return soundVolume();
            default:
                throw new NonExhaustiveCaseDistinction(opcode);
        }
    })();

    const block = meta.blocks[meta.rootID];

    if (isTopLevelDataBlock(block)) {
        return meta;
    }

    meta.blocks[meta.rootID] = canonicalizeInputs(block);

    return meta;
}
