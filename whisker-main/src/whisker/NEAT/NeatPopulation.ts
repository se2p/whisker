import {List} from "../utils/List";
import {NeatChromosome} from "./NeatChromosome";
import {Species} from "./Species";
import {NeatParameter} from "./NeatParameter";
import {ChromosomeGenerator} from "../search/ChromosomeGenerator";
import {NeatUtil} from "./NeatUtil";

export class NeatPopulation<C extends NeatChromosome> {

    private _chromosomes: List<C>;
    private _species: List<Species<C>>;
    private _speciesCount: number;
    private _highestFitness: number;
    private _highestFitnessLastChanged: number
    private _generation: number;
    private readonly _numberOfSpeciesTargeted: number;
    private _populationChampion: C;
    private readonly _generator: ChromosomeGenerator<C>
    private readonly _startSize: number;

    constructor(size: number, numberOfSpecies: number, generator: ChromosomeGenerator<C>) {
        this._speciesCount = 0;
        this._highestFitness = 0;
        this._highestFitnessLastChanged = 0;
        this._numberOfSpeciesTargeted = numberOfSpecies
        this._generator = generator;
        this._startSize = size;
        this._generation = 0;
        this._species = new List<Species<C>>();
        this._chromosomes = new List<C>();
        this.generatePopulation();
    }

    /**
     * Generates a new Population
     * @param sample a sample to set the type of the Chromosomes the population holds
     * @param size the size of the population
     * @private
     */
    private generatePopulation(): void {
        while (this.populationSize() < this._startSize) {
            const chromosome = this._generator.get();
            this.chromosomes.add(chromosome)
            NeatUtil.speciate(chromosome, this);
        }
        console.log(this.species);
    }


    /**
     * Applies evolution to the current population -> generate the next generation from the current one
     */
    public evolution(): void {

        let bestSpecie: Species<C>;
        const currentSpeciesSize: number = this._species.size();
        const compatibilityModifier = 0.3;

        // Adjust the Distance Threshold to aim for the targeted number of Species
        if (this.generation > 1) {
            if (currentSpeciesSize < this._numberOfSpeciesTargeted)
                NeatParameter.DISTANCE_THRESHOLD -= compatibilityModifier;
            else if (currentSpeciesSize > this._numberOfSpeciesTargeted)
                NeatParameter.DISTANCE_THRESHOLD += compatibilityModifier;

            if (NeatParameter.DISTANCE_THRESHOLD < 0.3) NeatParameter.DISTANCE_THRESHOLD = 0.3;
        }
        console.log("Current Threshold: " + NeatParameter.DISTANCE_THRESHOLD)

        // First calculate the shared fitness value of each chromosome in each Specie and mark the chromosomes
        // which will not survive this generation
        for (const specie of this.species) {
            specie.assignAdjustFitness();
        }

        // Calculate the total average fitness value of all chromosomes in the generation
        let fitnessSum = 0.0;
        for (const chromosome of this.chromosomes) {
            fitnessSum += chromosome.fitness;
        }
        const numberOrganisms = this.chromosomes.size();
        const averageFitness = fitnessSum / numberOrganisms;

        // Compute the expected number of offspring for each chromosome which depends on its fitness value
        // in comparison to the averageFitness of the population
        for (const chromosome of this.chromosomes) {
            chromosome.expectedOffspring = chromosome.fitness / averageFitness;
        }

        console.log("Average Fitness: " + averageFitness)
        // Now calculate the number of offspring in each Species
        let leftOver = 0.0;
        let totalOffspringExpected = 0;
        for (const specie of this.species) {
            leftOver = specie.getNumberOfOffsprings(leftOver);
            totalOffspringExpected += specie.expectedOffspring;
        }

        // Handle lost children due to rounding precision
        if (totalOffspringExpected < numberOrganisms) {
            // Find the species which expects the most children and simultaneously is the best specie
            let maxExpectedOffspring = 0;
            let finalExpectedOffspring = 0;
            for (const specie of this._species) {
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
            if (finalExpectedOffspring < numberOrganisms) {
                console.info("The population has died!")
                for (const specie of this.species) {
                    specie.expectedOffspring = 0;
                }
                bestSpecie.expectedOffspring = NeatParameter.POPULATION_SIZE;
            }
        }

        else if(totalOffspringExpected > this._startSize){
            console.error("Pruning Size")
            for(const specie of this.species){
                specie.expectedOffspring *= 0.70
            }
        }


        // Copy the current species into a new List for sorting the species in descending order according to the
        // non adjusted fitness value of the best chromosome in the species.


        this.species.sort((a, b) =>
            a.chromosomes.get(0).nonAdjustedFitness < b.chromosomes.get(0).nonAdjustedFitness ? +1 : -1);

        const currentSpecie = this.species.get(0);
        const bestSpeciesId = currentSpecie.id;
        this._populationChampion = currentSpecie.chromosomes.get(0);
        this._populationChampion.populationChampion = true;
        this._populationChampion.numberOffspringPopulationChamp = 3;

        // Check for fitness stagnation
        if (this._populationChampion.nonAdjustedFitness > this._highestFitness) {
            this._highestFitness = this._populationChampion.nonAdjustedFitness;
            this._highestFitnessLastChanged = 0;
        } else {
            this._highestFitnessLastChanged++;
        }

        // If there is a stagnation in fitness perform delta-coding
        if (this._highestFitnessLastChanged > NeatParameter.PENALIZING_AGE + 5) {
            console.info("Perform detla-coding")
            this._highestFitnessLastChanged = 0;
            const halfPopulation = this.populationSize() / 2;
            console.info("Population size is: " + this.populationSize());

            // If we only have one Specie allow only the champ to reproduce
            if (this.species.size() == 1) {
                this.species.get(0).chromosomes.get(0).numberOffspringPopulationChamp = Math.floor(this.populationSize() / 3);
                this.species.get(0).expectedOffspring = this.populationSize();
            }

            // Otherwise allow the first two species only to reproduce and mark the others dead.
            for (let i = 0; i < this.species.size(); i++) {
                const specie = this.species.get(i);
                // The first two species are allowed to reproduce the whole population
                if (i <= 1) {
                    specie.chromosomes.get(0).numberOffspringPopulationChamp = Math.floor(halfPopulation / 3);
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
        for (const specie of this.species)
            for (const chromosome of specie.chromosomes)
                if (chromosome.eliminate)
                    specie.removeChromosome(chromosome);

        for (const chromosome of this._chromosomes) {
            if (chromosome.eliminate) {
                this.chromosomes.remove(chromosome);
            }
        }


        // Now let the reproduction start
        for (const specie of this._species) {
            specie.breed(this, this._species);
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
        for (const specie of this._species) {
            console.log("Specie " + specie.id + " has a size of: " + specie.chromosomes.size())
            if (specie.chromosomes.size() === 0) {
                doomedSpecies.add(specie);
            } else {
                // Give the new species an age bonus!
                if (specie.novel)
                    specie.novel = false;
                else
                    specie.age++;
                for (const chromosome of specie.chromosomes) {
                    this.chromosomes.add(chromosome);
                    chromosome.champion = false;
                    chromosome.populationChampion = false;
                    chromosome.numberOffspringPopulationChamp = 0;
                }
            }
        }

        for (const specie of doomedSpecies) {
            this._species.remove(specie);
        }

        // To be sure check if the best specie survived. If it died something went terribly wrong!
        let foundBest = false;
        for (const specie of this.species)
            if (specie.id === bestSpeciesId) {
                foundBest = true;
                break;
            }
        if (!foundBest)
            console.error("Lost best Species :(")
        this.generation++;
        console.log(this.species)
    }

    populationSize(): number {
        return this.chromosomes.size();
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

    get populationChampion(): C {
        return this._populationChampion;
    }

    set populationChampion(value: C) {
        this._populationChampion = value;
    }
}
