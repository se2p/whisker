import {NeatChromosome} from "./NeatChromosome";
import {ExecutionTrace} from "../testcase/ExecutionTrace";
import {ConnectionGene} from "./ConnectionGene";
import {List} from "../utils/List";
import {Crossover} from "../search/Crossover";
import {Mutation} from "../search/Mutation";
import {Container} from "../utils/Container";
import {FitnessFunction} from "../search/FitnessFunction";
import {NeuroevolutionExecutor} from "./NeuroevolutionExecutor";

export class NeuroevolutionTestChromosome extends NeatChromosome{

    private _trace: ExecutionTrace

    constructor(connections : List<ConnectionGene>, crossoverOp: Crossover<NeatChromosome>, mutationOp: Mutation<NeatChromosome>) {
        super(connections, crossoverOp, mutationOp);
        this.generateNetwork();
        this._trace = null;
    }

    async evaluate(): Promise<void>{
        const executor = new NeuroevolutionExecutor(Container.vmWrapper);
        await executor.execute(this);
    }

    getFitness(fitnessFunction: FitnessFunction<this>): number {
        const fitness = fitnessFunction.getFitness(this);
        return fitness;
    }

    get trace(): ExecutionTrace {
        return this._trace;
    }

    set trace(value: ExecutionTrace) {
        this._trace = value;
    }
}
