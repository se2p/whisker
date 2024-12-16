/**
 * A Scratch block as it is represented in its 'live' form,
 * i.e. when being part of a target's Block object within a scratch-vm instance.
 */
export type ScratchVMBlock = {
    id: string;
    opcode: string;
    inputs: Record<string, unknown>;
    fields: Record<string, unknown>;
    next: string | null;
    topLevel: boolean;
    parent: string | null;
    shadow: boolean;
    breakpoint: boolean;
};
