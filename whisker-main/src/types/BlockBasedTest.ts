import {ScratchVMBlock} from "./ScratchVMBlock";

export type BlockBasedTest = {
    title: string;
    blocks: Array<ScratchVMBlock>;
    comment: string | null;
};
