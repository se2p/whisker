import {
    Input,
    InputKey,
    inputRefersToShadowBlock,
    isBroadCastInput,
    isColorPickerInput,
    isDeletedInput,
    isListInput,
    isMathAngleInput,
    isMathIntegerInput,
    isMathNumberInput,
    isMathPositiveNumberInput,
    isMathWholeNumberInput,
    isTextInput,
    isTopLevelDataBlock,
    isVariableInput,
    PrimitiveInput,
    shadowTypes
} from "../blocks/Inputs";
import {BlockID, isBlock, isBlockID, isScratchBlock, ScratchBlock} from "../blocks/Block";
import {isStackBlock} from "../blocks/shapes/StackBlock";
import {isCBlock} from "../blocks/shapes/CBlock";
import {isCapBlock} from "../blocks/shapes/CapBlock";
import {isHatBlock} from "../blocks/shapes/HatBlock";
import {getInputKeys, getOpcode, supportsInput} from "./blocks";
import {isBooleanReporterBlock, isStringNumberReporterBlock} from "../blocks/shapes/Reporter";
import {motionBlockOpcodes, Opcode} from "../blocks/Opcode";

function canBeParent(block: ScratchBlock): boolean {
    return isStackBlock(block) ||
        (isCBlock(block) && !isCapBlock(block)) || // control_forever is C-Block and Cap-Block at the same time...
        isHatBlock(block);
}

function canBeNext(block: ScratchBlock): boolean {
    return isStackBlock(block) ||
        isCBlock(block) ||
        isCapBlock(block);
}

export function canConnect(parent: ScratchBlock | null, next: ScratchBlock | null): boolean {
    // If null, it means there is no parent/next. Every Scratch block allows this.
    if (parent === null || next === null) {
        return true;
    }

    return canBeParent(parent) && canBeNext(next);
}

/**
 * Tells whether the given `parent` can take the given `input` via the specified `key`
 * @param parent The block that should take the input
 * @param key The input key to use
 * @param input The input to check
 */
export function canBeInput(parent: ScratchBlock, key: InputKey, input: ScratchBlock | Input): boolean {
    // Dynamic dispatch depending on the type of the `input` argument.
    return isScratchBlock(input)
        ? canBeInputB(parent, key, input)
        : canBeInputI(parent, key, input)
        ;
}

// Like `canBeInput()`, but the input has been narrowed down to be a `ScratchBlock` object -> "B" suffix in `canBeInputB()`
function canBeInputB(parent: ScratchBlock, key: InputKey, input: ScratchBlock): boolean {
    if (!supportsInput(parent, key)) {
        return false;
    }

    /*
     * Almost all inputs are oval-shaped. There are only a handful special cases, which we check first:
     * (1) Only C-blocks can take other stackable blocks.
     * (2) C-blocks can have boolean inputs.
     * (3) Boolean operators can have boolean inputs.
     * (4) The remaining blocks have oval-shaped inputs.
     */

    if (key === "SUBSTACK" || key === "SUBSTACK2") { // (1)
        return canBeNext(input);
    }

    if (key === "CONDITION") { // (2)
        return isBooleanReporterBlock(input);
    }

    if (["operator_and", "operator_or", "operator_not"].includes(getOpcode(parent))) { // (3)
        // Note: the Scratch IDE also allows boolean blocks to be dropped into oval-shaped inputs, but we do not allow
        // that here...
        return isBooleanReporterBlock(input);
    }

    return isStringNumberReporterBlock(input) || isTopLevelDataBlock(input); // (4)
}

// Like `canBeInput()`, but the input has been narrowed down to be an `Input` object  -> "I" suffix in `canBeInputI()`
function canBeInputI(parent: ScratchBlock, key: InputKey, input: Input): boolean {
    // Top-level variable/list blocks cannot have any inputs.
    if (isTopLevelDataBlock(parent)) {
        return false;
    }

    // Does the parent even support the input key?
    if (!getInputKeys(parent).includes(key)) {
        return false;
    }

    const [shadowType, inputBlock, obscuredBlock] = input;

    /*
     * Note: Every combination of block and input key only allows certain types of inputs. Luckily, we need not check
     * all possible combinations because most keys are only used by one kind of block. But some keys, such as
     * "OPERAND1", are used both by boolean and number reporter blocks.
     */

    // Blocks with substacks or boolean inputs:
    // (1) can have no input ("deleted input")
    // (2) or require a stackable block or boolean reporter block
    if (
        key === "SUBSTACK" ||
        key === "SUBSTACK2" ||
        key === "CONDITION" ||
        key === "OPERAND" ||
        key === "OPERAND1" && (parent.opcode === "operator_add" || parent.opcode === "operator_or") ||
        key === "OPERAND2" && (parent.opcode === "operator_add" || parent.opcode === "operator_or")
    ) {
        if (isDeletedInput(input)) { // (1)
            return true;
        }

        return shadowType === shadowTypes.noShadow && isBlockID(inputBlock); // (2)
    }

    // All other inputs are oval-shaped. They cannot be of type "noShadow".
    if (shadowType === shadowTypes.noShadow) {
        return false;
    }

    let inputToCheck = inputBlock;

    // Any oval-shaped input can also be obscured by a reporter block, or a custom variable/list block.
    if (shadowType === shadowTypes.obscuredShadow) { // (0)
        if (!canBeObscuringInput(inputToCheck)) {
            return false;
        }

        inputToCheck = obscuredBlock;
    }

    // We have an oval-shaped drop-down menu -> the input must be a valid BlockID to the associated shadow block.
    if (inputRefersToShadowBlock(parent.opcode, key)) {
        return isBlockID(inputToCheck); // assume reference to shadow block
    }

    // Primitive input type 4
    if (
        key === "STEPS" ||
        key === "DEGREES" ||
        key === "X" ||
        key === "Y" ||
        key === "SECS" ||
        key === "DX" ||
        key === "DY" ||
        key === "CHANGE" ||
        key === "NUM" && parent.opcode !== "looks_goforwardbackwardlayers" ||
        key === "VALUE" && parent.opcode !== "data_setvariableto" ||
        key === "SIZE" ||
        key === "NUM1" ||
        key === "NUM2" ||
        key === "VOLUME" ||
        key === "FROM" ||
        key === "TO"
    ) {
        return isMathNumberInput(inputToCheck);
    }

    // Primitive input type 5
    if (key === "DURATION") {
        return isMathPositiveNumberInput(inputToCheck);
    }

    // Primitive input type 6
    if (key === "TIMES" || key === "LETTER") {
        return isMathWholeNumberInput(inputToCheck);
    }

    // Primitive input type 7
    if (key === "NUM" || key === "INDEX") {
        return isMathIntegerInput(inputToCheck);
    }

    // Primitive input type 8
    if (key === "DIRECTION") {
        return isMathAngleInput(inputToCheck);
    }

    // Primitive input type 9
    if (key === "COLOR" || key === "COLOR2") {
        return isColorPickerInput(inputToCheck);
    }

    // Primitive input type 10
    if (
        key === "MESSAGE" ||
        key === "VALUE" ||
        key === "OPERAND1" ||
        key === "OPERAND2" ||
        key === "STRING1" ||
        key === "STRING2" ||
        key === "STRING" ||
        key === "QUESTION" ||
        key === "ITEM"
    ) {
        return isTextInput(inputToCheck);
    }

    // Primitive input type 11
    if (key === "BROADCAST_INPUT") {
        return isBroadCastInput(inputToCheck);
    }

    throw new Error(`Unhandled input key "${key}"`);
}

function canBeObscuringInput(i: BlockID | PrimitiveInput): boolean {
    return (                        // Every obscuring input is either
        isBlockID(i) ||             // a predefined reporter block, or
        isVariableInput(i) ||       // a custom variable block, or
        isListInput(i)              // a custom list block.
    );
}

export function canBeOnTheStage(block: ScratchBlock): boolean {
    /*
     * In the Scratch IDE, some blocks are not available in the toolbox when the stage is selected. For example, the
     * entire motion block category is empty ("Stage selected: no motion blocks"), and other block categories are
     * missing blocks, too, like "say" or "think" blocks in the "looks" category. These blocks are blacklisted below, as
     * they are not meant to be used on the stage. Nevertheless, the Scratch IDE still offers a – perhaps unintended? –
     * way of using blacklisted blocks on the stage. We explicitly do not allow this.
     */

    const blacklist: Array<Opcode> = [
        ...motionBlockOpcodes,
        "looks_sayforsecs",
        "looks_thinkforsecs",
        "looks_say",
        "looks_think",
        "looks_switchcostumeto",
        "looks_costume",
        "looks_nextcostume",
        "looks_changesizeby",
        "looks_setsizeto",
        "looks_show",
        "looks_hide",
        "looks_gotofrontback",
        "looks_goforwardbackwardlayers",
        "looks_costumenumbername",
        "control_start_as_clone",
        "control_delete_this_clone",
        "event_whenthisspriteclicked",
        "sensing_touchingcolor",
        "sensing_touchingobjectmenu",
        "sensing_touchingobject",
        "sensing_coloristouchingcolor",
        "sensing_setdragmode",
    ];

    return isTopLevelDataBlock(block) || !blacklist.includes(block.opcode);
}

export function canBeOnSprite(block: ScratchBlock): boolean {
    return isTopLevelDataBlock(block) || block.opcode !== "event_whenstageclicked";
}

export function canTakeBooleanInput(block: ScratchBlock): boolean {
    if (!isBlock(block)) {
        return false;
    }

    return [
        "control_if",
        "control_if_else",
        "control_wait_until",
        "control_repeat_until",
        "operator_and",
        "operator_or",
        "operator_not"
    ].includes(block.opcode);
}
