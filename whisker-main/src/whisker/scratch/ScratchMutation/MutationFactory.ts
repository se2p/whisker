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
import {Randomness} from "../../utils/Randomness";

export class MutationFactory {

    /**
     * Array of feasible mutation operations, where each element is of the form "operator-mutationId"
     * @private
     */
    private _candidates: Set<string> = new Set<string>();

    constructor(private _vm: VirtualMachine, _specifiedMutators: string[]) {
        this.initialiseCandidateArray(_specifiedMutators);
    }

    /**
     * Initialises an array of feasible mutation candidates based on the specified mutation operators.
     * @param specifiedMutators The specified mutation operators.
     */
    private initialiseCandidateArray(specifiedMutators: string[]) {
        const operators = this.fetchMutationOperators(specifiedMutators);
        for (const operator of operators) {
            const operatorCandidates = operator.getMutationCandidates();
            console.log(`Operator ${operator} corresponds to ${operatorCandidates.length} mutation candidates`);
            operatorCandidates.forEach(candidate => this._candidates.add(`${operator}-${candidate}`));
        }
    }

    /**
     * Generates for every specified mutation operator the respective mutation class.
     * @param specifiedMutators The
     * @private
     */
    private fetchMutationOperators(specifiedMutators: string[]): Set<ScratchMutation> {
        const mutationOperators = new Set<ScratchMutation>();
        for (const mutator of specifiedMutators) {
            switch (mutator) {
                case 'KRM':
                    mutationOperators.add(new KeyReplacementMutation(this._vm));
                    break;
                case 'SBD':
                    mutationOperators.add(new SingleBlockDeletionMutation(this._vm));
                    break;
                case 'SDM':
                    mutationOperators.add(new ScriptDeletionMutation(this._vm));
                    break;
                case 'AOR':
                    mutationOperators.add(new ArithmeticOperatorReplacementMutation(this._vm));
                    break;
                case 'LOR':
                    mutationOperators.add(new LogicalOperatorReplacementMutation(this._vm));
                    break;
                case 'ROR':
                    mutationOperators.add(new RelationalOperatorReplacementMutation(this._vm));
                    break;
                case 'NCM':
                    mutationOperators.add(new NegateConditionalMutation(this._vm));
                    break;
                case 'VRM':
                    mutationOperators.add(new VariableReplacementMutation(this._vm));
                    break;
                case 'ALL':
                    mutationOperators.add(new KeyReplacementMutation(this._vm));
                    mutationOperators.add(new SingleBlockDeletionMutation(this._vm));
                    mutationOperators.add(new ScriptDeletionMutation(this._vm));
                    mutationOperators.add(new ArithmeticOperatorReplacementMutation(this._vm));
                    mutationOperators.add(new LogicalOperatorReplacementMutation(this._vm));
                    mutationOperators.add(new RelationalOperatorReplacementMutation(this._vm));
                    mutationOperators.add(new NegateConditionalMutation(this._vm));
                    mutationOperators.add(new VariableReplacementMutation(this._vm));
                    break;
            }
        }
        return mutationOperators;
    }

    /**
     * Generates a random Scratch mutant from the set of available mutation candidates and
     * removes the generated mutant from the set of available candidates.
     * @returns The generated scratch mutant or null if the mutation operation was unsuccessful.
     */
    public generateRandomMutant(): ScratchProgram | null {
        const mutationCandidate = Randomness.getInstance().pick(Array.from(this._candidates));
        this._candidates.delete(mutationCandidate);
        const [operatorKey, ...mutationID] = mutationCandidate.split("-");
        const operator = Array.from(this.fetchMutationOperators([operatorKey]))[0];
        return operator.generateMutant(mutationID.join("-"));
    }


    get candidates(): Set<string> {
        return this._candidates;
    }
}
