import {ScratchMutation} from "./ScratchMutation";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchProgram} from "../ScratchInterface";
import {OperatorFilter} from "scratch-analysis/src/block-filter";

export class LogicalOperatorReplacementMutation extends ScratchMutation {

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * The LogicalOperatorReplacementMutation replaces a logical operation (and, or) with the opposing one.
     * @param mutationBlock the block whose logical operation should be replaced.
     * @param mutantProgram the mutant program in which the logical operation will be replaced.
     * @param originalBlock the corresponding logical block from the original Scratch program.
     * @returns true if the mutation was successful.
     */
    applyMutation(mutationBlock: unknown, mutantProgram: ScratchProgram, originalBlock: unknown): boolean {
        const originalOpcode = mutationBlock['opcode'];
        const mutantOpcode = originalOpcode === 'operator_and' ? 'operator_or' : 'operator_and';
        mutationBlock['opcode'] = mutantOpcode;
        const blockId = `${originalBlock['id'].slice(0, 4)}-${originalBlock['target']}`;
        mutantProgram.name = `LOR:${originalOpcode}-${mutantOpcode}-${blockId}`.replace(/,/g, '');
        return true;
    }

    /**
     * Valid mutation candidates are logical operation blocks.
     * @returns an array of mutation candidate block ids.
     */
    protected getMutationCandidates(): string[] {
        const logicalOperationBlocks: string[] = [];
        for (const [id, block] of this.blockMap.entries()) {
            if (OperatorFilter.logical(block)) {
                logicalOperationBlocks.push(id);
            }
        }
        return logicalOperationBlocks;
    }


}
