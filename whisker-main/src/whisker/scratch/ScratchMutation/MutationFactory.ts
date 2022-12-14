import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {KeyReplacementMutation} from "./KeyReplacementMutation";
import {SingleBlockDeletionMutation} from "./SingleBlockDeletionMutation";
import {ScriptDeletionMutation} from "./ScriptDeletionMutation";
import {ArithmeticOperatorReplacementMutation} from "./ArithmeticOperatorReplacementMutation";
import {LogicalOperatorReplacementMutation} from "./LogicalOperatorReplacementMutation";
import {RelationalOperatorReplacementMutation} from "./RelationalOperatorReplacementMutation";
import {NegateConditionalMutation} from "./NegateConditionalMutation";
import {VariableReplacementMutation} from "./VariableReplacementMutation";
import {ScratchMutation} from "./ScratchMutation";
import {ScratchProgram} from "../ScratchInterface";
import Arrays from "../../utils/Arrays";

export class MutationFactory {

    constructor(private _vm: VirtualMachine) {
    }

    private fetchMutationOperators(specifiedMutators: string[]): ScratchMutation[] {
        const mutationOperators: ScratchMutation[] = [];
        for (const mutator of specifiedMutators) {
            switch (mutator) {
                case 'KRM':
                    mutationOperators.push(new KeyReplacementMutation(this._vm));
                    break;
                case 'SBD':
                    mutationOperators.push(new SingleBlockDeletionMutation(this._vm));
                    break;
                case 'SDM':
                    mutationOperators.push(new ScriptDeletionMutation(this._vm));
                    break;
                case 'AOR':
                    mutationOperators.push(new ArithmeticOperatorReplacementMutation(this._vm));
                    break;
                case 'LOR':
                    mutationOperators.push(new LogicalOperatorReplacementMutation(this._vm));
                    break;
                case 'ROR':
                    mutationOperators.push(new RelationalOperatorReplacementMutation(this._vm));
                    break;
                case 'NCM':
                    mutationOperators.push(new NegateConditionalMutation(this._vm));
                    break;
                case 'VRM':
                    mutationOperators.push(new VariableReplacementMutation(this._vm));
                    break;
                case 'ALL':
                    mutationOperators.push(
                        new KeyReplacementMutation(this._vm),
                        new SingleBlockDeletionMutation(this._vm),
                        new ScriptDeletionMutation(this._vm),
                        new ArithmeticOperatorReplacementMutation(this._vm),
                        new LogicalOperatorReplacementMutation(this._vm),
                        new RelationalOperatorReplacementMutation(this._vm),
                        new NegateConditionalMutation(this._vm),
                        new VariableReplacementMutation(this._vm));
                    break;
            }
        }
        return mutationOperators;
    }

    /**
     * Generates Scratch mutants based on the specified mutation operators.
     * @param specifiedMutators the specified mutation operations.
     * @param maxMutants the maximum number of mutants that should be returned.
     * @returns an array of the created mutants.
     */
    public generateScratchMutations(specifiedMutators: string[], maxMutants:number): ScratchProgram[] {
        if (maxMutants === undefined) {
            maxMutants = Number.MAX_SAFE_INTEGER;
        }
        const operators = this.fetchMutationOperators(specifiedMutators);
        const mutantPrograms: ScratchProgram[] = [];
        for (const mutator of operators) {
            const mutants = mutator.generateMutants();
            console.log(`Operator ${mutator} generated ${mutants.length} mutants`);
            mutantPrograms.push(...mutants);
        }

        // If we have an upper bound of desired mutants; we choose randomly selected ones until we hit the bound.
        if (mutantPrograms.length > maxMutants) {
            Arrays.shuffle(mutantPrograms);
            const reducedMutants = mutantPrograms.slice(0, maxMutants);
            console.log(`Reduced Mutants from ${mutantPrograms.length} down to ${reducedMutants.length} mutants`);
            return reducedMutants;
        }
        console.log(`Produced ${mutantPrograms.length} mutants`);
        return mutantPrograms;
    }
}
