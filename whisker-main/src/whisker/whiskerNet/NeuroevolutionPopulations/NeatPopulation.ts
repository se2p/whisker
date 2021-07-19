import {NetworkChromosome} from "../NetworkChromosome";
import {NeuroevolutionPopulation} from "./NeuroevolutionPopulation";

export class NeatPopulation<C extends NetworkChromosome> extends NeuroevolutionPopulation<NetworkChromosome> {

    /**
     * The average SharedFitness of the current population. Used for determining how many children each Chromosome is
     * allowed to produce.
     */
    private _averageSharedFitness: number;

    /**
     * Calculates the FitnessDistribution across species, marks parent candidates and calculates the average
     * SharedFitness value required for assigning the correct number of Offspring to each Chromosome/Species.
     */
    protected calculateFitnessDistribution(): void {
        // Calculate the shared fitness value for each chromosome in each Specie and mark parent candidates.
        for (const specie of this.species) {
            specie.assignAdjustFitness();
        }

        // Calculate the total average fitness value of all chromosomes in the generation
        let fitnessSum = 0.0;
        for (const chromosome of this.chromosomes) {
            fitnessSum += chromosome.sharedFitness;
        }
        const numberOrganisms = this.chromosomes.size();
        this._averageSharedFitness = fitnessSum / numberOrganisms;
    }

    /**
     * Defines how many children each Chromosome/Species is allowed to produce.
     */
    protected assignNumberOfOffspring(): void {
        // Compute the expected number of offspring for each chromosome which depends on its fitness value
        // in comparison to the averageFitness of the population
        for (const chromosome of this.chromosomes) {
            chromosome.expectedOffspring = chromosome.sharedFitness / this._averageSharedFitness;
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
     * Deep Clone of NeatPopulation
     * @returns clone of this NeatPopulation.
     */
    public clone(): NeatPopulation<C> {
        const clone = new NeatPopulation(this.generator, this.properties);
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


}
