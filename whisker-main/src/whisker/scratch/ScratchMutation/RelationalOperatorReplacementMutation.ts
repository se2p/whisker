import {ScratchMutation} from "./ScratchMutation";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {Randomness} from "../../utils/Randomness";
import {OperatorFilter, getBlockFromId} from "scratch-analysis";
import {BlockID} from "../../../assembler/blocks/Block";
import {Project} from "../../../assembler/project/Project";

export class RelationalOperatorReplacementMutation extends ScratchMutation {

    private static readonly RELATIONAL_OPCODES = ['operator_equals', 'operator_lt', 'operator_gt']

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * The RelationalOperatorReplacementMutation replaces a relational operation (<, ==, >) with a randomly
     * chosen different one.
     * @param mutationBlockId the id of the block whose relational operation should be replaced.
     * @param mutantProgram the mutant program in which the relational operation will be replaced.
     * @returns true if the mutation was successful.
     */
    public applyMutation(mutationBlockId: BlockID, mutantProgram: Project): boolean {
        const mutationBlock = getBlockFromId(mutantProgram.targets, mutationBlockId);
        const originalOpcode = mutationBlock['opcode'];
        let mutantOpcode = Randomness.getInstance().pick(RelationalOperatorReplacementMutation.RELATIONAL_OPCODES);
        while (mutantOpcode === originalOpcode) {
            mutantOpcode = Randomness.getInstance().pick(RelationalOperatorReplacementMutation.RELATIONAL_OPCODES);
        }
        mutationBlock['opcode'] = mutantOpcode;
        const mutantId = this.getMutantId(mutationBlockId);
        mutantProgram.mutantName = `ROR:${originalOpcode}-${mutantOpcode}-${mutantId}`.replace(/,/g, '');
        return true;
    }

    /**
     * Valid mutation candidates are relational operation blocks.
     * @returns an array of mutation candidate block ids.
     */
    public getMutationCandidates(): string[] {
        const logicalOperationBlocks: string[] = [];
        for (const [id, block] of this.blockMap.entries()) {
            if (OperatorFilter.relational(block)) {
                logicalOperationBlocks.push(id);
            }
        }
        return logicalOperationBlocks;
    }

    /**
     * String representation of a given mutator.
     * @returns string representation of the mutator.
     */
    public toString(): string {
        return 'ROR';
    }
}
