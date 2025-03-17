/**
 * A Scratch block as it is represented in its 'live' form,
 * i.e. when being part of a target's Block object within a scratch-vm instance.
 */
export type ScratchVMBlock = TopLevelVMBlock | SubVMBlock;

export type TopLevelVMBlock = {
    id: string;
    opcode: string;
    inputs: Record<string, unknown>;
    fields: Record<string, unknown>;
    next: string | null;
    topLevel: true;
    parent: null;
    shadow: boolean;
    x: number | string;
    y: number | string;
    breakpoint: boolean;
};

export type SubVMBlock = {
    id: string;
    opcode: string;
    inputs: Record<string, unknown>;
    fields: Record<string, unknown>;
    next: string | null;
    topLevel: boolean; // special case: shadowed input blocks have topLevel set to true
    parent: string;
    shadow: boolean;
    breakpoint: boolean;
};
