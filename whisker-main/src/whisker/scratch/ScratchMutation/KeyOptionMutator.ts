import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {Mutator} from "./Mutator";
import {Randomness} from "../../utils/Randomness";

export class KeyOptionMutator extends Mutator {

    private static readonly KEY_OPTIONS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
        'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'space', 'up arrow', 'down arrow', 'right arrow', 'left arrow', 'any'];


    constructor(vm: VirtualMachine) {
        super(vm);
    }

    protected getMutationCandidates(): string[] {
        const keyBlocks: string[] = [];
        for (const [id, block] of this.blockMap.entries()) {
            if (block.fields.KEY_OPTION) {
                keyBlocks.push(id);
            }
        }
        return keyBlocks;
    }

    public generateMutants(): any[] {
        const mutants: VirtualMachine[] = [];
        const mutationCandidates = this.getMutationCandidates();
        for(const mutationBlockId of mutationCandidates){
            const mutantVM = JSON.parse(this.originalProjectJSON);
            const originalBlock = this.blockMap.get(mutationBlockId);
            const mutationBlock = this.getMutationBlock(mutantVM, mutationBlockId, originalBlock.target);
            if(mutationBlock !== undefined) {
                mutationBlock.fields.KEY_OPTION[0] = Randomness.getInstance().pick(KeyOptionMutator.KEY_OPTIONS);
            }
            mutants.push(mutantVM);
        }
        return mutants;
    }

}
