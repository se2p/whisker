import {NeatPopulation} from "./NeatPopulation";

export class RandomNeuroevolutionPopulation extends NeatPopulation {

    /**
     * In RandomNeuroevolutionPopulation each network is allowed to generate exactly one child.
     */
    protected assignNumberOfOffspring(): void {
        for (const chromosome of this.networks) {
            chromosome.expectedOffspring = 1;
            chromosome.isParent = true;
        }
        for (const species of this.species) {
            species.calculateAverageSharedFitness();
            species.expectedOffspring = species.networks.length;
        }

        // Find the population champion for reporting purposes.
        this.sortPopulation();
        this.sortSpecies();
        this.populationChampion = this.networks[0];
        this.populationChampion.isPopulationChampion = true;

        // Update the highest fitness value found so far.
        if (this.populationChampion.fitness > this.bestFitness) {
            this.bestFitness = this.populationChampion.fitness;
            this.highestFitnessLastChanged = 0;
        } else {
            this.highestFitnessLastChanged++;
        }
    }
}
