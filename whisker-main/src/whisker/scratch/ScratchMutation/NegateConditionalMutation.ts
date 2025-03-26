import {ScratchMutation} from "./ScratchMutation";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import uid from "scratch-vm/src/util/uid";
import logger from "../../../util/logger";
import {OperatorFilter, getHostingTarget, getBlockFromId} from "scratch-analysis";
import {BlockID} from "../../../assembler/blocks/Block";
import {Project} from "../../../assembler/project/Project";
import {OperatorNot} from "../../../assembler/blocks/categories/Operators";

export class NegateConditionalMutation extends ScratchMutation {

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * The NegateConditionalMutation negating a selected diamond shaped conditional block by inserting a not block.
     * @param mutationBlockId the id of the block that will be negated.
     * @param mutantProgram the mutant program in which the conditional block will be negated
     * @returns true if the mutation was successful.
     */
    public applyMutation(mutationBlockId: BlockID, mutantProgram: Project): boolean {
        const mutantId = this.getMutantId(mutationBlockId);
        mutantProgram.mutantName = `NCM:${mutantId}`.replace(/,/g, '');

        const mutationBlock = getBlockFromId(mutantProgram.targets, mutationBlockId);
        const not_block = NegateConditionalMutation.notBlockGenerator(mutationBlockId, mutationBlock['parent']);

        // The parent of the mutated block.
        const parent = getBlockFromId(mutantProgram.targets, mutationBlock['parent']);

        // Only if the parent exists, modify the parent block to point to the wrapping not block instead of the negated
        // conditional diamond block
        if (parent) {
            mutationBlock['parent'] = not_block['id'];

            if (parent['inputs']['CONDITION'] !== undefined) {
                parent['inputs']['CONDITION'][1] = not_block['id'];
            } else if (parent['inputs']['OPERAND']) {
                parent['inputs']['OPERAND'][1] = not_block['id'];
            } else if (parent['inputs']['TOUCHINGOBJECTMENU']) {
                parent['inputs']['TOUCHINGOBJECTMENU'][1] = not_block['id'];
            } else if (parent['inputs']['OPERAND1'][1] === mutationBlockId) {
                parent['inputs']['OPERAND1'][1] = not_block['id'];
            } else if (parent['inputs']['OPERAND2'][1] === mutationBlockId) {
                parent['inputs']['OPERAND2'][1] = not_block['id'];
            } else {
                logger.warn(`Unknown parent block ${parent['id']} for ${mutantProgram.mutantName}`);
                return false;
            }
        }

        const sourceTarget = getHostingTarget(mutantProgram.targets, mutationBlockId);
        if (sourceTarget === null) {
            return false;
        }
        sourceTarget.blocks[not_block['id']] = not_block;
        return true;
    }

    /**
     * Valid mutation candidates are conditional blocks that can be negated.
     * @returns an array of mutation candidate block ids.
     */
    public getMutationCandidates(): BlockID[] {
        const conditionalBlocks: BlockID[] = [];
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
     * @param blockToNegateId the id of the block that should be negated.
     * @param parentId the id of the parent holding the block to negate
     * @returns not block with the block to negate as operand
     */
    private static notBlockGenerator(blockToNegateId: BlockID, parentId: BlockID): OperatorNot {
        return {
            fields: {},
            id: uid(), // non-standard property...
            inputs: {
                OPERAND: [
                    2,
                    blockToNegateId
                ]
            },
            opcode: "operator_not",
            next: null,
            parent: parentId,
            shadow: false,
            topLevel: false
        } as OperatorNot;
    }

    /**
     * String representation of a given mutator.
     * @returns string representation of the mutator.
     */
    public toString(): string {
        return 'NCM';
    }
}
