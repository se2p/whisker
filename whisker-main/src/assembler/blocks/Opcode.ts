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
