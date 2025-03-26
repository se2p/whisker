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
import {Randomness} from "../../utils/Randomness";
import logger from '../../../util/logger';
import {Project} from "../../../assembler/project/Project";

export class MutationFactory {

    /**
     * Mapping of specified mutations and instantiated operators.
     */
    private _mutators: Map<string, ScratchMutation> = new Map<string, ScratchMutation>();

    /**
     * Array of feasible mutation operations, where each element is of the form "operator-mutationId"
     * @private
     */
    private _candidates: Set<string> = new Set<string>();

    constructor(vm: Readonly<VirtualMachine>, _specifiedMutators: string[]) {
        this.initialiseCandidateArray(vm, _specifiedMutators);
    }

    /**
     * Initialises an array of feasible mutation candidates based on the specified mutation operators.
     * @param vm The virtual machine hosting the original non-mutated Scratch program.
     * @param specifiedMutators The mutators that will be used to mutate the Scratch program.
     */
    private initialiseCandidateArray(vm: Readonly<VirtualMachine>, specifiedMutators: string[]) {
        this.initialiseMutationOperators(vm, specifiedMutators);
        for (const operator of this._mutators.values()) {
            const operatorCandidates = operator.getMutationCandidates();
            logger.info(`Operator ${operator} corresponds to ${operatorCandidates.length} mutation candidates`);
            operatorCandidates.forEach(candidate => this._candidates.add(`${operator}-${candidate}`));
        }
    }

    /**
     * Generates for every specified mutation operator the respective mutation class.
     * @param vm The virtual machine hosting the original non-mutated Scratch program.
     * @param specifiedMutators The mutators that will be used to mutate the Scratch program.
     */
    private initialiseMutationOperators(vm: Readonly<VirtualMachine>, specifiedMutators: string[]) {
        for (const mutator of specifiedMutators) {
            switch (mutator) {
                case 'KRM':
                    this._mutators.set(mutator, new KeyReplacementMutation(vm));
                    break;
                case 'SBD':
                    this._mutators.set(mutator, new SingleBlockDeletionMutation(vm));
                    break;
                case 'SDM':
                    this._mutators.set(mutator, new ScriptDeletionMutation(vm));
                    break;
                case 'AOR':
                    this._mutators.set(mutator, new ArithmeticOperatorReplacementMutation(vm));
                    break;
                case 'LOR':
                    this._mutators.set(mutator, new LogicalOperatorReplacementMutation(vm));
                    break;
                case 'ROR':
                    this._mutators.set(mutator, new RelationalOperatorReplacementMutation(vm));
                    break;
                case 'NCM':
                    this._mutators.set(mutator, new NegateConditionalMutation(vm));
                    break;
                case 'VRM':
                    this._mutators.set(mutator, new VariableReplacementMutation(vm));
                    break;
                case 'ALL':
                    this._mutators.set('KRM', new KeyReplacementMutation(vm));
                    this._mutators.set('SBD', new SingleBlockDeletionMutation(vm));
                    this._mutators.set('SDM', new ScriptDeletionMutation(vm));
                    this._mutators.set('AOR', new ArithmeticOperatorReplacementMutation(vm));
                    this._mutators.set('LOR', new LogicalOperatorReplacementMutation(vm));
                    this._mutators.set('ROR', new RelationalOperatorReplacementMutation(vm));
                    this._mutators.set('NCM', new NegateConditionalMutation(vm));
                    this._mutators.set('VRM', new VariableReplacementMutation(vm));
                    break;
            }
        }
    }

    /**
     * Generates a random Scratch mutant from the set of available mutation candidates and
     * removes the generated mutant from the set of available candidates.
     * @returns The generated scratch mutant or null if the mutation operation was unsuccessful.
     */
    public generateRandomMutant(): Project | null {
        const mutationCandidate = Randomness.getInstance().pick(Array.from(this._candidates));
        this._candidates.delete(mutationCandidate);
        const [operatorKey, ...mutationID] = mutationCandidate.split("-");
        const operator = this._mutators.get(operatorKey);
        return operator.generateMutant(mutationID.join("-"));
    }


    get candidates(): Set<string> {
        return this._candidates;
    }
}
