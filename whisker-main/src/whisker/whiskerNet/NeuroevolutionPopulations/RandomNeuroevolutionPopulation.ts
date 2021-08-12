import {NeuroevolutionPopulation} from "./NeuroevolutionPopulation";
import {NetworkChromosome} from "../NetworkChromosome";

export class RandomNeuroevolutionPopulation<C extends NetworkChromosome> extends NeuroevolutionPopulation<NetworkChromosome> {

    /**
     * We actually have no need for calculating fitnessDistribution in the RandomPopulation. We nevertheless do it
     * for statistic purposes.
     */
    protected calculateFitnessDistribution(): void {
        // Calculate the shared fitness value for each chromosome in each Specie and mark parent candidates.
        for (const specie of this.species) {
            specie.assignAdjustFitness();
        }
    }

    /**
     * In the RandomPopulation each Network is allowed to generate exactly one child using mutation.
     */
    protected assignNumberOfOffspring(): void {
        for (const chromosome of this.chromosomes) {
            chromosome.expectedOffspring = 1;
            chromosome.hasDeathMark = false;
        }
        for (const species of this.species) {
            species.calculateAverageSpeciesFitness();
            species.expectedOffspring = species.size();
            species.calculateAverageNetworkFitness();
        }

        // Find the population champion and reward him with additional children
        this.sortPopulation();
        this.sortSpecies();
        this.populationChampion = this.chromosomes.get(0);
        this.populationChampion.isPopulationChampion = true;

        // Update highestFitness
        if (this.populationChampion.networkFitness > this.highestFitness) {
            this.highestFitness = this.populationChampion.networkFitness;
            this.highestFitnessLastChanged = 0;
        } else {
            this.highestFitnessLastChanged++;
        }
    }

    /**
     * Deep Clone of RandomPopulation.
     * @returns clone of this RandomPopulation.
     */
    clone(): RandomNeuroevolutionPopulation<C> {
        const clone = new RandomNeuroevolutionPopulation(this.generator, this.properties);
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
