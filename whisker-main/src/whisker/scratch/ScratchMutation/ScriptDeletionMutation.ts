import {ScratchMutation} from "./ScratchMutation";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ControlFilter} from "scratch-analysis";
import {getBlockFromId} from "scratch-analysis";
import {Project} from "../../../assembler/project/Project";
import {BlockID} from "../../../assembler/blocks/Block";

export class ScriptDeletionMutation extends ScratchMutation {

    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * The ScriptDeletionMutation disconnects a hat block from its children, which basically leads to the deletion of
     * the script since it's no longer reachable.
     * @param mutationBlockId the id of the hat block that will be disconnected.
     * @param mutantProgram the mutant program in which the hat block will be disconnected.
     * @returns true if the mutation was successful.
     */
    public applyMutation(mutationBlockId: BlockID, mutantProgram: Project): boolean {
        const mutationBlock = getBlockFromId(mutantProgram.targets, mutationBlockId);
        if (mutationBlock['next'] !== null) {
            const nextBlock = getBlockFromId(mutantProgram.targets, mutationBlock['next']);
            nextBlock['parent'] = null;
            mutationBlock['next'] = null;
            const mutantId = this.getMutantId(mutationBlockId);
            mutantProgram.mutantName = `SDM:${mutantId}`.replace(/,/g, '');
            return true;
        } else {
            return false;
        }
    }

    /**
     * Valid mutation candidates are hat blocks.
     * @returns an array of mutation candidate block ids.
     */
    public getMutationCandidates(): string[] {
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
    public toString(): string {
        return 'SDM';
    }
}
