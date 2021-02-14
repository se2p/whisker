import {List} from "../utils/List";
import {NeatChromosome} from "./NeatChromosome";

export class Species<C extends NeatChromosome> {
    private _chromosomes: List<C>

    constructor(firstChromosome: C) {
        this._chromosomes = new List<C>();
        this._chromosomes.add(firstChromosome);
    }

    public sortGenomes(): void {
        // Sort in decreasing order according to the fitness values of the Chromosomes
        this._chromosomes.sort((a, b) => b.fitness - a._fitness);
    }

    public adjustedFitness(): void {
        for (const chromosome of this._chromosomes)
            // Since the sharing function of all chromosomes within a Species results in 1,
            // simply divide by the size of the species
            chromosome.adjustedFitness = chromosome.fitness / this._chromosomes.size();
    }

    public removeWeakChromosomes(nSurvivors: number): void {
        this.sortGenomes();
        this.chromosomes = this.chromosomes.subList(0, nSurvivors);
    }


    get chromosomes(): List<C> {
        return this._chromosomes;
    }

    set chromosomes(value: List<C>) {
        this._chromosomes = value;
    }
}
