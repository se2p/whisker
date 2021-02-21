import {FitnessFunction} from "../search/FitnessFunction";
import {NeatChromosome} from "./NeatChromosome";

export class ScoreFitness implements FitnessFunction<NeatChromosome> {
    compare(value1: number, value2: number): number {
        return value2 - value1;
    }

    getFitness(chromosome: NeatChromosome): number {
        chromosome.nonAdjustedFitness = chromosome.points + 9;
        return chromosome.nonAdjustedFitness;
    }

    isCovered(chromosome: NeatChromosome): boolean {
        return this.isOptimal(this.getFitness(chromosome));
    }

    isOptimal(fitnessValue: number): boolean {
        return fitnessValue === 600;
    }

}
