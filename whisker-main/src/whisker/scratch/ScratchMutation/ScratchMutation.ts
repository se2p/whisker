import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {getBlockMap} from '../../../../../scratch-analysis/src/control-flow-graph';
import {ScratchProgram} from "../ScratchInterface";
import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";


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
     * Returns an array of block id's indicating mutation candidates of a given mutator.
     */
    public abstract getMutationCandidates(): string[];

    /**
     * Applies the instantiated mutation operator.
     * @param mutationBlockId the id  of the block that will be mutated.
     * @param mutantProgram the mutant program in which the mutationBlock resides.
     * @param target the name of the target in which the block to mutate resides.
     */
    public abstract applyMutation(mutationBlockId: Readonly<string>, mutantProgram: ScratchProgram,
                                  target: Readonly<string>): boolean

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
    public generateMutant(mutationID: string): ScratchProgram | null {
        const mutantProgram: ScratchProgram = JSON.parse(this.originalProjectJSON);
        const originalBlock = this.blockMap.get(mutationID);
        if (this.applyMutation(mutationID, mutantProgram, originalBlock['target'])) {
            return mutantProgram;
        }
        return null;
    }

    /**
     * Generates mutants based on the specified mutation operator.
     * @returns Array of generated mutants.
     */
    public generateMutants(): ScratchProgram[] {
        const mutants: ScratchProgram[] = [];
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
     * Extracts the block that will be mutation from a cloned mutant VM.
     * @param program the Scratch program from which a block should be extracted.
     * @param blockId the id of the block that should be extracted.
     * @param targetName the target in which the requested block resides. This information is necessary since the
     * block ids in the default Scratch program are not extended with the target names.
     */
    protected extractBlockFromProgram(program: ScratchProgram, blockId: string, targetName: string): unknown | undefined {
        // blockId can be null, e.g. when we are trying to extract a parent block but the block does not exist.
        if (blockId === null) {
            return undefined;
        }

        const targetBlocks = program.targets.find((target) => this.isTarget(targetName, target)).blocks;
        for (const [id, block] of Object.entries(targetBlocks)) {
            if (blockId.startsWith(id)) {
                return block;
            }
        }
        return undefined;
    }

    /**
     * Checks whether the given RenderedTarget corresponds to the given target name.
     * @param targetName The name of the target.
     * @param target The given target that will be evaluated whether it corresponds to the given name.
     * @returns true if the given target corresponds to the given name.
     */
    protected isTarget(targetName: string, target: RenderedTarget): boolean {
        if (targetName == '_stage_') {  // Special handling for stages since they have a unique identifier.
            return target.isStage;
        } else {
            return !target.isStage && target.name === targetName;
        }
    }
}
