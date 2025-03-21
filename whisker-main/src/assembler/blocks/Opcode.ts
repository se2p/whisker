export type Opcode =
    // by category
    | MonitorBlockOpcode
    | CustomBlockOpcode
    | ControlBlockOpcode
    | EventBlockOpcode
    | LooksBlockOpcode
    | SoundBlockOpcode
    | SensingBlockOpcode
    | MotionBlockOpcode
    | OperatorBlockOpcode
    | DataBlockOpcode
    | PenBlockOpcode

    // by shape
    | ReporterBlockOpcode
    | HatBlockOpcode
    | CBlockOpcode
    | CapBlockOpcode
    | StackBlockOpcode

    // other
    | DropDownMenuOpcode
    ;

export const monitorBlockOpcodes = Object.freeze([
    "data_variable",
    "motion_xposition",
    "motion_yposition",
    "motion_direction",
    "looks_costumenumbername",
    "looks_backdropnumbername",
    "looks_size",
    "sensing_answer",
    "sensing_loudness",
    "sensing_timer",
    "sensing_current",
    "sensing_username",
    "data_listcontents",
] as const);

export type MonitorBlockOpcode = typeof monitorBlockOpcodes[number];

export const customBlockOpcodes = Object.freeze([
    "procedures_definition",
    "procedures_call",
    "procedures_prototype",
] as const);

export type CustomBlockOpcode = typeof customBlockOpcodes[number];

export const controlBlockOpcodes = Object.freeze([
    "control_wait",
    "control_repeat",
    "control_forever",
    "control_if",
    "control_if_else",
    "control_wait_until",
    "control_repeat_until",
    "control_stop",
    "control_create_clone_of",
    "control_create_clone_of_menu",
    "control_delete_this_clone",
    "control_start_as_clone",
] as const);

export type ControlBlockOpcode = typeof controlBlockOpcodes[number];

export const eventBlockOpcodes = Object.freeze([
    "event_whenflagclicked",
    "event_whenkeypressed",
    "event_whenthisspriteclicked",
    "event_whenstageclicked",
    "event_whengreaterthan",
    "event_whenbackdropswitchesto",
    "event_whenbroadcastreceived",
    "event_broadcast",
    "event_broadcastandwait",
] as const);

export type EventBlockOpcode = typeof eventBlockOpcodes[number];

export const looksBlockOpcodes = Object.freeze([
    "looks_size",
    "looks_sayforsecs",
    "looks_thinkforsecs",
    "looks_say",
    "looks_think",
    "looks_switchcostumeto",
    "looks_costume",
    "looks_nextcostume",
    "looks_switchbackdropto",
    "looks_switchbackdroptoandwait",
    "looks_backdrops",
    "looks_nextbackdrop",
    "looks_changesizeby",
    "looks_setsizeto",
    "looks_changeeffectby",
    "looks_seteffectto",
    "looks_cleargraphiceffects",
    "looks_show",
    "looks_hide",
    "looks_gotofrontback",
    "looks_goforwardbackwardlayers",
    "looks_costumenumbername",
    "looks_backdropnumbername",
] as const);

export type LooksBlockOpcode = typeof looksBlockOpcodes[number];

export const soundBlockOpcodes = Object.freeze([
    "sound_playuntildone",
    "sound_sounds_menu",
    "sound_play",
    "sound_stopallsounds",
    "sound_changeeffectby",
    "sound_seteffectto",
    "sound_cleareffects",
    "sound_changevolumeby",
    "sound_setvolumeto",
    "sound_volume",
] as const);

export type SoundBlockOpcode = typeof soundBlockOpcodes[number];

export const sensingBlockOpcodes = Object.freeze([
    "sensing_touchingobject",
    "sensing_touchingobjectmenu",
    "sensing_touchingcolor",
    "sensing_coloristouchingcolor",
    "sensing_distancetomenu",
    "sensing_distanceto",
    "sensing_askandwait",
    "sensing_answer",
    "sensing_keyoptions",
    "sensing_keypressed",
    "sensing_mousedown",
    "sensing_mousex",
    "sensing_mousey",
    "sensing_setdragmode",
    "sensing_loudness",
    "sensing_timer",
    "sensing_resettimer",
    "sensing_of",
    "sensing_of_object_menu",
    "sensing_current",
    "sensing_dayssince2000",
    "sensing_username",
] as const);

export type SensingBlockOpcode = typeof sensingBlockOpcodes[number];

export const motionBlockOpcodes = Object.freeze([
    "motion_movesteps",
    "motion_turnright",
    "motion_turnleft",
    "motion_goto",
    "motion_goto_menu",
    "motion_gotoxy",
    "motion_glideto",
    "motion_glideto_menu",
    "motion_glidesecstoxy",
    "motion_pointindirection",
    "motion_changexby",
    "motion_changeyby",
    "motion_pointtowards",
    "motion_pointtowards_menu",
    "motion_setx",
    "motion_sety",
    "motion_ifonedgebounce",
    "motion_setrotationstyle",
    "motion_xposition",
    "motion_yposition",
    "motion_direction",
] as const);

export type MotionBlockOpcode = typeof motionBlockOpcodes[number];

export const operatorBlockOpcodes = Object.freeze([
    "operator_add",
    "operator_subtract",
    "operator_multiply",
    "operator_divide",
    "operator_mod",
    "operator_random",
    "operator_gt",
    "operator_lt",
    "operator_equals",
    "operator_and",
    "operator_or",
    "operator_not",
    "operator_join",
    "operator_letter_of",
    "operator_contains",
    "operator_length",
    "operator_round",
    "operator_mathop",
] as const);

export type OperatorBlockOpcode = typeof operatorBlockOpcodes[number];

export const dataBlockOpcodes = Object.freeze([
    "data_setvariableto",
    "data_changevariableby",
    "data_showvariable",
    "data_hidevariable",
    "data_addtolist",
    "data_deleteoflist",
    "data_deletealloflist",
    "data_insertatlist",
    "data_replaceitemoflist",
    "data_itemoflist",
    "data_itemnumoflist",
    "data_lengthoflist",
    "data_listcontainsitem",
    "data_showlist",
    "data_hidelist",
] as const);

export type DataBlockOpcode = typeof dataBlockOpcodes[number];

export const hatBlockOpcodes = Object.freeze([
    "event_whenflagclicked",
    "event_whenkeypressed",
    "event_whenthisspriteclicked",
    "event_whenstageclicked",
    "event_whenbackdropswitchesto",
    "event_whengreaterthan",
    "event_whenbroadcastreceived",
    "control_start_as_clone",
    "procedures_definition",
] as const);

export type HatBlockOpcode = typeof hatBlockOpcodes[number];

export function isHatBlockOpcode(opcode: Opcode): opcode is HatBlockOpcode {
    return hatBlockOpcodes.includes(opcode as HatBlockOpcode);
}

export const numberReporterBlockOpcodes = Object.freeze([
    "motion_xposition",
    "motion_yposition",
    "motion_direction",
    "looks_costumenumbername",
    "looks_backdropnumbername",
    "looks_size",
    "sound_volume",
    "sensing_mousex",
    "sensing_mousey",
    "sensing_loudness",
    "sensing_timer",
    "sensing_of",
    "sensing_current",
    "sensing_dayssince2000",
    "sensing_distanceto",
    "operator_add",
    "operator_subtract",
    "operator_multiply",
    "operator_divide",
    "operator_random",
    "operator_length",
    "operator_mod",
    "operator_round",
    "operator_mathop",
    "data_itemnumoflist",
    "data_lengthoflist",
] as const);

export type NumberReporterBlockOpcode = typeof numberReporterBlockOpcodes[number];

export const stringReporterBlockOpcodes = Object.freeze([
    "sensing_answer",
    "sensing_username",
    "operator_join",
    "operator_letter_of",
] as const);

export type StringReporterBlockOpcode = typeof stringReporterBlockOpcodes[number];

export const booleanReporterBlockOpcodes = Object.freeze([
    "sensing_touchingobject",
    "sensing_touchingcolor",
    "sensing_coloristouchingcolor",
    "sensing_keypressed",
    "sensing_mousedown",
    "operator_gt",
    "operator_lt",
    "operator_equals",
    "operator_and",
    "operator_not",
    "operator_or",
    "operator_contains",
    "data_listcontainsitem",
    "argument_reporter_boolean",
] as const);

export type BooleanReporterBlockOpcode = typeof booleanReporterBlockOpcodes[number];

export const numberStringReporterBlockOpcodes = Object.freeze([
    "argument_reporter_string_number",
    ...numberReporterBlockOpcodes,
    ...stringReporterBlockOpcodes,
] as const);

export type NumberStringReporterBlockOpcode = typeof numberStringReporterBlockOpcodes[number];

export const reporterBlockOpcodes = Object.freeze([
    ...numberStringReporterBlockOpcodes,
    ...booleanReporterBlockOpcodes
] as const);

export type ReporterBlockOpcode = typeof reporterBlockOpcodes[number];

export const cBlockOpcodes = Object.freeze([
    "control_forever",
    "control_if",
    "control_if_else",
    "control_repeat",
    "control_repeat_until",
] as const);

export type CBlockOpcode = typeof cBlockOpcodes[number];

export function isCBlockOpcode(opcode: Opcode): opcode is CBlockOpcode {
    return cBlockOpcodes.includes(opcode as CBlockOpcode);
}

export const capBlockOpcodes = Object.freeze([
    "control_stop", // only if the option "other scripts in sprite" is not selected!
    "control_delete_this_clone",
    "control_forever",
] as const);

export type CapBlockOpcode = typeof capBlockOpcodes[number];

export const stackBlockOpcodes = Object.freeze([
    // Motion blocks
    "motion_movesteps",
    "motion_turnright",
    "motion_turnleft",
    "motion_goto",
    "motion_gotoxy",
    "motion_glideto",
    "motion_glidesecstoxy",
    "motion_pointindirection",
    "motion_pointtowards",
    "motion_changexby",
    "motion_setx",
    "motion_changeyby",
    "motion_sety",
    "motion_ifonedgebounce",
    "motion_setrotationstyle",

    // Looks blocks
    "looks_sayforsecs",
    "looks_say",
    "looks_thinkforsecs",
    "looks_think",
    "looks_switchcostumeto",
    "looks_switchbackdropto",
    "looks_switchbackdroptoandwait",
    "looks_nextcostume",
    "looks_nextbackdrop",
    "looks_changesizeby",
    "looks_setsizeto",
    "looks_changeeffectby",
    "looks_seteffectto",
    "looks_cleargraphiceffects",
    "looks_show",
    "looks_hide",
    "looks_gotofrontback",
    "looks_goforwardbackwardlayers",

    // Sound blocks
    "sound_playuntildone",
    "sound_play",
    "sound_stopallsounds",
    "sound_changeeffectby",
    "sound_seteffectto",
    "sound_cleareffects",
    "sound_changevolumeby",
    "sound_setvolumeto",

    // Event blocks
    "event_broadcast",
    "event_broadcastandwait",

    // Control blocks
    "control_wait",
    "control_wait_until",
    "control_create_clone_of",
    "control_stop", // only if the option "other scripts in sprite" is selected!

    // Sensing blocks
    "sensing_askandwait",
    "sensing_setdragmode",
    "sensing_resettimer",

    // Variable blocks
    "data_setvariableto",
    "data_changevariableby",
    "data_showvariable",
    "data_hidevariable",
    "data_addtolist",
    "data_deleteoflist",
    "data_deletealloflist",
    "data_insertatlist",
    "data_replaceitemoflist",
    "data_showlist",
    "data_hidelist",

    // Custom block
    "procedures_call",

    // Pen blocks
    "pen_clear",
    "pen_stamp",
    "pen_penDown",
    "pen_penUp",
    "pen_setPenColorToColor",
    "pen_changePenColorParamBy",
    "pen_setPenColorParamTo",
    "pen_changePenSizeBy",
    "pen_setPenSizeTo",
] as const);

export type StackBlockOpcode = typeof stackBlockOpcodes[number];

/**
 * Shadow blocks that ARE (not have!) an oval-shaped drop-down menu.
 * https://en.scratch-wiki.info/wiki/Dropdown_Menu#Accept_Block_Inputs
 */
export const dropDownMenuOpcodes = Object.freeze([
    "looks_backdrops",
    "looks_costume",
    "control_create_clone_of_menu",
    "sensing_touchingobjectmenu",
    "sensing_distancetomenu",
    "sensing_keyoptions",
    "sensing_of_object_menu",
    "motion_goto_menu",
    "motion_glideto_menu",
    "motion_pointtowards_menu",
    "sound_sounds_menu",
    "pen_menu_colorParam",
] as const);

export type DropDownMenuOpcode = typeof dropDownMenuOpcodes[number];

export const shadowBlockOpcodes = Object.freeze([
    ...dropDownMenuOpcodes,
    "procedures_prototype"
] as const);

export type ShadowBlockOpcode = typeof shadowBlockOpcodes[number];

export function isShadowBlockOpcode(opcode: Opcode): opcode is ShadowBlockOpcode {
    return shadowBlockOpcodes.includes(opcode as ShadowBlockOpcode);
}

export const blockWithFieldOpcodes = Object.freeze([
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
] as const);

// https://en.scratch-wiki.info/wiki/Dropdown_Menu#Do_Not_Accept_Block_Inputs
export type BlockWithFieldOpcode = typeof blockWithFieldOpcodes[number];

// https://en.scratch-wiki.info/wiki/Dropdown_Menu#Accept_Block_Inputs
export const blockWithShadowInputOpcodes = Object.freeze([
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
] as const);

export type BlockWithShadowInputOpcode = typeof blockWithShadowInputOpcodes[number];

export const penBlockOpcodes = Object.freeze([
    "pen_clear",
    "pen_stamp",
    "pen_penDown",
    "pen_penUp",
    "pen_setPenColorToColor",
    "pen_changePenColorParamBy",
    "pen_menu_colorParam",
    "pen_setPenColorParamTo",
    "pen_changePenSizeBy",
    "pen_setPenSizeTo",
] as const);

export type PenBlockOpcode = typeof penBlockOpcodes[number];
