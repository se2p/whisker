import {BlockID} from "../blocks/Block";
import {MonitorBlockOpcode} from "../blocks/Opcode";
import {Multiple, Scalar, Value} from "../blocks/categories/Data";

/**
 * Monitor display modes.
 */
type Mode = ReadWriteVar | "list";
type ReadWriteVar = ReadOnlyVar | "slider";
type ReadOnlyVar = "default" | "large";

type Parameter =
    | VariableName
    | ListName
    | NumberOrName
    | CurrentMenu
    | None
    ;

type VariableName = Record<"VARIABLE", string>;

type ListName = Record<"LIST", string>;

type NumberOrName = Record<"NUMBERNAME", "number" | "name">;

type CurrentMenu = Record<"CURRENTMENU", MenuItem>;

type MenuItem =
    | "SECOND"
    | "MINUTE"
    | "HOUR"
    | "DAYOFWEEK"
    | "DATE"
    | "MONTH"
    | "YEAR"
    ;

type None = Record<string, never>;

/**
 * A Stage monitor, sometimes called a watcher, is a display on the Stage that shows the value of a variable, boolean,
 * or a list. The color behind any number on a Stage monitor is the base color of the block it is corresponding to.
 * They can be shown and hidden by selecting and un-selecting the small box to the left of the block.
 *
 * https://en.scratch-wiki.info/wiki/Stage_Monitor
 */
export interface Monitor {

    /**
     * The ID of the monitored block in case of a custom variable or list. Otherwise, in case of a predefined sensing
     * block, it is sometimes a descriptive name (such as "answer" or "backdropnumbername_number"), or random characters
     * followed by a string that hints at the monitored block (e.g., "!?hvrx_=#O(A|lGsqC]}_size" for the "looks_size"
     * block). The prefix "!?hvrx_=#O(A|lGsqC]}" appears to be related to the sprite the "looks_size" block belongs to.
     */
    id: BlockID;

    /**
     * The monitor's mode.
     */
    mode: Mode;

    /**
     * The opcode of the block the monitor belongs to.
     */
    opcode: MonitorBlockOpcode;

    /**
     * Some monitors can be configured, e.g., whether to show the costume name or costume number. When such
     * parameterization is possible, this object tells which option has been selected. Empty for other monitors.
     */
    params: Parameter;

    /**
     * The name of the target the monitor belongs to, if any.
     */
    spriteName?: string;

    /**
     * The value appearing on the monitor. The value type depends on the monitor.
     */
    value: Value;

    /**
     * The width of the monitor on the stage.
     */
    width: number;

    /**
     * The height of the monitor on the stage.
     */
    height: number;

    /**
     * The x-coordinate of the monitor on the stage.
     */
    x: number;

    /**
     * The y-coordinate of the monitor on the stage.
     */
    y: number;

    /**
     * True if the monitor is visible on the stage, and false otherwise.
     */
    visible: boolean;
}

/**
 * Common interface for monitors of predefined and custom variables.
 */
interface VariableMonitor extends Monitor {
    mode: ReadWriteVar;

    /**
     * The value appearing on the monitor.
     */
    value: Scalar;
}

/**
 * Monitor for user-defined variables.
 */
export interface DataVariableMonitor extends VariableMonitor {
    opcode: "data_variable";

    /**
     * The name of the monitored variable.
     */
    params: VariableName;

    /**
     * The minimum value of the monitor's slider.
     */
    sliderMin: number;

    /**
     * The maximum value of the monitor's slider.
     */
    sliderMax: number;

    /**
     * True if the monitor's slider allows only integer values and false otherwise.
     */
    isDiscrete: boolean;
}

/**
 * Monitor for predefined variables such as "x position" or "answer".
 */
interface PredefinedVariableMonitor extends VariableMonitor {
    mode: ReadOnlyVar;
}

export interface MotionXPositionMonitor extends PredefinedVariableMonitor {
    opcode: "motion_xposition";
    params: None;
    value: number;
}

export interface MotionYPositionMonitor extends PredefinedVariableMonitor {
    opcode: "motion_yposition";
    params: None;
    value: number;
}

export interface MotionDirectionMonitor extends PredefinedVariableMonitor {
    opcode: "motion_direction";
    params: None;
    value: number;
}

export interface LooksCostumeNumberNameMonitor extends PredefinedVariableMonitor {
    opcode: "looks_costumenumbername";
    params: NumberOrName;
}

export interface LooksCostumeNumberMonitor extends LooksBackdropNumberNameMonitor {
    params: Record<"NUMBERNAME", "number">;
    value: number;
}

export interface LooksCostumeNameMonitor extends LooksBackdropNumberNameMonitor {
    params: Record<"NUMBERNAME", "name">;
    value: string;
}

export interface LooksBackdropNumberNameMonitor extends PredefinedVariableMonitor {
    id: "backdropnumbername_number";
    opcode: "looks_backdropnumbername";
    params: NumberOrName;
}

export interface LooksBackdropNumberMonitor extends LooksBackdropNumberNameMonitor {
    params: Record<"NUMBERNAME", "number">;
    value: number;
}

export interface LooksBackdropNameMonitor extends LooksBackdropNumberNameMonitor {
    params: Record<"NUMBERNAME", "name">;
    value: string;
}

export interface LooksSizeMonitor extends PredefinedVariableMonitor {
    opcode: "looks_size";
    params: None;
    value: number;
}

export interface SensingAnswerMonitor extends PredefinedVariableMonitor {
    id: "answer";
    opcode: "sensing_answer";
    params: None;
    value: string;
}

export interface SensingLoudnessMonitor extends PredefinedVariableMonitor {
    id: "loudness";
    opcode: "sensing_loudness";
    params: None;
    value: number;
}

export interface SensingTimerMonitor extends PredefinedVariableMonitor {
    id: "timer";
    opcode: "sensing_timer";
    params: None;
    value: number;
}

interface SensingCurrentMonitor extends PredefinedVariableMonitor {
    opcode: "sensing_current";
    spriteName: null;
    params: CurrentMenu;
    value: number;
}

type CurrentSecond =
    | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20
    | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39
    | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59
    ;

export interface SensingCurrentSecondMonitor extends SensingCurrentMonitor {
    id: "current_second";
    params: Record<"CURRENTMENU", "SECOND">;
    value: CurrentSecond;
}

type CurrentMinute = CurrentSecond;

export interface SensingCurrentMinuteMonitor extends SensingCurrentMonitor {
    id: "current_minute";
    params: Record<"CURRENTMENU", "MINUTE">;
    value: CurrentMinute;
}

type CurrentHour =
    | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
    | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23
    ;

export interface SensingCurrentHourMonitor extends SensingCurrentMonitor {
    id: "current_hour";
    params: Record<"CURRENTMENU", "HOUR">;
    value: CurrentHour;
}

type CurrentDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface SensingCurrentDayMonitor extends SensingCurrentMonitor {
    id: "current_dayofweek";
    params: Record<"CURRENTMENU", "DAYOFWEEK">;
    value: CurrentDay;
}

type CurrentDate =
    | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16
    | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31
    ;

export interface SensingCurrentDateMonitor extends SensingCurrentMonitor {
    id: "current_date";
    params: Record<"CURRENTMENU", "DATE">;
    value: CurrentDate;
}

type CurrentMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface SensingCurrentMonthMonitor extends SensingCurrentMonitor {
    id: "current_month";
    params: Record<"CURRENTMENU", "MONTH">;
    value: CurrentMonth;
}

type CurrentYear = number;

export interface SensingCurrentYearMonitor extends SensingCurrentMonitor {
    id: "current_year";
    params: Record<"CURRENTMENU", "YEAR">;
    value: CurrentYear;
}

type Username = string;

export interface SensingUsernameMonitor extends PredefinedVariableMonitor {
    id: "sensing_username";
    opcode: "sensing_username";
    params: None;
    value: Username;
}

export interface ListMonitor extends Monitor {
    opcode: "data_listcontents";
    mode: "list";
    params: ListName;
    value: Multiple;
}
