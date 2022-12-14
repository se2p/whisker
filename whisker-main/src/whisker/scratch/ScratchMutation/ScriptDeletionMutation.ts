import {ScratchMutation} from "./ScratchMutation";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ControlFilter} from "scratch-analysis/src/block-filter";
import {ScratchProgram} from "../ScratchInterface";

export class ScriptDeletionMutation extends ScratchMutation {

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * The ScriptDeletionMutation disconnects a hat block from its childs, which basically leads to the deletion of
     * the script since it's no longer reachable.
     * @param mutationBlockId the id of the hat block that will be disconnected.
     * @param mutantProgram the mutant program in which the hat block will be disconnected.
     * @param target the name of the target in which the block to mutate resides.
     * @returns true if the mutation was successful.
     */
    applyMutation(mutationBlockId: Readonly<string>, mutantProgram: ScratchProgram, target:Readonly<string>): boolean {
        const mutationBlock = this.extractBlockFromProgram(mutantProgram, mutationBlockId, target);
        if(mutationBlock['next'] !== null) {
            const nextBlock = this.extractBlockFromProgram(mutantProgram, mutationBlock['next'], target);
            nextBlock['parent'] = null;
            mutationBlock['next'] = null;
            const blockId = `${mutationBlockId.slice(0, 4)}-${target}`;
            mutantProgram.name = `SDM:${blockId}`.replace(/,/g, '');
            return true;
        }
        else{
            return false;
        }
    }

    /**
     * Valid mutation candidates are hat blocks.
     * @returns an array of mutation candidate block ids.
     */
    protected getMutationCandidates(): string[] {
        const hatBlocks: string[] = [];
        for (const [id, block] of this.blockMap.entries()) {
            if (ControlFilter.hatBlock(block)) {
                hatBlocks.push(id);
            }
        }
        return hatBlocks;
    }

    /**
     * String representation of a given mutator.
     * @returns string representation of the mutator.
     */
    public toString():string{
        return 'SDM';
    }
}
