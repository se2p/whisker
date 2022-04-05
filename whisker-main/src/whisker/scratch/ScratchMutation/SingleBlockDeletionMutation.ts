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
     * @param originalBLock the originalBlock
     * @param mutationBlock
     * @param mutantProgram
     */
    public applyMutation(originalBLock: Readonly<unknown>, mutationBlock: unknown, mutantProgram: ScratchProgram): boolean {

        // Since we exclude hat blocks, every block that has no parent is a dead block and removing them is pointless.
        if (mutationBlock['parent'] === undefined) {
            return false;
        }
        const parent = this.extractBlockFromProgram(mutantProgram, mutationBlock['parent'], originalBLock['target']);

        // On the other hand, the next block can be null if we are about to delete the last block in a script.
        let next: unknown;
        if (mutationBlock['next'] !== null) {
            next = this.extractBlockFromProgram(mutantProgram, mutationBlock['next'], originalBLock['target']);
        } else {
            next = null;
        }

        // Change the pointers of the parent and next block
        if (next !== null) {
            parent['next'] = mutationBlock['next'];
            next['parent'] = mutationBlock['parent'];
        } else {
            parent['next'] = null;
        }

        // Finally, delete the mutationBlock by removing its pointers to the next and parent block.
        mutationBlock['parent'] = undefined;
        mutationBlock['next'] = undefined;
        mutantProgram.name = `SBD:${originalBLock['opcode']}-${originalBLock['id'].slice(0, 4)}${originalBLock['target']}`;
        return true;
    }

    /**
     * Valid mutation candidates are all statements blocks that are neither hat nor branching blocks .
     * @returns an array of mutation candidate block ids.
     */
    protected getMutationCandidates(): string[] {
        const deletionCandidates: string[] = [];
        for (const [id, block] of this.blockMap.entries()) {
            if (StatementFilter.isStatementBlock(block) && !ControlFilter.hatBlock(block) && !ControlFilter.branch(block)) {
                deletionCandidates.push(id);
            }
        }
        return deletionCandidates;
    }


}
