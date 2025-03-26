import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchMutation} from "./ScratchMutation";
import {Randomness} from "../../utils/Randomness";
import {getBlockFromId} from "scratch-analysis";
import {keys} from "../../../assembler/blocks/categories/Events";
import {BlockID} from "../../../assembler/blocks/Block";
import {Project} from "../../../assembler/project/Project";

export class KeyReplacementMutation extends ScratchMutation {
    constructor(vm: VirtualMachine) {
        super(vm);
    }

    /**
     * Applies the KeyReplacementMutation, which replaces a key that triggers an event with a randomly chosen new key.
     * @param mutationBlockId the id of the block whose key option will be replaced.
     * @param mutantProgram the mutant program in which the key will be replaced.
     * @returns true if the mutation was successful.
     */
    public applyMutation(mutationBlockId: BlockID, mutantProgram: Project): boolean {
        const mutationBlock = getBlockFromId(mutantProgram.targets, mutationBlockId);
        const originalKeyPress = mutationBlock['fields']['KEY_OPTION'][0];
        let mutantKeyPress = Randomness.getInstance().pick(keys);
        while (originalKeyPress === mutantKeyPress) {
            mutantKeyPress = Randomness.getInstance().pick(keys);
        }
        mutationBlock['fields']['KEY_OPTION'][0] = mutantKeyPress;
        mutantProgram.mutantName = `KRM:${originalKeyPress}-To-${mutantKeyPress}`;
        return true;
    }

    /**
     * Valid mutation candidates are all blocks that contain a KEY_OPTION field.
     * @returns an array of mutation candidate block ids.
     */
    public getMutationCandidates(): string[] {
        const keyBlocks: string[] = [];
        for (const [id, block] of this.blockMap.entries()) {
            if (block['fields']['KEY_OPTION']) {
                keyBlocks.push(id);
            }
        }
        return keyBlocks;
    }

    /**
     * String representation of a given mutator.
     * @returns string representation of the mutator.
     */
    public toString():string{
        return 'KRM';
    }

}
