import {ScratchMutation} from "./ScratchMutation";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchProgram} from "../ScratchInterface";
import {OperatorFilter} from "scratch-analysis/src/block-filter";
import {Randomness} from "../../utils/Randomness";

export class ArithmeticOperatorReplacementMutation extends ScratchMutation {

    private static readonly ARITHMETIC_OPCODES = ['operator_add', 'operator_subtract', 'operator_multiply',
        'operator_divide']

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * The ArithmeticOperatorReplacementMutation replaces an arithmetic operation ( + , - , * , / ), with a different
     * randomly chosen one.
     * @param mutationBlockId the id of the block whose arithmetic operation should be replaced
     * @param mutantProgram the mutant program in which the arithmetic operation will be replaced
     * @param target the name of the target in which the block to mutate resides.
     * @returns true if the mutation was successful.
     */
    applyMutation(mutationBlockId: Readonly<string>, mutantProgram: ScratchProgram, target:Readonly<string>): boolean {
        const mutationBlock = this.extractBlockFromProgram(mutantProgram, mutationBlockId, target);
        const originalOpcode = mutationBlock['opcode'];
        let mutantOpcode = Randomness.getInstance().pick(ArithmeticOperatorReplacementMutation.ARITHMETIC_OPCODES);
        while (originalOpcode === mutantOpcode) {
            mutantOpcode = Randomness.getInstance().pick(ArithmeticOperatorReplacementMutation.ARITHMETIC_OPCODES);
        }
        mutationBlock['opcode'] = mutantOpcode;
        const blockId = `${mutationBlockId.slice(0, 4)}-${target}`;
        mutantProgram.name = `AOR:${originalOpcode}-${mutantOpcode}-${blockId}`.replace(/,/g, '');
        return true;
    }

    /**
     * Valid mutation candidates are arithmetic operation blocks.
     * @returns an array of mutation candidate block ids.
     */
    protected getMutationCandidates(): string[] {
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
