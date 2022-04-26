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
     * @param mutationBlockId the id of the block whose relational operation should be replaced.
     * @param mutantProgram the mutant program in which the relational operation will be replaced.
     * @param target the name of the target in which the block to mutate resides.
     * @returns true if the mutation was successful.
     */
    applyMutation(mutationBlockId: Readonly<string>, mutantProgram: ScratchProgram, target:Readonly<string>): boolean {
        const mutationBlock = this.extractBlockFromProgram(mutantProgram, mutationBlockId, target);
        const originalOpcode = mutationBlock['opcode'];
        let mutantOpcode = Randomness.getInstance().pick(RelationalOperatorReplacementMutation.RELATIONAL_OPCODES);
        while (mutantOpcode === originalOpcode) {
            mutantOpcode = Randomness.getInstance().pick(RelationalOperatorReplacementMutation.RELATIONAL_OPCODES);
        }
        mutationBlock['opcode'] = mutantOpcode;
        const blockId = `${mutationBlockId.slice(0, 4)}-${target}`;
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

    /**
     * String representation of a given mutator.
     * @returns string representation of the mutator.
     */
    public toString():string{
        return 'ROR';
    }
}
