import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {Mutator} from "./Mutator";
import {Randomness} from "../../utils/Randomness";
import {ScratchProgram} from "../ScratchInterface";

export class KeyReplacementOperator extends Mutator {

    private static readonly KEY_OPTIONS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
        'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'space', 'up arrow', 'down arrow', 'right arrow', 'left arrow', 'any'];


    constructor(vm: VirtualMachine) {
        super(vm);
    }

    protected getMutationCandidates(): string[] {
        const keyBlocks: string[] = [];
        for (const [id, block] of this.blockMap.entries()) {
            if (block['fields']['KEY_OPTION']) {
                keyBlocks.push(id);
            }
        }
        return keyBlocks;
    }

    public generateMutants(): ScratchProgram[] {
        const mutants: ScratchProgram[] = [];
        const mutationCandidates = this.getMutationCandidates();
        for (const mutationBlockId of mutationCandidates) {
            const mutantProgram: ScratchProgram = JSON.parse(this.originalProjectJSON);
            const originalBlock = this.blockMap.get(mutationBlockId);
            const mutationBlock = this.getMutationBlock(mutantProgram, mutationBlockId, originalBlock['target']);
            if (mutationBlock !== undefined) {
                const originalKeyPress = mutationBlock['fields']['KEY_OPTION'][0];
                let mutantKeyPress = Randomness.getInstance().pick(KeyReplacementOperator.KEY_OPTIONS);
                while (originalKeyPress === mutantKeyPress) {
                    mutantKeyPress = Randomness.getInstance().pick(KeyReplacementOperator.KEY_OPTIONS);
                }
                mutationBlock['fields']['KEY_OPTION'][0] = mutantKeyPress;
                mutantProgram.name = `KRM:${originalKeyPress}-To-${mutantKeyPress}`;
                mutants.push(mutantProgram);
            }
        }
        return mutants;
    }

}
