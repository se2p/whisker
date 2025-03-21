import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {getBlockMap} from 'scratch-analysis/src/control-flow-graph';
import {Project} from "../../../assembler/project/Project";
import {Block, BlockID} from "../../../assembler/blocks/Block";


export abstract class ScratchMutation {

    /**
     * Maps blockIds to the corresponding blocks of a Scratch program.
     */
    protected readonly blockMap: Map<BlockID, Block>;

    /**
     * JSON representation of the original project.
     */
    protected readonly originalProjectJSON: string

    protected constructor(originalVM: Readonly<VirtualMachine>) {
        this.blockMap = getBlockMap(originalVM.runtime.targets);
        this.originalProjectJSON = originalVM.toJSON();
    }

    /**
     * Returns an array of block id's indicating mutation candidates of a given mutator.
     */
    public abstract getMutationCandidates(): string[];

    /**
     * Applies the instantiated mutation operator.
     * @param mutationBlockId the id of the block that will be mutated.
     * @param mutantProgram the mutant program in which the mutationBlock resides.
     */
    public abstract applyMutation(mutationBlockId: string, mutantProgram: Project): boolean

    /**
     * String representation of a given mutator.
     * @returns string representation of the mutator.
     */
    public abstract toString(): string

    /**
     * Generates a single mutant based on the specified mutation specifier.
     * @param mutationID The identifier specifying which Scratch mutant to generate.
     * @returns The generated mutant or null if something goes wrong during the mutant generation process.
     */
    public generateMutant(mutationID: string): Project | null {
        const mutantProgram: Project = JSON.parse(this.originalProjectJSON);
        if (this.applyMutation(mutationID, mutantProgram)) {
            return mutantProgram;
        }
        return null;
    }

    /**
     * Generates mutants based on the specified mutation operator.
     * @returns Array of generated mutants.
     */
    public generateMutants(): Project[] {
        const mutants: Project[] = [];
        const mutationCandidates = this.getMutationCandidates();
        for (const mutationBlockId of mutationCandidates) {
            const mutant = this.generateMutant(mutationBlockId);
            if (mutant !== null) {
                mutants.push(mutant);
            }
        }
        return mutants;
    }

    /**
     * Generates an identifier for the mutation operator based on the mutated block.
     * @param blockId The mutated block.
     * @returns Identifier for mutation operation.
     */
    protected getMutantId(blockId: string): string {
        return blockId.substring(0, 5);
    }
}
