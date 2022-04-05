import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {getBlockMap} from 'scratch-analysis/src/control-flow-graph';
import {ScratchProgram} from "../ScratchInterface";


export abstract class ScratchMutation {

    /**
     * Maps blockIds to the corresponding blocks of a Scratch program.
     */
    protected readonly blockMap: Map<string, unknown>;

    /**
     * JSON representation of the original project.
     */
    protected readonly originalProjectJSON

    protected constructor(protected readonly originalVM: VirtualMachine) {
        this.blockMap = getBlockMap(this.originalVM.runtime.targets);
        this.originalProjectJSON = this.originalVM.toJSON();
    }

    /**
     * Returns a list of block id's indicating mutation candidates of a given mutator.
     */
    protected abstract getMutationCandidates(): string[];

    /**
     * Applies the given mutation operator.
     * @returns true if the mutation was successful.
     */
    public abstract applyMutation(originalBlock: Readonly<unknown>, mutationBlock: unknown, mutantProgram: ScratchProgram): boolean;

    /**
     * Generates mutants based on the specified mutation operator.
     */
    public generateMutants(): ScratchProgram[] {
        const mutants: ScratchProgram[] = [];
        const mutationCandidates = this.getMutationCandidates();
        for (const mutationBlockId of mutationCandidates) {
            const mutantProgram: ScratchProgram = JSON.parse(this.originalProjectJSON);
            const originalBlock = this.blockMap.get(mutationBlockId);
            const mutationBlock = this.extractBlockFromProgram(mutantProgram, mutationBlockId, originalBlock['target']);
            if (mutationBlock !== undefined) {
                if (this.applyMutation(originalBlock, mutationBlock, mutantProgram)) {
                    mutants.push(mutantProgram);
                }
            }
        }
        return mutants;
    }


    /**
     * Extracts the block that will be mutation from a cloned mutant VM.
     * @param program the Scratch program from which a block should be extracted.
     * @param blockId the id of the block that should be extracted.
     * @param targetName the target in which the requested block resides. This information is necessary since the
     * block ids in the default Scratch program are not extended with the target names.
     */
    protected extractBlockFromProgram(program: ScratchProgram, blockId: string, targetName: string): unknown | undefined {
        const targetBlocks = program.targets.find(target => target.name === targetName).blocks;
        for (const [id, block] of Object.entries(targetBlocks)) {
            if (blockId.startsWith(id)) {
                return block;
            }
        }
        return undefined;
    }

}
