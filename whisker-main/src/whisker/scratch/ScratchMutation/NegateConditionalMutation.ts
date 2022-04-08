import {ScratchMutation} from "./ScratchMutation";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchProgram} from "../ScratchInterface";
import {OperatorFilter} from "scratch-analysis/src/block-filter";
import uid from "scratch-vm/src/util/uid";

export class NegateConditionalMutation extends ScratchMutation {

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * The NegateConditionalMutation negates a selected diamond shaped conditional block by inserting a not block.
     * @param mutationBlock the block that will be negated.
     * @param mutantProgram the mutant program in which the conditional block will be negated
     * @param originalBlock the corresponding diamond shaped conditional block from the original Scratch program.
     * @returns true if the mutation was successful.
     */
    applyMutation(mutationBlock: unknown, mutantProgram: ScratchProgram, originalBlock?: Readonly<unknown>): boolean {
        const not_block = NegateConditionalMutation.notBlockGenerator(originalBlock);
        const parent = this.extractBlockFromProgram(mutantProgram, mutationBlock['parent'], originalBlock['target']);
        mutationBlock['parent'] = not_block['id'];

        // Modify the parent block to point to the wrapping not block instead of the negated conditional diamond block
        if (parent['inputs']['CONDITION'] !== undefined) {
            parent['inputs']['CONDITION'][1] = not_block['id'];
        } else if (parent['inputs']['OPERAND']) {
            parent['inputs']['OPERAND'][1] = not_block['id'];
        } else {
            console.log(`Unknown parent block ${parent['id']} for ${mutantProgram.name}`);
            return false;
        }

        // Add the not block to the mutant program
        const sourceTarget = mutantProgram.targets.find(target => target.name === originalBlock['target']);
        if (sourceTarget !== undefined) {
            sourceTarget.blocks[not_block['id']] = not_block;
        } else {
            console.log(`Unknown source target ${originalBlock['target']} for program ${mutantProgram.name}`);
            return false;
        }

        const blockId = `${originalBlock['id'].slice(0, 4)}-${originalBlock['target']}`;
        mutantProgram.name = `NCM:${blockId}`.replace(/,/g, '');
        return true;
    }

    /**
     * Valid mutation candidates are negatable conditional blocks.
     * @returns an array of mutation candidate block ids.
     */
    protected getMutationCandidates(): string[] {
        const conditionalBlocks: string[] = [];
        for (const [id, block] of this.blockMap.entries()) {
            // Negating a not block is pointless since we negate its argument anyway.
            if (OperatorFilter.negatable(block) && block['opcode'] !== 'operator_not') {
                conditionalBlocks.push(id);
            }
        }
        return conditionalBlocks;
    }

    /**
     * Generates a not block given the block that should be negated.
     * @param blockToNegate the block that should be negated.
     * @returns not block with the block to negate as operand
     */
    private static notBlockGenerator(blockToNegate: Readonly<unknown>): unknown {
        const blockToNegateId = blockToNegate['id'].split(`-${blockToNegate['target']}`)[0];
        const parentId = blockToNegate['parent'].split(`-${blockToNegate['target']}`)[0];
        return {
            fields: {},
            id: uid(),
            inputs: {
                OPERAND: [
                    2,
                    blockToNegateId,
                ]
            },
            opcode: "operator_not",
            next: null,
            parent: parentId,
            shadow: false,
            topLevel: false
        };

    }

}
