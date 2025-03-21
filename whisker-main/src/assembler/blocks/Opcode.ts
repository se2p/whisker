export type Opcode =
    // by category
    | ControlBlockOpcode
    | DataBlockOpcode
    | EventBlockOpcode
    | LooksBlockOpcode

    // by shape
    | HatBlockOpcode
    ;

export const controlBlockOpcodes = [
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
] as const;

export type ControlBlockOpcode = typeof controlBlockOpcodes[number];

export const dataBlockOpcodes = [
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
] as const;

export type DataBlockOpcode = typeof dataBlockOpcodes[number];

export const eventBlockOpcodes = [
    "event_whenflagclicked",
    "event_whenkeypressed",
    "event_whenthisspriteclicked",
    "event_whenstageclicked",
    "event_whengreaterthan",
    "event_whenbackdropswitchesto",
    "event_whenbroadcastreceived",
    "event_broadcast",
    "event_broadcastandwait",
] as const;

export type EventBlockOpcode = typeof eventBlockOpcodes[number];

export const hatBlockOpcodes = [
    "event_whenflagclicked",
    "event_whenkeypressed",
    "event_whenthisspriteclicked",
    "event_whenstageclicked",
    "event_whenbackdropswitchesto",
    "event_whengreaterthan",
    "event_whenbroadcastreceived",
    "control_start_as_clone",
    "procedures_definition",
] as const;

export type HatBlockOpcode = typeof hatBlockOpcodes[number];

export const looksBlockOpcodes = [
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
] as const;

export type LooksBlockOpcode = typeof looksBlockOpcodes[number];

/**
 * Shadow blocks that ARE (not have!) an oval-shaped drop-down menu.
 * https://en.scratch-wiki.info/wiki/Dropdown_Menu#Accept_Block_Inputs
 */
export const dropDownMenuOpcodes = [
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
] as const;

export type DropDownMenuOpcode = typeof dropDownMenuOpcodes[number];

export const shadowBlockOpcodes = [
    ...dropDownMenuOpcodes,
    "procedures_prototype"
] as const;

export type ShadowBlockOpcode = typeof shadowBlockOpcodes[number];

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
