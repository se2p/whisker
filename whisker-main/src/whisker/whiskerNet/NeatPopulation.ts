import {List} from "../utils/List";
import {NetworkChromosome} from "./NetworkChromosome";
import {Species} from "./Species";
import {ChromosomeGenerator} from "../search/ChromosomeGenerator";
import {NeuroevolutionProperties} from "./NeuroevolutionProperties";
import {NeuroevolutionUtil} from "./NeuroevolutionUtil";

export class NeatPopulation<C extends NetworkChromosome> {

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
    private readonly _chromosomes: List<C>;

    /**
     * Saves all species which are currently existent.
     */
    private readonly _species: List<Species<C>>;

    /**
     * Number of species we want to maintain through the generations.
     * To ensure this, the distanceThreshold is adjusted appropriately in each generation.
     */
    private readonly _numberOfSpeciesTargeted: number;

    /**
     * The number of encountered species through all generations.
     */
    private _speciesCount: number;

    /**
     * The average fitness of the current generation. Used for reporting purposes.
     */
    private _averageFitness: number;

    /**
     * The highest fitness value ever achieved through all generations.
     */
    private _highestFitness: number;

    /**
     * Number of iterations since the highest network fitness has improved.
     */
    private _highestFitnessLastChanged: number

    /**
     * Saves the number of the current generation.
     */
    private _generation: number;

    /**
     * Points to the populationChampion.
     */
    private _populationChampion: C;

    /**
     * Constructs a new NEATPopulation
     * @param size the size of the population
     * @param numberOfSpecies the number of species we want to maintain through the generations.
     * @param generator the chromosomeGenerator used for creating the initial population.
     * @param properties the defined search parameters
     * @param generatePopulation determines whether the constructor should generate a new Population
     */
    constructor(size: number, numberOfSpecies: number, generator: ChromosomeGenerator<C>,
                properties: NeuroevolutionProperties<C>, generatePopulation = true) {
        this._speciesCount = 0;
        this._highestFitness = 0;
        this._highestFitnessLastChanged = 0;
        this._numberOfSpeciesTargeted = numberOfSpecies
        this._generator = generator;
        this._startSize = size;
        this._generation = 0;
        this._species = new List<Species<C>>();
        this._chromosomes = new List<C>();
        this._properties = properties;
        this._averageFitness = 0;

        if (generatePopulation) {
            this.generatePopulation();
        }
    }

    /**
     * Generates an initial population of networks.
     */
    private generatePopulation(): void {
        while (this.populationSize() < this.startSize) {
            const chromosome = this.generator.get();
            this.chromosomes.add(chromosome)
            NeuroevolutionUtil.speciate(chromosome, this, this.properties);
        }
        console.log("Starting Species: ", this.species);
    }

    /**
     * Calculates the shared fitness of each species member and infers the number of children each species is allowed
     * to produce in the next evolution step.
     */
    public assignNumberOfChildren(): void {
        // Adjust the Distance Threshold accordingly to eventually reach the targeted number of Species
        const compatibilityModifier = 0.3;
        if (this.generation > 1) {
            if (this.species.size() < this.numberOfSpeciesTargeted)
                this.properties.distanceThreshold -= compatibilityModifier;
            else if (this.species.size() > this.numberOfSpeciesTargeted)
                this.properties.distanceThreshold += compatibilityModifier;

            if (this.properties.distanceThreshold < 0.3)
                this.properties.distanceThreshold = 0.3;
        }

        // First calculate the shared fitness value of each chromosome in each Specie and mark the chromosomes
        // which will not survive this generation
        for (const specie of this.species) {
            specie.assignAdjustFitness();
        }

        // Calculate the total average fitness value of all chromosomes in the generation
        let fitnessSum = 0.0;
        for (const chromosome of this.chromosomes) {
            fitnessSum += chromosome.sharedFitness;
        }
        const numberOrganisms = this.chromosomes.size();
        const averageFitness = fitnessSum / numberOrganisms;

        // Compute the expected number of offspring for each chromosome which depends on its fitness value
        // in comparison to the averageFitness of the population
        for (const chromosome of this.chromosomes) {
            chromosome.expectedOffspring = chromosome.sharedFitness / averageFitness;
        }
        // Now calculate the number of offspring in each Species
        let leftOver = 0.0;
        let totalOffspringExpected = 0;
        for (const specie of this.species) {
            leftOver = specie.getNumberOfOffspringsNEAT(leftOver);
            totalOffspringExpected += specie.expectedOffspring;
        }

        // Find the population champion and reward him with additional children
        this.sortPopulation();
        this.sortSpecies();
        this.populationChampion = this.chromosomes.get(0);
        this.populationChampion.isPopulationChampion = true;
        this.populationChampion.numberOffspringPopulationChamp = this.properties.populationChampionNumberOffspring;

        // Handle lost children due to rounding errors
        if (totalOffspringExpected < this.startSize) {
            // Assign the lost children to the population champion's species
            const lostChildren = this.startSize - totalOffspringExpected;
            this.populationChampion.species.expectedOffspring += lostChildren;
        }

        // Calculate average fitness for logging purposes
        this.calculateAverageFitness();

        // Check for fitness stagnation
        if (this.populationChampion.networkFitness > this.highestFitness) {
            this.highestFitness = this.populationChampion.networkFitness;
            this.highestFitnessLastChanged = 0;
        } else {
            this.highestFitnessLastChanged++;
        }

        // If there is a stagnation in fitness refocus the search
        if (this.highestFitnessLastChanged > this.properties.penalizingAge + 5) {
            console.info("Refocusing the search on the two most promising species")
            this.highestFitnessLastChanged = 0;
            const halfPopulation = this.startSize / 2;

            // If we only have one Specie allow only the champ to reproduce
            if (this.species.size() == 1) {
                const specie = this.species.get(0);
                specie.chromosomes.get(0).numberOffspringPopulationChamp = Math.floor(this.startSize);
                specie.expectedOffspring = this.startSize;
                specie.ageOfLastImprovement = specie.age;
            }

            // Otherwise, allow only the first two species to reproduce and mark the others dead.
            else {
                for (let i = 0; i < this.species.size(); i++) {
                    const specie = this.species.get(i);
                    if (i <= 1) {
                        specie.chromosomes.get(0).numberOffspringPopulationChamp = Math.floor(halfPopulation);
                        specie.expectedOffspring = halfPopulation;
                        specie.ageOfLastImprovement = specie.age;
                    }
                    // The other species are terminated.
                    else {
                        specie.expectedOffspring = 0;
                    }
                }
            }

            //TODO: Babies Stolen
        }
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
                this.chromosomes.remove(chromosome);
            }
        }

        // Now let the reproduction start
        const offspring = new List<NetworkChromosome>()
        for (const specie of this.species) {
            offspring.addList(specie.breed(this, this.species));
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
        this.chromosomes.clear();

        // Remove empty species and age the ones that survive.
        // Furthermore, add the members of the surviving species to the population List
        const doomedSpecies = new List<Species<C>>();
        for (const specie of this._species) {
            if (specie.chromosomes.size() === 0) {
                doomedSpecies.add(specie);
            } else {
                // Give the new species an age bonus!
                if (specie.isNovel)
                    specie.isNovel = false;
                else
                    specie.age++;
                for (const chromosome of specie.chromosomes) {
                    this.chromosomes.add(chromosome);
                }
            }
        }
        for (const specie of doomedSpecies) {
            this.species.remove(specie);
        }
        this.generation++;
    }

    /**
     * Returns the size of the population
     * @return population Size
     */
    public populationSize(): number {
        return this.chromosomes.size();
    }

    /**
     * Sorts the population according to the networkFitness in decreasing order.
     */
    private sortPopulation(): void {
        this.chromosomes.sort((a, b) => b.networkFitness - a.networkFitness)
    }

    /**
     * Sorts the species List according to their champion's networkFitness in decreasing order.
     */
    private sortSpecies(): void {
        this.species.sort((a, b) => b.expectedOffspring - a.expectedOffspring)
    }

    /**
     * Calculates the average fitness of the whole population. Used for reporting.
     */
    private calculateAverageFitness(): void {
        let sum = 0;
        for (const chromosome of this.chromosomes)
            sum += chromosome.networkFitness;
        this.averageFitness = sum / this.populationSize();
    }

    /**
     * Deep Clone of this NeatPopulation.
     * @returns clone of this.
     */
    clone(): NeatPopulation<C> {
        const clone = new NeatPopulation(this.populationSize(), this.numberOfSpeciesTargeted, this.generator, this.properties, false);
        clone.speciesCount = this.speciesCount;
        clone.highestFitness = this.highestFitness;
        clone.highestFitnessLastChanged = this.highestFitnessLastChanged;
        clone.averageFitness = this.averageFitness;
        clone.generation = this.generation;
        clone.populationChampion = this.populationChampion.clone() as C;
        for (const network of this.chromosomes) {
            clone.chromosomes.add(network.clone() as C);
        }
        for (const species of this.species) {
            clone.species.add(species.clone());
        }
        return clone;
    }

    /**
     * Transform this NeatPopulation into a JSON representation.
     * @return Record containing this NeatPopulation's attributes mapped to the corresponding values.
     */
    public toJSON(): Record<string, (number | Species<C>)> {
        const population = {};
        population[`averageFitness`] = this.averageFitness;
        population[`HighestFitness`] = this.populationChampion.networkFitness;
        population[`PopulationChampionId`] = this.populationChampion.id;
        for (let i = 0; i < this.species.size(); i++) {
            population[`Species ${i}`] = this.species.get(i).toJSON();
        }
        return population;
    }

    get chromosomes(): List<C> {
        return this._chromosomes;
    }

    get species(): List<Species<C>> {
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
