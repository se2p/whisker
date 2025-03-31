import {ScratchMutation} from "./ScratchMutation";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {Randomness} from "../../utils/Randomness";
import {OperatorFilter, getBlockFromId} from "scratch-analysis";
import {BlockID} from "../../../assembler/blocks/Block";
import {Project} from "../../../assembler/project/Project";

export class ArithmeticOperatorReplacementMutation extends ScratchMutation {

    private static readonly ARITHMETIC_OPCODES = ['operator_add', 'operator_subtract', 'operator_multiply',
        'operator_divide']

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * The ArithmeticOperatorReplacementMutation replaces an arithmetic operation (+, -, *, /), with a different
     * randomly chosen one.
     * @param mutationBlockId the id of the block whose arithmetic operation should be replaced
     * @param mutantProgram the mutant program in which the arithmetic operation will be replaced
     * @returns true if the mutation was successful.
     */
    public applyMutation(mutationBlockId: BlockID, mutantProgram: Project): boolean {
        const mutationBlock = getBlockFromId(mutantProgram.targets, mutationBlockId);
        const originalOpcode = mutationBlock['opcode'];
        let mutantOpcode = Randomness.getInstance().pick(ArithmeticOperatorReplacementMutation.ARITHMETIC_OPCODES);
        while (originalOpcode === mutantOpcode) {
            mutantOpcode = Randomness.getInstance().pick(ArithmeticOperatorReplacementMutation.ARITHMETIC_OPCODES);
        }
        mutationBlock['opcode'] = mutantOpcode;
        const mutantId = this.getMutantId(mutationBlockId);
        mutantProgram.mutantName = `AOR:${originalOpcode}-${mutantOpcode}-${mutantId}`.replace(/,/g, '');
        return true;
    }

    /**
     * Valid mutation candidates are arithmetic operation blocks.
     * @returns an array of mutation candidate block ids.
     */
     public getMutationCandidates(): string[] {
        const arithmeticOperatorBlocks: string[] = [];
        for (const [id, block] of this.blockMap.entries()) {
            if (OperatorFilter.arithmetic(block)) {
                arithmeticOperatorBlocks.push(id);
            }
        }
        return arithmeticOperatorBlocks;
    }

    /**
     * String representation of a given mutator.
     * @returns string representation of the mutator.
     */
    public toString():string{
        return 'AOR';
    }


}
