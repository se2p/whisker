import {ScratchMutation} from "./ScratchMutation";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchProgram} from "../ScratchInterface";
import {OperatorFilter} from "scratch-analysis/src/block-filter";
import {Randomness} from "../../utils/Randomness";

export class LogicalOperatorReplacementMutation extends ScratchMutation {

    private static readonly LOGICAL_ARITHMETIC_OPCODES = ['operator_equals', 'operator_lt', 'operator_gt']

    private static readonly LOGICAL_BOOLEAN_OPCODES = ['operator_and', 'operator_or']

    constructor(vm: VirtualMachine) {
        super(vm);
        console.log(this.originalVM);
    }

    /**
     * The LogicalOperatorReplacementMutation replaces an arithmetic logic operation ( < , == , > ) or a boolean
     * logic operation ( and, or) with a randomly chosen new operation from the same class.
     * @param mutationBlock the block whose logic operation should be replaced.
     * @param mutantProgram the mutant program in which the logic operation will be replaced.
     * @param originalBlock the corresponding block from the original Scratch program.
     * @returns true if the mutation was successful.
     */
    applyMutation(mutationBlock: unknown, mutantProgram: ScratchProgram, originalBlock:unknown): boolean {
        const originalOpcode = mutationBlock['opcode'];
        const opcodePool = OperatorFilter.logicalArithmetic(mutationBlock) ?
            LogicalOperatorReplacementMutation.LOGICAL_ARITHMETIC_OPCODES : LogicalOperatorReplacementMutation.LOGICAL_BOOLEAN_OPCODES;
        let mutantOpcode = Randomness.getInstance().pick(opcodePool);
        while (originalOpcode === mutantOpcode) {
            mutantOpcode = Randomness.getInstance().pick(opcodePool);
        }
        mutationBlock['opcode'] = mutantOpcode;
        const blockId = `${originalBlock['id'].slice(0, 4)}-${originalBlock['target']}`;
        mutantProgram.name = `LOR:${originalOpcode}-${mutantOpcode}-${blockId}`.replace(/,/g, '');
        return true;
    }

    /**
     * Valid mutation candidates are logic operation blocks.
     * @returns an array of mutation candidate block ids.
     */
    protected getMutationCandidates(): string[] {
        const arithmeticOperatorBlocks: string[] = [];
        for (const [id, block] of this.blockMap.entries()) {
            if (OperatorFilter.logical(block)) {
                arithmeticOperatorBlocks.push(id);
            }
        }
        return arithmeticOperatorBlocks;
    }


}
