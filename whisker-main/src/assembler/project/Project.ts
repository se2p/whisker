import {Target} from "./Target";
import {Monitor} from "./Monitor";
import {Block, BlockID} from "../blocks/Block";
import {TopLevelListBlock, TopLevelVariableBlock} from "../blocks/Inputs";
import {HashCode} from "../../repair/utils/hashCode";

/**
 * A Scratch project's `project.json` file, representing the project. This JSON file is included in the project's
 * *.sb3 file. On most operating systems, one can obtain this JSON file by first renaming the *.sb3 it so that it ends
 * with *.zip, and then extracting it.
 *
 * https://en.scratch-wiki.info/wiki/Scratch_File_Format
 */
export interface Project<B = Block, V = TopLevelVariableBlock, L = TopLevelListBlock> {

    /**
     * An array of targets, in the same order as in the Scratch User Interface. A target is either the stage or some
     * sprite.
     */
    targets: Target<B, V, L>[];

    /**
     * An array of monitors used in the project, in their layer order. Monitors show the current values of variables,
     * lists and reporter blocks.
     */
    monitors?: Monitor[];

    /**
     * An array of the identifiers of the extensions used.
     */
    extensions: Extension[];

    /**
     * Metadata about the project's author and the Scratch version used.
     */
    meta: Meta;

    /**
     * The Scratch version used. The Scratch VM can add this property dynamically when loading and verifying a project.
     */
    projectVersion?: 2 | 3;

    /**
     * Property specific to mutation testing of Scratch projects.
     */
    mutantName?: string;
}

/**
 * An extension is a category of blocks that can be added to the block palette and extends the scope of the Scratch
 * editor. Extensions make it possible to connect Scratch projects with external hardware (such as LEGO WeDo or
 * micro:bit), sources of information on the web (such as Google Translate and Amazon Text to Speech), or blocks
 * allowing for more advanced functionality. They add a collection of command and reporter blocks that can be used to
 * interact with a particular device or data source. When an extension is enabled, its blocks appear in a location with
 * the same name as the extension.
 *
 * https://en.scratch-wiki.info/wiki/Extension
 */
export type Extension =
    | "pen"
    | "wedo2"
    | "music"
    | "microbit"
    | "text2speech"
    | "translate"
    | "videoSensing"
    | "ev3"
    | "makeymakey"
    | "boost"
    | "gdxfor"
    ;

/**
 * Project meta information.
 *
 * https://en.scratch-wiki.info/wiki/Scratch_File_Format#Meta
 */
export interface Meta {

    /**
     * Always 3.0.0.
     */
    semver: "3.0.0";

    /**
     * The version of the Scratch VM that the project was created with.
     */
    vm: string;

    /**
     * The user agent of the last person to edit the project.
     */
    agent: string;

    /**
     * Non-standard property not present in regular Scratch projects. Added by Whisker. Used by automatic repair, e.g.,
     * to identify syntactic code clones.
     */
    hashCode?: HashCode;

    /**
     * Non-standard property not present in regular Scratch projects. Added by Whisker. Used by automatic repair, e.g.,
     * to document the changes mutation and crossover operators applied to a project.
     */
    changeLogs?: Array<ChangeLog>;

    filePath?: string;
}

export interface ChangeLog {
    operator: string;
    operands: Array<BlockID>;
    parents: Array<HashCode>;
    renamed: Record<BlockID, BlockID>;
    deleted: Array<BlockID>;
}
