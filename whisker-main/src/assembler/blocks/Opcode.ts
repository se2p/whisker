export type Opcode = string;

export const blockWithFieldOpcodes = [
    "motion_setrotationstyle",
    "looks_changeeffectby",
    "looks_seteffectto",
    "looks_goforwardbackwardlayers",
    "looks_gotofrontback",
    "looks_costumenumbername",
    "looks_backdropnumbername",
    "sound_changeeffectby",
    "sound_seteffectto",
    "event_whenkeypressed",
    "event_whenbackdropswitchesto",
    "event_whengreaterthan",
    "event_whenbroadcastreceived",
    "control_stop",
    "sensing_setdragmode",
    "sensing_of",
    "sensing_of_object_menu",
    "sensing_current",
    "operator_mathop",
] as const;

// https://en.scratch-wiki.info/wiki/Dropdown_Menu#Do_Not_Accept_Block_Inputs
export type BlockWithFieldOpcode = typeof blockWithFieldOpcodes[number];

// https://en.scratch-wiki.info/wiki/Dropdown_Menu#Accept_Block_Inputs
export const blockWithShadowInputOpcodes = [
    "motion_goto",
    "motion_glideto",
    "motion_pointtowards",
    "looks_switchcostumeto",
    "looks_switchbackdropto",
    "looks_switchbackdroptoandwait",
    "sound_playuntildone",
    "sound_play",
    "control_create_clone_of",
    "sensing_touchingobject",
    "sensing_distanceto",
    "sensing_keypressed",
    "sensing_of",
    "pen_changePenColorParamBy",
    "pen_setPenColorParamTo",
] as const;

export type BlockWithShadowInputOpcode = typeof blockWithShadowInputOpcodes[number];
