import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {getBlockMap} from 'scratch-analysis/src/control-flow-graph'


export abstract class Mutator {

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
     * Generates a list of generated mutants based on the extracted mutation candidates and the original VM.
     */
    public abstract generateMutants(): Record<string, unknown>[];


    /**
     * Extracts the block that will be mutation from a cloned mutant VM.
     * @param mutantVM the cloned mutant VM.
     * @param mutantBlockId the block id of the block that should be mutated.
     * @param targetName the target whose block will be mutated.
     */
    protected getMutationBlock(mutantVM: VirtualMachine, mutantBlockId: string, targetName: string): unknown {
        const targetBlocks = mutantVM.targets.find(target => target.name === targetName).blocks;
        for (const [id, block] of Object.entries(targetBlocks)) {
            if (mutantBlockId.startsWith(id)) {
                return block;
            }
        }
        return undefined;
    }

}
