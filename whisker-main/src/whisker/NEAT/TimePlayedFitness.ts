import {FitnessFunction} from "../search/FitnessFunction";
import {NeatChromosome} from "./NeatChromosome";

export class TimePlayedFitness implements FitnessFunction<NeatChromosome> {
    compare(value1: number, value2: number): number {
        return value2 - value1;
    }

    getFitness(chromosome: NeatChromosome): number {
        chromosome.nonAdjustedFitness = chromosome.timePlayed;
        return chromosome.nonAdjustedFitness;
    }

    isCovered(chromosome: NeatChromosome): boolean {
        return this.isOptimal(this.getFitness(chromosome));
    }

    isOptimal(fitnessValue: number): boolean {
        return fitnessValue === 600;
    }

}
