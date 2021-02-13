import {Mutation} from "../search/Mutation";
import {NeatChromosome} from "./NeatChromosome";
import {NeatConfig} from "./NeatConfig";


export class NeatMutation implements Mutation<NeatChromosome>{
    apply(chromosome: NeatChromosome): NeatChromosome {
        if(Math.random() <= NeatConfig.WEIGHT_MUTATION)
            this.mutateWeight(chromosome);
        return chromosome;
    }

    mutateWeight(chromosome: NeatChromosome) : NeatChromosome{
        for (const connection of chromosome.getConnections())
        {
            if (Math.random() <= NeatConfig.WEIGHT_CHANCE)
            {
                if (Math.random() < NeatConfig.PERTURB_CHANCE)
                    connection.weight = (connection.weight + (2 * Math.random() - 1) * NeatConfig.STEPS);
                else connection.weight = (4 * Math.random() - 2);
            }
        }
        return chromosome;
    }

}
