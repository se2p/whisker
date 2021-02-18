import {List} from "../utils/List";
import {NeatChromosome} from "./NeatChromosome";
import {Chromosome} from "../search/Chromosome";

export class Species<C extends NeatChromosome> {
    private _chromosomes: List<C>
    private _topFitness: number;
    private _staleNess: number;

    constructor(firstChromosome: C) {
        this._chromosomes = new List<C>();
        this._chromosomes.add(firstChromosome);
    }

    /**
     * Sorts the Chromosomes of the species in decreasing order according to its fitness values
     * @private
     */
    private sortChromosomes(): void {
        this._chromosomes.sort((a, b) => b.fitness - a._fitness);
    }

    /**
     * Calculates the adjusted fitness value of each Chromosome
     */
    public adjustedFitnessChromosome(): void {
        for (const chromosome of this._chromosomes)
            // Since the sharing function of all chromosomes within a Species results in 1,
            // simply divide by the size of the species
            chromosome.adjustedFitness = chromosome.fitness / this._chromosomes.size();
    }

    /**
     * Calculates the adjusted fitness value of the whole species
     */
    public getAdjustedFitnessTotal(): number {
        let totalAdjustedFitness = 0;
        this.adjustedFitnessChromosome();
        for (const chromosome of this.chromosomes)
            totalAdjustedFitness += chromosome.adjustedFitness;
        return totalAdjustedFitness;
    }

    /**
     * Kills the weakest member of the species
     * @param killPercentage the percentage of members to remove
     */
    public removeWeakChromosomes(killPercentage: number): void {
        this.sortChromosomes();
        const nSurvivors = Math.floor(killPercentage * this.chromosomes.size())
        this.chromosomes = this.chromosomes.subList(0, this.chromosomes.size() - nSurvivors);
    }

    /**
     * Gets the Elites of the population
     * @param eliteRate the percentage of members which should be preserved as elites
     */
    public getElites(eliteRate: number): List<C> {
        const elites = new List<C>();
        const numberElites = Math.floor(eliteRate * this.chromosomes.size());
        this.sortChromosomes();
        for (let i = 0; i < numberElites; i++) {
            elites.add(this.chromosomes.get(i))
        }
        return elites;
    }

    /**
     * Get the best Chromosome of the population
     */
    public getTopChromosome(): C {
        this.sortChromosomes();
        return this.chromosomes.get(0);
    }

    /**x
     * Breed a new Child by applying mutation only
     */
    public breedChildMutationOnly(): C {
        const parent = this.chromosomes.get(Math.floor(Math.random()) * this.chromosomes.size())
        let child = parent.clone();
        child = child.mutate();
        return child as C;
    }

    /**
     * Breed a new Child by applying Crossover followed by Mutation
     */
    public breedChildCrossoverAndMutation(): C {
        let child: NeatChromosome;
        if (this.chromosomes.size() < 2) {
            child = this.chromosomes.get(0).mutate();
            return child as C;
        }
        const parent1 = this.chromosomes.get(Math.floor(Math.random() * this.chromosomes.size()))
        let parent2 = this.chromosomes.get(Math.floor(Math.random() * this.chromosomes.size()))
        // Pick a new second parent if by chance the same parent has been selected
        while (parent2.equals(parent1))
            parent2 = this.chromosomes.get(Math.floor(Math.random() * this.chromosomes.size()))

        // In Neat we only get one Child in the process of Crossover
        child = parent1.clone();
        child = child.crossover(parent2).getFirst();
        child = child.mutate();
        return child as C;
    }

    get chromosomes(): List<C> {
        return this._chromosomes;
    }

    set chromosomes(value: List<C>) {
        this._chromosomes = value;
    }

    get topFitness(): number {
        return this._topFitness;
    }

    set topFitness(value: number) {
        this._topFitness = value;
    }

    get staleNess(): number {
        return this._staleNess;
    }

    set staleNess(value: number) {
        this._staleNess = value;
    }
}
