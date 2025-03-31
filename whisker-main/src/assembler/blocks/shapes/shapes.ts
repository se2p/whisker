import {ScratchBlock} from "../Block";
import {isHatBlock} from "./HatBlock";
import {isCapBlock} from "./CapBlock";
import {isStackBlock} from "./StackBlock";
import {isCBlock} from "./CBlock";
import {isBooleanReporterBlock, isStringNumberReporterBlock} from "./Reporter";
import {isShadowBlock} from "../other/ShadowBlock";

export type Shape =
    | "hat"
    | "cap"
    | "stack"
    | "C"
    | "boolean"
    | "reporter"
    | "shadow"
    ;

export function getShape(block: ScratchBlock): Shape[] {
    const shapes: Shape[] = [];

    if (isHatBlock(block)) {
        shapes.push("hat");
    }

    if (isCapBlock(block)) {
        shapes.push("cap");
    }

    if (isCBlock(block)) {
        shapes.push("C");
    }

    if (isStackBlock(block)) {
        shapes.push("stack");
    }

    if (isBooleanReporterBlock(block)) {
        shapes.push("boolean");
    }

    if (isStringNumberReporterBlock(block)) {
        shapes.push("reporter");
    }

    if (isShadowBlock(block)) {
        shapes.push("shadow");
    }

    return shapes;
}
