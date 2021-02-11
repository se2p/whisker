import {Mutation} from "../search/Mutation";
import {NeatChromosome} from "./NeatChromosome";

// TODO: Implement Mutation (Node ADD mutation, Connection Mutation)

export class NeatMutation implements Mutation<NeatChromosome>{
    apply(chromosome: NeatChromosome): NeatChromosome {
        return undefined;
    }

}
