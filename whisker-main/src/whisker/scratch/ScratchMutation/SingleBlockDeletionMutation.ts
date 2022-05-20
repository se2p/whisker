import {ScratchMutation} from "./ScratchMutation";
import {ScratchProgram} from "../ScratchInterface";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ControlFilter, StatementFilter} from "scratch-analysis/src/block-filter";


export class SingleBlockDeletionMutation extends ScratchMutation {

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * The SingleBlockDeletionMutation removes a single statement block that is neither a hat nor a branching block.
     * @param mutationBlockId the id of the block that should be deleted from the mutant program
     * @param mutantProgram the mutant program from which the mutationBlock will be deleted
     * @param target the name of the target in which the block to mutate resides.
     * @returns true if the mutation was successful.
     */
    applyMutation(mutationBlockId: Readonly<string>, mutantProgram: ScratchProgram, target:Readonly<string>): boolean {
        const mutationBlock = this.extractBlockFromProgram(mutantProgram, mutationBlockId, target);


        // Since we exclude hat blocks, every block that has no parent is a dead block and removing them is pointless.
        if (mutationBlock['parent'] === null) {
            return false;
        }
        const parent = this.extractBlockFromProgram(mutantProgram, mutationBlock['parent'], target);

        // On the other hand, the next block can be null if we are about to delete the last block in a script.
        let next: unknown;
        if (mutationBlock['next'] !== null) {
            next = this.extractBlockFromProgram(mutantProgram, mutationBlock['next'], target);
        } else {
            next = null;
        }

        // Change the pointers of the parent and next block.
        if (next !== null) {
            next['parent'] = mutationBlock['parent'];
        }
        // If the deletion block is saved in the substack field, the parent does not point to the deletion block
        // within the parent's next field.
        if (parent['next'] !== null && parent['next'].slice(0, 5) === mutationBlockId.slice(0, 5)) {
            parent['next'] = next === null ? null : mutationBlock['next'];
        }

        // If the parent points to the block within its substack field we have to bend the pointer to point to the
        // deletion block's next block.
        if ('SUBSTACK' in parent['inputs']) {
            const substackArray = parent['inputs']['SUBSTACK'];
            if (mutationBlockId.startsWith(substackArray[1] as string)) {
                substackArray[1] = mutationBlock['next'];
            }
        }

        // Some blocks have two substack fields, e.g. if-else blocks.
        if ('SUBSTACK2' in parent['inputs']) {
            const substackArray = parent['inputs']['SUBSTACK2'];
            if (mutationBlockId.startsWith(substackArray[1] as string)) {
                substackArray[1] = mutationBlock['next'];
            }
        }

        // Finally, delete the mutationBlock by removing its pointers to the next and parent block.
        mutationBlock['parent'] = null;
        mutationBlock['next'] = null;
        mutantProgram.name = `SBD:${mutationBlock['opcode']}-${mutationBlockId.slice(0, 4)}-${target}`.replace(/,/g, '');
        return true;
    }

    /**
     * Valid mutation candidates are all statements blocks that are neither hat nor branching blocks .
     * @returns an array of mutation candidate block ids.
     */
    protected getMutationCandidates(): string[] {
        const deletionCandidates: string[] = [];
        for (const [id, block] of this.blockMap.entries()) {
            if (StatementFilter.isStatementBlock(block) &&
                !block['shadow'] &&
                !ControlFilter.hatBlock(block) &&
                !ControlFilter.branch(block)) {
                deletionCandidates.push(id);
            }
        }
        return deletionCandidates;
    }

    /**
     * String representation of a given mutator.
     * @returns string representation of the mutator.
     */
    public toString():string{
        return 'SBD';
    }
}
