import {FitnessFunction} from "../search/FitnessFunction";
import {NeatChromosome} from "./NeatChromosome";

export class ScoreFitness implements FitnessFunction<NeatChromosome> {
    compare(value1: number, value2: number): number {
        return value2 - value1;
    }

    getFitness(chromosome: NeatChromosome): number {
        chromosome.networkFitness = chromosome.points + 0.01;
        return chromosome.networkFitness;
    }

    isCovered(chromosome: NeatChromosome): boolean {
        return this.isOptimal(this.getFitness(chromosome));
    }

    isOptimal(fitnessValue: number): boolean {
        return fitnessValue === 600;
    }

}
