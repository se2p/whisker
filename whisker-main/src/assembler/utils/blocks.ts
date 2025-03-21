import {deepFreeze} from "./Objects";
import {List, Multiple, Scalar, Variable} from "../blocks/categories/Data";
import {Opcode} from "../blocks/Opcode";
import {ExprKey, Input, InputKey, isExprKey, isTopLevelDataBlock} from "../blocks/Inputs";
import {Block, BlockID, isBlock, isBlockID, ScratchBlock} from "../blocks/Block";
import {FieldKey} from "../blocks/Fields";

export function listName(list: List): string {
    return list[0];
}

export function listValues(list: List): Multiple {
    return list[1];
}

export function varOrListName(varOrList: Variable | List): string {
    return varOrList[0];
}

export function variableName(variable: Variable): string {
    return variable[0];
}

export function variableValue(variable: Variable): Scalar {
    return variable[1];
}

const inputKeys = deepFreeze({
    /*
     * Control blocks
     */
    "control_create_clone_of": ["CLONE_OPTION"],
    "control_create_clone_of_menu": [],
    "control_delete_this_clone": [],
    "control_forever": ["SUBSTACK"],
    "control_if": ["CONDITION", "SUBSTACK"],
    "control_if_else": ["CONDITION", "SUBSTACK", "SUBSTACK2"],
    "control_repeat": ["TIMES", "SUBSTACK"],
    "control_repeat_until": ["CONDITION", "SUBSTACK"],
    "control_stop": [],
    "control_wait": ["DURATION"],
    "control_wait_until": ["CONDITION"],
    "control_start_as_clone": [],

    /*
     * Event blocks
     */
    "event_broadcast": ["BROADCAST_INPUT"],
    "event_whenbackdropswitchesto": [],
    "event_broadcastandwait": ["BROADCAST_INPUT"],
    "event_whenbroadcastreceived": [],
    "event_whengreaterthan": ["VALUE"],
    "event_whenflagclicked": [],
    "event_whenkeypressed": [],
    "event_whenstageclicked": [],
    "event_whenthisspriteclicked": [],

    /*
     * Looks blocks
     */
    "looks_backdropnumbername": [],
    "looks_changeeffectby": ["CHANGE"],
    "looks_backdrops": [],
    "looks_cleargraphiceffects": [],
    "looks_costumenumbername": [],
    "looks_goforwardbackwardlayers": ["NUM"],
    "looks_costume": [],
    "looks_changesizeby": ["CHANGE"],
    "looks_gotofrontback": [],
    "looks_hide": [],
    "looks_nextbackdrop": [],
    "looks_say": ["MESSAGE"],
    "looks_sayforsecs": ["MESSAGE", "SECS"],
    "looks_seteffectto": ["VALUE"],
    "looks_setsizeto": ["SIZE"],
    "looks_show": [],
    "looks_size": [],
    "looks_switchbackdropto": ["BACKDROP"],
    "looks_switchbackdroptoandwait": ["BACKDROP"],
    "looks_switchcostumeto": ["COSTUME"],
    "looks_think": ["MESSAGE"],
    "looks_thinkforsecs": ["MESSAGE", "SECS"],
    "looks_nextcostume": [],

    /*
     * Motion blocks
     */
    "motion_movesteps": ["STEPS"],
    "motion_turnright": ["DEGREES"],
    "motion_turnleft": ["DEGREES"],
    "motion_goto": ["TO"],
    "motion_goto_menu": [],
    "motion_gotoxy": ["X", "Y"],
    "motion_glideto": ["TO", "SECS"],
    "motion_glideto_menu": [],
    "motion_glidesecstoxy": ["SECS", "X", "Y"],
    "motion_pointindirection": ["DIRECTION"],
    "motion_changexby": ["DX"],
    "motion_changeyby": ["DY"],
    "motion_pointtowards": ["TOWARDS"],
    "motion_pointtowards_menu": [],
    "motion_setx": ["X"],
    "motion_sety": ["Y"],
    "motion_ifonedgebounce": [],
    "motion_setrotationstyle": [],
    "motion_xposition": [],
    "motion_yposition": [],
    "motion_direction": [],

    /*
     * Custom blocks
     */
    "procedures_call": null, // FIXME: can be entire value space of string[]
    "procedures_definition": ["custom_block"],
    "procedures_prototype": null, // FIXME: can be entire value space of string[]

    /*
     * Operator blocks
     */
    "operator_add": ["NUM1", "NUM2"],
    "operator_subtract": ["NUM1", "NUM2"],
    "operator_multiply": ["NUM1", "NUM2"],
    "operator_divide": ["NUM1", "NUM2"],
    "operator_mod": ["NUM1", "NUM2"],
    "operator_random": ["FROM", "TO"],
    "operator_gt": ["OPERAND1", "OPERAND2"],
    "operator_lt": ["OPERAND1", "OPERAND2"],
    "operator_equals": ["OPERAND1", "OPERAND2"],
    "operator_and": ["OPERAND1", "OPERAND2"],
    "operator_or": ["OPERAND1", "OPERAND2"],
    "operator_not": ["OPERAND"],
    "operator_join": ["STRING1", "STRING2"],
    "operator_letter_of": ["LETTER", "STRING"],
    "operator_contains": ["STRING1", "STRING2"],
    "operator_length": ["STRING"],
    "operator_round": ["NUM"],
    "operator_mathop": ["NUM"],

    /*
     * Sensing blocks
     */
    "sensing_touchingobject": ["TOUCHINGOBJECTMENU"],
    "sensing_touchingobjectmenu": [],
    "sensing_touchingcolor": ["COLOR"],
    "sensing_coloristouchingcolor": ["COLOR", "COLOR2"],
    "sensing_distancetomenu": [],
    "sensing_distanceto": ["DISTANCETOMENU"],
    "sensing_askandwait": ["QUESTION"],
    "sensing_answer": [],
    "sensing_keyoptions": [],
    "sensing_keypressed": ["KEY_OPTION"],
    "sensing_mousedown": [],
    "sensing_mousex": [],
    "sensing_mousey": [],
    "sensing_setdragmode": [],
    "sensing_loudness": [],
    "sensing_timer": [],
    "sensing_resettimer": [],
    "sensing_of": ["OBJECT"],
    "sensing_of_object_menu": [],
    "sensing_current": [],
    "sensing_dayssince2000": [],
    "sensing_username": [],

    /*
     * Sound blocks
     */
    "sound_playuntildone": ["SOUND_MENU"],
    "sound_sounds_menu": [],
    "sound_play": ["SOUND_MENU"],
    "sound_stopallsounds": [],
    "sound_changeeffectby": ["VALUE"],
    "sound_seteffectto": ["VALUE"],
    "sound_cleareffects": [],
    "sound_changevolumeby": ["VOLUME"],
    "sound_setvolumeto": ["VOLUME"],
    "sound_volume": [],

    /*
     * Variable blocks
     */
    "data_setvariableto": ["VALUE"],
    "data_changevariableby": ["VALUE"],
    "data_showvariable": [],
    "data_hidevariable": [],
    "data_addtolist": ["ITEM"],
    "data_deleteoflist": ["INDEX"],
    "data_deletealloflist": [],
    "data_insertatlist": ["ITEM", "INDEX"],
    "data_replaceitemoflist": ["ITEM", "INDEX"],
    "data_itemoflist": ["INDEX"],
    "data_itemnumoflist": ["ITEM"],
    "data_lengthoflist": [],
    "data_listcontainsitem": ["ITEM"],
    "data_showlist": [],
    "data_hidelist": [],

    /*
     * Monitors
     */
    "data_variable": [],
    "sensing_loundness": [],
    "data_listcontents": [],

    /*
     * Reporter blocks
     */
    "argument_reporter_boolean": [],
    "argument_reporter_string_number": [],

    /*
     * Pen blocks
     */
    "pen_clear": [],
    "pen_stamp": [],
    "pen_penDown": [],
    "pen_penUp": [],
    "pen_setPenColorToColor": ["COLOR"],
    "pen_changePenColorParamBy": ["COLOR_PARAM", "VALUE"],
    "pen_menu_colorParam": [],
    "pen_setPenColorParamTo": ["COLOR_PARAM"],
    "pen_changePenSizeBy": ["SIZE"],
    "pen_setPenSizeTo": ["SIZE"],
} as Record<Opcode, Array<InputKey> | null>);

export function getInputKeys(arg: Opcode | Block): Array<InputKey> {
    const opcode = typeof arg === "string" ? arg : arg.opcode;
    const keys = inputKeys[opcode];

    if (keys) {
        return keys;
    }

    throw new Error(`Unhandled opcode "${opcode}"`);
}

export function getExprKeys(arg: Opcode | Block): Array<ExprKey> {
    return getInputKeys(arg).filter((key) => isExprKey(key)) as Array<ExprKey>;
}

const fieldKeys = deepFreeze({
    /*
     * Oval-shaped drop-down menus:
     */
    "motion_goto_menu": ["TO"],
    "motion_glideto_menu": ["TO"],
    "motion_pointtowards_menu": ["TOWARDS"],
    "looks_costume": ["COSTUME"],
    "looks_backdrops": ["BACKDROP"],
    "sound_sounds_menu": ["SOUND_MENU"],
    "control_create_clone_of_menu": ["CLONE_OPTION"],
    "sensing_touchingobjectmenu": ["TOUCHINGOBJECTMENU"],
    "sensing_distancetomenu": ["DISTANCETOMENU"],
    "sensing_keyoptions": ["KEY_OPTION"],
    "sensing_of_object_menu": ["OBJECT"],
    "pen_menu_colorParam": ["colorParam"],

    /*
     * Rectangular-shaped drop-down menus:
     */
    "motion_setrotationstyle": ["STYLE"],
    "looks_changeeffectby": ["EFFECT"],
    "looks_seteffectto": ["EFFECT"],
    "looks_goforwardbackwardlayers": ["FORWARD_BACKWARD"],
    "looks_gotofrontback": ["FRONT_BACK"],
    "looks_costumenumbername": ["NUMBER_NAME"],
    "looks_backdropnumbername": ["NUMBER_NAME"],
    "sound_changeeffectby": ["EFFECT"],
    "sound_seteffectto": ["EFFECT"],
    "event_whenkeypressed": ["KEY_OPTION"],
    "event_whenbackdropswitchesto": ["BACKDROP"],
    "event_whengreaterthan": ["WHENGREATERTHANMENU"],
    "event_whenbroadcastreceived": ["BROADCAST_OPTION"],
    "control_stop": ["STOP_OPTION"],
    "sensing_setdragmode": ["DRAG_MODE"],
    "sensing_of": ["PROPERTY"],
    "sensing_current": ["CURRENTMENU"],
    "operator_mathop": ["OPERATOR"],

    /*
     * Variable blocks:
     */
    "data_setvariableto": ["VARIABLE"],
    "data_changevariableby": ["VARIABLE"],
    "data_showvariable": ["VARIABLE"],
    "data_hidevariable": ["VARIABLE"],

    /*
     * List blocks:
     */
    "data_addtolist": ["LIST"],
    "data_deleteoflist": ["LIST"],
    "data_insertatlist": ["LIST"],
    "data_replaceitemoflist": ["LIST"],
    "data_itemoflist": ["LIST"],
    "data_itemnumoflist": ["LIST"],
    "data_listcontainsitem": ["LIST"],

    /*
     * Custom block definitions:
     */
    "argument_reporter_string_number": ["VALUE"],
    "argument_reporter_boolean": ["VALUE"],

    /*
     * No drop-down menus:
     */
    "control_create_clone_of": [],
    "control_delete_this_clone": [],
    "control_forever": [],
    "control_if": [],
    "control_if_else": [],
    "control_repeat": [],
    "control_repeat_until": [],
    "control_wait": [],
    "control_wait_until": [],
    "control_start_as_clone": [],
    "event_broadcast": [],
    "event_broadcastandwait": [],
    "event_whenflagclicked": [],
    "event_whenstageclicked": [],
    "event_whenthisspriteclicked": [],
    "looks_cleargraphiceffects": [],
    "looks_changesizeby": [],
    "looks_hide": [],
    "looks_nextbackdrop": [],
    "looks_say": [],
    "looks_sayforsecs": [],
    "looks_setsizeto": [],
    "looks_show": [],
    "looks_size": [],
    "looks_switchbackdropto": [],
    "looks_switchbackdroptoandwait": [],
    "looks_switchcostumeto": [],
    "looks_think": [],
    "looks_thinkforsecs": [],
    "looks_nextcostume": [],
    "motion_movesteps": [],
    "motion_turnright": [],
    "motion_turnleft": [],
    "motion_goto": [],
    "motion_gotoxy": [],
    "motion_glideto": [],
    "motion_glidesecstoxy": [],
    "motion_pointindirection": [],
    "motion_changexby": [],
    "motion_changeyby": [],
    "motion_pointtowards": [],
    "motion_setx": [],
    "motion_sety": [],
    "motion_ifonedgebounce": [],
    "motion_xposition": [],
    "motion_yposition": [],
    "motion_direction": [],
    "procedures_call": [],
    "procedures_definition": [],
    "procedures_prototype": [],
    "operator_add": [],
    "operator_subtract": [],
    "operator_multiply": [],
    "operator_divide": [],
    "operator_mod": [],
    "operator_random": [],
    "operator_gt": [],
    "operator_lt": [],
    "operator_equals": [],
    "operator_and": [],
    "operator_or": [],
    "operator_not": [],
    "operator_join": [],
    "operator_letter_of": [],
    "operator_contains": [],
    "operator_length": [],
    "operator_round": [],
    "sensing_touchingobject": [],
    "sensing_touchingcolor": [],
    "sensing_coloristouchingcolor": [],
    "sensing_distanceto": [],
    "sensing_askandwait": [],
    "sensing_answer": [],
    "sensing_keypressed": [],
    "sensing_mousedown": [],
    "sensing_mousex": [],
    "sensing_mousey": [],
    "sensing_loudness": [],
    "sensing_timer": [],
    "sensing_resettimer": [],
    "sensing_dayssince2000": [],
    "sensing_username": [],
    "sound_playuntildone": [],
    "sound_play": [],
    "sound_stopallsounds": [],
    "sound_cleareffects": [],
    "sound_changevolumeby": [],
    "sound_setvolumeto": [],
    "sound_volume": [],
    "data_deletealloflist": [],
    "data_lengthoflist": [],
    "data_showlist": [],
    "data_hidelist": [],
    "data_variable": [],
    "sensing_loundness": [],
    "data_listcontents": [],
    "pen_clear": [],
    "pen_stamp": [],
    "pen_penDown": [],
    "pen_penUp": [],
    "pen_setPenColorToColor": [],
    "pen_changePenColorParamBy": [],
    "pen_setPenColorParamTo": [],
    "pen_changePenSizeBy": [],
    "pen_setPenSizeTo": [],
} as Record<Opcode, Array<FieldKey>>);

export function getFieldKeys(blockOrOpcode: ScratchBlock | Opcode): Array<FieldKey> {
    if (isTopLevelDataBlock(blockOrOpcode)) {
        return [];
    }

    const opcode = typeof blockOrOpcode === "string" ? blockOrOpcode : blockOrOpcode.opcode;
    const keys = fieldKeys[opcode];

    if (keys) {
        return keys;
    }

    throw new Error(`Unhandled opcode "${opcode}"`);
}

export function supportsInput(blockOrOpcode: ScratchBlock | Opcode, key: InputKey): boolean {
    if (typeof blockOrOpcode === "string") {
        return getInputKeys(blockOrOpcode).includes(key);
    }

    if (isTopLevelDataBlock(blockOrOpcode)) {
        return false;
    }

    return supportsInput(blockOrOpcode.opcode, key);
}

export function getBlockIDs([, inputBlock, obscuredBlock]: Input): Array<BlockID> {
    const result = Array<BlockID>();

    if (isBlockID(inputBlock)) {
        result.push(inputBlock);
    }

    if (isBlockID(obscuredBlock)) {
        result.push(obscuredBlock);
    }

    return result;
}

export function getOpcode(block: ScratchBlock): Opcode | null {
    return isBlock(block) ? block.opcode : null;
}
