const MotionFilter = {
    directionChange: block =>
        block.opcode === 'motion_turnright' ||
        block.opcode === 'motion_turnleft' ||
        block.opcode === 'motion_pointindirection' ||
        block.opcode === 'motion_pointtowards',

    directionSet: block =>
        block.opcode === 'motion_pointindirection',

    positionChange: block =>
        block.opcode === 'motion_movesteps' ||
        block.opcode === 'motion_goto' ||
        block.opcode === 'motion_gotoxy' ||
        block.opcode === 'motion_glideto' ||
        block.opcode === 'motion_glidesecstoxy' ||
        block.opcode === 'motion_changexby' ||
        block.opcode === 'motion_changeyby' ||
        block.opcode === 'motion_setx' ||
        block.opcode === 'motion_sety',

    positionSet: block =>
        block.opcode === 'motion_gotoxy' ||
        block.opcode === 'motion_glidesecstoxy',

    xSet: block =>
        block.opcode === 'motion_setx',

    ySet: block =>
        block.opcode === 'motion_sety',

    motionBlock: block =>
        block.opcode.startsWith('motion_') &&
        !block.opcode.endsWith('_menu') && !(
            block.opcode === 'motion_xposition' ||
            block.opcode === 'motion_yposition' ||
            block.opcode === 'motion_direction'
        )
};
const LooksFilter = {
    backdropChange: block =>
        block.opcode === 'looks_switchbackdroptoandwait' ||
        block.opcode === 'looks_nextbackdrop' ||
        block.opcode === 'looks_switchbackdropto',

    nextBackdrop: block =>
        block.opcode === 'looks_nextbackdrop',

    backdropSet: block =>
        block.opcode === 'looks_switchbackdroptoandwait' ||
        block.opcode === 'looks_switchbackdropto',

    costumeChange: block =>
        block.opcode === 'looks_switchcostumeto' ||
        block.opcode === 'looks_nextcostume',

    costumeSet: block =>
        block.opcode === 'looks_switchcostumeto',

    sizeChange: block =>
        block.opcode === 'looks_changesizeby' ||
        block.opcode === 'looks_setsizeto',

    sizeSet: block =>
        block.opcode === 'looks_setsizeto',

    visibilitySet: block =>
        block.opcode === 'looks_show' ||
        block.opcode === 'looks_hide',

    sayBlock: block =>
        block.opcode === 'looks_say' ||
        block.opcode === 'looks_sayforsecs',

    thinkBlock: block =>
        block.opcode === 'looks_think' ||
        block.opcode === 'looks_thinkforsecs',

    backdropBlock: block =>
        block.opcode === 'looks_backdrops',

    looksBlock: block =>
        block.opcode.startsWith('looks_') &&
        !block.opcode.endsWith('_menu') && !(
            block.opcode === 'looks_backdropnumbername' ||
            block.opcode === 'looks_costumenumbername' ||
            block.opcode === 'looks_size'
        )
};

const SoundFilter = {
    play: block =>
        block.opcode === 'sound_play' ||
        block.opcode === 'sound_playuntildone',

    soundBlock: block =>
        block.opcode.startsWith('sound_') &&
        !block.opcode.endsWith('_menu') && !(
            block.opcode === 'sound_volume'
        )
};

const EventFilter = {
    userEvent: block =>
        block.opcode === 'event_whenflagclicked' ||
        block.opcode === 'event_whenthisspriteclicked' ||
        block.opcode === 'event_whenstageclicked' ||
        block.opcode === 'event_whenkeypressed' ||
        block.opcode === 'event_whengreaterthan',

    greenFlag: block =>
        block.opcode === 'event_whenflagclicked',

    hatEvent: block =>
        block.opcode === 'event_whenflagclicked' ||
        block.opcode === 'event_whenthisspriteclicked' ||
        block.opcode === 'event_whenstageclicked' ||
        block.opcode === 'event_whenbackdropswitchesto' ||
        block.opcode === 'event_whengreaterthan' ||
        block.opcode === 'event_whenbroadcastreceived' ||
        block.opcode === 'event_whenkeypressed',

    broadcastSend: block =>
        block.opcode === 'event_broadcast' ||
        block.opcode === 'event_broadcastandwait',

    broadcastReceive: block =>
        block.opcode === 'event_whenbroadcastreceived',

    broadcastMenu: block =>
        block.opcode === 'event_broadcast_menu',

    cloneCreate: block =>
        block.opcode === 'control_create_clone_of',

    cloneStart: block =>
        block.opcode === 'control_start_as_clone',

    cloneMenu: block =>
        block.opcode === "control_create_clone_of_menu",

    backdropStart: block =>
        block.opcode === 'event_whenbackdropswitchesto',

    backdropChange: block =>
        block.opcode === 'looks_switchbackdropto',

    eventSend: block =>
        EventFilter.broadcastSend(block) ||
        EventFilter.cloneCreate(block),

    eventReceive: block =>
        EventFilter.broadcastReceive(block) ||
        EventFilter.cloneStart(block),

    eventBlock: block =>
        block.opcode.startsWith('event_') &&
        !block.opcode.endsWith('_menu') &&
        block.opcode !== 'event_touchingobjectmenu'
};

const ControlFilter = {
    controlBlock: block =>
        block.opcode.startsWith('control_') &&
        !block.opcode.endsWith('_menu'),

    singleBranch: block =>
        block.opcode === 'control_if' ||
        block.opcode === 'control_repeat' ||
        block.opcode === 'control_repeat_until' ||
        block.opcode === 'control_forever' ||
        block.opcode === 'control_wait_until',

    doubleBranch: block =>
        block.opcode === 'control_if_else',

    branch: block =>
        ControlFilter.singleBranch(block) || ControlFilter.doubleBranch(block),

    hatBlock: block =>
        EventFilter.hatEvent(block) || block.opcode === 'control_start_as_clone',

    executionHaltingBlock: block =>
        block.opcode === 'control_wait' ||
        block.opcode === 'looks_thinkforsecs' ||
        block.opcode === 'looks_sayforsecs' ||
        block.opcode === 'motion_glidesecstoxy' ||
        block.opcode === 'motion_glideto' ||
        block.opcode === 'sound_playuntildone' ||
        block.opcode === 'text2speech_speakAndWait'
};

const SensingFilter = {
    askBlock: block =>
        block.opcode === 'sensing_askandwait',
    sensingBlock: block =>
        block.opcode === 'sensing_askandwait' ||
        block.opcode === 'sensing_setdragmode' ||
        block.opcode === 'sensing_resettimer'
};

const VariableFilter = {
    set: block =>
        block.opcode === 'data_setvariableto',
    update: block =>
        block.opcode === 'data_setvariableto' ||
        block.opcode === 'data_changevariableby',
    variableBlock: block =>
        block.opcode === 'data_setvariableto' ||
        block.opcode === 'data_changevariableby' ||
        block.opcode === 'data_showvariable' ||
        block.opcode === 'data_hidevariable'
};

const OperatorFilter = {
    arithmetic: block =>
        block.opcode === 'operator_add' ||
        block.opcode === 'operator_subtract' ||
        block.opcode === 'operator_multiply' ||
        block.opcode === 'operator_divide',

    relational: block =>
        block.opcode === 'operator_equals' ||
        block.opcode === 'operator_lt' ||
        block.opcode === 'operator_gt',

    logical: block =>
        block.opcode === 'operator_and' ||
        block.opcode === 'operator_or',

    negatable: block =>
        block.opcode === 'sensing_touchingobject' ||
        block.opcode === 'sensing_touchingcolor' ||
        block.opcode === 'sensing_coloristouchingcolor' ||
        block.opcode === 'sensing_keypressed' ||
        block.opcode === 'sensing_mousedown' ||
        block.opcode === 'operator_contains' ||
        block.opcode === 'operator_not' ||
        OperatorFilter.logical(block) ||
        OperatorFilter.relational(block)
}

const ListFilter = {
    update: block =>
        block.opcode === 'data_addtolist' ||
        block.opcode === 'data_deleteoflist' ||
        block.opcode === 'data_deletealloflist' ||
        block.opcode === 'data_insertatlist' ||
        block.opcode === 'data_replaceitemoflist' ||
        block.opcode === 'data_replaceitemoflist',

    listBlock: block =>
        ListFilter.update(block) ||
        block.opcode === 'data_showlist' ||
        block.opcode === 'data_hidelist'
}

const MusicFilter = {
    musicBlock: block =>
        block.opcode.startsWith('music_')
}

const CustomFilter = {
    customBlock: block =>
        block.opcode.startsWith('procedures_'),

    defineBlock: block =>
        block.opcode === 'procedures_definition'
}

const PenFilter = {
    penBlock: block =>
        block.opcode.startsWith('pen_')
}

const Text2SpeechFilter = {
    text2speechBlock: block =>
        block.opcode.startsWith('text2speech_')
}

const StatementFilter = {
    isStatementBlock: block => {
        if (block.topLevel && !EventFilter.eventBlock(block) &&
            !EventFilter.cloneStart(block) &&
            !CustomFilter.customBlock(block)) {
            // loose blocks
            return false;
        }
        if (block.opcode.endsWith('_menu')) {
            return false;
        }
        return MotionFilter.motionBlock(block) ||
            LooksFilter.looksBlock(block) ||
            SoundFilter.soundBlock(block) ||
            EventFilter.eventBlock(block) ||
            ControlFilter.controlBlock(block) ||
            SensingFilter.sensingBlock(block) ||
            ListFilter.listBlock(block) ||
            VariableFilter.variableBlock(block) ||
            MusicFilter.musicBlock(block) ||
            CustomFilter.customBlock(block) ||
            PenFilter.penBlock(block) ||
            Text2SpeechFilter.text2speechBlock(block);
    }
};

export {
    ControlFilter,
    MotionFilter,
    LooksFilter,
    SoundFilter,
    EventFilter,
    VariableFilter,
    OperatorFilter,
    ListFilter,
    SensingFilter,
    StatementFilter,
    MusicFilter,
    CustomFilter,
    PenFilter,
    Text2SpeechFilter
};
