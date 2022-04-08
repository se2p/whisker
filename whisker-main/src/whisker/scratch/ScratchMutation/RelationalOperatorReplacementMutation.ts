import {ScratchMutation} from "./ScratchMutation";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchProgram} from "../ScratchInterface";
import {OperatorFilter} from "scratch-analysis/src/block-filter";
import {Randomness} from "../../utils/Randomness";

export class RelationalOperatorReplacementMutation extends ScratchMutation {

    private static readonly RELATIONAL_OPCODES = ['operator_equals', 'operator_lt', 'operator_gt']

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * The RelationalOperatorReplacementMutation replaces a relational operation (<, ==, >) with a randomly
     * chosen different one.
     * @param mutationBlock the block whose relational operation should be replaced.
     * @param mutantProgram the mutant program in which the relational operation will be replaced.
     * @param originalBlock the corresponding relational block from the original Scratch program.
     * @returns true if the mutation was successful.
     */
    applyMutation(mutationBlock: unknown, mutantProgram: ScratchProgram, originalBlock: unknown): boolean {
        const originalOpcode = mutationBlock['opcode'];
        let mutantOpcode = Randomness.getInstance().pick(RelationalOperatorReplacementMutation.RELATIONAL_OPCODES);
        while (mutantOpcode === originalOpcode) {
            mutantOpcode = Randomness.getInstance().pick(RelationalOperatorReplacementMutation.RELATIONAL_OPCODES);
        }
        mutationBlock['opcode'] = mutantOpcode;
        const blockId = `${originalBlock['id'].slice(0, 4)}-${originalBlock['target']}`;
        mutantProgram.name = `ROR:${originalOpcode}-${mutantOpcode}-${blockId}`.replace(/,/g, '');
        return true;
    }

    /**
     * Valid mutation candidates are relational operation blocks.
     * @returns an array of mutation candidate block ids.
     */
    protected getMutationCandidates(): string[] {
        const logicalOperationBlocks: string[] = [];
        for (const [id, block] of this.blockMap.entries()) {
            if (OperatorFilter.relational(block)) {
                logicalOperationBlocks.push(id);
            }
        }
        return logicalOperationBlocks;
    }


}
