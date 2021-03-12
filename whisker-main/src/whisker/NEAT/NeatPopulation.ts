import {List} from "../utils/List";
import {NeatChromosome} from "./NeatChromosome";
import {Species} from "./Species";
import {ChromosomeGenerator} from "../search/ChromosomeGenerator";
import {NeatUtil} from "./NeatUtil";
import {NeuroevolutionProperties} from "./NeuroevolutionProperties";

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
    private readonly _properties: NeuroevolutionProperties<C>;
    private _distThreshold: number;

    constructor(size: number, numberOfSpecies: number, generator: ChromosomeGenerator<C>,
                properties: NeuroevolutionProperties<C>) {
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
        this._distThreshold = properties.distanceThreshold;

        this.generatePopulation();
    }

    /**
     * Generates a new Population
     * @private
     */
    private generatePopulation(): void {
        while (this.populationSize() < this._startSize) {
            const chromosome = this._generator.get();
            this.chromosomes.add(chromosome)
            NeatUtil.speciate(chromosome, this, this._properties);
        }
        console.log("Starting Species: ", this.species);
    }


    /**
     * Applies evolution to the current population -> generate the next generation from the current one
     */
    public evolution(): void {
        const currentSpeciesSize: number = this._species.size();
        const compatibilityModifier = 0.3;
        // Adjust the Distance Threshold to aim for the targeted number of Species
        if (this.generation > 1) {
            if (currentSpeciesSize < this._numberOfSpeciesTargeted)
                this._distThreshold -= compatibilityModifier;
            else if (currentSpeciesSize > this._numberOfSpeciesTargeted)
                this._distThreshold += compatibilityModifier;

            if (this._distThreshold < 0.3) this._distThreshold = 0.3;
        }

        // First calculate the shared fitness value of each chromosome in each Specie and mark the chromosomes
        // which will not survive this generation
        for (const specie of this.species) {
            specie.assignAdjustFitness();
        }

        // Original Offspring calculation
        /*
        // Calculate the total average fitness value of all chromosomes in the generation
        let fitnessSum = 0.0;
        for (const chromosome of this.chromosomes) {
            fitnessSum += chromosome.networkFitness;
        }
        const numberOrganisms = this.chromosomes.size();
        const averageFitness = fitnessSum / numberOrganisms;

        // Compute the expected number of offspring for each chromosome which depends on its fitness value
        // in comparison to the averageFitness of the population
        for (const chromosome of this.chromosomes) {
            chromosome.expectedOffspring = chromosome.networkFitness / averageFitness;
        }

        console.log("Average Fitness: " + averageFitness)
        // Now calculate the number of offspring in each Species
        let leftOver = 0.0;
        let totalOffspringExpected = 0;
        for (const specie of this.species) {
            leftOver = specie.getNumberOfOffsprings(leftOver);
            totalOffspringExpected += specie.expectedOffspring;
        }
         */

        // Calculate the total Average Species Fitness; used for assigning the amount of offspring per species
        let totalAverageSpeciesFitness = 0;
        let totalNonAdjustedFitness = 0;        // This value is only used for monitoring.
        for (const specie of this.species) {
            totalAverageSpeciesFitness += specie.averageSpeciesFitness();
            for(const chromosome of specie.chromosomes){
                totalNonAdjustedFitness += chromosome.nonAdjustedFitness;
            }
        }

        // Calculate expected children per species and total expectedOffspring
        let leftOver = 0;
        let totalOffspringExpected = 0;
        for (const specie of this.species) {
            leftOver = specie.getNumberOffspringsAvg(leftOver, totalAverageSpeciesFitness, this.startSize)
            totalOffspringExpected += specie.expectedOffspring;
        }

        // Handle lost children due to rounding precision
        if (totalOffspringExpected < this.startSize) {
            // Find the species which expects the most children and simultaneously is the best specie
            let maxExpectedOffspring = 0;
            let finalExpectedOffspring = 0;
            let biggestSpecie: Species<C>;
            const lostChildren = this.startSize - totalOffspringExpected;
            for (const specie of this.species) {
                if (specie.expectedOffspring >= maxExpectedOffspring) {
                    maxExpectedOffspring = specie.expectedOffspring;
                    biggestSpecie = specie;
                }
                finalExpectedOffspring += specie.expectedOffspring;
            }
            // Give extra offspring to the best specie
            biggestSpecie.expectedOffspring += lostChildren;
            finalExpectedOffspring += lostChildren;

            // If we still dont reach the size of the current Population, something went wrong
            // This might happen when a stagnant species dominates the population and then gets killed due to its age
            // We handle this problem by only allowing the best specie to reproduce
            if (finalExpectedOffspring < this.startSize) {
                console.error("The population has died!")
                for (const specie of this.species) {
                    specie.expectedOffspring = 0;
                }
                biggestSpecie.expectedOffspring = this._startSize;
            }
        }


        // Find the species with the best chromosome -> population Champion
        for (const specie of this.species)
            specie.sortChromosomes();
        this.species.sort((a, b) =>
            a.chromosomes.get(0).nonAdjustedFitness < b.chromosomes.get(0).nonAdjustedFitness ? +1 : -1);

        // Assign the population Champion its earned offsprings.
        const popChampSpecie = this.species.get(0);
        this._populationChampion = popChampSpecie.chromosomes.get(0);
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
        if (this._highestFitnessLastChanged > this._properties.penalizingAge + 5) {
            console.info("Perform delta-coding")
            this._highestFitnessLastChanged = 0;
            const halfPopulation = this.startSize / 2;
            console.info("New Species size is: " + halfPopulation);

            // If we only have one Specie allow only the champ to reproduce
            if (this.species.size() == 1) {
                const specie = this.species.get(0);
                specie.chromosomes.get(0).numberOffspringPopulationChamp = Math.floor(this.startSize);
                specie.expectedOffspring = this.startSize;
                specie.ageOfLastImprovement = specie.age;
            }

            // Otherwise, allow only the first two species to reproduce and mark the others dead.
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

            //TODO: Babies Stolen
        }


        // Remove the Chromosomes with a death mark on them.
        const eliminateList = new List<C>();
        for (const chromosome of this._chromosomes) {
            if (chromosome.eliminate) {
                const specie = chromosome.species;
                specie.removeChromosome(chromosome);
                this.chromosomes.remove(chromosome);
                eliminateList.add(chromosome);
            }
        }

        // Now let the reproduction start
        const offspring = new List<NeatChromosome>()
        for (const specie of this._species) {
            offspring.addList(specie.breed(this, this._species));
        }

        // Speciate the produced offspring
        for (const child of offspring) {
            NeatUtil.speciate(child, this, this._properties)
        }

        // Remove the old chromosomes from the population and the species. The new ones are already speciated
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
                if (specie.novel)
                    specie.novel = false;
                else
                    specie.age++;
                for (const chromosome of specie.chromosomes) {
                    this.chromosomes.add(chromosome);
                }
            }
        }
        for (const specie of doomedSpecies) {
            this._species.remove(specie);
        }

        // Pruning the Size if population gets out of hand! This might happen when we have a huge fitness increase
        // within one generation.
        if (this.populationSize() > this.startSize * 1.5) {
            let tries = 0;
            while (this.populationSize() > this.startSize && tries < 50) {
                for (const specie of this.species) {
                    // Only remove Chromosomes from species which have a lot of them.
                    if (specie.size() > 10) {
                        // Remove Chromosomes from species and then remove the eliminated ones from the whole population.
                        const removedChromosomes = specie.sieveWeakChromosomes(5);
                        for (const chromosome of removedChromosomes)
                            this.chromosomes.remove(chromosome);
                    } else
                        tries++;
                }
            }
            console.log(" Population Size after Pruning: " + this.populationSize())
        }

        this.generation++;
        console.log("All Species: ", this.species)
        console.log("Population Size: " + this.populationSize())
        console.log("Average Fitness: " + totalAverageSpeciesFitness / this.species.size())
        console.log("Highest fitness last changed: " + this.highestFitnessLastChanged)
        console.log("Population Champion: ", this.populationChampion)
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

    get startSize(): number {
        return this._startSize;
    }
}
