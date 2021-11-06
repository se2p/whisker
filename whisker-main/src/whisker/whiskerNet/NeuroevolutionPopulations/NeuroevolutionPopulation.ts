import {NetworkChromosome} from "../NetworkChromosome";
import {Species} from "./Species";
import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";
import {NeuroevolutionProperties} from "../NeuroevolutionProperties";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import Arrays from "../../utils/Arrays";

export abstract class NeuroevolutionPopulation<C extends NetworkChromosome> {

    /**
     * The defined search parameters.
     */
    private readonly _properties: NeuroevolutionProperties<C>;

    /**
     * The NetworkGenerator used for creating an initial population.
     */
    private readonly _generator: ChromosomeGenerator<C>

    /**
     * The starting size of the population. Should be maintained through all generations!
     */
    private readonly _startSize: number;

    /**
     * Saves all networks of the current population.
     */
    private readonly _chromosomes: C[] = [];

    /**
     * Saves all species which are currently existent.
     */
    private readonly _species: Species<C>[] = [];

    /**
     * Number of species we want to maintain through the generations.
     * To ensure this, the distanceThreshold is adjusted appropriately in each generation.
     */
    private readonly _numberOfSpeciesTargeted: number;

    /**
     * The number of encountered species through all generations.
     */
    private _speciesCount = 0;

    /**
     * The average fitness of the current generation. Used for reporting purposes.
     */
    private _averageFitness = 0;

    /**
     * The highest fitness value ever achieved through all generations.
     */
    private _highestFitness = 0;

    /**
     * Number of iterations since the highest network fitness has improved.
     */
    private _highestFitnessLastChanged = 0;

    /**
     * Saves the number of the current generation.
     */
    private _generation = 0;

    /**
     * Points to the populationChampion.
     */
    private _populationChampion: C;

    /**
     * Constructs a new NEATPopulation
     * @param generator the chromosomeGenerator used for creating the initial population.
     * @param properties the defined search parameters
     */
    public constructor(generator: ChromosomeGenerator<C>, properties: NeuroevolutionProperties<C>) {
        this._startSize = properties.populationSize;
        this._numberOfSpeciesTargeted = properties.numberOfSpecies;
        this._generator = generator;
        this._properties = properties;
    }

    /**
     * Calculates the SharedFitness of each Chromosome in its Species and determines which Chromosomes are allowed
     * to reproduce.
     */
    protected abstract calculateFitnessDistribution(): void;

    /**
     * Assigns the number of Offspring each Chromosome/Species is allowed to produce.
     */
    protected abstract assignNumberOfOffspring(): void;

    /**
     * Deep Clone of a concrete NeuroevolutionPopulation.
     * @returns clone of concrete NeuroevolutionPopulation.
     */
    public abstract clone(): NeuroevolutionPopulation<C>;

    /**
     * Generates an initial population of networks.
     */
    public generatePopulation(): void {
        while (this.populationSize() < this.startSize) {
            const chromosome = this.generator.get();
            this.chromosomes.push(chromosome)
            NeuroevolutionUtil.speciate(chromosome, this, this.properties);
        }
        console.log("Starting Species: ", this.species);
    }

    /**
     * Calculates the shared fitness of each species member and infers the number of children each species is allowed
     * to produce in the next evolution step.
     */
    public updatePopulationStatistics(): void {
        this.updateCompatibilityThreshold();
        this.calculateFitnessDistribution();
        this.assignNumberOfOffspring();
        this.calculateAverageNetworkFitness();
    }

    /**
     * Applies evolution to the current population -> generate the next generation from the current one.
     */
    public evolve(): void {
        // Remove the Chromosomes with a death mark on them.
        for (const chromosome of this.chromosomes) {
            if (chromosome.hasDeathMark) {
                const specie = chromosome.species;
                specie.removeChromosome(chromosome);
                Arrays.remove(this.chromosomes, chromosome);
            }
        }

        // Now let the reproduction start
        const offspring = [];
        for (const specie of this.species) {
            offspring.push(specie.breed(this, this.species));
        }

        // Speciate the produced offspring
        for (const child of offspring) {
            NeuroevolutionUtil.speciate(child, this, this.properties)
        }

        // Remove the parents from the population and the species. The new ones still exist within their species
        for (const chromosome of this.chromosomes) {
            const specie = chromosome.species;
            specie.removeChromosome(chromosome);
        }
        Arrays.clear(this.chromosomes);

        // Remove empty species and age the ones that survive.
        // Furthermore, add the members of the surviving species to the population List
        const doomedSpecies = [];
        for (const specie of this._species) {
            if (specie.chromosomes.length === 0) {
                doomedSpecies.push(specie);
            } else {
                // Give the new species an age bonus!
                if (specie.isNovel)
                    specie.isNovel = false;
                else
                    specie.age++;
                for (const chromosome of specie.chromosomes) {
                    this.chromosomes.push(chromosome);
                }
            }
        }
        for (const specie of doomedSpecies) {
            Arrays.remove(this.species, specie);
        }
        this.generation++;
    }

    /**
     * Updates the CompatibilityThreshold with the goal of obtaining the desired amount of species.
     */
    private updateCompatibilityThreshold(): void {
        const compatibilityModifier = 0.3;
        if (this.generation > 1) {
            if (this.species.length < this.numberOfSpeciesTargeted)
                this.properties.distanceThreshold -= compatibilityModifier;
            else if (this.species.length > this.numberOfSpeciesTargeted)
                this.properties.distanceThreshold += compatibilityModifier;

            if (this.properties.distanceThreshold < 0.3)
                this.properties.distanceThreshold = 0.3;
        }
    }

    /**
     * Returns the size of the population
     * @return population Size
     */
    public populationSize(): number {
        return this.chromosomes.length;
    }

    /**
     * Sorts the population according to the networkFitness in decreasing order.
     */
    protected sortPopulation(): void {
        this.chromosomes.sort((a, b) => b.networkFitness - a.networkFitness)
    }

    /**
     * Sorts the species List according to their champion's networkFitness in decreasing order.
     */
    protected sortSpecies(): void {
        this.species.sort((a, b) => b.expectedOffspring - a.expectedOffspring)
    }

    /**
     * Calculates the average fitness of the whole population. Used for reporting.
     */
    private calculateAverageNetworkFitness(): void {
        let sum = 0;
        for (const chromosome of this.chromosomes)
            sum += chromosome.networkFitness;
        this.averageFitness = sum / this.populationSize();
    }

    /**
     * Transform this NeatPopulation into a JSON representation.
     * @return Record containing this NeatPopulation's attributes mapped to the corresponding values.
     */
    public toJSON(): Record<string, (number | Species<C>)> {
        const population = {};
        population[`averageFitness`] = this.averageFitness;
        population[`HighestFitness`] = this.highestFitness;
        population[`PopulationChampionId`] = this.populationChampion.id;
        for (let i = 0; i < this.species.length; i++) {
            population[`Species ${i}`] = this.species[i].toJSON();
        }
        return population;
    }

    get chromosomes(): C[] {
        return this._chromosomes;
    }

    get species(): Species<C>[] {
        return this._species;
    }

    get speciesCount(): number {
        return this._speciesCount;
    }

    set speciesCount(value: number) {
        this._speciesCount = value;
    }

    get highestFitness(): number {
        return this._highestFitness;
    }

    set highestFitness(value: number) {
        this._highestFitness = value;
    }

    get highestFitnessLastChanged(): number {
        return this._highestFitnessLastChanged;
    }

    set highestFitnessLastChanged(value: number) {
        this._highestFitnessLastChanged = value;
    }

    get generation(): number {
        return this._generation;
    }

    set generation(value: number) {
        this._generation = value;
    }

    get populationChampion(): C {
        return this._populationChampion;
    }

    set populationChampion(value: C) {
        this._populationChampion = value;
    }

    get startSize(): number {
        return this._startSize;
    }

    get averageFitness(): number {
        return this._averageFitness;
    }

    set averageFitness(value: number) {
        this._averageFitness = value;
    }

    get properties(): NeuroevolutionProperties<C> {
        return this._properties;
    }

    get numberOfSpeciesTargeted(): number {
        return this._numberOfSpeciesTargeted;
    }

    get generator(): ChromosomeGenerator<C> {
        return this._generator;
    }
}
