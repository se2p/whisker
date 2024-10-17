import {ScratchMutation} from "./ScratchMutation";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchInterface, ScratchProgram} from "../ScratchInterface";
import {OperatorFilter} from "scratch-analysis/src/block-filter";

export class LogicalOperatorReplacementMutation extends ScratchMutation {

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * The LogicalOperatorReplacementMutation replaces a logical operation (and, or) with the opposing one.
     * @param mutationBlockId the id of the block whose logical operation should be replaced.
     * @param mutantProgram the mutant program in which the logical operation will be replaced.
     * @returns true if the mutation was successful.
     */
    public applyMutation(mutationBlockId: string, mutantProgram: ScratchProgram): boolean {
        const mutationBlock = ScratchInterface.getBlockFromId(mutantProgram, mutationBlockId);
        const originalOpcode = mutationBlock['opcode'];
        const mutantOpcode = originalOpcode === 'operator_and' ? 'operator_or' : 'operator_and';
        mutationBlock['opcode'] = mutantOpcode;
        const mutantId = this.getMutantId(mutationBlockId);
        mutantProgram.name = `LOR:${originalOpcode}-${mutantOpcode}-${mutantId}`.replace(/,/g, '');
        return true;
    }

    /**
     * Valid mutation candidates are logical operation blocks.
     * @returns an array of mutation candidate block ids.
     */
    public getMutationCandidates(): string[] {
        const logicalOperationBlocks: string[] = [];
        for (const [id, block] of this.blockMap.entries()) {
            if (OperatorFilter.logical(block)) {
                logicalOperationBlocks.push(id);
            }
        }
        return logicalOperationBlocks;
    }

    /**
     * String representation of a given mutator.
     * @returns string representation of the mutator.
     */
    public toString():string{
        return 'LOR';
    }
}
