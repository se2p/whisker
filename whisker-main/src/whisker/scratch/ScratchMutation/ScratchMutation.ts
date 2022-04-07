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
     * Applies the instantiated mutation operator.
     * @param mutationBlock the block that will be mutated.
     * @param mutantProgram the mutant program in which the mutationBlock resides.
     * @param originalBlock the corresponding block from the original Scratch Program, we need this one since it holds
     * additional information such as the source sprite name.
     */
    public abstract applyMutation(mutationBlock: unknown, mutantProgram: ScratchProgram,
                                  originalBlock?: Readonly<unknown>): boolean;

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
                if (this.applyMutation(mutationBlock, mutantProgram, originalBlock)) {
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
