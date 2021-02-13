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
            if (Math.random() <= NeatConfig.WEIGHT_PERTURB_CHANCE)
            {
                const test = this.randomNumber(-1, 1)
                connection.weight += this.randomNumber(-1, 1);
            }
        }
        return chromosome;
    }

    private randomNumber(min : number, max:number) : number{
        return Math.random() * (max-min) + min
    }

}
