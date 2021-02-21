import {List} from "../utils/List";
import {NeatChromosome} from "./NeatChromosome";
import {NeatChromosomeGenerator} from "./NeatChromosomeGenerator";
import {Species} from "./Species";
import {NeatConfig} from "./NeatConfig";

export class NeatPopulation<C extends NeatChromosome> {

    private _chromosomes: List<C>;
    private _species: List<Species<C>>;
    private _speciesCount: number;
    private _highestFitness: number;
    private _highestFitnessLastChanged: number
    private _generation: number;
    private _numberOfSpeciesTargeted: number;

    constructor(chromosomeType: C, size: number, numberOfSpecies: number) {
        this._speciesCount = 0;
        this._highestFitness = 0;
        this._highestFitnessLastChanged = 0;
        this._numberOfSpeciesTargeted = numberOfSpecies
        this._chromosomes = this.generatePopulation(chromosomeType, size);
        this._generation = 0;
        this.speciate();
    }

    /**
     * Generates a new Population
     * @param sample a sample to set the type of the Chromosomes the population holds
     * @param size the size of the population
     * @private
     */
    private generatePopulation(sample: C, size: number): List<C> {
        const inputSize = sample.inputNodes.size();
        const outputSize = sample.outputNodes.size();
        const mutationOp = sample.getMutationOperator();
        const crossoverOp = sample.getCrossoverOperator();
        const generator = new NeatChromosomeGenerator(mutationOp, crossoverOp, inputSize, outputSize);
        const population = new List<C>()
        while (population.size() < size)
            population.add(generator.get() as C)
        return population;
    }

    private speciate() {
        this._species = new List<Species<C>>();
        let speciesCounter = 0;

        // Assign each chromosome of the population to a species
        for (const chromosome of this._chromosomes) {

            // If we have no species at all so far create the first one
            if (this._species.isEmpty()) {
                const newSpecies = new Species(speciesCounter, false);
                this.species.add(newSpecies as Species<C>);
                speciesCounter++;
                newSpecies.addChromosome(chromosome);
                chromosome.species = newSpecies;
            }

                // If we already have some species find the correct one or create a new one for the chromosome if it
            // fits in none of them
            else {
                let foundSpecies = false;
                for (const specie of this._species) {
                    // Get a representative of the specie and calculate the compatibility distance
                    const representative = specie.chromosomes.get(0);
                    const compatDistance = chromosome.compatibilityDistance(representative);

                    // If they are compatible enough add the chromosome to the species
                    if (compatDistance < NeatConfig.DISTANCE_THRESHOLD) {
                        specie.addChromosome(chromosome);
                        chromosome.species = specie;
                        foundSpecies = true;
                        break;
                    }
                }

                // If the chromosome fits to no species create one for it
                if (!foundSpecies) {
                    const newSpecies = new Species(speciesCounter, false);
                    this.species.add(newSpecies as Species<C>)
                    speciesCounter++;
                    newSpecies.addChromosome(chromosome);
                    chromosome.species = newSpecies;
                }
            }
        }
        this._speciesCount = speciesCounter;
    }


    /**
     * Applies evolution to the current population -> generate the next generation from the current one
     */
    public evolution(): void {

        let bestSpecie: Species<C>;
        const currentPopulationSize: number = this.chromosomes.size();
        const currentSpeciesSize: number = this._species.size();
        const compatibilityModifier = 0.3;

        // Adjust the Distance Threshold to aim for the targeted number of Species
        if (this.generation > 1) {
            if (currentSpeciesSize < this._numberOfSpeciesTargeted)
                NeatConfig.DISTANCE_THRESHOLD -= compatibilityModifier;
            else if (currentSpeciesSize > this._numberOfSpeciesTargeted)
                NeatConfig.DISTANCE_THRESHOLD += compatibilityModifier;

            if (NeatConfig.DISTANCE_THRESHOLD < 0.3) NeatConfig.DISTANCE_THRESHOLD = 0.3;

        }

        // First calculate the shared fitness value of each chromosome in each Specie and mark the chromosomes
        // which will not survive this generation
        for (const specie of this.species) {
            specie.assignAdjustFitness();
            specie.markKillCandidates();
        }

        // Calculate the total average fitness value of all chromosomes in the generation
        let fitnessSum = 0;
        for (const chromosome of this.chromosomes)
            fitnessSum += chromosome.fitness;

        const averageFitness = fitnessSum / currentPopulationSize;

        // Compute the expected number of offspring for each chromosome which depends on its fitness value
        // in comparison to the averageFitness of the population
        for (const chromosome of this.chromosomes)
            chromosome.expectedOffspring = chromosome.fitness / averageFitness;

        // Now calculate the number of offspring in each Species
        let leftOver = 0;
        let totalOffspringExpected = 0;
        for (const specie of this.species) {
            leftOver = specie.getNumberOfOffsprings(leftOver);
            totalOffspringExpected += specie.expectedOffspring;
        }

        // Handle lost children due to rounding precision
        if (totalOffspringExpected < currentPopulationSize) {

            // Find the species which expects the most children and simultaneously is the best specie
            let maxExpectedOffspring = 0;
            let finalExpectedOffspring = 0;
            for (const specie of this.species) {
                if (specie.expectedOffspring >= maxExpectedOffspring) {
                    maxExpectedOffspring = specie.expectedOffspring;
                    bestSpecie = specie;
                }
                finalExpectedOffspring += specie.expectedOffspring;
            }

            // Give extra offspring to the best specie
            bestSpecie.expectedOffspring++;
            finalExpectedOffspring++;

            // If we still dont reach the size of the current Population, something went wrong
            // This might happen when a stagnant species dominates the population and then gets killed due to its age
            // We handle this problem by only allowing the best specie to reproduce
            if (finalExpectedOffspring < currentPopulationSize) {
                console.info("The population has died!")
                for (const specie of this.species) {
                    specie.expectedOffspring = 0;
                }
                bestSpecie.expectedOffspring = currentPopulationSize;
            }
        }

        // Copy the current species into a new List for sorting the species in descending order according to the
        // non adjusted fitness value of the best chromosome in the species.
        const sortedSpecies = new List<Species<C>>();
        sortedSpecies.addList(this.species);
        sortedSpecies.sort((a, b) =>
            b.chromosomes.get(0).nonAdjustedFitness - a.chromosomes.get(0).nonAdjustedFitness);

        const currentSpecie = sortedSpecies.get(0);
        const bestSpeciesId = currentSpecie.id;
        const populationChamp = currentSpecie.chromosomes.get(0);
        populationChamp.populationChampion = true;
        populationChamp.numberOffspringPopulationChamp = 3;

        // Check for fitness stagnation
        if (populationChamp.nonAdjustedFitness > this._highestFitness) {
            this._highestFitness = populationChamp.nonAdjustedFitness;
            this._highestFitnessLastChanged = 0;
        } else {
            this._highestFitnessLastChanged++;
        }

        // If there is a stagnation in fitness perform delta-coding
        if (this._highestFitnessLastChanged > NeatConfig.PENALIZING_AGE + 5) {
            console.info("Perform detla-coding")
            this._highestFitnessLastChanged = 0;
            const halfPopulation = NeatConfig.POPULATION_SIZE / 2;
            const tmp = NeatConfig.POPULATION_SIZE - halfPopulation;
            console.info("Population size is: " + NeatConfig.POPULATION_SIZE);
            console.info("Half population size is: " + halfPopulation + "popSize - halfPopSize = " + tmp);

            // If we only have one Specie allow only the champ to reproduce
            if (sortedSpecies.size() == 1) {
                sortedSpecies.get(0).chromosomes.get(0).numberOffspringPopulationChamp = NeatConfig.POPULATION_SIZE;
                sortedSpecies.get(0).expectedOffspring = NeatConfig.POPULATION_SIZE;
            }

            // Otherwise allow the first two species only to reproduce and mark the others dead.
            for (let i = 0; i < sortedSpecies.size(); i++) {
                const specie = sortedSpecies.get(i);
                // The first two species are allowed to reproduce the whole population
                if (i <= 1) {
                    specie.chromosomes.get(0).numberOffspringPopulationChamp = halfPopulation;
                    specie.expectedOffspring = halfPopulation;
                    specie.ageOfLastImprovement = specie.age;
                }
                // The other species are terminated.
                else {
                    specie.expectedOffspring = 0;
                }
            }

            //TODO: Baby Stolen
        }

        // Now eliminate chromosomes which are marked for dead
        // Store the chromosomes to kill
        const doomedDead = new List<C>()
        for (const chromosome of this.chromosomes) {
            if (chromosome.eliminate) {
                // Remove the chromosome from its species
                const specie = chromosome.species;
                specie.removeChromosome(chromosome);
                doomedDead.add(chromosome);
            }
        }
        // Remove the chromosomes from the population pool.
        for (const chromosome of doomedDead) {
            this.chromosomes.remove(chromosome);
        }
        doomedDead.clear();

        // Now let the reproduction start
        for (const specie of sortedSpecies) {
            specie.breed(this, sortedSpecies);
        }

        // Remove the old chromosomes from the population and the species. The new ones are saved in the species
        for (const chromosome of this.chromosomes) {
            const specie = chromosome.species;
            specie.removeChromosome(chromosome);
        }
        this.chromosomes.clear();

        // Remove empty species and age the ones that survive.
        // Furthermore, add the members of the surviving species to the population List
        const doomedSpecies = new List<Species<C>>();
        for (const specie of this.species) {
            if (specie.chromosomes.size() == 0)
                doomedSpecies.add(specie);
            else {
                // Give the new species an age bonus!
                if (specie.novel)
                    specie.novel = false;
                else
                    specie.age++;
                for (const chromosome of specie.chromosomes)
                    this.chromosomes.add(chromosome);
            }
        }

        for (const specie of doomedSpecies)
            this.species.remove(specie);


        // To be sure check if the best specie survived. If it died something went terribly wrong!
        let foundBest = false;
        for (const specie of this.species)
            if (specie.id === bestSpeciesId) {
                foundBest = true;
                break;
            }
        if (!foundBest)
            console.error("Lost best Species :(")
    }


    get chromosomes(): List<C> {
        return this._chromosomes;
    }

    set chromosomes(value: List<C>) {
        this._chromosomes = value;
    }

    get species(): List<Species<C>> {
        return this._species;
    }

    set species(value: List<Species<C>>) {
        this._species = value;
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
}
